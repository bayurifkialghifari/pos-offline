import { BaseRepository } from "@/db/BaseRepository"
import type { Sale } from "@/db/types"
import { dayKey } from "@/lib/datetime"

export type DatedSale = Sale & { readonly sold_at: number }

export class SaleRepository extends BaseRepository<Sale> {
  protected readonly table = "sales"

  listRecent(limit = 50): Promise<Sale[]> {
    return this.db.query<Sale>(
      `SELECT * FROM sales WHERE deleted_at IS NULL
       ORDER BY COALESCE(sold_at, opened_at, created_at) DESC LIMIT ?`,
      [limit],
    )
  }

  listBetween(from: number, to: number, limit?: number): Promise<DatedSale[]> {
    return this.db.query<DatedSale>(
      `SELECT * FROM sales
       WHERE deleted_at IS NULL AND status <> 'open' AND sold_at BETWEEN ? AND ?
       ORDER BY sold_at DESC ${limit === undefined ? "" : "LIMIT ?"}`,
      limit === undefined ? [from, to] : [from, to, limit],
    )
  }

  listOpenBills(limit = 100): Promise<Sale[]> {
    return this.db.query<Sale>(
      `SELECT * FROM sales
       WHERE deleted_at IS NULL AND status = 'open'
       ORDER BY opened_at DESC, created_at DESC LIMIT ?`,
      [limit],
    )
  }

  async nextNumber(prefix: string, t: number): Promise<string> {
    const base = `${prefix}-${dayKey(t).replace(/-/g, "")}`
    const rows = await this.db.query<{ n: number }>(
      `SELECT COALESCE(MAX(CAST(SUBSTR(number, LENGTH(?) + 2) AS INTEGER)),0) AS n FROM sales WHERE SUBSTR(number,1,LENGTH(?) + 1) = ?`,
      [base, base, base + "-"],
    )
    const seq = (rows[0]?.n ?? 0) + 1
    return `${base}-${String(seq).padStart(3, "0")}`
  }
}
