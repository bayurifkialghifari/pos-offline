import type { ReceiptJob } from "@/services/capabilities/registry"

export interface EscposOpts {
  feed?: number

  cut?: boolean
}

export function encodeReceipt(
  job: ReceiptJob,
  opts: EscposOpts = {},
): Uint8Array {
  const bytes: number[] = []
  const push = (...b: number[]) => {
    for (const x of b) bytes.push(x)
  }

  const text = (s: string) => {
    for (const ch of s) {
      const c = ch.codePointAt(0) ?? 0x3f
      push(c > 0xff ? 0x3f : c)
    }
  }

  push(0x1b, 0x40)

  let curAlign = -1
  let curBold = -1
  let curSize = -1
  for (const line of job.lines) {
    const align = line.align === "center" ? 1 : line.align === "right" ? 2 : 0
    if (align !== curAlign) {
      push(0x1b, 0x61, align)
      curAlign = align
    }
    const bold = line.bold ? 1 : 0
    if (bold !== curBold) {
      push(0x1b, 0x45, bold)
      curBold = bold
    }

    const size = line.size === "large" ? 0x11 : 0x00
    if (size !== curSize) {
      push(0x1d, 0x21, size)
      curSize = size
    }
    text(line.text ?? "")
    push(0x0a)
  }

  push(0x1b, 0x61, 0x00)
  push(0x1b, 0x45, 0x00)
  push(0x1d, 0x21, 0x00)

  const feed = opts.feed ?? 3
  for (let i = 0; i < feed; i++) push(0x0a)
  if (opts.cut ?? true) push(0x1d, 0x56, 0x01)

  return Uint8Array.from(bytes)
}
