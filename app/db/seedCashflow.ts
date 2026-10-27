import { nowMs } from "@/lib/datetime"
import { uuid } from "@/lib/uuid"
import type { Db } from "./types"

export const DEFAULT_CASHFLOW_CATEGORIES: ReadonlyArray<{
  name: string
  type: "income" | "expense"
  isSystem: 0 | 1
}> = [
  { name: "Penjualan", type: "income", isSystem: 1 },
  { name: "Modal / Setoran", type: "income", isSystem: 0 },
  { name: "Pendapatan Lain", type: "income", isSystem: 0 },
  { name: "Belanja Stok", type: "expense", isSystem: 0 },
  { name: "Gaji Karyawan", type: "expense", isSystem: 0 },
  { name: "Sewa Tempat", type: "expense", isSystem: 0 },
  { name: "Listrik & Air", type: "expense", isSystem: 0 },
  { name: "Operasional", type: "expense", isSystem: 0 },
  { name: "Lain-lain", type: "expense", isSystem: 0 },
]

export async function seedDefaultCashflowCategories(db: Db): Promise<void> {
  const t = nowMs()
  for (const [i, c] of DEFAULT_CASHFLOW_CATEGORIES.entries()) {
    const existing = await db.query<{ id: string }>(
      `SELECT id FROM cashflow_categories WHERE name = ? AND deleted_at IS NULL LIMIT 1`,
      [c.name],
    )
    if (existing.length > 0) continue
    await db.run(
      `INSERT INTO cashflow_categories
         (id, name, type, is_system, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), c.name, c.type, c.isSystem, i, t, t],
    )
  }
}
