import { BaseRepository } from "@/db/BaseRepository"
import type { Media } from "@/db/types"

export class MediaRepository extends BaseRepository<Media> {
  protected readonly table = "media"

  get(id: string): Promise<Media | null> {
    return this.findById(id)
  }

  byIds(ids: string[]): Promise<Media[]> {
    if (!ids.length) return Promise.resolve([])
    const placeholders = ids.map(() => "?").join(", ")
    return this.list({ where: `id IN (${placeholders})`, params: ids })
  }

  async findByHash(hash: string): Promise<Media | null> {
    const rows = await this.list({ where: "hash = ?", params: [hash] })
    return rows[0] ?? null
  }
}
