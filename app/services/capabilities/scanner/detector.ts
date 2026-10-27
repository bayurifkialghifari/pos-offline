import type { ScanResult } from "../registry"

const WEB_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "itf",
  "codabar",
  "qr_code",
] as const

export type DecodeSource = HTMLVideoElement | HTMLCanvasElement

export interface Detector {
  readonly engine: "native" | "zxing"
  detect(source: DecodeSource): Promise<ScanResult[]>

  readonly wantsCanvas: boolean
  close(): void
}

interface BarcodeDetectorLike {
  detect(
    source: CanvasImageSource,
  ): Promise<{ rawValue: string; format: string }[]>
}

interface BarcodeDetectorCtor {
  new (opts?: { formats?: string[] }): BarcodeDetectorLike
  getSupportedFormats(): Promise<string[]>
}

function nativeCtor(): BarcodeDetectorCtor | null {
  const g = globalThis as unknown as { BarcodeDetector?: BarcodeDetectorCtor }
  return g.BarcodeDetector ?? null
}

async function tryNative(): Promise<Detector | null> {
  const Ctor = nativeCtor()
  if (!Ctor) return null
  let supported: string[] = []
  try {
    supported = await Ctor.getSupportedFormats()
  } catch {
    return null
  }

  const formats = WEB_FORMATS.filter((f) => supported.includes(f))
  if (!formats.length) return null

  const det = new Ctor({ formats })
  return {
    engine: "native",
    wantsCanvas: false,
    async detect(source) {
      const found = await det.detect(source)
      return found.map((b) => ({ value: b.rawValue, format: b.format }))
    },
    close() {},
  }
}

async function zxing(): Promise<Detector> {
  const [{ BrowserMultiFormatReader }, zx] = await Promise.all([
    import("@zxing/browser"),
    import("@zxing/library"),
  ])

  const hints = new Map()
  hints.set(zx.DecodeHintType.POSSIBLE_FORMATS, [
    zx.BarcodeFormat.EAN_13,
    zx.BarcodeFormat.EAN_8,
    zx.BarcodeFormat.UPC_A,
    zx.BarcodeFormat.UPC_E,
    zx.BarcodeFormat.CODE_128,
    zx.BarcodeFormat.CODE_39,
    zx.BarcodeFormat.ITF,
    zx.BarcodeFormat.CODABAR,
    zx.BarcodeFormat.QR_CODE,
  ])
  hints.set(zx.DecodeHintType.TRY_HARDER, true)

  const reader = new BrowserMultiFormatReader(hints)

  return {
    engine: "zxing",
    wantsCanvas: true,
    async detect(source) {
      try {
        const res = reader.decodeFromCanvas(source as HTMLCanvasElement)
        return [
          {
            value: res.getText(),
            format: zx.BarcodeFormat[res.getBarcodeFormat()],
          },
        ]
      } catch {
        return []
      }
    },
    close() {},
  }
}

let cached: Promise<Detector> | null = null

export function getDetector(): Promise<Detector> {
  cached ??= tryNative().then((d) => d ?? zxing())
  return cached
}
