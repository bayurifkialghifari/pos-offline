<script setup lang="ts">
import BackupCard from "@/components/molecules/common/BackupCard.vue"
import CashierStatus from "@/components/organisms/dashboard/CashierStatus.vue"
import DailyOverview from "@/components/organisms/dashboard/DailyOverview.vue"
import RecentActivity from "@/components/organisms/dashboard/RecentActivity.vue"
import SalesTrend from "@/components/organisms/dashboard/SalesTrend.vue"
import StoreShortcuts from "@/components/organisms/dashboard/StoreShortcuts.vue"
import { formatDate } from "@/lib/datetime"
import { useCashierStore } from "@/stores/cashier"
import { useMediaStore } from "@/stores/media"
import { useReportsStore } from "@/stores/reports"
import { useSettingsStore } from "@/stores/settings"
import { useMediaQuery } from "@vueuse/core"
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  ShoppingCart,
  Store,
} from "lucide-vue-next"
import { onMounted, ref } from "vue"
import { RouterLink } from "vue-router"
const settings = useSettingsStore()
const reports = useReportsStore()
const cashier = useCashierStore()
const media = useMediaStore()
const isTablet = useMediaQuery("(min-width: 768px)")
const error = ref("")
const today = formatDate(Date.now())
onMounted(async () => {
  try {
    if (settings.storeLogo) await media.ensure([settings.storeLogo])
    reports.setSource("sales")
    await Promise.all([reports.load(), cashier.load()])
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Ringkasan gagal dimuat"
  }
})
</script>
<template>
  <div class="mx-auto max-w-7xl space-y-6 p-4 pb-8 md:p-6 lg:p-8">
    <header
      class="flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-hero p-5 text-hero-foreground md:gap-4 md:rounded-none md:bg-transparent md:p-0 md:text-foreground"
    >
      <div class="flex min-w-0 items-center gap-3">
        <span
          class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-hero-foreground/10 md:bg-card"
          ><img
            v-if="media.url(settings.storeLogo)"
            :src="media.url(settings.storeLogo) ?? undefined"
            alt=""
            width="48"
            height="48"
            class="size-full object-contain p-1" /><Store
            v-else
            aria-hidden="true"
            class="size-6"
        /></span>
        <div class="min-w-0">
          <p
            class="text-xs font-medium text-hero-foreground/75 md:text-muted-foreground"
          >
            Dashboard
          </p>
          <h1
            class="mt-1 break-words text-2xl font-semibold tracking-tight md:text-3xl"
          >
            {{ settings.storeName }}
          </h1>
          <p
            v-if="settings.storeOwner"
            class="mt-1 break-words text-sm text-hero-foreground/75 md:text-muted-foreground"
          >
            {{ settings.storeOwner }}
          </p>
        </div>
      </div>
      <RouterLink
        to="/pos"
        class="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-highlight px-5 font-semibold text-highlight-foreground transition-colors hover:bg-highlight/90 md:w-auto md:bg-hero md:text-hero-foreground md:hover:bg-hero/90"
        ><ShoppingCart aria-hidden="true" class="size-5" />Mulai
        transaksi<ArrowUpRight aria-hidden="true" class="size-4"
      /></RouterLink>
    </header>
    <StoreShortcuts />
    <p
      v-if="error"
      role="alert"
      class="rounded-xl bg-destructive/10 p-4 text-sm text-destructive"
    >
      {{ error }}
    </p>
    <section
      aria-labelledby="daily-summary-heading"
      :aria-busy="reports.loading"
      class="space-y-4"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="daily-summary-heading"
          class="flex items-center gap-2 text-base font-semibold"
        >
          <ChartNoAxesCombined
            aria-hidden="true"
            class="size-4 text-muted-foreground"
          />Ringkasan hari ini
        </h2>
        <p class="text-sm text-muted-foreground">{{ today }}</p>
      </div>
      <DailyOverview :mobile="!isTablet" />
      <div class="grid items-start gap-4 xl:grid-cols-12">
        <SalesTrend class="xl:col-span-8" />
        <div
          class="grid min-w-0 gap-4 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-1"
        >
          <CashierStatus /><RecentActivity />
        </div>
      </div>
    </section>
    <BackupCard />
  </div>
</template>
