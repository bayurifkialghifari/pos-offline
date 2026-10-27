import { getDb } from "@/db/sqlite"
import type { CashflowEntry } from "@/db/types"
import { presetRange, type DateRange } from "@/lib/dateRange"
import { startOfDay } from "@/lib/datetime"
import { CashflowEntryRepository } from "@/repositories/cashflowEntry.repo"
import { SaleRepository, type DatedSale } from "@/repositories/sale.repo"
import { defineStore } from "pinia"
import { computed, ref } from "vue"

export type ReportSource = "sales" | "cashflow"

interface ChartSeries {
  name: string
  data: number[]
}

export const useReportsStore = defineStore("reports", () => {
  const source = ref<ReportSource>("sales")

  const range = ref<DateRange>(presetRange("week"))
  const loading = ref(false)

  const todaySales = ref<DatedSale[]>([])
  const todayCash = ref<CashflowEntry[]>([])

  const rangeSales = ref<DatedSale[]>([])
  const rangeCash = ref<CashflowEntry[]>([])

  function saleRepo() {
    return new SaleRepository(getDb())
  }
  function cashRepo() {
    return new CashflowEntryRepository(getDb())
  }

  async function loadRange(r: DateRange) {
    const [rs, rc] = await Promise.all([
      saleRepo().listBetween(r.from, r.to),
      cashRepo().listBetween(r.from, r.to),
    ])
    rangeSales.value = rs
    rangeCash.value = rc
  }

  async function load() {
    loading.value = true
    try {
      const today = presetRange("today")
      const [ts, tc] = await Promise.all([
        saleRepo().listBetween(today.from, today.to),
        cashRepo().listBetween(today.from, today.to),
      ])
      todaySales.value = ts
      todayCash.value = tc
      await loadRange(range.value)
    } finally {
      loading.value = false
    }
  }

  function setSource(s: ReportSource) {
    source.value = s
  }

  async function setRange(r: DateRange) {
    range.value = r
    loading.value = true
    try {
      await loadRange(r)
    } finally {
      loading.value = false
    }
  }

  const todaySalesSummary = computed(() => {
    const rows = todaySales.value.filter((s) => s.status === "completed")
    return {
      total: rows.reduce((sum, s) => sum + s.total, 0),
      count: rows.length,
    }
  })

  const todayCashflow = computed(() => {
    let income = 0
    let expense = 0
    for (const e of todayCash.value) {
      if (e.direction === "debit") income += e.amount
      else expense += e.amount
    }
    return { income, expense, net: income - expense }
  })

  function dayList(r: DateRange): number[] {
    const days: number[] = []
    let cur = startOfDay(r.from)
    const span = Math.ceil((r.to - r.from) / 86400000)
    const step = Math.max(1, Math.ceil(span / 60))
    while (cur <= r.to) {
      days.push(cur)
      const d = new Date(cur)
      d.setDate(d.getDate() + step)
      cur = startOfDay(d.getTime())
    }
    return days
  }

  const chart = computed<{ categories: string[]; series: ChartSeries[] }>(
    () => {
      const days = dayList(range.value)
      const categories = days.map((ms) => {
        const d = new Date(ms)
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
      })

      function bucket(ms: number) {
        const index = days.findLastIndex((day) => day <= ms)
        return index < 0 ? undefined : index
      }

      if (source.value === "sales") {
        const data = new Array(days.length).fill(0)
        for (const s of rangeSales.value) {
          if (s.status !== "completed") continue
          const i = bucket(s.sold_at)
          if (i !== undefined) data[i] += s.total
        }
        return { categories, series: [{ name: "Penjualan", data }] }
      }

      const income = new Array(days.length).fill(0)
      const expense = new Array(days.length).fill(0)
      for (const e of rangeCash.value) {
        const i = bucket(e.occurred_at)
        if (i === undefined) continue
        if (e.direction === "debit") income[i] += e.amount
        else expense[i] += e.amount
      }
      return {
        categories,
        series: [
          { name: "Pemasukan", data: income },
          { name: "Pengeluaran", data: expense },
        ],
      }
    },
  )

  const salesSummary = computed(() => {
    const rows = rangeSales.value.filter((s) => s.status === "completed")
    const total = rows.reduce((sum, s) => sum + s.total, 0)
    return {
      total,
      count: rows.length,
      average: rows.length ? Math.round(total / rows.length) : 0,
    }
  })
  const cashSummary = computed(() => {
    const income = rangeCash.value
      .filter((e) => e.direction === "debit")
      .reduce((sum, e) => sum + e.amount, 0)
    const expense = rangeCash.value
      .filter((e) => e.direction === "credit")
      .reduce((sum, e) => sum + e.amount, 0)
    return { income, expense, net: income - expense }
  })
  const hasChartData = computed(() =>
    chart.value.series.some((s) => s.data.some((v) => v > 0)),
  )

  return {
    source,
    range,
    salesSummary,
    cashSummary,
    rangeSales,
    loading,
    todaySalesSummary,
    todayCashflow,
    chart,
    hasChartData,
    load,
    setSource,
    setRange,
  }
})
