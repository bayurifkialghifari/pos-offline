import { Resvg } from "@resvg/resvg-js"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
const root = "android/app/src/main/res/"
const icon = readFileSync("assets/branding/icon.svg", "utf8")
const foreground = readFileSync("assets/branding/foreground.svg", "utf8")
for (const [density, size] of Object.entries({
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
})) {
  const directory = root + "mipmap-" + density
  mkdirSync(directory, { recursive: true })
  const png = new Resvg(icon, { fitTo: { mode: "width", value: size } })
    .render()
    .asPng()
  writeFileSync(directory + "/ic_launcher.png", png)
  writeFileSync(directory + "/ic_launcher_round.png", png)
  writeFileSync(
    directory + "/ic_launcher_foreground.png",
    new Resvg(foreground, {
      fitTo: { mode: "width", value: Math.round(size * 2.25) },
    })
      .render()
      .asPng(),
  )
}
writeFileSync(
  "public/icon-512.png",
  new Resvg(icon, { fitTo: { mode: "width", value: 512 } }).render().asPng(),
)
