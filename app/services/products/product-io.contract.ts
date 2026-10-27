import type { ProductInput } from "@/stores/products"
export interface RowError {
  line: number
  message: string
}

export interface ParsedProduct {
  line: number
  categoryName: string | null
  input: Omit<ProductInput, "category_id">
}

export interface ParseResult {
  rows: ParsedProduct[]
  errors: RowError[]
}

export interface ImportResult {
  imported: number

  skippedDuplicate: number
  createdCategories: number
  errors: RowError[]
}
