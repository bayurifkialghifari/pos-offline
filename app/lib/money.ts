const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const plain = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatRupiah(amount: number): string {
  return idr.format(Math.round(amount || 0))
}

export function formatNumber(amount: number): string {
  return plain.format(Math.round(amount || 0))
}

export function parseRupiah(input: string): number {
  if (!input) return 0
  const digits = input.replace(/[^\d]/g, "")
  return digits ? parseInt(digits, 10) : 0
}
