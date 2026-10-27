import { strFromU8, unzipSync } from "fflate"
import {
  BackupError,
  MAX_EXPANDED,
  MAX_ZIP,
  digest,
  toBase64,
  type ValidatedBackup,
} from "./archive"
import { checkReferences } from "./references"
import { backupSchema } from "./schema"
export async function inspectBackup(
  archive: Uint8Array,
): Promise<ValidatedBackup> {
  if (archive.byteLength > MAX_ZIP)
    throw new BackupError("Cadangan melebihi batas 64 MB")
  let expanded = 0,
    count = 0
  const names = new Set<string>()
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(archive, {
      filter: (file) => {
        expanded += file.originalSize
        count++
        if (
          count > 10001 ||
          expanded > MAX_EXPANDED ||
          names.has(file.name) ||
          (!/^media\/[a-zA-Z0-9_-]+\.bin$/.test(file.name) &&
            file.name !== "manifest.json")
        )
          throw new BackupError(
            "Arsip berisi jalur, ukuran, atau duplikat yang tidak diizinkan",
          )
        names.add(file.name)
        return true
      },
    })
  } catch (error) {
    if (error instanceof BackupError) throw error
    throw new BackupError("File ZIP rusak atau bukan cadangan POS Offline")
  }
  const raw = files["manifest.json"]
  if (!raw || raw.length > 32 * 1024 * 1024)
    throw new BackupError(
      "Manifest cadangan tidak ditemukan atau terlalu besar",
    )
  let decoded: unknown
  try {
    decoded = JSON.parse(strFromU8(raw))
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new BackupError("Manifest tidak bisa dibaca")
    throw error
  }
  const parsed = backupSchema.safeParse(decoded)
  if (!parsed.success)
    throw new BackupError(
      "Struktur atau versi cadangan tidak didukung: " +
        parsed.error.issues[0]?.message,
    )
  const manifest = parsed.data
  checkReferences(manifest)
  if (
    manifest.files.length !== manifest.tables.media.length ||
    names.size !== manifest.files.length + 1
  )
    throw new BackupError("Daftar media tidak lengkap")
  const media = new Map<string, string>()
  for (const row of manifest.tables.media) {
    const path = "media/" + row.id + ".bin"
    const info = manifest.files.find((file) => file.path === path)
    const bytes = files[path]
    if (
      !info ||
      !bytes ||
      bytes.length !== info.size ||
      (await digest(bytes)) !== info.sha256
    )
      throw new BackupError("Checksum foto tidak cocok")
    const png =
      bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    const webp =
      strFromU8(bytes.slice(0, 4)) === "RIFF" &&
      strFromU8(bytes.slice(8, 12)) === "WEBP"
    if (!(
      (row.mime === "image/png" && png) ||
      (row.mime === "image/jpeg" && jpeg) ||
      (row.mime === "image/webp" && webp)
    ))
      throw new BackupError("Jenis foto tidak cocok")
    media.set(row.id, toBase64(bytes))
  }
  return { manifest, media, archive: new Uint8Array(archive) }
}
