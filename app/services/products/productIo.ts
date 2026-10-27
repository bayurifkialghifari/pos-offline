import { getDb, persist } from "@/db/sqlite"
import type { Category, Product } from "@/db/types"
import { DEFAULT_BARCODE_TYPE } from "@/lib/barcode"
import type { ExportSheet } from "@/lib/xlsx"
import { CategoryRepository } from "@/repositories/category.repo"
import { ProductRepository } from "@/repositories/product.repo"
import { useUnitsStore } from "@/stores/units"
import type { ImportResult, ParsedProduct } from "./product-io.contract"
export type {
  ImportResult,
  ParsedProduct,
  ParseResult,
  RowError,
} from "./product-io.contract"
export { parseProductRows } from "./product-rows"

export const PRODUCT_COLUMNS = [
  "nama",
  "satuan",
  "kategori",
  "sku",
  "barcode",
  "tipe_barcode",
  "harga_jual",
  "harga_modal",
  "lacak_stok",
  "stok",
  "aktif",
] as const

export function buildProductSheet(
  products: Product[],
  categories: Category[],
): ExportSheet {
  const nameById = new Map(categories.map((c) => [c.id, c.name]))
  return {
    name: "Produk",
    rows: products.map((p) => ({
      nama: p.name,
      kategori: p.category_id ? (nameById.get(p.category_id) ?? "") : "",
      sku: p.sku ?? "",
      barcode: p.barcode ?? "",
      tipe_barcode: p.barcode_type,
      harga_jual: p.price,
      harga_modal: p.cost,
      lacak_stok: p.track_stock ? "ya" : "tidak",
      stok: p.stock / useUnitsStore().byId(p.unit_id).factor,
      satuan: useUnitsStore().byId(p.unit_id).symbol,
      aktif: p.active ? "ya" : "tidak",
    })),
  }
}

export function buildTemplateSheet(): ExportSheet {
  return {
    name: "Produk",
    rows: [
      {
        nama: "Contoh Produk",
        satuan: "pcs",
        kategori: "Minuman",
        sku: "SKU-001",
        barcode: "8991002101234",
        tipe_barcode: DEFAULT_BARCODE_TYPE,
        harga_jual: 15000,
        harga_modal: 10000,
        lacak_stok: "ya",
        stok: 24,
        aktif: "ya",
      },
    ],
  }
}

const CHUNK = 300

export async function importProducts(
  rows: ParsedProduct[],
  onProgress?: (done: number, total: number) => void,
): Promise<ImportResult> {
  const db = getDb()

  const existing = await db.query<{ barcode: string }>(
    `SELECT barcode FROM products
     WHERE barcode IS NOT NULL AND barcode <> '' AND deleted_at IS NULL`,
  )
  const seen = new Set(existing.map((r) => r.barcode))

  const cats = await db.query<{ id: string; name: string }>(
    `SELECT id, name FROM categories WHERE deleted_at IS NULL`,
  )
  const catByName = new Map(
    cats.map((c) => [c.name.trim().toLowerCase(), c.id]),
  )

  const result: ImportResult = {
    imported: 0,
    skippedDuplicate: 0,
    createdCategories: 0,
    errors: [],
  }
  let sortOrder = cats.length

  for (let start = 0; start < rows.length; start += CHUNK) {
    const chunk = rows.slice(start, start + CHUNK)

    await db.transaction(async (tx) => {
      const products = new ProductRepository(tx)
      const categories = new CategoryRepository(tx)

      for (const row of chunk) {
        const barcode = row.input.barcode
        if (barcode && seen.has(barcode)) {
          result.skippedDuplicate++
          continue
        }

        let categoryId: string | null = null
        if (row.categoryName) {
          const key = row.categoryName.toLowerCase()
          categoryId = catByName.get(key) ?? null
          if (!categoryId) {
            const created = await categories.create({
              name: row.categoryName,
              color: null,
              sort_order: sortOrder++,
            })
            categoryId = created.id
            catByName.set(key, created.id)
            result.createdCategories++
          }
        }

        try {
          await products.create({ ...row.input, category_id: categoryId })
          if (barcode) seen.add(barcode)
          result.imported++
        } catch (err) {
          result.errors.push({
            line: row.line,
            message: err instanceof Error ? err.message : "Gagal menyimpan",
          })
        }
      }
    })

    await persist()
    onProgress?.(Math.min(start + CHUNK, rows.length), rows.length)
  }

  return result
}
