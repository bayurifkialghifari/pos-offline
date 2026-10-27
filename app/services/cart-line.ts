import type { Product, Unit } from "@/db/types"
import {
  amountForQuantity,
  parseQuantity,
  parseRupiah,
  quantityForNominal,
} from "@/lib/quantity"
import type { CartLine } from "./cart-draft"
export function pricedCartLine(
  product: Product,
  unit: Unit,
  mode: "quantity" | "nominal",
  raw: string,
  lineId: string,
): CartLine {
  let baseQty: number
  let lineTotal: number
  let requestedNominal: number | null
  switch (mode) {
    case "quantity":
      baseQty = parseQuantity(raw, unit.factor)
      lineTotal = amountForQuantity(product.price, baseQty, unit.factor)
      requestedNominal = null
      break
    case "nominal":
      requestedNominal = parseRupiah(raw)
      baseQty = quantityForNominal(product.price, requestedNominal, unit.factor)
      lineTotal = requestedNominal
      break
  }
  return {
    productId: product.id,
    name: product.name,
    price: product.price,
    qty: baseQty / unit.factor,
    lineId: lineId,
    unitId: unit.id,
    unitLabel: unit.label,
    unitSymbol: unit.symbol,
    unitDimension: unit.dimension,
    unitFactor: unit.factor,
    baseQty,
    inputMode: mode,
    requestedNominal,
    lineTotal,
    image_path: product.image_path,
    track_stock: product.track_stock,
    stock: product.stock,
  }
}
export function productFromLine(line: CartLine): Product {
  return {
    id: line.productId,
    name: line.name,
    price: line.price,
    unit_id: line.unitId,
    image_path: line.image_path,
    track_stock: line.track_stock,
    stock: line.stock,
    active: 1,
    category_id: null,
    sku: null,
    barcode: null,
    barcode_type: "EAN13",
    cost: 0,
    created_at: 0,
    updated_at: 0,
    deleted_at: null,
  }
}
