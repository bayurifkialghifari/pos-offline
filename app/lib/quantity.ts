import type { Unit } from "@/db/types"
export class QuantityError extends Error {
  override readonly name = "QuantityError"
}
export function safeNumber(value: bigint): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER))
    throw new QuantityError("Angka terlalu besar")
  return Number(value)
}
export function roundRatio(numerator: bigint, denominator: bigint): number {
  if (denominator <= 0n) throw new QuantityError("Konversi satuan tidak valid")
  return safeNumber((numerator + denominator / 2n) / denominator)
}
export function parseRupiah(raw: string): number {
  if (!/^\d+$/.test(raw.trim()))
    throw new QuantityError("Masukkan rupiah bulat tanpa pemisah")
  return safeNumber(BigInt(raw.trim()))
}
export function parseQuantity(raw: string, factor: number): number {
  const normalized = raw.trim().replace(",", ".")
  if (!/^\d+(?:\.\d{1,6})?$/.test(normalized))
    throw new QuantityError("Jumlah tidak valid")
  const [whole, fraction = ""] = normalized.split(".")
  const numerator = BigInt((whole ?? "0") + fraction) * BigInt(factor)
  const denominator = 10n ** BigInt(fraction.length)
  if (numerator % denominator !== 0n)
    throw new QuantityError("Jumlah lebih kecil dari ketelitian satuan")
  const baseQty = safeNumber(numerator / denominator)
  if (baseQty === 0) throw new QuantityError("Jumlah harus lebih dari nol")
  return baseQty
}
export function amountForQuantity(
  price: number,
  baseQty: number,
  factor: number,
): number {
  return roundRatio(BigInt(price) * BigInt(baseQty), BigInt(factor))
}
export function quantityForNominal(
  price: number,
  nominal: number,
  factor: number,
): number {
  if (price <= 0 || nominal <= 0)
    throw new QuantityError("Harga dan nominal harus lebih dari nol")
  const qty = roundRatio(BigInt(nominal) * BigInt(factor), BigInt(price))
  if (qty === 0)
    throw new QuantityError("Nominal terlalu kecil untuk satuan ini")
  return qty
}
export function formatQuantity(
  baseQty: number,
  unit: Pick<Unit, "factor" | "symbol">,
): string {
  return (
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 6 }).format(
      baseQty / unit.factor,
    ) +
    " " +
    unit.symbol
  )
}
