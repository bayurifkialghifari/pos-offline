import {
  allowedAsset,
  parseChecksum,
  versionCode,
} from "@/services/updates/release"
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
