<script setup lang="ts">
import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  Receipt,
  Wallet,
} from "lucide-vue-next"
const icons = {
  money: CircleDollarSign,
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  neutral: Wallet,
  count: Receipt,
} as const
withDefaults(
  defineProps<{
    label: string
    value: string
    detail?: string
    tone?: "money" | "income" | "expense" | "neutral" | "count"
    compact?: boolean
  }>(),
  { tone: "neutral", detail: "", compact: false },
)
</script>
<template>
  <article
    class="min-w-0 rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]"
    :class="compact ? 'p-4' : 'p-5'"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm font-medium text-muted-foreground">{{ label }}</p>
      <span
        class="flex size-10 shrink-0 items-center justify-center rounded-xl"
        :class="{
          'bg-info/10 text-info': tone === 'money',
          'bg-success/10 text-success': tone === 'income',
          'bg-destructive/10 text-destructive': tone === 'expense',
          'bg-muted text-muted-foreground':
            tone === 'neutral' || tone === 'count',
        }"
        ><component :is="icons[tone]" aria-hidden="true" class="size-5"
      /></span>
    </div>
    <p
      class="mt-3 break-words font-semibold tracking-tight tabular-nums"
      :class="[
        compact
          ? value.length > 11
            ? 'text-base'
            : 'text-2xl'
          : value.length > 11
            ? 'text-xs min-[360px]:text-sm sm:text-xl xl:text-2xl'
            : 'text-2xl lg:text-3xl',
        {
          'text-info': tone === 'money',
          'text-success': tone === 'income',
          'text-destructive': tone === 'expense',
        },
      ]"
    >
      {{ value.replace(/\s/g, " ") }}
    </p>
    <p v-if="detail" class="mt-2 text-sm text-muted-foreground">{{ detail }}</p>
  </article>
</template>
