<script setup lang="ts">
import { Badge } from "@/components/atoms/ui/badge"
import { Button } from "@/components/atoms/ui/button"
import BottomSheet from "@/components/molecules/common/BottomSheet.vue"
import AppHeader from "@/components/organisms/layout/AppHeader.vue"
import { getDb } from "@/db/sqlite"
import type { Sale, SaleItem } from "@/db/types"
import { formatDateTime } from "@/lib/datetime"
import { formatRupiah } from "@/lib/money"
import { formatQuantity } from "@/lib/quantity"
import { buildReceipt } from "@/lib/receipt"
import type { PrinterCapability } from "@/services/capabilities/registry"
import { capabilities } from "@/services/capabilities/registry"
import { VoidService } from "@/services/void.service"
import { usePrinterStore } from "@/stores/printer"
import { useSalesStore } from "@/stores/sales"
import { useSettingsStore } from "@/stores/settings"
import { Printer, Receipt } from "lucide-vue-next"
import { onMounted, ref } from "vue"
import { useRoute } from "vue-router"

const voidOpen = ref(false),
  voidBusy = ref(false),
  actionError = ref("")
async function voidTransaction() {
  if (!sale.value || voidBusy.value) return
  voidBusy.value = true
  actionError.value = ""
  try {
    sale.value = await new VoidService(getDb()).voidSale(sale.value.id)
    voidOpen.value = false
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : "Pembatalan gagal"
  } finally {
    voidBusy.value = false
  }
}
const route = useRoute()
const sales = useSalesStore()
const settings = useSettingsStore()

const sale = ref<Sale | null>(null)
const items = ref<SaleItem[]>([])
const loading = ref(true)

const PAY_LABEL: Record<string, string> = {
  cash: "Tunai",
  qris: "QRIS",
  transfer: "Transfer",
}

function activityTime(value: Sale): number {
  if (value.status === "open") return value.opened_at ?? value.created_at
  return value.sold_at ?? value.created_at
}

onMounted(async () => {
  const res = await sales.getWithItems(String(route.params.id))
  sale.value = res.sale
  items.value = res.items
  loading.value = false
})

async function printReceipt() {
  if (!sale.value) return
  actionError.value = ""
  try {
    const printer = capabilities.get<PrinterCapability>("printer")
    if (!printer) return
    await printer.print(
      buildReceipt(sale.value, items.value, {
        storeName: settings.storeName,
        storeOwner: settings.storeOwner,
        width: usePrinterStore().paperWidth,
      }),
    )
  } catch (error) {
    actionError.value =
      error instanceof Error ? error.message : "Struk gagal dicetak"
  }
}
</script>

<template>
  <div>
    <AppHeader title="Detail Transaksi" :subtitle="sale?.number" back />

    <div v-if="loading" class="p-8 text-center text-sm text-muted-foreground">
      Memuat…
    </div>

    <div
      v-else-if="!sale"
      class="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground"
    >
      <Receipt class="size-10" />
      <p class="text-sm">Transaksi tidak ditemukan.</p>
    </div>

    <div v-else class="space-y-4 p-4">
      <div class="rounded-2xl border border-border bg-card p-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">Nomor</span>
          <span class="font-medium">{{ sale.number }}</span>
        </div>
        <div class="mt-1.5 flex items-center justify-between text-sm">
          <span class="text-muted-foreground">{{
            sale.status === "open" ? "Ditahan" : "Waktu"
          }}</span>
          <span>{{ formatDateTime(activityTime(sale)) }}</span>
        </div>
        <div
          v-if="sale.status === 'open'"
          class="mt-1.5 flex items-center justify-between gap-3 text-sm"
        >
          <span class="text-muted-foreground">Label</span>
          <span class="truncate text-right font-medium">{{
            sale.open_bill_label ?? "Tanpa label"
          }}</span>
        </div>
        <div
          v-if="sale.status !== 'open'"
          class="mt-1.5 flex items-center justify-between text-sm"
        >
          <span class="text-muted-foreground">Metode</span>
          <span>{{
            PAY_LABEL[sale.payment_method] ?? sale.payment_method
          }}</span>
        </div>
        <div v-if="sale.status === 'open'" class="mt-3">
          <Badge variant="warning">Open Bill</Badge>
        </div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-border bg-card">
        <div class="divide-y divide-border">
          <div
            v-for="it in items"
            :key="it.id"
            class="flex items-start gap-3 p-3"
          >
            <span
              class="mt-0.5 min-w-8 text-sm font-semibold tabular-nums text-muted-foreground"
              >{{
                formatQuantity(it.base_qty, {
                  factor: it.unit_factor,
                  symbol: it.unit_symbol,
                })
              }}</span
            >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium">{{ it.name_snapshot }}</p>
              <p class="text-xs text-muted-foreground">
                {{ formatRupiah(it.price_snapshot) }} / {{ it.unit_symbol }}
                <span v-if="it.input_mode === 'nominal'">
                  · Sesuai nominal (jumlah ≈)</span
                >
              </p>
            </div>
            <span class="text-sm font-semibold">{{
              formatRupiah(it.line_total)
            }}</span>
          </div>
        </div>

        <div class="space-y-1.5 border-t border-border bg-muted/30 p-4">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Subtotal</span>
            <span>{{ formatRupiah(sale.subtotal) }}</span>
          </div>
          <div v-if="sale.discount > 0" class="flex justify-between text-sm">
            <span class="text-muted-foreground">Diskon</span>
            <span>-{{ formatRupiah(sale.discount) }}</span>
          </div>
          <div class="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{{ formatRupiah(sale.total) }}</span>
          </div>
          <div
            v-if="sale.status !== 'open'"
            class="flex justify-between text-sm"
          >
            <span class="text-muted-foreground">Bayar</span>
            <span>{{ formatRupiah(sale.paid) }}</span>
          </div>
          <div
            v-if="sale.status !== 'open' && sale.change_due > 0"
            class="flex justify-between text-sm"
          >
            <span class="text-muted-foreground">Kembalian</span>
            <span class="font-semibold text-success">{{
              formatRupiah(sale.change_due)
            }}</span>
          </div>
        </div>
      </div>

      <p
        v-if="sale.status === 'void'"
        class="rounded-xl bg-destructive/10 p-4 font-medium text-destructive"
      >
        Transaksi dibatalkan. Stok sudah dikembalikan.
      </p>
      <p v-if="actionError" role="alert" class="text-destructive">
        {{ actionError }}
      </p>
      <Button
        v-if="sale.status === 'completed'"
        variant="destructive"
        class="min-h-11 w-full"
        @click="voidOpen = true"
        >Batalkan transaksi</Button
      >
      <Button
        v-if="sale.status !== 'open'"
        variant="outline"
        class="w-full gap-2"
        @click="printReceipt"
      >
        <Printer class="size-4" /> Cetak Ulang Struk
      </Button>
    </div>
    <BottomSheet v-model:open="voidOpen" title="Batalkan transaksi?">
      <div class="space-y-4 p-5">
        <p>{{ sale?.number }} · {{ formatRupiah(sale?.total ?? 0) }}</p>
        <p class="text-sm text-muted-foreground">
          Stok yang tercatat dikembalikan dan pemasukan penjualan dibatalkan.
          Riwayat tetap tersimpan. Catatan hitung sesi yang sudah ditutup tidak
          diubah.
        </p>
        <p v-if="actionError" role="alert" class="text-destructive">
          {{ actionError }}
        </p>
        <div class="flex gap-3">
          <Button
            variant="outline"
            class="min-h-11 flex-1"
            :disabled="voidBusy"
            @click="voidOpen = false"
            >Kembali</Button
          ><Button
            variant="destructive"
            class="min-h-11 flex-1"
            :disabled="voidBusy"
            @click="voidTransaction"
            >Batalkan transaksi</Button
          >
        </div>
      </div>
    </BottomSheet>
  </div>
</template>
