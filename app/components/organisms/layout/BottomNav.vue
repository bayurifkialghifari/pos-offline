<script setup lang="ts">
import { cn } from "@/lib/utils"
import { RouterLink, useRoute } from "vue-router"
import { isNavActive, primaryNavItems } from "./navItems"

const route = useRoute()
</script>

<template>
  <nav
    aria-label="Navigasi utama"
    class="sticky bottom-0 z-30 grid shrink-0 grid-cols-5 gap-1 rounded-t-3xl border-t border-border bg-card px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
  >
    <RouterLink
      v-for="item in primaryNavItems"
      :key="item.to"
      :to="item.to"
      :aria-current="isNavActive(route.path, item) ? 'page' : undefined"
      class="flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors"
      :class="
        cn(
          isNavActive(route.path, item)
            ? 'bg-hero text-hero-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )
      "
    >
      <component :is="item.icon" aria-hidden="true" class="size-5" />
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>
