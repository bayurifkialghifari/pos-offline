import type { BackupManifest } from "./schema"
export class BackupError extends Error {
  override readonly name = "BackupError"
}
export const MAX_ZIP = 64 * 1024 * 1024
export const MAX_EXPANDED = 128 * 1024 * 1024
export interface ValidatedBackup {
  readonly manifest: BackupManifest
  readonly media: ReadonlyMap<string, string>
  readonly archive: Uint8Array
}
export function fromBase64(data: string): Uint8Array {
  return Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
}
export function toBase64(data: Uint8Array): string {
  let result = ""
  for (let i = 0; i < data.length; i += 32768)
    result += String.fromCharCode(...data.subarray(i, i + 32768))
  return btoa(result)
}
export async function digest(bytes: Uint8Array): Promise<string> {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new Uint8Array(bytes).buffer),
    ),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("")
}
