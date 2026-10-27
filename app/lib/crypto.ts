function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function digestHex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest("SHA-256", bytes)
  return toHex(new Uint8Array(buf))
}

export async function makePinHash(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const saltHex = toHex(salt)
  const hash = await digestHex(`${saltHex}:${pin}`)
  return `${saltHex}:${hash}`
}

export async function verifyPin(
  pin: string,
  stored: string | null,
): Promise<boolean> {
  if (!stored) return false
  const sep = stored.indexOf(":")
  if (sep <= 0) return false
  const saltHex = stored.slice(0, sep)
  const expected = stored.slice(sep + 1)
  const actual = await digestHex(`${saltHex}:${pin}`)
  return actual === expected
}
