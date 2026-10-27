import { z } from "zod"
const semver = z.string().regex(/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/)
export const RELEASE_REPOSITORY = "bayurifkialghifari/pos-offline"
export const releaseSchema = z.object({
  tag_name: semver,
  draft: z.literal(false),
  prerelease: z.literal(false),
  body: z.string().nullable(),
  html_url: z.string().url(),
  assets: z.array(
    z.object({
      name: z.string(),
      browser_download_url: z.string().url(),
      size: z.number().int().positive(),
    }),
  ),
})
export type Release = z.infer<typeof releaseSchema>
export class UpdateError extends Error {
  override readonly name = "UpdateError"
}
export function versionCode(version: string): number {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(version)
  if (!match) throw new UpdateError("Versi tidak valid")
  const major = Number(match[1]),
    minor = Number(match[2]),
    patch = Number(match[3]),
    code = major * 1000000 + minor * 1000 + patch
  if (
    minor > 999 ||
    patch > 999 ||
    !Number.isSafeInteger(code) ||
    code > 2100000000 ||
    code < 1
  )
    throw new UpdateError("Versi di luar batas Android")
  return code
}
export function allowedAsset(url: string, tag: string, name: string): boolean {
  const expected =
    "https://github.com/" +
    RELEASE_REPOSITORY +
    "/releases/download/" +
    tag +
    "/" +
    name
  return url === expected
}
export function releaseAssets(release: Release) {
  versionCode(release.tag_name.slice(1))
  const apkName = "pos-offline-" + release.tag_name + ".apk"
  const apk = release.assets.find((a) => a.name === apkName),
    checksums = release.assets.find((a) => a.name === "SHA256SUMS.txt")
  if (
    !apk ||
    !checksums ||
    apk.size > 100 * 1024 * 1024 ||
    checksums.size > 16384 ||
    !allowedAsset(apk.browser_download_url, release.tag_name, apkName) ||
    !allowedAsset(
      checksums.browser_download_url,
      release.tag_name,
      "SHA256SUMS.txt",
    )
  )
    throw new UpdateError("Rilis belum memiliki APK dan checksum yang valid")
  return { apk, checksums }
}
export function parseChecksum(text: string, filename: string): string {
  const matches = text
    .split(/\r?\n/)
    .map((line) => /^([a-fA-F0-9]{64})\s+\*?([^\s/]+)$/.exec(line.trim()))
    .filter((match) => match?.[2] === filename)
  const hash = matches[0]?.[1]
  if (matches.length !== 1 || !hash)
    throw new UpdateError("Checksum APK tidak tersedia atau duplikat")
  return hash.toLowerCase()
}
