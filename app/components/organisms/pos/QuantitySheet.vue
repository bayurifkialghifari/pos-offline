<script setup lang="ts">
import { Button } from "@/components/atoms/ui/button"
import { Input } from "@/components/atoms/ui/input"
import BottomSheet from "@/components/molecules/common/BottomSheet.vue"
import { formatRupiah } from "@/lib/money"
import {
  amountForQuantity,
  formatQuantity,
  parseQuantity,
  parseRupiah,
  QuantityError,
  quantityForNominal,
} from "@/lib/quantity"
import { useCartStore } from "@/stores/cart"
import { useUnitsStore } from "@/stores/units"
import { computed, ref, watch } from "vue"
const cart = useCartStore()
const units = useUnitsStore()
const mode = ref<"quantity" | "nominal">("quantity")
const raw = ref("1")
const error = ref("")
watch(
  () => cart.pendingProduct,
  (product) => {
    if (!product) return
    const existing = cart.lines.find(
      (line) => line.lineId === cart.editingLineId,
    )
    mode.value = existing?.inputMode ?? "quantity"
    raw.value = String(
      existing ? (existing.requestedNominal ?? existing.qty) : 1,
    )
    error.value = ""
  },
)
const preview = computed(() => {
  const product = cart.pendingProduct
  if (!product) return ""
  const unit = units.byId(product.unit_id)
  try {
    switch (mode.value) {
      case "quantity": {
        const qty = parseQuantity(raw.value, unit.factor)
        return (
          formatQuantity(qty, unit) +
          " · " +
          formatRupiah(amountForQuantity(product.price, qty, unit.factor))
        )
      }
      case "nominal": {
        const nominal = parseRupiah(raw.value)
        return (
          "≈ " +
          formatQuantity(
            quantityForNominal(product.price, nominal, unit.factor),
            unit,
          ) +
          " · " +
          formatRupiah(nominal)
        )
      }
      default: {
        const exhaustive: never = mode.value
        throw new QuantityError("Mode tidak valid: " + exhaustive)
      }
    }
  } catch (e) {
    if (e instanceof QuantityError) return e.message
    throw e
  }
})
function submit() {
  try {
    cart.commitAmount(mode.value, raw.value)
  } catch (e) {
    if (e instanceof QuantityError) {
      error.value = e.message
      return
    }
    throw e
  }
}
function selectMode(next: "quantity" | "nominal") {
  mode.value = next
  raw.value = next === "quantity" ? "1" : "10000"
  error.value = ""
}
</script>
<template>
  <BottomSheet
    :open="Boolean(cart.pendingProduct)"
    :title="cart.pendingProduct?.name"
    @update:open="cart.cancelQuantity()"
  >
    <form
      v-if="cart.pendingProduct"
      class="space-y-4 p-5"
      @submit.prevent="submit"
    >
      <p class="text-sm text-muted-foreground">
        {{ formatRupiah(cart.pendingProduct.price) }} /
        {{ units.byId(cart.pendingProduct.unit_id).symbol }}
      </p>
      <div class="grid grid-cols-2 gap-2">
        <Button
          type="button"
          :variant="mode === 'quantity' ? 'default' : 'outline'"
          @click="selectMode('quantity')"
          >Jumlah satuan</Button
        ><Button
          type="button"
          :variant="mode === 'nominal' ? 'default' : 'outline'"
          @click="selectMode('nominal')"
          >Nominal rupiah</Button
        >
      </div>
      <label for="quantity-input" class="text-sm font-medium">{{
        mode === "quantity"
          ? "Jumlah (" + units.byId(cart.pendingProduct.unit_id).symbol + ")"
          : "Berapa rupiah?"
      }}</label>
      <Input
        id="quantity-input"
        v-model="raw"
        :inputmode="mode === 'quantity' ? 'decimal' : 'numeric'"
        autofocus
        autocomplete="off"
      />
      <p
        class="rounded-xl bg-muted p-3 text-sm tabular-nums"
        aria-live="polite"
      >
        {{ preview }}
      </p>
      <p v-if="mode === 'nominal'" class="text-xs text-muted-foreground">
        Stok dibulatkan ke satuan terkecil. Tagihan tetap sesuai nominal.
      </p>
      <p v-if="error" role="alert" class="text-sm text-destructive">
        {{ error }}
      </p>
      <div class="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" @click="cart.cancelQuantity()"
          >Batal</Button
        ><Button type="submit">{{
          cart.editingLineId ? "Simpan jumlah" : "Tambah ke keranjang"
        }}</Button>
      </div>
    </form></BottomSheet
  >
</template>
