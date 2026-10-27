import type { Db } from "./types"
export const DEFAULT_UNITS = [
  {
    id: "unit-pcs",
    label: "Buah",
    symbol: "pcs",
    dimension: "count",
    factor: 1,
  },
  {
    id: "unit-kg",
    label: "Kilogram",
    symbol: "kg",
    dimension: "weight",
    factor: 1000,
  },
  {
    id: "unit-liter",
    label: "Liter",
    symbol: "liter",
    dimension: "volume",
    factor: 1000,
  },
] as const
export async function seedUnits(db: Db): Promise<void> {
  await db.transaction(async (tx) => {
    for (const unit of DEFAULT_UNITS)
      await tx.run(
        "INSERT OR IGNORE INTO units (id,label,symbol,dimension,factor,active,created_at,updated_at,deleted_at) VALUES (?,?,?,?,?,1,?,?,NULL)",
        [
          unit.id,
          unit.label,
          unit.symbol,
          unit.dimension,
          unit.factor,
          Date.now(),
          Date.now(),
        ],
      )
  })
}
