import type { CheckoutLine } from "@/services/checkout.contract"
import { z } from "zod"
export interface CartLine extends CheckoutLine {
  readonly image_path: string | null
  readonly track_stock: number
  readonly stock: number
}
export interface CartSnapshot {
  readonly lines: readonly CartLine[]
  readonly discount: number
}
export interface ActiveOpenBill {
  readonly id: string
  readonly label: string | null
}
export interface OpenBillCartState {
  readonly bill: ActiveOpenBill
  readonly snapshot: CartSnapshot
}
export interface CartDraft extends CartSnapshot {
  readonly bill: ActiveOpenBill | null
}
const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const draftLine = z.object({
  productId: z.string(),
  name: z.string(),
  price: integer,
  qty: z.number().positive(),
  lineId: z.string(),
  unitId: z.string(),
  unitLabel: z.string(),
  unitSymbol: z.string(),
  unitDimension: z.enum(["count", "weight", "volume"]),
  unitFactor: integer.positive(),
  baseQty: integer.positive(),
  inputMode: z.enum(["quantity", "nominal"]),
  requestedNominal: integer.nullable(),
  lineTotal: integer,
  image_path: z.string().nullable(),
  track_stock: integer,
  stock: integer,
})
export const draftSchema = z.object({
  lines: z.array(draftLine).max(500),
  discount: integer,
  bill: z.object({ id: z.string(), label: z.string().nullable() }).nullable(),
})
