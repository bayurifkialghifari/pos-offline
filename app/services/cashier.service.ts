import { persist } from "@/db/sqlite"
import type { CashierSession, Db } from "@/db/types"
import { nowMs } from "@/lib/datetime"
import {
  CashierSessionRepository,
  type SessionCashSummary,
} from "@/repositories/cashierSession.repo"
import { z } from "zod"

const money = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
export interface OpenSessionInput {
  readonly openingCash: number
  readonly openedBy?: string | null
  readonly note?: string | null
}
export interface CloseSessionInput {
  readonly sessionId: string
  readonly countedCash: number
  readonly note?: string | null
}
export class CashierError extends Error {
  override readonly name = "CashierError"
}
export async function assertOpenSession(
  db: Db,
  id: string | null | undefined,
): Promise<void> {
  if (!id) return
  const session = await new CashierSessionRepository(db).findById(id)
  if (!session || session.status !== "open")
    throw new CashierError("Sesi kasir sudah ditutup. Pilih sesi yang aktif.")
}
export class CashierService {
  constructor(private readonly db: Db) {}
  async open(input: OpenSessionInput): Promise<CashierSession> {
    const amount = money.parse(input.openingCash)
    const session = await this.db.transaction(async (tx) => {
      const repo = new CashierSessionRepository(tx)
      if (await repo.current())
        throw new CashierError("Masih ada sesi kasir yang terbuka")
      return repo.create({
        opened_at: nowMs(),
        closed_at: null,
        opening_cash: amount,
        expected_cash: amount,
        counted_cash: null,
        difference: null,
        status: "open",
        opened_by: input.openedBy ?? null,
        note: input.note ?? null,
      })
    })
    await persist()
    return session
  }
  summary(session: CashierSession): Promise<SessionCashSummary> {
    return new CashierSessionRepository(this.db).summary(session)
  }
  async close(input: CloseSessionInput): Promise<CashierSession | null> {
    const counted = money.parse(input.countedCash)
    const result = await this.db.transaction(async (tx) => {
      const repo = new CashierSessionRepository(tx)
      const session = await repo.findById(input.sessionId)
      if (!session || session.status !== "open")
        throw new CashierError("Sesi tidak ditemukan atau sudah ditutup")
      const { expectedCash } = await repo.summary(session)
      return repo.update(session.id, {
        closed_at: nowMs(),
        expected_cash: expectedCash,
        counted_cash: counted,
        difference: counted - expectedCash,
        status: "closed",
        note: input.note ?? session.note,
      })
    })
    await persist()
    return result
  }
}
