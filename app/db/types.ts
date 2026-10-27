export interface LocalEntity {
  id: string
  created_at: number
  updated_at: number
  deleted_at: number | null
}

export interface RunResult {
  changes: number
  lastId?: number
}

export interface Db {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<T[]>
  run(sql: string, params?: unknown[]): Promise<RunResult>

  execute(sql: string): Promise<void>

  transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T>

  readonly inTransaction: boolean
}

export interface Category extends LocalEntity {
  name: string
  sort_order: number
  color: string | null
}

export interface Product extends LocalEntity {
  category_id: string | null
  unit_id: string
  name: string
  sku: string | null
  barcode: string | null
  barcode_type: string
  price: number
  cost: number
  track_stock: number
  stock: number
  image_path: string | null
  active: number
}

export interface Media extends LocalEntity {
  mime: string
  width: number | null
  height: number | null
  bytes: number | null
  hash: string | null
  data: string | null
}

export interface CashierSession extends LocalEntity {
  opened_at: number
  closed_at: number | null
  opening_cash: number
  expected_cash: number
  counted_cash: number | null
  difference: number | null
  status: "open" | "closed"
  opened_by: string | null
  note: string | null
}

export interface Sale extends LocalEntity {
  session_id: string | null
  number: string
  subtotal: number
  discount: number
  tax: number
  total: number
  paid: number
  change_due: number
  payment_method: string
  status: "open" | "completed" | "void"
  open_bill_label: string | null
  opened_at: number | null
  origin_device_id: string | null
  sold_at: number | null
}

export interface SaleItem extends LocalEntity {
  sale_id: string
  product_id: string | null
  name_snapshot: string
  price_snapshot: number
  qty: number
  stock_tracked: number
  line_id: string
  unit_id: string
  unit_label: string
  unit_symbol: string
  unit_dimension: UnitDimension
  unit_factor: number
  base_qty: number
  input_mode: "quantity" | "nominal"
  requested_nominal: number | null
  discount: number
  line_total: number
}

export interface CashflowCategory extends LocalEntity {
  name: string
  type: "income" | "expense"
  is_system: number
  sort_order: number
}

export interface CashflowEntry extends LocalEntity {
  category_id: string | null
  session_id: string | null
  direction: "debit" | "credit"
  amount: number
  source: "manual" | "sale"
  source_ref: string | null
  note: string | null
  occurred_at: number
}

export interface SettingRow {
  key: string
  value: string
  updated_at: number
}

export type UnitDimension = "count" | "weight" | "volume"

export interface Unit extends LocalEntity {
  readonly label: string
  readonly symbol: string
  readonly dimension: UnitDimension
  readonly factor: number
  readonly active: number
}
