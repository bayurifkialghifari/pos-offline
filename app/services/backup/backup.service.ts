import { persist } from "@/db/sqlite"
import type { Db } from "@/db/types"
import { APP_VERSION } from "@/lib/version"
import { strToU8, zipSync } from "fflate"
import {
  BackupError,
  digest,
  fromBase64,
  type ValidatedBackup,
} from "./archive"
import { inspectBackup } from "./inspect"
import { saveRecovery } from "./recovery"
import { checkReferences } from "./references"
import {
  BUSINESS_SETTINGS,
  TABLE_NAMES,
  tablesSchema,
  type BackupManifest,
} from "./schema"
export { BackupError, fromBase64, toBase64 } from "./archive"
export type { ValidatedBackup } from "./archive"
export { inspectBackup } from "./inspect"
export class BackupService {
  constructor(private readonly db: Db) {}
  async export(): Promise<Uint8Array> {
    const snapshot = await this.db.transaction(async (tx) => {
      const entries: Record<string, unknown> = {}
      for (const table of TABLE_NAMES)
        entries[table] = await tx.query("SELECT * FROM " + table)
      const parsedMedia = await tx.query<{ id: string; data: string }>(
        "SELECT id, data FROM media",
      )
      const mediaRows = await tx.query<Record<string, unknown>>(
        "SELECT id,mime,width,height,bytes,hash,created_at,updated_at,deleted_at FROM media",
      )
      entries["media"] = mediaRows
      const settings = await tx.query<{
        key: string
        value: string
        updated_at: number
      }>("SELECT * FROM settings")
      entries["settings"] = settings.filter((row) =>
        BUSINESS_SETTINGS.some((key) => key === row.key),
      )
      return { tables: tablesSchema.parse(entries), media: parsedMedia }
    })
    const files: Record<string, Uint8Array> = {}
    const fileInfo = []
    for (const row of snapshot.media) {
      const bytes = fromBase64(row.data),
        path = "media/" + row.id + ".bin"
      if (bytes.length > 8 * 1024 * 1024)
        throw new BackupError("Satu foto melebihi batas 8 MB")
      files[path] = bytes
      fileInfo.push({ path, size: bytes.length, sha256: await digest(bytes) })
    }
    const manifest: BackupManifest = {
      format: "pos-offline-backup",
      formatVersion: 1,
      schemaVersion: 1,
      appVersion: APP_VERSION,
      createdAt: Date.now(),
      tables: snapshot.tables,
      files: fileInfo,
    }
    checkReferences(manifest)
    files["manifest.json"] = strToU8(JSON.stringify(manifest))
    const archive = zipSync(files, { level: 6 })
    await inspectBackup(archive)
    return archive
  }
  async replace(backup: ValidatedBackup): Promise<void> {
    const validated = await inspectBackup(backup.archive)
    const recovery = await this.export()
    await saveRecovery(recovery)
    await this.db.transaction(async (tx) => {
      for (const table of [...TABLE_NAMES].reverse())
        if (table !== "settings") await tx.run("DELETE FROM " + table)
      for (const key of BUSINESS_SETTINGS)
        await tx.run("DELETE FROM settings WHERE key = ?", [key])
      await tx.run("DELETE FROM settings WHERE key = 'active_cart'")
      for (const table of TABLE_NAMES)
        for (const row of validated.manifest.tables[table]) {
          const values: Record<string, unknown> = { ...row }
          if (table === "media" && "id" in row)
            values["data"] = validated.media.get(row.id)
          const columns = Object.keys(values)
          await tx.run(
            "INSERT INTO " +
              table +
              " (" +
              columns.join(",") +
              ") VALUES (" +
              columns.map(() => "?").join(",") +
              ")",
            columns.map((column) => values[column]),
          )
        }
      if ((await tx.query("PRAGMA foreign_key_check")).length)
        throw new BackupError("Referensi database tidak valid")
    })
    await persist()
  }
}
