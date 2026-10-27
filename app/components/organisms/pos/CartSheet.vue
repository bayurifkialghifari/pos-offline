<script setup lang="ts">
import { Button } from "@/components/atoms/ui/button"
import BottomSheet from "@/components/molecules/common/BottomSheet.vue"
import CartLines from "@/components/organisms/pos/CartLines.vue"
import { formatRupiah } from "@/lib/money"
import { useCartStore } from "@/stores/cart"

defineProps<{ open: boolean }>()
const emit = defineEmits<{
  "update:open": [value: boolean]
  hold: []
  "open-bills": []
  pay: []
}>()

const cart = useCartStore()
</script>

<template>
  <BottomSheet
    :open="open"
    title="Keranjang"
    @update:open="emit('update:open', $event)"
  >
    <CartLines />

    <div
      class="sticky bottom-0 space-y-3 border-t border-border bg-background/95 p-4 backdrop-blur"
    >
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted-foreground"
          >Total ({{ cart.count }} item)</span
        >
        <span class="text-lg font-bold">{{ formatRupiah(cart.total) }}</span>
      </div>
      <Button variant="outline" class="w-full" @click="emit('open-bills')">
        Open Bills
      </Button>
      <div class="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          :disabled="cart.isEmpty"
          @click="cart.clear()"
        >
          Kosongkan
        </Button>
        <Button
          variant="secondary"
          :disabled="cart.isEmpty"
          @click="emit('hold')"
        >
          {{ cart.activeOpenBillId ? "Simpan Perubahan" : "Tahan Pesanan" }}
        </Button>
      </div>
      <Button class="w-full" :disabled="cart.isEmpty" @click="emit('pay')"
        >Bayar</Button
      >
    </div>
  </BottomSheet>
</template>
