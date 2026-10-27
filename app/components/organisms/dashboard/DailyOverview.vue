<script setup lang="ts">
import MetricCard from "@/components/molecules/dashboard/MetricCard.vue"
import { formatRupiah } from "@/lib/money"
import { useReportsStore } from "@/stores/reports"
import {
  ArrowUpRight,
  CircleDollarSign,
  Receipt,
  Wallet,
} from "lucide-vue-next"
import { computed } from "vue"
import { RouterLink } from "vue-router"
const reports = useReportsStore()
const average = computed(() =>
  reports.todaySalesSummary.count
    ? Math.round(
        reports.todaySalesSummary.total / reports.todaySalesSummary.count,
      )
    : 0,
)
</script>
<template>
  <div class="grid grid-cols-2 gap-4 xl:grid-cols-12">
    <article
      aria-label="Penjualan hari ini"
      class="col-span-2 min-w-0 rounded-3xl bg-primary p-5 text-primary-foreground md:p-6 xl:col-span-6"
    >
      <div class="flex items-center justify-between gap-3">
        <span class="flex items-center gap-3 text-sm font-semibold"
          ><span
            class="flex size-11 items-center justify-center rounded-2xl bg-primary-foreground/10"
            ><CircleDollarSign aria-hidden="true" class="size-6" /></span
          >Penjualan hari ini</span
        >
        <RouterLink
          to="/reports"
          aria-label="Lihat laporan penjualan"
          class="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10 transition-colors hover:bg-primary-foreground/20"
          ><ArrowUpRight aria-hidden="true" class="size-5"
        /></RouterLink>
      </div>
      <p
        class="mt-5 break-words text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl"
      >
        {{ formatRupiah(reports.todaySalesSummary.total).replace(/\s/g, " ") }}
      </p>
      <div class="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm">
        <p class="flex items-center gap-2">
          <Receipt aria-hidden="true" class="size-4" /><span
            ><strong class="font-semibold">{{
              reports.todaySalesSummary.count
            }}</strong>
            transaksi selesai</span
          >
        </p>
        <p>
          Rata-rata
          <strong class="font-semibold tabular-nums">{{
            formatRupiah(average)
          }}</strong>
        </p>
      </div>
    </article>
    <MetricCard
      class="xl:col-span-3"
      label="Kas masuk"
      :value="formatRupiah(reports.todayCashflow.income)"
      detail="Pemasukan hari ini"
      tone="income"
    />
    <MetricCard
      class="xl:col-span-3"
      label="Kas keluar"
      :value="formatRupiah(reports.todayCashflow.expense)"
      detail="Pengeluaran hari ini"
      tone="expense"
    />
    <RouterLink
      to="/cashflow"
      class="col-span-2 flex min-h-12 flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/70 px-4 py-3 text-sm xl:col-span-12"
    >
      <span class="flex flex-wrap items-center gap-2"
        ><Wallet
          aria-hidden="true"
          class="size-4 text-muted-foreground"
        />Selisih kas hari ini
        <strong class="tabular-nums">{{
          formatRupiah(reports.todayCashflow.net)
        }}</strong></span
      >
      <span class="flex items-center gap-1 font-medium"
        >Lihat arus kas<ArrowUpRight aria-hidden="true" class="size-4"
      /></span>
    </RouterLink>
  </div>
</template>
