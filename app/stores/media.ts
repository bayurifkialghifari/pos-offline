import { getDb } from "@/db/sqlite"
import { sha256Hex, toDataUrl, type ProcessedImage } from "@/lib/image"
import { MediaRepository } from "@/repositories/media.repo"
import { defineStore } from "pinia"
import { ref } from "vue"

const REF_PREFIX = "media://"

export function mediaRefId(ref: string | null | undefined): string | null {
  if (!ref || !ref.startsWith(REF_PREFIX)) return null
  return ref.slice(REF_PREFIX.length) || null
}

interface CachedMedia {
  mime: string
  data: string | null
}

export const useMediaStore = defineStore("media", () => {
  const cache = ref<Map<string, CachedMedia>>(new Map())

  const version = ref(0)

  function repo() {
    return new MediaRepository(getDb())
  }

  async function ensure(refs: Array<string | null | undefined>) {
    const ids = Array.from(
      new Set(
        refs
          .map((r) => mediaRefId(r))
          .filter((id): id is string => !!id && !cache.value.has(id)),
      ),
    )
    if (!ids.length) return
    const rows = await repo().byIds(ids)
    for (const m of rows) {
      cache.value.set(m.id, {
        mime: m.mime,
        data: m.data,
      })
    }
    version.value++
  }

  function url(ref: string | null | undefined): string | null {
    void version.value
    const id = mediaRefId(ref)
    if (!id) return null
    const m = cache.value.get(id)
    if (!m) return null
    if (m.data) return toDataUrl(m.mime, m.data)
    return null
  }

  async function save(img: ProcessedImage): Promise<string> {
    const hash = await sha256Hex(img.data)
    const existing = await repo().findByHash(hash)
    const row =
      existing ??
      (await repo().create({
        mime: img.mime,
        width: img.width,
        height: img.height,
        bytes: img.bytes,
        hash,
        data: img.data,
      }))
    cache.value.set(row.id, {
      mime: row.mime,
      data: row.data,
    })
    version.value++
    return `${REF_PREFIX}${row.id}`
  }

  function clear() {
    cache.value.clear()
    version.value++
  }

  return { ensure, url, save, clear }
})
