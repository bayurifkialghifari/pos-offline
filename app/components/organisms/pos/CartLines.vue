<script setup lang="ts">
import { formatRupiah } from "@/lib/money"
import { formatQuantity } from "@/lib/quantity"
import { useCartStore } from "@/stores/cart"
import { useMediaStore } from "@/stores/media"
import { Minus, Package, Plus, Trash2 } from "lucide-vue-next"

withDefaults(defineProps<{ rowClass?: string }>(), { rowClass: "px-5 py-3" })

const cart = useCartStore()
const media = useMediaStore()
</script>

<template>
  <div class="divide-y divide-border">
    <div
      v-for="l in cart.lines"
      :key="l.lineId"
      class="flex items-center gap-3"
      :class="rowClass"
    >
      <div
        class="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground"
      >
        <img
          v-if="media.url(l.image_path)"
          :src="media.url(l.image_path)!"
          :alt="l.name"
          class="size-full object-cover"
        />
        <Package v-else class="size-5" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium">{{ l.name }}</p>
        <p class="text-xs text-muted-foreground">
          {{ formatRupiah(l.lineTotal) }}
        </p>
      </div>
      <div class="flex items-center gap-1">
        <button
          class="flex size-11 items-center justify-center rounded-full border border-border text-foreground active:scale-95"
          @click="cart.dec(l.lineId)"
        >
          <component
            :is="l.qty <= 1 ? Trash2 : Minus"
            class="size-4"
            :class="l.qty <= 1 ? 'text-destructive' : ''"
          />
        </button>
        <button
          class="min-h-11 text-center text-xs font-semibold tabular-nums"
          @click="cart.edit(l.lineId)"
        >
          {{
            formatQuantity(l.baseQty, {
              factor: l.unitFactor,
              symbol: l.unitSymbol,
            })
          }}<span
            v-if="l.inputMode === 'nominal'"
            class="block text-[10px] text-muted-foreground"
            >Nominal rupiah</span
          >
        </button>
        <button
          class="flex size-11 items-center justify-center rounded-full border border-border text-foreground disabled:opacity-40 active:scale-95"
          :disabled="l.qty >= cart.maxQty(l)"
          @click="cart.inc(l.lineId)"
        >
          <Plus class="size-4" />
        </button>
        <button
          class="flex size-11 items-center justify-center text-destructive"
          aria-label="Hapus baris"
          @click="cart.remove(l.lineId)"
        >
          <Trash2 class="size-4" />
        </button>
      </div>
    </div>
  </div>
</template>
