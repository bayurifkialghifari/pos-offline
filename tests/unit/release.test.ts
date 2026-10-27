import {
  allowedAsset,
  parseChecksum,
  versionCode,
} from "@/services/updates/release"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { expect, it } from "vitest"
it("maps ordered versions without collisions and rejects invalid Android values", () => {
  expect(versionCode("0.1.0")).toBe(1000)
  expect(versionCode("1.0.0")).toBeGreaterThan(versionCode("0.999.999"))
  for (const version of [
    "01.0.0",
    "1.1000.0",
    "1.0.1000",
    "2101.0.0",
    "v1.0.0",
    "0.0.0",
  ])
    expect(() => versionCode(version)).toThrow()
})
it("requires one exact APK checksum and repository-scoped download", () => {
  const hash = "a".repeat(64)
  expect(
    parseChecksum(hash + "  pos-offline-v0.1.0.apk", "pos-offline-v0.1.0.apk"),
  ).toBe(hash)
  expect(() =>
    parseChecksum(
      hash + "  ../pos-offline-v0.1.0.apk",
      "pos-offline-v0.1.0.apk",
    ),
  ).toThrow()
  expect(() =>
    parseChecksum(
      (hash + "  pos-offline-v0.1.0.apk\n").repeat(2),
      "pos-offline-v0.1.0.apk",
    ),
  ).toThrow()
  expect(
    allowedAsset(
      "https://github.com/other/repo/releases/download/v0.1.0/file.apk",
      "v0.1.0",
      "file.apk",
    ),
  ).toBe(false)
})

it("produces updater-compatible checksums when the release workflow prepares assets", () => {
  const filename = "pos-offline-v0.1.0.apk"
  const apk = Buffer.from("release APK fixture")
  const workflow = readFileSync(".github/workflows/android-release.yml", "utf8")
  const command = workflow
    .split("\n")
    .find((line) => line.trimStart().startsWith("sha256sum "))
  if (!command) throw new TypeError("Release checksum command is missing")
  const directory = mkdtempSync(join(tmpdir(), "pos-offline-release-"))
  try {
    writeFileSync(join(directory, filename), apk)
    writeFileSync(
      join(directory, "pos-offline-v0.1.0.aab"),
      "release AAB fixture",
    )

    execFileSync("sh", ["-c", command.trim()], { cwd: directory })

    const text = readFileSync(join(directory, "SHA256SUMS.txt"), "utf8")
    expect(parseChecksum(text, filename)).toBe(
      createHash("sha256").update(apk).digest("hex"),
    )
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
