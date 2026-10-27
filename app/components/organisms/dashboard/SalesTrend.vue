<script setup lang="ts">
import TrendChart from "@/components/organisms/reports/TrendChart.vue"
import { formatDate } from "@/lib/datetime"
import { formatRupiah } from "@/lib/money"
import { useReportsStore } from "@/stores/reports"
import { ArrowUpRight, ChartNoAxesCombined } from "lucide-vue-next"
import { RouterLink } from "vue-router"
const reports = useReportsStore()
</script>
<template>
  <section
    aria-labelledby="sales-trend-heading"
    class="min-w-0 rounded-3xl border border-border bg-card p-5 md:p-6"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="flex items-center gap-3">
        <span
          class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-info/10 text-info"
          ><ChartNoAxesCombined aria-hidden="true" class="size-5"
        /></span>
        <div>
          <h3 id="sales-trend-heading" class="font-semibold">Tren penjualan</h3>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ formatDate(reports.range.from) }} –
            {{ formatDate(reports.range.to) }}
          </p>
        </div>
      </div>
      <RouterLink
        to="/reports"
        class="flex min-h-11 items-center gap-1 text-sm font-medium"
        >Laporan<ArrowUpRight aria-hidden="true" class="size-4"
      /></RouterLink>
    </div>
    <div class="my-5">
      <p class="break-words text-3xl font-semibold tracking-tight tabular-nums">
        {{ formatRupiah(reports.salesSummary.total).replace(/\s/g, " ") }}
      </p>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ reports.salesSummary.count }} transaksi dalam periode ini
      </p>
    </div>
    <TrendChart
      :categories="reports.chart.categories"
      :series="reports.chart.series"
    />
    <p
      v-if="!reports.hasChartData"
      class="mt-4 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground"
    >
      Penjualan dalam periode ini akan muncul di grafik setelah transaksi
      selesai.
    </p>
  </section>
</template>
