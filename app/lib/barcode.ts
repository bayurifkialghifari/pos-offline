export interface BarcodeTypeDef {
  value: string
  label: string

  hint: string
}

export const BARCODE_TYPES: BarcodeTypeDef[] = [
  { value: "EAN13", label: "EAN-13 (standar ritel)", hint: "13 digit angka" },
  {
    value: "CODE128",
    label: "CODE128 (bebas)",
    hint: "huruf & angka, panjang bebas",
  },
  { value: "EAN8", label: "EAN-8", hint: "8 digit angka" },
  { value: "UPC", label: "UPC-A", hint: "12 digit angka" },
  {
    value: "CODE39",
    label: "CODE39",
    hint: "huruf kapital, angka, - . $ / + %",
  },
  { value: "ITF14", label: "ITF-14", hint: "14 digit angka" },
]

export const DEFAULT_BARCODE_TYPE = "EAN13"

const VALID_TYPES = new Set(BARCODE_TYPES.map((t) => t.value))

export function normalizeBarcodeType(raw: unknown): string {
  const v = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s_-]/g, "")
  if (VALID_TYPES.has(v)) return v

  if (v === "UPCA") return "UPC"
  if (v === "EAN" || v === "EAN13") return "EAN13"
  if (v === "ITF" || v === "ITF14") return "ITF14"
  if (v === "CODE128A" || v === "CODE128B" || v === "CODE128C") return "CODE128"
  return DEFAULT_BARCODE_TYPE
}

export function barcodeTypeLabel(type: string): string {
  return BARCODE_TYPES.find((t) => t.value === type)?.label ?? type
}

export function barcodeTypeHint(type: string): string {
  return BARCODE_TYPES.find((t) => t.value === type)?.hint ?? ""
}

type JsBarcodeFn = (
  el: unknown,
  value: string,
  options: Record<string, unknown>,
) => void

let jsBarcodePromise: Promise<JsBarcodeFn> | null = null

async function loadJsBarcode(): Promise<JsBarcodeFn> {
  jsBarcodePromise ??= import("jsbarcode").then(
    (m) => (m.default ?? m) as unknown as JsBarcodeFn,
  )
  return jsBarcodePromise
}

function newSvg(): SVGSVGElement {
  return document.createElementNS("http://www.w3.org/2000/svg", "svg")
}

const JSBARCODE_SVG_ATTRS = [
  "width",
  "height",
  "x",
  "y",
  "viewBox",
  "xmlns",
  "version",
]

function clearSvg(el: SVGElement): void {
  while (el.firstChild) el.removeChild(el.firstChild)
  for (const a of JSBARCODE_SVG_ATTRS) el.removeAttribute(a)
}

function readSvgText(el: SVGElement): string {
  return Array.from(el.querySelectorAll("text"))
    .map((t) => t.textContent ?? "")
    .join("")
}

function checkDigit(digits: string, firstWeight: 1 | 3): string {
  const sum = digits
    .split("")
    .reduce(
      (s, d, i) =>
        s + Number(d) * (i % 2 === 0 ? firstWeight : 4 - firstWeight),
      0,
    )
  return String((10 - (sum % 10)) % 10)
}

export function effectiveBarcodeValue(value: string, type: string): string {
  const v = value.trim()
  switch (normalizeBarcodeType(type)) {
    case "EAN13":
      return /^\d{12}$/.test(v) ? v + checkDigit(v, 1) : v
    case "EAN8":
      return /^\d{7}$/.test(v) ? v + checkDigit(v, 3) : v
    case "UPC":
      return /^\d{11}$/.test(v) ? v + checkDigit(v, 3) : v

    case "ITF14":
      return /^\d{13}$/.test(v) ? v + checkDigit(v, 3) : v
    default:
      return v
  }
}

export async function isValidBarcode(
  value: string,
  type: string,
): Promise<boolean> {
  const v = value.trim()
  if (!v) return false
  const JsBarcode = await loadJsBarcode()
  let ok = false
  try {
    JsBarcode(newSvg(), v, {
      format: normalizeBarcodeType(type),
      valid: (isValid: boolean) => {
        ok = isValid
      },
    })
  } catch {
    ok = false
  }
  return ok
}

export async function guessBarcodeType(value: string): Promise<string> {
  const v = value.trim()
  if (!v) return DEFAULT_BARCODE_TYPE

  for (const t of ["EAN13", "UPC", "EAN8", "ITF14", "CODE39", "CODE128"]) {
    if (await isValidBarcode(v, t)) return t
  }
  return DEFAULT_BARCODE_TYPE
}

export interface RenderOptions {
  width?: number
  height?: number
  fontSize?: number
  displayValue?: boolean
  margin?: number
  background?: string
  lineColor?: string
}

const RENDER_DEFAULTS: RenderOptions = {
  width: 2,
  height: 80,
  fontSize: 16,
  displayValue: true,
  margin: 10,
  background: "#ffffff",
  lineColor: "#000000",
}

export interface RenderResult {
  ok: boolean

  rendered: string
}

export async function renderBarcodeSvg(
  el: SVGElement,
  value: string,
  type: string,
  opts: RenderOptions = {},
): Promise<RenderResult> {
  clearSvg(el)
  const JsBarcode = await loadJsBarcode()
  let ok = false
  try {
    JsBarcode(el, value.trim(), {
      ...RENDER_DEFAULTS,
      ...opts,
      format: normalizeBarcodeType(type),
      valid: (isValid: boolean) => {
        ok = isValid
      },
    })
  } catch {
    ok = false
  }
  if (!ok) {
    clearSvg(el)
    return { ok: false, rendered: "" }
  }
  return { ok: true, rendered: readSvgText(el) }
}

export async function barcodeToPngDataUrl(
  value: string,
  type: string,
  opts: RenderOptions = {},
): Promise<string | null> {
  const JsBarcode = await loadJsBarcode()
  const canvas = document.createElement("canvas")
  let ok = false
  try {
    JsBarcode(canvas, value.trim(), {
      ...RENDER_DEFAULTS,
      width: 3,
      height: 120,
      ...opts,
      format: normalizeBarcodeType(type),
      valid: (isValid: boolean) => {
        ok = isValid
      },
    })
  } catch {
    return null
  }
  return ok ? canvas.toDataURL("image/png") : null
}
