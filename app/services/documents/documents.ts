import { pickDataFile } from "@/lib/file"
import { BackupError, fromBase64, toBase64 } from "@/services/backup/archive"
import { Capacitor, registerPlugin } from "@capacitor/core"
interface DocumentPlugin {
  pick(): Promise<{ cancelled: boolean; name?: string; data?: string }>
  save(options: { name: string; data: string }): Promise<{ cancelled: boolean }>
}
const Documents = registerPlugin<DocumentPlugin>("Documents")
export async function pickBackup(): Promise<{
  name: string
  bytes: Uint8Array
} | null> {
  if (Capacitor.isNativePlatform()) {
    const result = await Documents.pick()
    if (result.cancelled) return null
    if (!result.data || !result.name)
      throw new BackupError("Dokumen tidak bisa dibaca")
    return { name: result.name, bytes: fromBase64(result.data) }
  }
  const file = await pickDataFile([".zip"])
  if (!file) return null
  if (file.size > 64 * 1024 * 1024)
    throw new BackupError("Cadangan melebihi batas 64 MB")
  return { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) }
}
export async function saveBackup(
  name: string,
  bytes: Uint8Array,
): Promise<boolean> {
  if (Capacitor.isNativePlatform())
    return !(await Documents.save({ name, data: toBase64(bytes) })).cancelled
  const blob = new Blob([new Uint8Array(bytes).buffer], {
    type: "application/zip",
  })
  const url = URL.createObjectURL(blob),
    link = document.createElement("a")
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
