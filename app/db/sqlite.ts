import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite"
import { Capacitor } from "@capacitor/core"
import { runMigrations } from "./migrations"
import { seedDefaultCashflowCategories } from "./seedCashflow"
import { seedUnits } from "./seedUnits"
import type { Db, RunResult } from "./types"

const DB_NAME = "posoffline"
const DB_VERSION = 1

let sqlite: SQLiteConnection | null = null
let dbConn: SQLiteDBConnection | null = null
let db: Db | null = null
let initPromise: Promise<Db> | null = null

const isWeb = Capacitor.getPlatform() === "web"

async function initWebStore(conn: SQLiteConnection): Promise<void> {
  const { defineCustomElements } = await import("jeep-sqlite/loader")
  defineCustomElements(window)
  let el = document.querySelector("jeep-sqlite")
  if (!el) {
    el = document.createElement("jeep-sqlite")
    document.body.appendChild(el)
  }
  await customElements.whenDefined("jeep-sqlite")
  await conn.initWebStore()
}

class SerialExecutor {
  private tail: Promise<unknown> = Promise.resolve()
  run<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.tail.then(operation, operation)
    this.tail = next.catch(() => undefined)
    return next
  }
}
const executor = new SerialExecutor()
export type SqlConnection = Pick<
  SQLiteDBConnection,
  | "query"
  | "run"
  | "execute"
  | "beginTransaction"
  | "commitTransaction"
  | "rollbackTransaction"
  | "isTransactionActive"
>
export class SqliteDb implements Db {
  constructor(
    private readonly conn: SqlConnection,
    private inTx = false,
  ) {}

  get inTransaction(): boolean {
    return this.inTx
  }

  async query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    const operation = () => this.conn.query(sql, params as never[])
    const res = await (this.inTx ? operation() : executor.run(operation))
    return (res.values ?? []) as T[]
  }

  async run(sql: string, params: unknown[] = []): Promise<RunResult> {
    const operation = () => this.conn.run(sql, params as never[], false)
    const res = await (this.inTx ? operation() : executor.run(operation))
    return {
      changes: res.changes?.changes ?? 0,
      lastId: res.changes?.lastId,
    }
  }

  async execute(sql: string): Promise<void> {
    const operation = () => this.conn.execute(sql, false)
    await (this.inTx ? operation() : executor.run(operation))
  }

  async transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
    if (this.inTx) {
      return fn(this)
    }
    return executor.run(async () => {
      const tx = new SqliteDb(this.conn, true)
      await this.conn.beginTransaction()
      try {
        const result = await fn(tx)
        if ((await this.conn.isTransactionActive()).result) {
          await this.conn.commitTransaction()
        }
        return result
      } catch (err) {
        if ((await this.conn.isTransactionActive()).result) {
          await this.conn.rollbackTransaction()
        }
        throw err
      }
    })
  }
}

export async function initDb(): Promise<Db> {
  if (db) return db
  if (initPromise) return initPromise

  initPromise = (async () => {
    sqlite = new SQLiteConnection(CapacitorSQLite)

    if (isWeb) {
      await initWebStore(sqlite)
    }

    const isConn = (await sqlite.isConnection(DB_NAME, false)).result
    dbConn = isConn
      ? await sqlite.retrieveConnection(DB_NAME, false)
      : await sqlite.createConnection(
          DB_NAME,
          false,
          "no-encryption",
          DB_VERSION,
          false,
        )

    await dbConn.open()

    const ready = new SqliteDb(dbConn)
    await ready.execute("PRAGMA foreign_keys = ON;")
    await runMigrations(ready)
    await seedUnits(ready)

    await seedDefaultCashflowCategories(ready)

    if (isWeb) {
      await executor.run(async () => {
        if (sqlite) await sqlite.saveToStore(DB_NAME)
      })
    }
    db = ready
    return ready
  })().catch((error) => {
    initPromise = null
    throw error
  })

  return initPromise
}

export function getDb(): Db {
  if (!db)
    throw new Error(
      "DB belum diinisialisasi — panggil initDb() dulu di main.ts",
    )
  return db
}

export async function persist(): Promise<void> {
  if (isWeb && sqlite) {
    await executor.run(async () => {
      if (sqlite) await sqlite.saveToStore(DB_NAME)
    })
  }
}

export async function closeDb(): Promise<void> {
  if (dbConn) await dbConn.close()
  if (sqlite) await sqlite.closeConnection(DB_NAME, false)
  db = null
  dbConn = null
  sqlite = null
  initPromise = null
}
