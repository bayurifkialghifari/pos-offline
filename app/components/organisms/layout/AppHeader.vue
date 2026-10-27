<script setup lang="ts">
import { goBackOrHome } from "@/composables/useHardwareBack"
import { ChevronLeft } from "lucide-vue-next"
import { useRouter } from "vue-router"

defineProps<{
  title: string
  subtitle?: string
  back?: boolean
}>()

const router = useRouter()
</script>

<template>
  <header
    class="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur pt-[max(0.75rem,env(safe-area-inset-top))]"
  >
    <button
      v-if="back"
      class="-ml-1 flex size-11 items-center justify-center rounded-full text-foreground hover:bg-accent"
      aria-label="Kembali"
      @click="goBackOrHome(router)"
    >
      <ChevronLeft class="size-5" />
    </button>
    <div class="min-w-0 flex-1">
      <h1 class="truncate text-base font-semibold leading-tight">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="truncate text-xs text-muted-foreground">
        {{ subtitle }}
      </p>
    </div>
    <slot name="actions" />
  </header>
</template>
