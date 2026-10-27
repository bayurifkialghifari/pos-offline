import assert from "node:assert/strict"
import { test } from "node:test"
import { releaseMetadata } from "../../scripts/release-metadata.mjs"

const notes =
  "# Changelog\n\n## [Unreleased]\n\n## [0.1.0] - 2026-10-27\n\n### Added\n\n- Offline checkout.\n\n## [0.0.9] - 2026-10-20\n\n- Older release.\n"
test("extracts only the requested dated section and computes Android code", () => {
  assert.deepEqual(releaseMetadata("v0.1.0", "0.1.0", notes), {
    version: "0.1.0",
    code: 1000,
    notes: "### Added\n\n- Offline checkout.",
  })
})
test("rejects mismatched, prerelease and noncanonical tags", () => {
  for (const tag of [
    "v0.2.0",
    "0.1.0",
    "v00.1.0",
    "v0.1.0-beta",
    "v0.1.0+build",
  ])
    assert.throws(() => releaseMetadata(tag, "0.1.0", notes), /Tag/)
})
test("rejects collisions and Android version bounds", () => {
  for (const version of ["0.0.0", "0.1000.0", "0.0.1000", "2101.0.0"])
    assert.throws(
      () => releaseMetadata("v" + version, version, notes),
      /Android/,
    )
})
test("requires dated, nonempty release notes", () => {
  for (const changelog of [
    "# Changelog",
    notes.replace("2026-10-27", "TBD"),
    "## [0.1.0] - 2026-10-27\n\n### Added\n",
  ])
    assert.throws(
      () => releaseMetadata("v0.1.0", "0.1.0", changelog),
      /changelog|notes/,
    )
})
