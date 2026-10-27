import { persist } from "@/db/sqlite"
import type { Db, SettingRow } from "@/db/types"
export class SettingsRepository {
  constructor(private readonly db: Db) {}
  async getAll(): Promise<Record<string, string>> {
    const rows = await this.db.query<SettingRow>(
      "SELECT key, value FROM settings",
    )
    return Object.fromEntries(rows.map((row) => [row.key, row.value]))
  }
  async get(key: string): Promise<string | null> {
    const rows = await this.db.query<SettingRow>(
      "SELECT value FROM settings WHERE key = ?",
      [key],
    )
    return rows[0]?.value ?? null
  }
  async set(key: string, value: string): Promise<void> {
    await this.setMany({ [key]: value })
  }
  async setMany(entries: Record<string, string>): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (const [key, value] of Object.entries(entries)) {
        await tx.run(
          "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
          [key, value, Date.now()],
        )
      }
    })
    if (!this.db.inTransaction) await persist()
  }
}
