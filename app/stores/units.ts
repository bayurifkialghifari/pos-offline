import { getDb } from "@/db/sqlite"
import type { Unit } from "@/db/types"
import { UnitRepository } from "@/repositories/unit.repo"
import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { z } from "zod"
const unitInput = z.object({
  label: z.string().trim().min(1).max(40),
  symbol: z
    .string()
    .trim()
    .min(1)
    .max(12)
    .regex(/^[a-zA-Z0-9]+$/),
  dimension: z.enum(["count", "weight", "volume"]),
  factor: z.number().int().positive().max(1000000),
  active: z.literal(1),
})
export const useUnitsStore = defineStore("units", () => {
  const items = ref<Unit[]>([])
  const active = computed(() => items.value.filter((unit) => unit.active === 1))
  async function load() {
    items.value = await new UnitRepository(getDb()).list({
      orderBy: "created_at ASC",
    })
  }
  function byId(id: string): Unit {
    const unit = items.value.find((u) => u.id === id)
    if (!unit) throw new UnitError("Satuan tidak ditemukan")
    return unit
  }
  async function create(input: z.input<typeof unitInput>) {
    await new UnitRepository(getDb()).create(unitInput.parse(input))
    await load()
  }
  async function toggle(unit: Unit) {
    await new UnitRepository(getDb()).update(unit.id, {
      active: unit.active ? 0 : 1,
    })
    await load()
  }
  return { items, active, load, byId, create, toggle }
})
export class UnitError extends Error {
  override readonly name = "UnitError"
}
