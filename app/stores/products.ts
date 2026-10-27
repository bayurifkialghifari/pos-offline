import { getDb } from "@/db/sqlite"
import type { Product } from "@/db/types"
import { ProductRepository } from "@/repositories/product.repo"
import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { z } from "zod"

import type { ParsedProduct } from "@/services/products/productIo"

export type ProductInput = Omit<Product, keyof import("@/db/types").LocalEntity>

export function toProductInput(p: Product): ProductInput {
  return {
    category_id: p.category_id,
    unit_id: p.unit_id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    barcode_type: p.barcode_type,
    price: p.price,
    cost: p.cost,
    track_stock: p.track_stock,
    stock: p.stock,
    image_path: p.image_path,
    active: p.active,
  }
}

export const productInputSchema = z.object({
  category_id: z.string().nullable(),
  unit_id: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  sku: z.string().nullable(),
  barcode: z.string().nullable(),
  barcode_type: z.string(),
  price: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  cost: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  track_stock: z.union([z.literal(0), z.literal(1)]),
  stock: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  image_path: z.string().nullable(),
  active: z.union([z.literal(0), z.literal(1)]),
})
export const useProductsStore = defineStore("products", () => {
  const items = ref<Product[]>([])
  const loading = ref(false)
  const query = ref("")
  const categoryFilter = ref<string | null>(null)

  function repo() {
    return new ProductRepository(getDb())
  }

  const filtered = computed(() => {
    let list = items.value
    if (categoryFilter.value) {
      list = list.filter((p) => p.category_id === categoryFilter.value)
    }
    const q = query.value.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku ?? "").toLowerCase().includes(q) ||
          (p.barcode ?? "").toLowerCase().includes(q),
      )
    }
    return list
  })

  const count = computed(() => items.value.length)

  async function load() {
    loading.value = true
    items.value = await repo().listAll()
    loading.value = false
  }

  async function getById(id: string) {
    return repo().findById(id)
  }

  async function create(input: ProductInput) {
    const p = await repo().create(productInputSchema.parse(input))
    await load()
    return p
  }

  async function update(id: string, patch: Partial<ProductInput>) {
    const current = await repo().findById(id)
    if (!current) return
    await repo().update(
      id,
      productInputSchema.parse({ ...toProductInput(current), ...patch }),
    )
    await load()
  }

  async function remove(id: string) {
    await repo().softDelete(id)
    await load()
  }

  function byBarcode(code: string): Product | undefined {
    const c = code.trim()
    if (!c) return undefined
    return items.value.find((p) => p.barcode === c)
  }

  async function bulkImport(
    rows: ParsedProduct[],
    onProgress?: (done: number, total: number) => void,
  ) {
    const { importProducts } = await import("@/services/products/productIo")
    const result = await importProducts(rows, onProgress)
    await load()
    return result
  }

  return {
    items,
    loading,
    query,
    categoryFilter,
    filtered,
    count,
    load,
    getById,
    create,
    update,
    remove,
    byBarcode,
    bulkImport,
  }
})
