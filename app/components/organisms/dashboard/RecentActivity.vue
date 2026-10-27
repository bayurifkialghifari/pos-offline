<script setup lang="ts">
import { formatTime } from "@/lib/datetime"
import { formatRupiah } from "@/lib/money"
import { useReportsStore } from "@/stores/reports"
import { ArrowUpRight, Plus, Receipt } from "lucide-vue-next"
import { computed } from "vue"
import { RouterLink } from "vue-router"
const reports = useReportsStore()
const recent = computed(() => reports.rangeSales.slice(0, 5))
</script>
<template>
  <section
    aria-labelledby="recent-activity-heading"
    class="min-w-0 rounded-3xl border border-border bg-card p-5"
  >
    <div class="mb-4 flex items-center justify-between gap-3">
      <h3 id="recent-activity-heading" class="font-semibold">
        Aktivitas terbaru
      </h3>
      <Receipt aria-hidden="true" class="size-5 text-muted-foreground" />
    </div>
    <div v-if="!recent.length" class="rounded-2xl bg-muted/50 p-4">
      <span class="flex size-10 items-center justify-center rounded-xl bg-card"
        ><Receipt aria-hidden="true" class="size-5 text-muted-foreground"
      /></span>
      <p class="mt-3 font-medium">Mulai penjualan pertama</p>
      <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
        Tambahkan produk, lalu buka kasir. Transaksi selesai akan tampil di
        sini.
      </p>
      <RouterLink
        to="/products/new"
        class="mt-3 flex min-h-11 items-center gap-2 text-sm font-semibold"
        ><Plus aria-hidden="true" class="size-4" />Tambahkan produk</RouterLink
      >
    </div>
    <RouterLink
      v-for="sale in recent"
      :key="sale.id"
      :to="'/transactions/' + sale.id"
      class="flex min-h-16 items-center gap-3 border-b border-border py-3 last:border-0"
    >
      <span
        class="flex size-9 shrink-0 items-center justify-center rounded-xl"
        :class="
          sale.status === 'void'
            ? 'bg-destructive/10 text-destructive'
            : 'bg-success/10 text-success'
        "
        ><Receipt aria-hidden="true" class="size-4"
      /></span>
      <span class="min-w-0 flex-1"
        ><span class="block truncate text-sm font-medium">{{
          sale.number
        }}</span
        ><span class="mt-1 block text-xs text-muted-foreground"
          >{{ formatTime(sale.sold_at) }} ·
          {{ sale.status === "void" ? "Dibatalkan" : "Selesai" }}</span
        ></span
      >
      <strong
        class="max-w-[50%] shrink-0 break-words text-right text-xs tabular-nums sm:text-sm"
        >{{ formatRupiah(sale.total) }}</strong
      >
    </RouterLink>
    <RouterLink
      to="/transactions"
      class="mt-3 flex min-h-11 items-center justify-between gap-2 text-sm font-medium"
      >Semua transaksi<ArrowUpRight aria-hidden="true" class="size-4"
    /></RouterLink>
  </section>
</template>
