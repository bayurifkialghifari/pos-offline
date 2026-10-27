<script setup lang="ts">
import { Button } from "@/components/atoms/ui/button"
import BottomSheet from "@/components/molecules/common/BottomSheet.vue"
import type { Product } from "@/db/types"
import {
  barcodeToPngDataUrl,
  barcodeTypeHint,
  renderBarcodeSvg,
} from "@/lib/barcode"
import { saveOrShare, stripDataUrl } from "@/lib/download"
import { formatRupiah } from "@/lib/money"
import { Loader2, Share2 } from "lucide-vue-next"
import { computed, ref, watch } from "vue"

const props = defineProps<{ open: boolean; product: Product | null }>()
const emit = defineEmits<{ "update:open": [value: boolean] }>()

type Status = "idle" | "rendering" | "ok" | "invalid" | "empty"

const svgEl = ref<SVGSVGElement | null>(null)
const status = ref<Status>("idle")

const rendered = ref("")
const sharing = ref(false)

let renderToken = 0

const valid = computed(() => status.value === "ok")

watch(
  [
    () => props.open,
    () => props.product,
    () => props.product?.barcode,
    () => props.product?.barcode_type,
    svgEl,
  ],
  async () => {
    const token = ++renderToken
    const p = props.product

    rendered.value = ""
    if (!props.open || !p) {
      status.value = "idle"
      return
    }
    if (!p.barcode) {
      status.value = "empty"
      return
    }
    status.value = "rendering"

    if (!svgEl.value) return
    const res = await renderBarcodeSvg(svgEl.value, p.barcode, p.barcode_type)
    if (token !== renderToken) return
    status.value = res.ok ? "ok" : "invalid"
    rendered.value = res.rendered
  },
  { flush: "post" },
)

async function share() {
  const p = props.product
  if (!p?.barcode) return
  sharing.value = true
  try {
    const dataUrl = await barcodeToPngDataUrl(p.barcode, p.barcode_type)
    if (!dataUrl) return
    const safe = p.name.replace(/[^\w-]+/g, "-").slice(0, 40) || "produk"
    await saveOrShare(
      `barcode-${safe}-${p.barcode}.png`,
      stripDataUrl(dataUrl),
      "image/png",
    )
  } finally {
    sharing.value = false
  }
}
</script>

<template>
  <BottomSheet
    :open="open"
    title="Barcode"
    @update:open="emit('update:open', $event)"
  >
    <div v-if="product" class="space-y-4 p-5">
      <div class="text-center">
        <p class="font-semibold">{{ product.name }}</p>
        <p class="text-sm text-info">{{ formatRupiah(product.price) }}</p>
      </div>

      <div
        class="flex min-h-32 items-center justify-center rounded-2xl bg-white p-4"
      >
        <svg
          v-show="status === 'ok'"
          :key="`${product.barcode}|${product.barcode_type}`"
          ref="svgEl"
        />
        <Loader2
          v-if="status === 'rendering'"
          class="size-5 animate-spin text-neutral-400"
        />
        <p
          v-else-if="status === 'empty'"
          class="py-6 text-center text-sm text-neutral-500"
        >
          Produk ini belum punya barcode.
        </p>
        <p
          v-else-if="status === 'invalid'"
          class="py-6 text-center text-sm text-neutral-500"
        >
          "{{ product.barcode }}" tidak sesuai {{ product.barcode_type }} —
          butuh {{ barcodeTypeHint(product.barcode_type) }}.
        </p>
      </div>

      <p class="text-center text-xs text-muted-foreground">
        {{ product.barcode || "—" }} · {{ product.barcode_type }}
      </p>

      <p
        v-if="rendered && rendered !== product.barcode"
        class="text-center text-xs text-warning"
      >
        Tergambar sebagai {{ rendered }} — check digit ditambah otomatis.
      </p>

      <Button class="w-full gap-2" :disabled="!valid || sharing" @click="share">
        <component
          :is="sharing ? Loader2 : Share2"
          class="size-4"
          :class="sharing && 'animate-spin'"
        />
        {{ sharing ? "Menyiapkan…" : "Bagikan / Simpan Gambar" }}
      </Button>
    </div>
  </BottomSheet>
</template>
