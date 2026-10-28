<script setup lang="ts">
import BottomNav from "@/components/organisms/layout/BottomNav.vue"
import SideNav from "@/components/organisms/layout/SideNav.vue"
import SplashScreen from "@/components/organisms/layout/SplashScreen.vue"
import QuantitySheet from "@/components/organisms/pos/QuantitySheet.vue"
import { useHardwareBack } from "@/composables/useHardwareBack"
import { useCartStore } from "@/stores/cart"
import { useSettingsStore } from "@/stores/settings"
import { computed, onMounted, ref } from "vue"
import { useRoute } from "vue-router"

const cart = useCartStore()
const route = useRoute()

const showNav = computed(() => !route.meta.hideNav)
const showSideNav = computed(() => route.name !== "lock")

const { showExitHint } = useHardwareBack()

const settings = useSettingsStore()
const showSplash = ref(settings.splashEnabled)
onMounted(() => {
  if (showSplash.value) setTimeout(() => (showSplash.value = false), 1500)
})
</script>

<template>
  <div class="flex h-dvh w-full overflow-hidden bg-background">
    <SideNav v-if="showSideNav" />
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <main class="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <p
          v-if="cart.draftError"
          role="alert"
          class="bg-destructive/10 p-3 text-sm text-destructive"
        >
          {{ cart.draftError }}
          <button class="min-h-11 underline" @click="cart.flushDraft()">
            Coba simpan lagi
          </button>
        </p>
        <p
          v-if="cart.cartError"
          role="alert"
          class="bg-destructive/10 p-3 text-sm text-destructive"
        >
          {{ cart.cartError }}
        </p>
        <slot />
      </main>
      <BottomNav v-if="showNav" />
    </div>
  </div>

  <QuantitySheet />
  <Transition name="splash">
    <SplashScreen v-if="showSplash" />
  </Transition>

  <Transition name="hint">
    <div
      v-if="showExitHint"
      class="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      <div
        class="rounded-full bg-foreground/90 px-4 py-2 text-xs font-medium text-background shadow-lg"
      >
        Tekan sekali lagi untuk keluar
      </div>
    </div>
  </Transition>
</template>

<style>
.splash-leave-active {
  transition: opacity 0.2s ease;
}
.splash-leave-to {
  opacity: 0;
}
.hint-enter-active,
.hint-leave-active {
  transition: opacity 0.2s ease;
}
.hint-enter-from,
.hint-leave-to {
  opacity: 0;
}
</style>
