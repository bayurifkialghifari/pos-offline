import { z } from "zod"
import { releaseAssets, releaseSchema, UpdateError } from "./release"

export const UPDATE_CACHE_DURATION = 60 * 60 * 1000
const storageKey = "pos-offline:update-check:v1"
const cacheSchema = z.object({
  checkedAt: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  result: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("release"), release: releaseSchema.nullable() }),
    z.object({
      kind: z.literal("error"),
      message: z.string().min(1).max(1000),
    }),
  ]),
})
export type CachedUpdate = Readonly<z.infer<typeof cacheSchema>>
let memoryCache: CachedUpdate | null = null
let memoryOnly = false

export function readCachedUpdate(): CachedUpdate | null {
  let cache = memoryCache
  try {
    if (!memoryOnly && typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return null
      const parsed = cacheSchema.safeParse(JSON.parse(raw))
      if (!parsed.success) return null
      cache = parsed.data
      if (cache.result.kind === "release" && cache.result.release)
        releaseAssets(cache.result.release)
    }
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof UpdateError)
      return null
    if (!(error instanceof DOMException)) throw error
  }
  if (!cache) return null
  const age = Date.now() - cache.checkedAt
  return age >= 0 && age < UPDATE_CACHE_DURATION ? cache : null
}

export function writeCachedUpdate(cache: CachedUpdate): void {
  memoryCache = cache
  memoryOnly = true
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(cache))
      memoryOnly = false
    }
  } catch (error) {
    if (!(error instanceof DOMException)) throw error
  }
}
