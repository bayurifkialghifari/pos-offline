import { runMigrations } from "@/db/migrations"
import { seedDefaultCashflowCategories } from "@/db/seedCashflow"
import { seedUnits } from "@/db/seedUnits"
import { SqliteDb, type SqlConnection } from "@/db/sqlite"
import { ProductRepository } from "@/repositories/product.repo"
import type { CheckoutLine } from "@/services/checkout.contract"
import type { SqlValue } from "sql.js"
import initSqlJs from "sql.js"
export async function database() {
  const SQL = await initSqlJs()
  const sql = new SQL.Database()
  let active = false
  function parameters(values: unknown[]): SqlValue[] {
    return values.map((value) => {
      if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        value instanceof Uint8Array
      )
        return value
      throw new TypeError("Unsupported SQL parameter")
    })
  }
  const connection: SqlConnection = {
    async query(statement, values = []) {
      const stmt = sql.prepare(statement)
      try {
        stmt.bind(parameters(values))
        const rows = []
        while (stmt.step()) rows.push(stmt.getAsObject())
        return { values: rows }
      } finally {
        stmt.free()
      }
    },
    async run(statement, values = []) {
      sql.run(statement, parameters(values))
      return { changes: { changes: sql.getRowsModified() } }
    },
    async execute(statement) {
      sql.run(statement)
      return { changes: { changes: sql.getRowsModified() } }
    },
    async beginTransaction() {
      sql.run("BEGIN TRANSACTION")
      active = true
      return { changes: { changes: 0 } }
    },
    async commitTransaction() {
      sql.run("COMMIT")
      active = false
      return { changes: { changes: 0 } }
    },
    async rollbackTransaction() {
      sql.run("ROLLBACK")
      active = false
      return { changes: { changes: 0 } }
    },
    async isTransactionActive() {
      return { result: active }
    },
  }
  const db = new SqliteDb(connection)
  await db.execute("PRAGMA foreign_keys = ON")
  await runMigrations(db)
  await seedUnits(db)
  await seedDefaultCashflowCategories(db)
  return { db, close: () => sql.close() }
}
export async function rice(db: SqliteDb, stock = 10000) {
  return new ProductRepository(db).create({
    name: "Beras",
    category_id: null,
    unit_id: "unit-kg",
    sku: null,
    barcode: null,
    barcode_type: "CODE128",
    price: 15000,
    cost: 10000,
    track_stock: 1,
    stock,
    image_path: null,
    active: 1,
  })
}
export function nominalLine(
  productId: string,
  lineId = "line-one",
): CheckoutLine {
  return {
    productId,
    lineId,
    name: "Beras",
    price: 15000,
    qty: 0.667,
    track_stock: 1,
    unitId: "unit-kg",
    unitLabel: "Kilogram",
    unitSymbol: "kg",
    unitDimension: "weight",
    unitFactor: 1000,
    baseQty: 667,
    inputMode: "nominal",
    requestedNominal: 10000,
    lineTotal: 10000,
  }
}
