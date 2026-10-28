<script setup lang="ts">
import type { Component } from "vue"
defineProps<{ title: string; icon: Component; id: string }>()
</script>
<template>
  <section :aria-labelledby="id" class="space-y-3">
    <h2 :id="id" class="flex items-center gap-2 text-base font-semibold">
      <component
        :is="icon"
        aria-hidden="true"
        class="size-4 text-muted-foreground"
      />{{ title }}
    </h2>
    <slot />
  </section>
</template>
