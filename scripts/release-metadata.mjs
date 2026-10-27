import { appendFileSync, readFileSync, writeFileSync } from "node:fs"
import { pathToFileURL } from "node:url"

export function releaseMetadata(tag, packageVersion, changelog) {
  const match = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(tag)
  if (!match || tag.slice(1) !== packageVersion)
    throw new Error("Tag must match package.json version")
  const [, major, minor, patch] = match.map(Number)
  const code = major * 1000000 + minor * 1000 + patch
  if (
    minor > 999 ||
    patch > 999 ||
    !Number.isSafeInteger(code) ||
    code < 1 ||
    code > 2100000000
  )
    throw new Error("Version exceeds Android bounds")
  const heading = "## [" + packageVersion + "] - "
  const sections = changelog.split(/(?=^## \[)/m)
  const section = sections.find((value) => value.startsWith(heading))
  if (!section || !/^## \[[^\]]+\] - \d{4}-\d{2}-\d{2}\n/.test(section))
    throw new Error("Missing dated changelog section")
  const notes = section.slice(section.indexOf("\n") + 1).trim()
  if (!notes || !/^[-*] .+/m.test(notes))
    throw new Error("Release notes must describe changes")
  return { version: packageVersion, code, notes }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [, , tag, output] = process.argv
  if (!tag || !output)
    throw new Error("Usage: node scripts/release-metadata.mjs TAG NOTES_PATH")
  const pkg = JSON.parse(readFileSync("package.json", "utf8"))
  const metadata = releaseMetadata(
    tag,
    pkg.version,
    readFileSync("CHANGELOG.md", "utf8"),
  )
  writeFileSync(output, metadata.notes + "\n")
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      "version=" + metadata.version + "\ncode=" + metadata.code + "\n",
    )
}
