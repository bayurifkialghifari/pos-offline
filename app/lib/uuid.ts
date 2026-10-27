import { v4 as uuidv4, v7 as uuidv7 } from "uuid"

export function uuid(): string {
  return uuidv4()
}

export function deviceUuid(): string {
  return uuidv7()
}

export function devicePrefixOf(id: string, len = 4): string {
  const hex = (id || uuidv4()).replace(/-/g, "")
  return hex.slice(-len).toUpperCase()
}

export function shortId(len = 6): string {
  return uuidv4().replace(/-/g, "").slice(0, len).toUpperCase()
}
