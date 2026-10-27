import { Capacitor } from "@capacitor/core"
export function pickDataFile(exts: string[]): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = Capacitor.isNativePlatform() ? "*/*" : exts.join(",")
    input.style.display = "none"
    let settled = false
    const done = (v: File | null) => {
      if (settled) return
      settled = true
      input.remove()
      resolve(v)
    }
    input.addEventListener("change", () => done(input.files?.[0] ?? null))
    input.addEventListener("cancel", () => done(null))
    document.body.appendChild(input)
    input.click()
  })
}
export function isCsvFile(name: string): boolean {
  return name.toLowerCase().endsWith(".csv")
}
