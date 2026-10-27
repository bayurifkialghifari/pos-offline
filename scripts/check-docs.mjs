import { existsSync, readFileSync, readdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
const required = [
  "README.md",
  "PRD.md",
  "AGENTS.md",
  "architecture.md",
  "DESIGN.md",
  "CHANGELOG.md",
  "docs/features.md",
  "docs/verification.md",
]
for (const path of required)
  if (!existsSync(path)) throw new Error("Missing document: " + path)
const docs = [
  ...required,
  ...readdirSync("docs")
    .filter((name) => name.endsWith(".md"))
    .map((name) => "docs/" + name),
]
for (const path of new Set(docs)) {
  const contents = readFileSync(path, "utf8")
  if (!contents.startsWith("# "))
    throw new Error("Document needs a title: " + path)
  for (const link of contents.matchAll(/\]\(([^)]+)\)/g)) {
    const target = link[1].split("#")[0]
    if (
      target &&
      !/^[a-z]+:/.test(target) &&
      !existsSync(resolve(dirname(path), target))
    )
      throw new Error("Broken link in " + path + ": " + target)
  }
}
console.log("Documentation structure and local links verified")
