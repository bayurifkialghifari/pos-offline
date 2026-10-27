import { APP_VERSION } from "@/lib/version"
import { App } from "@capacitor/app"
import { Capacitor, registerPlugin } from "@capacitor/core"
import ky from "ky"
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
export async function checkUpdate(): Promise<Release | null> {
  const response = await ky.get(
    "https://api.github.com/repos/" + RELEASE_REPOSITORY + "/releases/latest",
    {
      timeout: 15000,
      retry: 1,
      headers: { Accept: "application/vnd.github+json" },
      throwHttpErrors: false,
    },
  )
  if (response.status === 404) return null
  if (!response.ok)
    throw new UpdateError(
      response.status === 403
        ? "Batas pemeriksaan GitHub tercapai. Coba lagi nanti."
        : "GitHub tidak bisa diakses. Periksa koneksi dan coba lagi.",
    )
  const parsed = releaseSchema.safeParse(await response.json())
  if (!parsed.success) throw new UpdateError("Data rilis tidak valid")
  releaseAssets(parsed.data)
  return versionCode(parsed.data.tag_name.slice(1)) >
    versionCode(await installedVersion())
    ? parsed.data
    : null
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
