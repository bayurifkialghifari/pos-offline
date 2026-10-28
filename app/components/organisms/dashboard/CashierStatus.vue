<script setup lang="ts">
import { formatRupiah } from "@/lib/money"
import { useCashierStore } from "@/stores/cashier"
import { ArrowUpRight, CalendarClock } from "lucide-vue-next"
import { RouterLink } from "vue-router"
const cashier = useCashierStore()
</script>
<template>
  <section
    aria-labelledby="cashier-status-heading"
    class="rounded-3xl bg-hero p-5 text-hero-foreground"
  >
    <div class="flex items-center justify-between gap-3">
      <span
        class="flex size-11 items-center justify-center rounded-2xl bg-highlight/15 text-highlight"
        ><CalendarClock aria-hidden="true" class="size-5" /></span
      ><span class="rounded-full bg-hero-foreground/10 px-3 py-1 text-xs">{{
        cashier.current ? "Sedang buka" : "Belum dibuka"
      }}</span>
    </div>
    <h3 id="cashier-status-heading" class="mt-4 text-lg font-semibold">
      Sesi kasir
    </h3>
    <p class="mt-1 text-sm leading-relaxed text-hero-foreground/80">
      {{
        cashier.current
          ? "Modal awal " + formatRupiah(cashier.current.opening_cash)
          : "Catat modal awal dan cocokkan kas laci saat menutup sesi."
      }}
    </p>
    <RouterLink
      to="/cashier"
      class="mt-4 flex min-h-11 items-center justify-between gap-2 rounded-xl bg-hero-foreground/10 px-3 text-sm font-semibold transition-colors hover:bg-hero-foreground/20"
      >{{ cashier.current ? "Kelola sesi" : "Buka sesi kasir"
      }}<ArrowUpRight aria-hidden="true" class="size-4"
    /></RouterLink>
  </section>
</template>
