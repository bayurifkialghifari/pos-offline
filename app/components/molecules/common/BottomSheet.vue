<script setup lang="ts">
import { X } from "lucide-vue-next"
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui"
defineProps<{ open: boolean; title?: string; desktopCentered?: boolean }>()
const emit = defineEmits<{ "update:open": [value: boolean] }>()
</script>
<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)"
    ><DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
      <DialogContent
        class="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] max-w-md flex-col rounded-t-3xl border border-border bg-background pb-[env(safe-area-inset-bottom)] shadow-2xl outline-none"
        :class="
          desktopCentered
            ? 'md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl'
            : ''
        "
      >
        <div class="flex shrink-0 items-center justify-between gap-3 px-5 py-3">
          <DialogTitle class="text-base font-semibold">{{
            title || "Pilihan"
          }}</DialogTitle
          ><DialogClose
            class="flex size-11 items-center justify-center rounded-xl hover:bg-accent"
            aria-label="Tutup"
            ><X class="size-5"
          /></DialogClose>
        </div>
        <DialogDescription class="sr-only"
          >Pilih tindakan atau tutup untuk kembali.</DialogDescription
        >
        <div class="min-h-0 flex-1 overflow-y-auto"><slot /></div>
      </DialogContent> </DialogPortal
  ></DialogRoot>
</template>
