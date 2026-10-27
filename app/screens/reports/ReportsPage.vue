<script setup lang="ts">
import DateRangeFilter from "@/components/molecules/common/DateRangeFilter.vue"
import ExportDialog from "@/components/molecules/common/ExportDialog.vue"
import MetricCard from "@/components/molecules/dashboard/MetricCard.vue"
import AppHeader from "@/components/organisms/layout/AppHeader.vue"
import TrendChart from "@/components/organisms/reports/TrendChart.vue"
import { rangeLabel } from "@/lib/dateRange"
import { formatRupiah } from "@/lib/money"
import { useCashflowStore } from "@/stores/cashflow"
import { useReportsStore } from "@/stores/reports"
import { useSalesStore } from "@/stores/sales"
import { Download } from "lucide-vue-next"
import { computed, onMounted, ref } from "vue"
const reports = useReportsStore()
const sales = useSalesStore()
const cashflow = useCashflowStore()
const exportOpen = ref(false)
const error = ref("")
const exportConfig = computed(() =>
  reports.source === "sales"
    ? {
        title: "Ekspor transaksi",
        filenameBase: "transaksi",
        buildSheets: sales.buildExport,
      }
    : {
        title: "Ekspor arus kas",
        filenameBase: "cashflow",
        buildSheets: cashflow.buildExport,
      },
)
async function load() {
  try {
    error.value = ""
    await reports.load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Laporan gagal dimuat"
  }
}
onMounted(load)
</script>
<template>
  <div class="pb-8">
    <AppHeader title="Laporan" :subtitle="rangeLabel(reports.range)" back
      ><template #actions
        ><button
          class="flex size-11 items-center justify-center rounded-xl hover:bg-accent"
          aria-label="Ekspor laporan"
          @click="exportOpen = true"
        >
          <Download class="size-5" /></button></template
    ></AppHeader>
    <div class="space-y-5 p-4 md:p-6">
      <p v-if="error" role="alert" class="text-destructive">
        {{ error }} <button class="underline" @click="load">Coba lagi</button>
      </p>
      <DateRangeFilter
        :model-value="reports.range"
        @update:model-value="
          reports.setRange($event).catch((e) => (error = e.message))
        "
      />
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Penjualan periode ini"
          :value="formatRupiah(reports.salesSummary.total)"
          :detail="reports.salesSummary.count + ' transaksi selesai'"
          tone="money"
        />
        <MetricCard
          label="Rata-rata transaksi"
          :value="formatRupiah(reports.salesSummary.average)"
          detail="Transaksi batal tidak dihitung"
        />
        <MetricCard
          label="Pemasukan"
          :value="formatRupiah(reports.cashSummary.income)"
          detail="Penjualan dan pemasukan manual"
          tone="income"
        />
        <MetricCard
          label="Pengeluaran"
          :value="formatRupiah(reports.cashSummary.expense)"
          :detail="'Arus bersih ' + formatRupiah(reports.cashSummary.net)"
          tone="expense"
        />
      </div>
      <section class="rounded-[20px] border border-border bg-card p-4 md:p-6">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold">Pergerakan usaha</h2>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ rangeLabel(reports.range) }} · rentang panjang dikelompokkan
              otomatis
            </p>
          </div>
          <div class="flex gap-1 rounded-xl bg-muted p-1">
            <button
              v-for="tab in [
                { id: 'sales', label: 'Penjualan' },
                { id: 'cashflow', label: 'Arus kas' },
              ] as const"
              :key="tab.id"
              class="min-h-11 rounded-lg px-4 text-sm font-medium"
              :class="
                reports.source === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              "
              @click="reports.setSource(tab.id)"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
        <p
          v-if="reports.loading"
          role="status"
          class="py-8 text-muted-foreground"
        >
          Memuat laporan…
        </p>
        <TrendChart
          v-else
          :categories="reports.chart.categories"
          :series="reports.chart.series"
        />
        <p
          v-if="!reports.hasChartData"
          class="mt-4 text-sm text-muted-foreground"
        >
          Belum ada aktivitas pada periode ini. Penjualan dan catatan kas akan
          muncul setelah disimpan.
        </p>
      </section>
    </div>
    <ExportDialog
      v-model:open="exportOpen"
      :title="exportConfig.title"
      :filename-base="exportConfig.filenameBase"
      :initial-range="reports.range"
      :build-sheets="exportConfig.buildSheets"
    />
  </div>
</template>
