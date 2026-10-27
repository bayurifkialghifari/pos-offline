<script setup lang="ts">
import BackupCard from "@/components/molecules/common/BackupCard.vue"
import BottomSheet from "@/components/molecules/common/BottomSheet.vue"
import AboutContent from "@/components/organisms/settings/AboutContent.vue"
import { APP_VERSION } from "@/lib/version"
import { ArrowUpRight, Info } from "lucide-vue-next"
import { ref } from "vue"
const aboutOpen = ref(false)
</script>
<template>
  <div class="space-y-5">
    <BackupCard />
    <button
      type="button"
      class="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
      @click="aboutOpen = true"
    >
      <span
        class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted"
        ><Info aria-hidden="true" class="size-5"
      /></span>
      <span class="min-w-0 flex-1"
        ><span class="block font-semibold">Tentang aplikasi</span
        ><span class="mt-1 block text-sm text-muted-foreground"
          >Versi {{ APP_VERSION }} · Changelog dan pembaruan</span
        ></span
      >
      <ArrowUpRight
        aria-hidden="true"
        class="size-5 shrink-0 text-muted-foreground"
      />
    </button>
    <BottomSheet
      v-model:open="aboutOpen"
      title="Tentang aplikasi"
      desktop-centered
    >
      <div class="p-4 pt-1 md:p-5 md:pt-1"><AboutContent /></div>
    </BottomSheet>
  </div>
</template>
