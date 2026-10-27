import { APP_VERSION } from "@/lib/version"
import { UpdateError, type Release } from "@/services/updates/release"
import { checkUpdate, installedVersion } from "@/services/updates/updater"
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

beforeEach(() => {
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

    const result = await checkUpdate()

    expect(result).toEqual(available ? release : null)
  },
)

it("reads the package version when running in a browser", async () => {
  vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

  const version = await installedVersion()

  expect(version).toBe(APP_VERSION)
  expect(App.getInfo).not.toHaveBeenCalled()
})

it("uses the package version when checking updates in a browser", async () => {
  vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
  fetchResponse.mockResolvedValue(Response.json(release))

  const result = await checkUpdate()

  expect(result).toBeNull()
  expect(App.getInfo).not.toHaveBeenCalled()
})

it("returns no update when GitHub has no published stable release", async () => {
  fetchResponse.mockResolvedValue(new Response(null, { status: 404 }))

  const result = await checkUpdate()

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

  await expect(checkUpdate()).rejects.toThrow(UpdateError)
})

it.each([403, 503])(
  "reports an update error when GitHub returns %i",
  async (status) => {
    vi.useFakeTimers()
    fetchResponse.mockImplementation(async () => new Response(null, { status }))

    const result = expect(checkUpdate()).rejects.toThrow(UpdateError)
    await vi.runAllTimersAsync()

    await result
  },
)

it("rejects the check when the network remains offline after retry", async () => {
  vi.useFakeTimers()
  fetchResponse.mockRejectedValue(new TypeError("Network unavailable"))

  const result = expect(checkUpdate()).rejects.toThrow(TypeError)
  await vi.runAllTimersAsync()

  await result
})

it("times out when GitHub never responds", async () => {
  vi.useFakeTimers()
  fetchResponse.mockImplementation(() => new Promise<Response>(() => undefined))

  const result = expect(checkUpdate()).rejects.toThrow(TimeoutError)
  await vi.runAllTimersAsync()

  await result
})
