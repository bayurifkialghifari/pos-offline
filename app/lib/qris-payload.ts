export class QrisError extends Error {
  override readonly name = "QrisError"
}
type Field = { readonly id: string; readonly value: string }

export function crc16(value: string): string {
  let crc = 0xffff
  for (const byte of new TextEncoder().encode(value)) {
    crc ^= byte << 8
    for (let bit = 0; bit < 8; bit++)
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0")
}

function parse(payload: string): Field[] {
  const fields: Field[] = []
  const ids = new Set<string>()
  let offset = 0
  while (offset < payload.length) {
    const header = payload.slice(offset, offset + 4)
    if (!/^\d{4}$/.test(header))
      throw new QrisError("Struktur QRIS tidak valid")
    const id = header.slice(0, 2)
    const length = Number(header.slice(2))
    const end = offset + 4 + length
    if (length === 0 || end > payload.length || ids.has(id))
      throw new QrisError("Panjang atau tag QRIS tidak valid")
    ids.add(id)
    fields.push({ id, value: payload.slice(offset + 4, end) })
    offset = end
  }
  const find = (id: string) => fields.find((field) => field.id === id)?.value
  const checksum = fields.at(-1)
  if (
    find("00") !== "01" ||
    !["11", "12"].includes(find("01") ?? "") ||
    find("53") !== "360" ||
    find("58") !== "ID" ||
    checksum?.id !== "63" ||
    !/^[0-9A-Fa-f]{4}$/.test(checksum.value) ||
    crc16(payload.slice(0, -4)) !== checksum.value.toUpperCase()
  )
    throw new QrisError("QRIS atau checksum tidak valid")
  return fields
}

export function isValidQris(payload: string): boolean {
  try {
    parse(payload.trim())
    return true
  } catch (error) {
    if (error instanceof QrisError) return false
    throw error
  }
}

export function makeDynamicPayload(payload: string, amount: number): string {
  if (!Number.isSafeInteger(amount) || amount <= 0)
    throw new QrisError("Nominal harus berupa rupiah bulat positif")
  const fields = parse(payload.trim())
    .filter((field) => field.id !== "54" && field.id !== "63")
    .map((field) => (field.id === "01" ? { id: "01", value: "12" } : field))
  fields.push({ id: "54", value: String(amount) })
  fields.sort((a, b) => Number(a.id) - Number(b.id))
  const body =
    fields
      .map(
        (field) =>
          field.id + String(field.value.length).padStart(2, "0") + field.value,
      )
      .join("") + "6304"
  return body + crc16(body)
}
