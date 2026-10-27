<script setup lang="ts">
import { Button } from "@/components/atoms/ui/button"
import AppHeader from "@/components/organisms/layout/AppHeader.vue"
import CameraScanner from "@/components/organisms/pos/CameraScanner.vue"
import CartLines from "@/components/organisms/pos/CartLines.vue"
import { formatRupiah } from "@/lib/money"
import type { ScanResult } from "@/services/capabilities/registry"
import { scanFeedback } from "@/services/capabilities/scanner/scanGate"
import { useCartStore } from "@/stores/cart"
import { useMediaStore } from "@/stores/media"
import { useProductsStore } from "@/stores/products"
import { PackagePlus, ScanLine, X } from "lucide-vue-next"
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()
const products = useProductsStore()
const media = useMediaStore()
const cart = useCartStore()

const scanner = shallowRef<InstanceType<typeof CameraScanner> | null>(null)

const toast = ref<{ text: string; tone: "ok" | "warn" } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function say(text: string, tone: "ok" | "warn" = "ok") {
  toast.value = { text, tone }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), 2200)
}

const unknown = ref<string | null>(null)

function handleCode(code: string) {
  const value = code.trim()
  if (!value) return

  const p = products.byBarcode(value)
  if (!p) {
    scanFeedback(false)
    unknown.value = value
    return
  }
  if (!p.active) {
    scanFeedback(false)
    say(`${p.name} nonaktif — aktifkan dulu di menu Produk`, "warn")
    return
  }

  if (p.track_stock && p.stock <= 0) {
    scanFeedback(false)
    say(`${p.name} stoknya habis`, "warn")
    return
  }
  try {
    if (!cart.add(p)) {
      scanFeedback(false)
      say(cart.cartError, "warn")
      return
    }
  } catch (error) {
    scanFeedback(false)
    say(
      error instanceof Error ? error.message : "Produk gagal ditambahkan",
      "warn",
    )
    return
  }
  scanFeedback(true)
  say(`${p.name} · ${formatRupiah(p.price)}`)
}

function onScan(r: ScanResult) {
  handleCode(r.value)
}

function createFromUnknown() {
  const code = unknown.value
  unknown.value = null
  void router.push(`/products/new?barcode=${encodeURIComponent(code ?? "")}`)
}

async function pay() {
  if (cart.isEmpty) return

  await scanner.value?.stop()

  void router.replace("/pos?pay=1")
}

onMounted(async () => {
  if (!products.items.length) await products.load()
  await media.ensure(products.items.map((p) => p.image_path))

  if (import.meta.dev) {
    ;(window as unknown as { __scan?: (code: string) => void }).__scan =
      handleCode
  }
})

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer)
  if (import.meta.dev) {
    delete (window as unknown as { __scan?: (code: string) => void }).__scan
  }
})
</script>

<template>
  <div class="flex h-full flex-col">
    <AppHeader
      title="Scan Barcode"
      :subtitle="
        cart.count
          ? `${cart.count} item di keranjang`
          : 'Arahkan barcode ke kamera'
      "
      back
    />

    <div class="relative h-[45dvh] shrink-0 bg-black">
      <CameraScanner
        ref="scanner"
        hint="Arahkan barcode produk ke dalam kotak"
        @scan="onScan"
      />

      <Transition name="toast">
        <div
          v-if="toast"
          class="pointer-events-none absolute inset-x-4 bottom-10 rounded-xl px-3 py-2 text-center text-sm font-medium text-white shadow-lg"
          :class="toast.tone === 'ok' ? 'bg-success/90' : 'bg-destructive/90'"
        >
          {{ toast.text }}
        </div>
      </Transition>
    </div>

    <div
      v-if="unknown"
      class="flex shrink-0 items-center gap-3 border-b border-warning/40 bg-warning/15 px-4 py-3"
    >
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium">
          Barcode {{ unknown }} belum terdaftar
        </p>
        <p class="text-xs text-muted-foreground">Buat produknya sekarang?</p>
      </div>
      <Button size="sm" class="gap-1.5 shrink-0" @click="createFromUnknown">
        <PackagePlus class="size-4" /> Buat
      </Button>
      <button
        class="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground active:scale-95"
        title="Lewati"
        @click="unknown = null"
      >
        <X class="size-4" />
      </button>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <CartLines v-if="!cart.isEmpty" row-class="px-4 py-3" />
      <div
        v-else
        class="flex h-full flex-col items-center justify-center gap-2 p-6 text-center"
      >
        <ScanLine class="size-8 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">
          Belum ada yang di-scan. Produk yang ke-scan langsung masuk ke sini.
        </p>
      </div>
    </div>

    <div
      class="shrink-0 space-y-3 border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted-foreground"
          >Total ({{ cart.count }} item)</span
        >
        <span class="text-lg font-bold">{{ formatRupiah(cart.total) }}</span>
      </div>
      <Button class="w-full" size="lg" :disabled="cart.isEmpty" @click="pay"
        >Bayar</Button
      >
    </div>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>
