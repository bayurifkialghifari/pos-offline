import { BaseRepository } from "@/db/BaseRepository"
import type { Unit } from "@/db/types"
export class UnitRepository extends BaseRepository<Unit> {
  protected readonly table = "units"
}
