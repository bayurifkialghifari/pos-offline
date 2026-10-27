import { uuid } from "@/lib/uuid"
import { persist } from "./sqlite"
import type { Db, LocalEntity } from "./types"

export interface ListOptions {
  readonly where?: string
  readonly params?: unknown[]
  readonly orderBy?: string
  readonly includeDeleted?: boolean
}
export class RepositoryError extends Error {
  override readonly name = "RepositoryError"
  constructor(
    readonly table: string,
    readonly id: string,
  ) {
    super("Data tidak ditemukan: " + table + "/" + id)
  }
}
export abstract class BaseRepository<T extends LocalEntity> {
  protected abstract readonly table: string
  constructor(protected readonly db: Db) {}
  async create(
    data: Omit<T, keyof LocalEntity> & Partial<Pick<T, "id">>,
  ): Promise<T> {
    const id = data.id ?? uuid()
    const now = Date.now()
    const row = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    }
    await this.db.transaction(async (tx) => {
      const fields = Object.keys(row)
      await tx.run(
        "INSERT INTO " +
          this.table +
          " (" +
          fields.join(", ") +
          ") VALUES (" +
          fields.map(() => "?").join(", ") +
          ")",
        Object.values(row),
      )
    })
    const result = await this.findById(id)
    if (result === null) throw new RepositoryError(this.table, id)
    if (!this.db.inTransaction) await persist()
    return result
  }
  async update(
    id: string,
    patch: Partial<Omit<T, keyof LocalEntity>>,
  ): Promise<T | null> {
    const fields = { ...patch, updated_at: Date.now() }
    await this.db.transaction(async (tx) => {
      await tx.run(
        "UPDATE " +
          this.table +
          " SET " +
          Object.keys(fields)
            .map((key) => key + " = ?")
            .join(", ") +
          " WHERE id = ? AND deleted_at IS NULL",
        [...Object.values(fields), id],
      )
    })
    if (!this.db.inTransaction) await persist()
    return this.findById(id)
  }
  async softDelete(id: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.run(
        "UPDATE " +
          this.table +
          " SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL",
        [Date.now(), Date.now(), id],
      )
    })
    if (!this.db.inTransaction) await persist()
  }
  async findById(id: string, db: Db = this.db): Promise<T | null> {
    const rows = await db.query<T>(
      "SELECT * FROM " + this.table + " WHERE id = ? AND deleted_at IS NULL",
      [id],
    )
    return rows[0] ?? null
  }
  async list(options: ListOptions = {}): Promise<T[]> {
    const conditions = options.includeDeleted ? [] : ["deleted_at IS NULL"]
    if (options.where) conditions.push(options.where)
    return this.db.query<T>(
      "SELECT * FROM " +
        this.table +
        (conditions.length ? " WHERE " + conditions.join(" AND ") : "") +
        (options.orderBy ? " ORDER BY " + options.orderBy : ""),
      options.params ?? [],
    )
  }
}
