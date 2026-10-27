import { persist } from "@/db/sqlite"
import type { Db, Sale } from "@/db/types"
import { safeNumber } from "@/lib/quantity"
import { SaleRepository } from "@/repositories/sale.repo"
import { SaleItemRepository } from "@/repositories/saleItem.repo"

export class VoidError extends Error {
  override readonly name = "VoidError"
}
export class VoidService {
  constructor(private readonly db: Db) {}
  async voidSale(id: string): Promise<Sale> {
    const result = await this.db.transaction(async (tx) => {
      const repo = new SaleRepository(tx)
      const sale = await repo.findById(id)
      if (!sale || sale.status !== "completed")
        throw new VoidError(
          "Hanya transaksi selesai yang bisa dibatalkan. Transaksi ini sudah berubah.",
        )
      const items = await new SaleItemRepository(tx).bySale(id)
      const demand = new Map<string, bigint>()
      for (const item of items)
        if (item.stock_tracked && item.product_id)
          demand.set(
            item.product_id,
            (demand.get(item.product_id) ?? 0n) + BigInt(item.base_qty),
          )
      for (const [productId, quantity] of demand) {
        const [product] = await tx.query<{ stock: number }>(
          "SELECT stock FROM products WHERE id = ?",
          [productId],
        )
        if (!product)
          throw new VoidError(
            "Produk sumber tidak ditemukan; pembatalan tidak diterapkan.",
          )
        await tx.run(
          "UPDATE products SET stock = ?, updated_at = ? WHERE id = ?",
          [safeNumber(BigInt(product.stock) + quantity), Date.now(), productId],
        )
      }
      const updated = await repo.update(id, { status: "void" })
      if (!updated) throw new VoidError("Transaksi tidak ditemukan")
      await tx.run(
        "UPDATE cashflow_entries SET deleted_at = ?, updated_at = ? WHERE source = 'sale' AND source_ref = ? AND deleted_at IS NULL",
        [Date.now(), Date.now(), id],
      )
      return updated
    })
    await persist()
    return result
  }
}
