import { APP_VERSION } from "@/lib/version"
import { readCachedUpdate } from "@/services/updates/cache"
import { UpdateError, type Release } from "@/services/updates/release"
import * as updater from "@/services/updates/updater"
import { App } from "@capacitor/app"
import { Capacitor } from "@capacitor/core"
import { TimeoutError } from "ky"
import { afterEach, beforeEach, expect, it, vi } from "vitest"

vi.mock("@capacitor/app", () => ({ App: { getInfo: vi.fn() } }))

const release = {
  tag_name: "v0.1.0",
  draft: false,
  prerelease: false,
  body: "Initial stable release notes.",
  html_url:
    "https://github.com/bayurifkialghifari/pos-offline/releases/tag/v0.1.0",
  assets: [
    {
      name: "pos-offline-v0.1.0.apk",
      size: 1024,
      browser_download_url:
        "https://github.com/bayurifkialghifari/pos-offline/releases/download/v0.1.0/pos-offline-v0.1.0.apk",
    },
    {
      name: "SHA256SUMS.txt",
      size: 200,
      browser_download_url:
        "https://github.com/bayurifkialghifari/pos-offline/releases/download/v0.1.0/SHA256SUMS.txt",
    },
  ],
} satisfies Release
const nativeInfo = {
  id: "com.karuhundeveloper.posoffline",
  name: "POS Offline",
  build: "9",
  version: "0.0.9",
} as const
const fetchResponse = vi.fn<typeof fetch>()
const storage = new Map<string, string>()

beforeEach(() => {
  storage.clear()
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  })
  fetchResponse.mockReset()
  vi.stubGlobal("fetch", fetchResponse)
  vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true)
  vi.mocked(App.getInfo).mockReset().mockResolvedValue(nativeInfo)
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it.each([
  { version: "0.0.9", available: true },
  { version: "0.1.0", available: false },
  { version: "0.1.1", available: false },
])(
  "compares the release with installed Android $version",
  async ({ version, available }) => {
    vi.mocked(App.getInfo).mockResolvedValue({ ...nativeInfo, version })
    fetchResponse.mockResolvedValue(Response.json(release))

    const result = await updater.checkUpdate()

    expect(result).toEqual(available ? release : null)
  },
)

it("reads the package version when running in a browser", async () => {
  vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

  const version = await updater.installedVersion()

  expect(version).toBe(APP_VERSION)
  expect(App.getInfo).not.toHaveBeenCalled()
})

it("uses the package version when checking updates in a browser", async () => {
  vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
  fetchResponse.mockResolvedValue(Response.json(release))

  const result = await updater.checkUpdate()

  expect(result).toBeNull()
  expect(App.getInfo).not.toHaveBeenCalled()
})

it("returns no update when GitHub has no published stable release", async () => {
  fetchResponse.mockResolvedValue(new Response(null, { status: 404 }))

  const result = await updater.checkUpdate()

  expect(result).toBeNull()
})

it.each([
  { reason: "a draft", body: { ...release, draft: true } },
  { reason: "a prerelease", body: { ...release, prerelease: true } },
  { reason: "an invalid tag", body: { ...release, tag_name: "v01.1.0" } },
  { reason: "missing assets", body: { ...release, assets: [] } },
  {
    reason: "foreign asset URLs",
    body: {
      ...release,
      assets: release.assets.map((asset) => ({
        ...asset,
        browser_download_url: asset.browser_download_url.replace(
          "bayurifkialghifari/pos-offline",
          "other/repo",
        ),
      })),
    },
  },
])("rejects release metadata when it contains $reason", async ({ body }) => {
  fetchResponse.mockResolvedValue(Response.json(body))

  await expect(updater.checkUpdate()).rejects.toThrow(UpdateError)
})

it.each([403, 503])(
  "reports an update error when GitHub returns %i",
  async (status) => {
    vi.useFakeTimers()
    fetchResponse.mockImplementation(async () => new Response(null, { status }))

    const result = expect(updater.checkUpdate()).rejects.toThrow(UpdateError)
    await vi.runAllTimersAsync()

    await result
  },
)

it("rejects the check when the network remains offline after retry", async () => {
  vi.useFakeTimers()
  fetchResponse.mockRejectedValue(new TypeError("Network unavailable"))

  const result = expect(updater.checkUpdate()).rejects.toThrow(TypeError)
  await vi.runAllTimersAsync()

  await result
})

it("times out when GitHub never responds", async () => {
  vi.useFakeTimers()
  fetchResponse.mockImplementation(() => new Promise<Response>(() => undefined))

  const result = expect(updater.checkUpdate()).rejects.toThrow(TimeoutError)
  await vi.runAllTimersAsync()

  await result
})

it("reuses a release across reloads until exactly one hour expires", async () => {
  vi.useFakeTimers()
  const checkedAt = new Date("2026-10-28T06:00:00Z")
  vi.setSystemTime(checkedAt)
  fetchResponse.mockImplementation(async () => Response.json(release))
  await updater.checkUpdate()
  vi.resetModules()
  const reloaded = await import("@/services/updates/updater")
  vi.setSystemTime(checkedAt.getTime() + 60 * 60 * 1000 - 1)

  const cached = await reloaded.checkUpdate()

  expect(cached).toEqual(release)
  expect(fetchResponse).toHaveBeenCalledTimes(1)
  vi.setSystemTime(checkedAt.getTime() + 60 * 60 * 1000)
  await reloaded.checkUpdate()
  expect(fetchResponse).toHaveBeenCalledTimes(2)
})

it.each([200, 404])(
  "reuses a no-update response with status %i",
  async (status) => {
    vi.mocked(App.getInfo).mockResolvedValue({
      ...nativeInfo,
      version: "0.1.0",
    })
    fetchResponse.mockImplementation(async () =>
      status === 200 ? Response.json(release) : new Response(null, { status }),
    )
    await updater.checkUpdate()

    const result = await updater.checkUpdate()

    expect(result).toBeNull()
    expect(fetchResponse).toHaveBeenCalledTimes(1)
  },
)

it("deduplicates simultaneous update checks", async () => {
  fetchResponse.mockImplementation(async () => Response.json(release))

  const results = await Promise.all([
    updater.checkUpdate(),
    updater.checkUpdate(),
  ])

  expect(results).toEqual([release, release])
  expect(fetchResponse).toHaveBeenCalledTimes(1)
})

it("persists rate-limit feedback instead of requesting GitHub again", async () => {
  fetchResponse.mockImplementation(
    async () => new Response(null, { status: 403 }),
  )
  await expect(updater.checkUpdate()).rejects.toThrow(UpdateError)
  vi.resetModules()
  const reloaded = await import("@/services/updates/updater")

  await expect(reloaded.checkUpdate()).rejects.toMatchObject({
    name: "UpdateError",
  })

  expect(fetchResponse).toHaveBeenCalledTimes(1)
})

it("compares a cached release with the newly installed version", async () => {
  fetchResponse.mockImplementation(async () => Response.json(release))
  await updater.checkUpdate()
  vi.mocked(App.getInfo).mockResolvedValue({ ...nativeInfo, version: "0.1.0" })

  const result = await updater.checkUpdate()

  expect(result).toBeNull()
  expect(fetchResponse).toHaveBeenCalledTimes(1)
})

it("allows a successful retry after a network failure", async () => {
  vi.useFakeTimers()
  fetchResponse.mockRejectedValue(new TypeError("Network unavailable"))
  const failure = expect(updater.checkUpdate()).rejects.toThrow(TypeError)
  await vi.runAllTimersAsync()
  await failure
  fetchResponse.mockImplementation(async () => Response.json(release))

  const result = await updater.checkUpdate()

  expect(result).toEqual(release)
})

it.each([
  { status: 403, remaining: "0", limited: true },
  { status: 403, remaining: "59", limited: false },
  { status: 429, remaining: "59", limited: true },
])(
  "caches HTTP $status with remaining $remaining without retrying",
  async ({ status, remaining, limited }) => {
    fetchResponse.mockImplementation(
      async () =>
        new Response(null, {
          status,
          headers: { "x-ratelimit-remaining": remaining },
        }),
    )
    await expect(updater.checkUpdate()).rejects.toThrow(
      limited ? "Batas pemeriksaan GitHub" : "GitHub tidak bisa diakses",
    )

    await expect(updater.checkUpdate()).rejects.toThrow(UpdateError)

    expect(fetchResponse).toHaveBeenCalledTimes(1)
  },
)

it.each([
  { reason: "malformed JSON", raw: "{" },
  { reason: "an invalid schema", raw: JSON.stringify({ checkedAt: "today" }) },
  {
    reason: "a future timestamp",
    raw: JSON.stringify({
      checkedAt: Date.now() + 60 * 60 * 1000,
      result: { kind: "release", release },
    }),
  },
  {
    reason: "foreign assets",
    raw: JSON.stringify({
      checkedAt: Date.now(),
      result: {
        kind: "release",
        release: {
          ...release,
          assets: release.assets.map((asset) => ({
            ...asset,
            browser_download_url: asset.browser_download_url.replace(
              "bayurifkialghifari/pos-offline",
              "other/repo",
            ),
          })),
        },
      },
    }),
  },
])("ignores persisted cache containing $reason without fetching", ({ raw }) => {
  storage.set("pos-offline:update-check:v1", raw)

  const cached = readCachedUpdate()

  expect(cached).toBeNull()
  expect(fetchResponse).not.toHaveBeenCalled()
})

it("keeps the cooldown in memory when persistent storage is denied", async () => {
  vi.resetModules()
  const isolated = await import("@/services/updates/updater")
  const checkedAt = new Date("2026-10-28T06:00:00Z")
  vi.useFakeTimers()
  vi.setSystemTime(checkedAt)
  fetchResponse.mockImplementation(async () => Response.json(release))
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw new DOMException("Storage denied", "SecurityError")
    },
    setItem: () => {
      throw new DOMException("Storage full", "QuotaExceededError")
    },
  })
  await isolated.checkUpdate()

  const result = await isolated.checkUpdate()

  expect(result).toEqual(release)
  expect(fetchResponse).toHaveBeenCalledTimes(1)
})

it.each([false, true])(
  "keeps the latest cooldown when only storage writes fail with stale cache %s",
  async (stale) => {
    vi.resetModules()
    const isolated = await import("@/services/updates/updater")
    const cache = await import("@/services/updates/cache")
    vi.useFakeTimers()
    const checkedAt = new Date("2026-10-28T06:00:00Z")
    vi.setSystemTime(checkedAt)
    const raw = stale
      ? JSON.stringify({
          checkedAt: checkedAt.getTime() - 60 * 60 * 1000,
          result: { kind: "release", release: null },
        })
      : null
    vi.stubGlobal("localStorage", {
      getItem: () => raw,
      setItem: () => {
        throw new DOMException("Storage full", "QuotaExceededError")
      },
    })
    fetchResponse.mockImplementation(async () => Response.json(release))
    await isolated.checkUpdate()

    expect(cache.readCachedUpdate()?.checkedAt).toBe(checkedAt.getTime())
    expect(await isolated.checkUpdate()).toEqual(release)
    expect(fetchResponse).toHaveBeenCalledTimes(1)
    vi.setSystemTime(checkedAt.getTime() + 60 * 60 * 1000)
    await isolated.checkUpdate()
    expect(fetchResponse).toHaveBeenCalledTimes(2)
  },
)
