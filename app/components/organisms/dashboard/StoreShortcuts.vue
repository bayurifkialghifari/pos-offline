<script setup lang="ts">
import {
  ArrowUpRight,
  CalendarClock,
  DatabaseBackup,
  Package,
  Printer,
  Receipt,
  Ruler,
  Settings,
  Store,
  Wallet,
} from "lucide-vue-next"
import { RouterLink } from "vue-router"
const items = [
  {
    to: "/products",
    label: "Produk",
    icon: Package,
    tone: "bg-info/10 text-info",
  },
  {
    to: "/settings/units",
    label: "Satuan produk",
    icon: Ruler,
    tone: "bg-primary/25 text-foreground",
  },
  {
    to: "/transactions",
    label: "Transaksi",
    icon: Receipt,
    tone: "bg-info/10 text-info",
  },
  {
    to: "/cashflow",
    label: "Arus kas",
    icon: Wallet,
    tone: "bg-success/10 text-success",
  },
  {
    to: "/cashier",
    label: "Sesi kasir",
    icon: CalendarClock,
    tone: "bg-warning/10 text-warning",
  },
  {
    to: "/printer",
    label: "Printer",
    icon: Printer,
    tone: "bg-muted text-muted-foreground",
  },
  {
    to: "/settings",
    label: "Setelan",
    icon: Settings,
    tone: "bg-muted text-muted-foreground",
  },
  {
    to: "/settings/backup",
    label: "Cadangan data",
    icon: DatabaseBackup,
    tone: "bg-primary/25 text-foreground",
  },
] as const
</script>
<template>
  <section aria-labelledby="store-management-heading" class="space-y-3">
    <h2
      id="store-management-heading"
      class="flex items-center gap-2 text-base font-semibold"
    >
      <Store aria-hidden="true" class="size-4 text-muted-foreground" />Kelola
      toko
    </h2>
    <nav
      aria-label="Kelola toko"
      class="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8"
    >
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="relative flex min-h-16 min-w-0 items-center gap-2 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-accent sm:min-h-24 sm:flex-col sm:items-start sm:justify-between sm:gap-3 sm:rounded-[20px] sm:p-4"
      >
        <span
          class="flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10"
          :class="item.tone"
          ><component :is="item.icon" aria-hidden="true" class="size-5"
        /></span>
        <span class="text-xs font-medium sm:text-sm">{{ item.label }}</span>
        <ArrowUpRight
          aria-hidden="true"
          class="absolute right-3 top-3 hidden size-4 text-muted-foreground sm:block"
        />
      </RouterLink>
    </nav>
  </section>
</template>
