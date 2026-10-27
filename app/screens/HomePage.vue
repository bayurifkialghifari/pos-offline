<script setup lang="ts">
import MetricCard from "@/components/molecules/dashboard/MetricCard.vue"
import TrendChart from "@/components/organisms/reports/TrendChart.vue"
import { formatTime } from "@/lib/datetime"
import { formatRupiah } from "@/lib/money"
import { useCashierStore } from "@/stores/cashier"
import { useReportsStore } from "@/stores/reports"
import { useSettingsStore } from "@/stores/settings"
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  HardDrive,
  Package,
  Printer,
  Receipt,
  Settings,
  ShoppingCart,
  Wallet,
} from "lucide-vue-next"
import { computed, onMounted, ref } from "vue"
import { RouterLink } from "vue-router"
const settings = useSettingsStore()
const reports = useReportsStore()
const cashier = useCashierStore()
const error = ref("")
const recent = computed(() => reports.rangeSales.slice(0, 5))
const menu = [
  { to: "/products", label: "Produk", icon: Package },
  { to: "/transactions", label: "Transaksi", icon: Receipt },
  { to: "/cashflow", label: "Arus kas", icon: Wallet },
  { to: "/cashier", label: "Sesi kasir", icon: CalendarClock },
  { to: "/printer", label: "Printer", icon: Printer },
  { to: "/settings", label: "Setelan", icon: Settings },
]
onMounted(async () => {
  try {
    reports.setSource("sales")
    await Promise.all([reports.load(), cashier.load()])
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Ringkasan gagal dimuat"
  }
})
</script>
<template>
  <div class="space-y-6 p-4 pb-8 md:p-6 lg:p-8">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="text-sm text-muted-foreground">
          Usaha berjalan, data tetap di perangkat
        </p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
          {{ settings.storeName }}
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ settings.storeOwner || "Ringkasan toko hari ini" }}
        </p>
      </div>
      <RouterLink
        to="/pos"
        class="flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground shadow-sm"
        ><ShoppingCart class="size-5" /> Mulai transaksi
        <ArrowUpRight class="size-4"
      /></RouterLink>
    </header>
    <p v-if="error" role="alert" class="text-destructive">{{ error }}</p>
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Penjualan hari ini"
        :value="formatRupiah(reports.todaySalesSummary.total)"
        :detail="reports.todaySalesSummary.count + ' transaksi selesai'"
        tone="money"
      /><MetricCard
        label="Kas masuk"
        :value="formatRupiah(reports.todayCashflow.income)"
        detail="Pemasukan hari ini"
        tone="income"
      /><MetricCard
        label="Kas keluar"
        :value="formatRupiah(reports.todayCashflow.expense)"
        detail="Pengeluaran hari ini"
        tone="expense"
      /><MetricCard
        label="Sesi kasir"
        :value="cashier.current ? 'Sedang buka' : 'Belum dibuka'"
        :detail="
          cashier.current
            ? 'Modal ' + formatRupiah(cashier.current.opening_cash)
            : 'Buka sesi untuk mencatat kas laci'
        "
      />
    </div>
    <div class="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section class="min-w-0 rounded-[20px] border border-border bg-card p-5">
        <div class="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold">Tren penjualan</h2>
            <p class="text-sm text-muted-foreground">
              Periode laporan terakhir
            </p>
          </div>
          <RouterLink
            to="/reports"
            class="flex min-h-11 items-center gap-2 text-sm font-medium"
            >Laporan <ArrowRight class="size-4"
          /></RouterLink>
        </div>
        <TrendChart
          :categories="reports.chart.categories"
          :series="reports.chart.series"
        />
      </section>
      <section class="min-w-0 rounded-[20px] border border-border bg-card p-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Aktivitas terbaru</h2>
          <Receipt class="size-5 text-muted-foreground" />
        </div>
        <div
          v-if="!recent.length"
          class="flex min-h-52 flex-col items-center justify-center text-center"
        >
          <Receipt class="mb-3 size-8 text-muted-foreground" />
          <p class="font-medium">Siap untuk penjualan pertama</p>
          <p class="mt-2 max-w-xs text-sm text-muted-foreground">
            Tambahkan produk, lalu buka kasir. Riwayat dan ringkasan muncul
            otomatis.
          </p>
          <RouterLink
            to="/products/new"
            class="mt-4 flex min-h-11 items-center font-medium underline"
            >Tambahkan produk</RouterLink
          >
        </div>
        <RouterLink
          v-for="sale in recent"
          :key="sale.id"
          :to="'/transactions/' + sale.id"
          class="flex min-h-16 items-center justify-between gap-3 border-b border-border py-3 last:border-0"
          ><div class="min-w-0">
            <p class="truncate text-sm font-medium">{{ sale.number }}</p>
            <p class="text-sm text-muted-foreground">
              {{ formatTime(sale.sold_at) }} ·
              {{ sale.status === "void" ? "Dibatalkan" : "Selesai" }}
            </p>
          </div>
          <strong class="shrink-0 text-sm text-info tabular-nums">{{
            formatRupiah(sale.total)
          }}</strong></RouterLink
        >
      </section>
    </div>
    <section>
      <h2 class="mb-3 text-sm font-medium text-muted-foreground">
        Kelola toko
      </h2>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <RouterLink
          v-for="item in menu"
          :key="item.to"
          :to="item.to"
          class="flex min-h-20 items-center gap-3 rounded-2xl border border-border bg-card px-4 font-medium hover:bg-accent"
          ><component :is="item.icon" class="size-5 shrink-0" /><span
            class="text-sm"
            >{{ item.label }}</span
          ></RouterLink
        >
      </div>
    </section>
    <RouterLink
      to="/settings/backup"
      class="flex items-center gap-4 rounded-[20px] bg-hero p-5 text-hero-foreground"
      ><HardDrive class="size-6 shrink-0" />
      <div class="flex-1">
        <p class="font-semibold">Satu toko, bebas pindah perangkat</p>
        <p class="mt-1 text-sm opacity-80">
          Simpan cadangan berisi produk, foto, transaksi, dan kas.
        </p>
      </div>
      <ArrowRight class="size-5 shrink-0"
    /></RouterLink>
  </div>
</template>
