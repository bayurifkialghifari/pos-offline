<script setup lang="ts">
import { cn } from "@/lib/utils"
const props = defineProps<{ class?: string }>()
</script>
<template>
  <div
    :class="
      cn(
        'rounded-3xl border bg-card text-card-foreground shadow-[var(--shadow-card)]',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
