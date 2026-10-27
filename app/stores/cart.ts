import { usePersistedCart } from "@/composables/usePersistedCart"
import type { Product } from "@/db/types"
import { amountForQuantity, QuantityError, safeNumber } from "@/lib/quantity"
import {
  type ActiveOpenBill,
  type CartDraft,
  type CartLine,
  type CartSnapshot,
  type OpenBillCartState,
} from "@/services/cart-draft"
import { pricedCartLine, productFromLine } from "@/services/cart-line"
import { useUnitsStore } from "@/stores/units"
import { defineStore } from "pinia"
import { computed, ref } from "vue"
export type {
  ActiveOpenBill,
  CartLine,
  CartSnapshot,
  OpenBillCartState,
} from "@/services/cart-draft"
export const useCartStore = defineStore("cart", () => {
  const lines = ref<CartLine[]>([])
  const discount = ref(0)
  const activeOpenBillId = ref<string | null>(null)
  const activeOpenBillLabel = ref<string | null>(null)
  const pendingProduct = ref<Product | null>(null)
  const editingLineId = ref<string | null>(null)
  const cartError = ref("")
  const count = computed(() => lines.value.length)
  const subtotal = computed(() =>
    safeNumber(
      lines.value.reduce((sum, line) => sum + BigInt(line.lineTotal), 0n),
    ),
  )
  const total = computed(() => Math.max(0, subtotal.value - discount.value))
  const isEmpty = computed(() => lines.value.length === 0)
  function find(productId: string) {
    return lines.value.find((line) => line.productId === productId)
  }
  function maxQty(line: CartLine): number {
    const siblings = lines.value
      .filter(
        (entry) =>
          entry.productId === line.productId && entry.lineId !== line.lineId,
      )
      .reduce((sum, entry) => sum + entry.baseQty, 0)
    return line.track_stock
      ? Math.max(0, line.stock - siblings) / line.unitFactor
      : Infinity
  }
  function commitLine(line: CartLine) {
    if (line.track_stock && line.qty > maxQty(line))
      throw new QuantityError("Stok tidak cukup untuk jumlah ini")
    const index = lines.value.findIndex((entry) => entry.lineId === line.lineId)
    if (index < 0) lines.value.push(line)
    else lines.value[index] = line
  }
  function add(product: Product): boolean {
    cartError.value = ""
    const unit = useUnitsStore().byId(product.unit_id)
    if (unit.dimension !== "count" || unit.factor !== 1) {
      pendingProduct.value = product
      editingLineId.value = null
      return true
    }
    const existing = lines.value.find(
      (line) => line.productId === product.id && line.inputMode === "quantity",
    )
    if (existing) {
      return inc(existing.lineId)
    }
    try {
      commitLine(
        pricedCartLine(product, unit, "quantity", "1", crypto.randomUUID()),
      )
      return true
    } catch (error) {
      if (error instanceof QuantityError) {
        cartError.value = error.message
        return false
      }
      throw error
    }
  }
  function edit(lineId: string) {
    const line = lines.value.find((entry) => entry.lineId === lineId)
    if (!line) return
    editingLineId.value = lineId
    pendingProduct.value = productFromLine(line)
  }
  function cancelQuantity() {
    pendingProduct.value = null
    editingLineId.value = null
  }
  function commitAmount(mode: "quantity" | "nominal", raw: string) {
    const product = pendingProduct.value
    if (!product) return
    const unit = useUnitsStore().byId(product.unit_id)
    const existing = lines.value.find(
      (line) => line.lineId === editingLineId.value,
    )
    commitLine(
      pricedCartLine(
        product,
        unit,
        mode,
        raw,
        existing?.lineId ?? crypto.randomUUID(),
      ),
    )
    cancelQuantity()
  }
  function inc(lineId: string): boolean {
    cartError.value = ""
    const line = lines.value.find((entry) => entry.lineId === lineId)
    if (!line) return false
    if (line.unitDimension !== "count" || line.inputMode !== "quantity") {
      edit(lineId)
      return true
    }
    const baseQty = line.baseQty + line.unitFactor
    try {
      commitLine({
        ...line,
        baseQty,
        qty: baseQty / line.unitFactor,
        lineTotal: amountForQuantity(line.price, baseQty, line.unitFactor),
      })
      return true
    } catch (error) {
      if (error instanceof QuantityError) {
        cartError.value = error.message
        return false
      }
      throw error
    }
  }
  function dec(lineId: string) {
    const line = lines.value.find((entry) => entry.lineId === lineId)
    if (!line) return
    if (line.unitDimension !== "count" || line.inputMode !== "quantity") {
      edit(lineId)
      return
    }
    const baseQty = line.baseQty - line.unitFactor
    if (baseQty <= 0) {
      remove(lineId)
      return
    }
    commitLine({
      ...line,
      baseQty,
      qty: baseQty / line.unitFactor,
      lineTotal: amountForQuantity(line.price, baseQty, line.unitFactor),
    })
  }
  function remove(lineId: string) {
    lines.value = lines.value.filter((line) => line.lineId !== lineId)
  }
  function clear() {
    cartError.value = ""
    lines.value = []
    discount.value = 0
    activeOpenBillId.value = null
    activeOpenBillLabel.value = null
    cancelQuantity()
  }
  function snapshot(): CartSnapshot {
    return {
      lines: lines.value.map((line) => ({ ...line })),
      discount: discount.value,
    }
  }
  function restore(next: CartSnapshot) {
    lines.value = next.lines.map((line) => ({ ...line }))
    discount.value = next.discount
  }
  function markOpenBill(bill: ActiveOpenBill) {
    activeOpenBillId.value = bill.id
    activeOpenBillLabel.value = bill.label
  }
  function loadOpenBill(next: OpenBillCartState) {
    restore(next.snapshot)
    markOpenBill(next.bill)
  }
  const persistedState = computed<CartDraft>(() => ({
    ...snapshot(),
    bill: activeOpenBillId.value
      ? { id: activeOpenBillId.value, label: activeOpenBillLabel.value }
      : null,
  }))
  const { draftError, loadDraft, flushDraft } = usePersistedCart(
    persistedState,
    (draft) => {
      restore(draft)
      if (draft.bill) markOpenBill(draft.bill)
    },
  )
  return {
    lines,
    discount,
    activeOpenBillId,
    activeOpenBillLabel,
    pendingProduct,
    editingLineId,
    draftError,
    cartError,
    count,
    subtotal,
    total,
    isEmpty,
    find,
    maxQty,
    add,
    edit,
    cancelQuantity,
    commitAmount,
    inc,
    dec,
    remove,
    clear,
    snapshot,
    restore,
    markOpenBill,
    loadOpenBill,
    loadDraft,
    flushDraft,
  }
})
