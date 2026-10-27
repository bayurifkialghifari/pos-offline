import {
  DEFAULT_BARCODE_TYPE,
  guessBarcodeType,
  normalizeBarcodeType,
} from "@/lib/barcode"
import { parseQuantity, parseRupiah, QuantityError } from "@/lib/quantity"
import type { RawRow } from "@/lib/xlsx"
import { useUnitsStore } from "@/stores/units"
import type {
  ParsedProduct,
  ParseResult,
  RowError,
} from "./product-io.contract"
const HEADER_ALIASES: Record<string, string> = {
  name: "nama",
  unit: "satuan",
  nama_produk: "nama",
  product_name: "nama",
  category: "kategori",
  kategori_produk: "kategori",
  code: "sku",
  kode: "sku",
  barcode_type: "tipe_barcode",
  tipe: "tipe_barcode",
  simbologi: "tipe_barcode",
  price: "harga_jual",
  harga: "harga_jual",
  sell_price: "harga_jual",
  cost: "harga_modal",
  modal: "harga_modal",
  cost_price: "harga_modal",
  track_stock: "lacak_stok",
  stock: "stok",
  qty: "stok",
  jumlah: "stok",
  active: "aktif",
  status: "aktif",
}

function normalizeHeader(key: string): string {
  const k = key.trim().toLowerCase().replace(/\s+/g, "_")
  return HEADER_ALIASES[k] ?? k
}

function cell(row: Record<string, string>, key: string): string {
  return (row[key] ?? "").trim()
}

function parseAmount(raw: string): number | null {
  if (!raw) return 0
  try {
    return parseRupiah(raw)
  } catch (error) {
    if (error instanceof QuantityError) return null
    throw error
  }
}

const TRUTHY = new Set(["ya", "y", "yes", "true", "1", "aktif", "on"])
const FALSY = new Set(["tidak", "no", "n", "false", "0", "nonaktif", "off", ""])

function parseFlag(raw: string, fallback: number): number | null {
  const v = raw.toLowerCase()
  if (!v) return fallback
  if (TRUTHY.has(v)) return 1
  if (FALSY.has(v)) return 0
  return null
}

export async function parseProductRows(raw: RawRow[]): Promise<ParseResult> {
  const rows: ParsedProduct[] = []
  const errors: RowError[] = []

  for (const [i, original] of raw.entries()) {
    const line = i + 2
    const row: Record<string, string> = {}
    for (const [k, v] of Object.entries(original)) {
      row[normalizeHeader(k)] = typeof v === "string" ? v : String(v ?? "")
    }

    const name = cell(row, "nama")
    if (!name) {
      errors.push({ line, message: 'Kolom "nama" kosong' })
      continue
    }

    const barcode = cell(row, "barcode")

    if (/e\+\d/i.test(barcode)) {
      errors.push({
        line,
        message: `Barcode "${barcode}" kebaca sebagai notasi ilmiah — format kolom barcode sebagai Teks dulu di Excel`,
      })
      continue
    }

    const price = parseAmount(cell(row, "harga_jual"))
    if (price === null) {
      errors.push({
        line,
        message: `Harga jual "${cell(row, "harga_jual")}" bukan angka`,
      })
      continue
    }
    const cost = parseAmount(cell(row, "harga_modal"))
    if (cost === null) {
      errors.push({
        line,
        message: `Harga modal "${cell(row, "harga_modal")}" bukan angka`,
      })
      continue
    }

    const trackStock = parseFlag(cell(row, "lacak_stok"), 0)
    if (trackStock === null) {
      errors.push({
        line,
        message: `Lacak stok "${cell(row, "lacak_stok")}" harus ya/tidak`,
      })
      continue
    }
    const active = parseFlag(cell(row, "aktif"), 1)
    if (active === null) {
      errors.push({
        line,
        message: `Aktif "${cell(row, "aktif")}" harus ya/tidak`,
      })
      continue
    }

    const symbol = cell(row, "satuan") || "pcs"
    const unit = useUnitsStore().active.find(
      (u) => u.symbol.toLowerCase() === symbol.toLowerCase(),
    )
    if (!unit) {
      errors.push({ line, message: "Satuan tidak dikenal: " + symbol })
      continue
    }
    let stock = 0
    try {
      const value = cell(row, "stok")
      stock = value && value !== "0" ? parseQuantity(value, unit.factor) : 0
    } catch (error) {
      if (error instanceof QuantityError) {
        errors.push({ line, message: error.message })
        continue
      }
      throw error
    }

    const typeCell = cell(row, "tipe_barcode")
    const barcodeType = typeCell
      ? normalizeBarcodeType(typeCell)
      : barcode
        ? await guessBarcodeType(barcode)
        : DEFAULT_BARCODE_TYPE

    const category = cell(row, "kategori")
    rows.push({
      line,
      categoryName: category || null,
      input: {
        name,
        unit_id: unit.id,
        sku: cell(row, "sku") || null,
        barcode: barcode || null,
        barcode_type: barcodeType,
        price,
        cost,
        track_stock: trackStock,
        stock: trackStock ? stock : 0,
        image_path: null,
        active,
      },
    })
  }

  return { rows, errors }
}
