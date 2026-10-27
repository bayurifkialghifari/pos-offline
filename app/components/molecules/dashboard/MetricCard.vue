<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string
    detail?: string
    tone?: "money" | "income" | "expense" | "neutral"
  }>(),
  { tone: "neutral", detail: "" },
)
</script>
<template>
  <article
    class="min-w-0 rounded-[20px] border border-border bg-card p-5 shadow-sm"
  >
    <p class="text-sm text-muted-foreground">{{ label }}</p>
    <p
      class="mt-3 break-words text-2xl font-semibold tracking-tight tabular-nums lg:text-3xl"
      :class="{
        'text-info': tone === 'money',
        'text-success': tone === 'income',
        'text-destructive': tone === 'expense',
      }"
    >
      {{ value }}
    </p>
    <p v-if="detail" class="mt-2 text-sm text-muted-foreground">{{ detail }}</p>
  </article>
</template>
