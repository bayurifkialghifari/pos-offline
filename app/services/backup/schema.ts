import { z } from "zod"
const integer = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)
const signed = z
  .number()
  .int()
  .min(Number.MIN_SAFE_INTEGER)
  .max(Number.MAX_SAFE_INTEGER)
const text = z.string().max(10000)
const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/)
const flag = z.union([z.literal(0), z.literal(1)])
const entity = {
  id,
  created_at: integer,
  updated_at: integer,
  deleted_at: integer.nullable(),
}
const category = z.strictObject({
  ...entity,
  name: text,
  sort_order: integer,
  color: text.nullable(),
})
const unit = z.strictObject({
  ...entity,
  label: text,
  symbol: text,
  dimension: z.enum(["count", "weight", "volume"]),
  factor: integer.min(1).max(1000000),
  active: flag,
})
const product = z.strictObject({
  ...entity,
  category_id: id.nullable(),
  unit_id: id,
  name: text,
  sku: text.nullable(),
  barcode: text.nullable(),
  barcode_type: text,
  price: integer,
  cost: integer,
  track_stock: flag,
  stock: integer,
  image_path: text.nullable(),
  active: flag,
})
const session = z.strictObject({
  ...entity,
  opened_at: integer,
  closed_at: integer.nullable(),
  opening_cash: integer,
  expected_cash: signed,
  counted_cash: integer.nullable(),
  difference: signed.nullable(),
  status: z.enum(["open", "closed"]),
  opened_by: text.nullable(),
  note: text.nullable(),
})
const sale = z.strictObject({
  ...entity,
  session_id: id.nullable(),
  number: text,
  subtotal: integer,
  discount: integer,
  tax: integer,
  total: integer,
  paid: integer,
  change_due: integer,
  payment_method: text,
  status: z.enum(["open", "completed", "void"]),
  open_bill_label: text.nullable(),
  opened_at: integer.nullable(),
  origin_device_id: text.nullable(),
  sold_at: integer.nullable(),
})
const item = z.strictObject({
  ...entity,
  sale_id: id,
  product_id: id.nullable(),
  name_snapshot: text,
  price_snapshot: integer,
  qty: z.number().positive().finite(),
  stock_tracked: flag,
  line_id: id,
  unit_id: id,
  unit_label: text,
  unit_symbol: text,
  unit_dimension: z.enum(["count", "weight", "volume"]),
  unit_factor: integer.min(1),
  base_qty: integer.min(1),
  input_mode: z.enum(["quantity", "nominal"]),
  requested_nominal: integer.nullable(),
  discount: integer,
  line_total: integer,
})
const cashCategory = z.strictObject({
  ...entity,
  name: text,
  type: z.enum(["income", "expense"]),
  is_system: flag,
  sort_order: integer,
})
const cashEntry = z.strictObject({
  ...entity,
  category_id: id.nullable(),
  session_id: id.nullable(),
  direction: z.enum(["debit", "credit"]),
  amount: integer,
  source: z.enum(["manual", "sale"]),
  source_ref: id.nullable(),
  note: text.nullable(),
  occurred_at: integer,
})
const media = z.strictObject({
  ...entity,
  mime: z.enum(["image/png", "image/jpeg", "image/webp"]),
  width: integer.nullable(),
  height: integer.nullable(),
  bytes: integer.nullable(),
  hash: text.nullable(),
})
export const BUSINESS_SETTINGS = [
  "store_name",
  "store_owner",
  "store_logo",
  "qris_payload",
  "qris_dynamic",
] as const
const setting = z.strictObject({
  key: z.enum(BUSINESS_SETTINGS),
  value: text,
  updated_at: integer,
})
const rows = <T extends z.ZodType>(schema: T) => z.array(schema).max(100000)
export const tablesSchema = z.strictObject({
  units: rows(unit),
  categories: rows(category),
  products: rows(product),
  cashier_sessions: rows(session),
  sales: rows(sale),
  sale_items: rows(item),
  cashflow_categories: rows(cashCategory),
  cashflow_entries: rows(cashEntry),
  media: rows(media),
  settings: rows(setting),
})
export const backupSchema = z.strictObject({
  format: z.literal("pos-offline-backup"),
  formatVersion: z.literal(1),
  schemaVersion: z.literal(1),
  appVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  createdAt: integer,
  tables: tablesSchema,
  files: z
    .array(
      z.strictObject({
        path: z.string().regex(/^media\/[a-zA-Z0-9_-]+\.bin$/),
        size: integer.max(8 * 1024 * 1024),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
      }),
    )
    .max(10000),
})
export type BackupManifest = z.infer<typeof backupSchema>
export type BackupTables = z.infer<typeof tablesSchema>
export const TABLE_NAMES = [
  "units",
  "categories",
  "products",
  "cashier_sessions",
  "sales",
  "sale_items",
  "cashflow_categories",
  "cashflow_entries",
  "media",
  "settings",
] as const
