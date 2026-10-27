import {
  amountForQuantity,
  parseQuantity,
  quantityForNominal,
} from "@/lib/quantity"
import { ProductRepository } from "@/repositories/product.repo"
import { CashierService } from "@/services/cashier.service"
import { CheckoutService } from "@/services/checkout.service"
import { VoidService } from "@/services/void.service"
import { describe, expect, it } from "vitest"
import { database, nominalLine, rice } from "./database"
describe("offline sale invariants", () => {
  it("charges exactly Rp10000 and records 667 grams with half-up quantity pricing", () => {
    expect(quantityForNominal(15000, 10000, 1000)).toBe(667)
    expect(amountForQuantity(15000, 667, 1000)).toBe(10005)
    expect(parseQuantity("0,667", 1000)).toBe(667)
    expect(() => parseQuantity("0.0001", 1000)).toThrow()
    expect(() => quantityForNominal(0, 10000, 1000)).toThrow()
  })
  it("aggregates sibling stock and rolls back all rows when insufficient", async () => {
    const { db, close } = await database()
    try {
      const product = await rice(db, 1000)
      await expect(
        new CheckoutService(db).checkout({
          lines: [nominalLine(product.id), nominalLine(product.id, "second")],
          paid: 20000,
          paymentMethod: "cash",
          devicePrefix: "TEST",
        }),
      ).rejects.toThrow()
      expect(await db.query("SELECT * FROM sales")).toHaveLength(0)
      expect(await db.query("SELECT * FROM sale_items")).toHaveLength(0)
      expect(await db.query("SELECT * FROM cashflow_entries")).toHaveLength(0)
      expect(
        (await new ProductRepository(db).findById(product.id))?.stock,
      ).toBe(1000)
    } finally {
      close()
    }
  })
  it("serializes concurrent checkout and restores recorded stock exactly once", async () => {
    const { db, close } = await database()
    try {
      const product = await rice(db, 1000)
      const service = new CheckoutService(db)
      const input = {
        lines: [nominalLine(product.id)],
        paid: 10000,
        paymentMethod: "cash",
        devicePrefix: "TEST",
      }
      const results = await Promise.allSettled([
        service.checkout(input),
        service.checkout(input),
      ])
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1)
      const completed = results.find((r) => r.status === "fulfilled")
      if (!completed || completed.status !== "fulfilled")
        throw new TypeError("Checkout fixture failed")
      expect(completed.value.sale.total).toBe(10000)
      expect(completed.value.items[0]?.line_total).toBe(10000)
      expect(
        (await new ProductRepository(db).findById(product.id))?.stock,
      ).toBe(333)
      await db.run("UPDATE products SET track_stock = 0 WHERE id = ?", [
        product.id,
      ])
      await new VoidService(db).voidSale(completed.value.sale.id)
      expect(
        (await new ProductRepository(db).findById(product.id))?.stock,
      ).toBe(1000)
      await expect(
        new VoidService(db).voidSale(completed.value.sale.id),
      ).rejects.toThrow()
      expect(
        (await new ProductRepository(db).findById(product.id))?.stock,
      ).toBe(1000)
      expect(
        await db.query(
          "SELECT * FROM cashflow_entries WHERE deleted_at IS NULL",
        ),
      ).toHaveLength(0)
    } finally {
      close()
    }
  })
  it("leaves stock unchanged on hold and accepts another device on completion", async () => {
    const { db, close } = await database()
    try {
      const product = await rice(db),
        service = new CheckoutService(db),
        line = nominalLine(product.id)
      const held = await service.hold({
        lines: [line],
        deviceId: "device-one",
        devicePrefix: "ONE",
        label: "Meja 1",
      })
      expect(
        (await new ProductRepository(db).findById(product.id))?.stock,
      ).toBe(10000)
      expect(
        (await service.resume({ saleId: held.sale.id, deviceId: "device-two" }))
          .items[0]?.base_qty,
      ).toBe(667)
      const result = await service.completeOpenBill({
        saleId: held.sale.id,
        deviceId: "device-two",
        lines: [line],
        paid: 10000,
        paymentMethod: "cash",
      })
      expect(result.sale.status).toBe("completed")
      await expect(
        service.completeOpenBill({
          saleId: held.sale.id,
          deviceId: "device-two",
          lines: [line],
          paid: 10000,
          paymentMethod: "cash",
        }),
      ).rejects.toThrow()
      expect(
        (await new ProductRepository(db).findById(product.id))?.stock,
      ).toBe(9333)
    } finally {
      close()
    }
  })
  it("rejects a checkout into a closed session without partial data", async () => {
    const { db, close } = await database()
    try {
      const product = await rice(db),
        cashier = new CashierService(db)
      const session = await cashier.open({ openingCash: 20000 })
      await cashier.close({ sessionId: session.id, countedCash: 20000 })
      await expect(
        new CheckoutService(db).checkout({
          lines: [nominalLine(product.id)],
          paid: 10000,
          paymentMethod: "cash",
          devicePrefix: "TEST",
          sessionId: session.id,
        }),
      ).rejects.toThrow(/ditutup/)
      expect(await db.query("SELECT * FROM sales")).toHaveLength(0)
    } finally {
      close()
    }
  })
  it("rolls back stock, sale and snapshots if cashflow creation fails", async () => {
    const { db, close } = await database()
    try {
      const product = await rice(db)
      await db.execute(
        "CREATE TRIGGER simulate_failure BEFORE INSERT ON cashflow_entries BEGIN SELECT RAISE(ABORT,'disk full'); END;",
      )
      await expect(
        new CheckoutService(db).checkout({
          lines: [nominalLine(product.id)],
          paid: 10000,
          paymentMethod: "cash",
          devicePrefix: "TEST",
        }),
      ).rejects.toThrow(/disk full/)
      expect(await db.query("SELECT * FROM sales")).toHaveLength(0)
      expect(await db.query("SELECT * FROM sale_items")).toHaveLength(0)
      expect(
        (await new ProductRepository(db).findById(product.id))?.stock,
      ).toBe(10000)
    } finally {
      close()
    }
  })
})
