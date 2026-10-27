import { amountForQuantity, quantityForNominal } from "@/lib/quantity"
import { BackupError } from "./archive"
import { TABLE_NAMES, type BackupManifest } from "./schema"
export function checkReferences(manifest: BackupManifest) {
  const t = manifest.tables
  for (const table of TABLE_NAMES)
    if (table !== "settings") {
      const ids = t[table].map((row) => row.id)
      if (new Set(ids).size !== ids.length)
        throw new BackupError("ID data duplikat pada " + table)
    }
  const contains = (table: readonly { id: string }[], id: string | null) =>
    id === null || table.some((row) => row.id === id)
  for (const product of t.products)
    if (
      !contains(t.units, product.unit_id) ||
      !contains(t.categories, product.category_id)
    )
      throw new BackupError("Referensi satuan atau kategori produk tidak valid")
  if (
    new Set(t.units.map((u) => u.symbol)).size !== t.units.length ||
    new Set(t.sales.map((s) => s.number)).size !== t.sales.length
  )
    throw new BackupError("Satuan atau nomor transaksi duplikat")
  if (
    t.cashier_sessions.filter(
      (s) => s.status === "open" && s.deleted_at === null,
    ).length > 1
  )
    throw new BackupError("Cadangan memiliki lebih dari satu sesi aktif")
  for (const sale of t.sales) {
    if (!contains(t.cashier_sessions, sale.session_id))
      throw new BackupError("Sesi transaksi tidak ditemukan")
    if (
      sale.total !== sale.subtotal - sale.discount + sale.tax ||
      sale.discount > sale.subtotal
    )
      throw new BackupError("Total transaksi tidak konsisten")
    if (
      sale.status !== "open" &&
      (sale.sold_at === null ||
        sale.paid < sale.total ||
        sale.change_due !== sale.paid - sale.total)
    )
      throw new BackupError("Pembayaran transaksi tidak konsisten")
    const active = t.sale_items.filter(
      (i) => i.sale_id === sale.id && i.deleted_at === null,
    )
    if (
      sale.deleted_at === null &&
      (!active.length ||
        active.reduce((sum, i) => sum + BigInt(i.line_total), 0n) !==
          BigInt(sale.subtotal))
    )
      throw new BackupError("Rincian transaksi tidak konsisten")
    if (new Set(active.map((i) => i.line_id)).size !== active.length)
      throw new BackupError("Baris transaksi duplikat")
  }
  for (const item of t.sale_items) {
    if (
      !contains(t.sales, item.sale_id) ||
      !contains(t.products, item.product_id) ||
      !contains(t.units, item.unit_id)
    )
      throw new BackupError("Referensi rincian transaksi tidak valid")
    if (item.qty !== item.base_qty / item.unit_factor || item.discount !== 0)
      throw new BackupError("Jumlah rincian transaksi tidak valid")
    if (
      item.input_mode === "quantity"
        ? item.requested_nominal !== null ||
          item.line_total !==
            amountForQuantity(
              item.price_snapshot,
              item.base_qty,
              item.unit_factor,
            )
        : item.requested_nominal !== item.line_total ||
          item.base_qty !==
            quantityForNominal(
              item.price_snapshot,
              item.line_total,
              item.unit_factor,
            )
    )
      throw new BackupError("Nominal rincian transaksi tidak valid")
  }
  for (const entry of t.cashflow_entries)
    if (
      !contains(t.cashflow_categories, entry.category_id) ||
      !contains(t.cashier_sessions, entry.session_id) ||
      (entry.source === "sale" &&
        (!entry.source_ref || !contains(t.sales, entry.source_ref)))
    )
      throw new BackupError("Referensi arus kas tidak valid")
  for (const ref of [
    ...t.products.map((p) => p.image_path),
    t.settings.find((s) => s.key === "store_logo")?.value ?? null,
  ])
    if (
      ref &&
      (!ref.startsWith("media://") || !contains(t.media, ref.slice(8)))
    )
      throw new BackupError("Foto lokal tidak ditemukan")
  if (new Set(t.settings.map((s) => s.key)).size !== t.settings.length)
    throw new BackupError("Setelan duplikat")
}
