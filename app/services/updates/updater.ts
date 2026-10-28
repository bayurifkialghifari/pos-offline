import { APP_VERSION } from "@/lib/version"
import { App } from "@capacitor/app"
import { Capacitor, registerPlugin } from "@capacitor/core"
import ky from "ky"
import { readCachedUpdate, writeCachedUpdate, type CachedUpdate } from "./cache"
import {
  parseChecksum,
  RELEASE_REPOSITORY,
  releaseAssets,
  releaseSchema,
  UpdateError,
  versionCode,
  type Release,
} from "./release"
interface UpdatePlugin {
  readChecksum(options: { url: string }): Promise<{ text: string }>
  downloadAndInstall(options: {
    url: string
    filename: string
    sha256: string
  }): Promise<{ status: "permission_required" | "install_started" }>
}
const AppUpdate = registerPlugin<UpdatePlugin>("AppUpdate")
export async function installedVersion(): Promise<string> {
  return Capacitor.isNativePlatform()
    ? (await App.getInfo()).version
    : APP_VERSION
}
let pendingCheck: Promise<Release | null> | null = null
export function checkUpdate(): Promise<Release | null> {
  if (pendingCheck) return pendingCheck
  pendingCheck = (async () => {
    const cached = readCachedUpdate()
    const result = cached ?? (await requestUpdate())
    switch (result.result.kind) {
      case "error":
        throw new UpdateError(result.result.message)
      case "release": {
        const release = result.result.release
        return release &&
          versionCode(release.tag_name.slice(1)) >
            versionCode(await installedVersion())
          ? release
          : null
      }
      default: {
        const unreachable: never = result.result
        return unreachable
      }
    }
  })().finally(() => {
    pendingCheck = null
  })
  return pendingCheck
}

async function requestUpdate(): Promise<CachedUpdate> {
  const response = await ky.get(
    "https://api.github.com/repos/" + RELEASE_REPOSITORY + "/releases/latest",
    {
      timeout: 15000,
      retry: { limit: 1, statusCodes: [408, 500, 502, 503, 504] },
      headers: { Accept: "application/vnd.github+json" },
      throwHttpErrors: false,
    },
  )
  let result: CachedUpdate["result"]
  try {
    if (response.status === 404) {
      result = { kind: "release", release: null }
    } else {
      if (!response.ok)
        throw new UpdateError(
          response.status === 429 ||
            (response.status === 403 &&
              (response.headers.get("x-ratelimit-remaining") === "0" ||
                response.headers.has("retry-after")))
            ? "Batas pemeriksaan GitHub tercapai. Coba lagi setelah jeda pemeriksaan."
            : "GitHub tidak bisa diakses. Coba lagi setelah jeda pemeriksaan.",
        )
      const parsed = releaseSchema.safeParse(await response.json())
      if (!parsed.success) throw new UpdateError("Data rilis tidak valid")
      releaseAssets(parsed.data)
      result = { kind: "release", release: parsed.data }
    }
  } catch (error) {
    if (error instanceof UpdateError || error instanceof SyntaxError)
      result = {
        kind: "error",
        message:
          error instanceof UpdateError
            ? error.message
            : "Data rilis tidak valid",
      }
    else throw error
  }
  const cached = { checkedAt: Date.now(), result }
  writeCachedUpdate(cached)
  return cached
}
export async function installUpdate(
  release: Release,
): Promise<"permission_required" | "install_started"> {
  if (!Capacitor.isNativePlatform())
    throw new UpdateError("Pemasangan langsung tersedia di Android")
  const { apk, checksums } = releaseAssets(release)
  const { text } = await AppUpdate.readChecksum({
    url: checksums.browser_download_url,
  })
  const sha256 = parseChecksum(text, apk.name)
  return (
    await AppUpdate.downloadAndInstall({
      url: apk.browser_download_url,
      filename: apk.name,
      sha256,
    })
  ).status
}
