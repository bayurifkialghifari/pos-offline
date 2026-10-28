<script setup lang="ts">
import { Button } from "@/components/atoms/ui/button"
import BottomSheet from "@/components/molecules/common/BottomSheet.vue"
import MarkdownContent from "@/components/molecules/common/MarkdownContent.vue"
import { useAppUpdate } from "@/composables/useAppUpdate"
import { Capacitor } from "@capacitor/core"
import {
  CheckCircle2,
  Clock3,
  Download,
  History,
  Info,
  Loader2,
  RefreshCw,
} from "lucide-vue-next"
import { ref } from "vue"
import changelog from "../../../../CHANGELOG.md?raw"

const changelogOpen = ref(false)
const {
  version,
  versionError,
  state,
  busy,
  coolingDown,
  nextCheckLabel,
  release,
  installing,
  installError,
  message,
  check,
  install,
} = useAppUpdate()
const statusLabels = {
  unchecked: "Belum diperiksa",
  checking: "Memeriksa pembaruan…",
  current: "Versi sudah terbaru",
  available: "Pembaruan tersedia",
  error: "Pemeriksaan gagal",
} as const
</script>

<template>
  <section aria-labelledby="app-version-heading" class="space-y-3">
    <h2
      id="app-version-heading"
      class="flex items-center gap-2 text-base font-semibold"
    >
      <Info aria-hidden="true" class="size-4 text-muted-foreground" />Aplikasi
    </h2>
    <div
      class="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]"
    >
      <div class="flex items-center gap-3 p-5">
        <img
          src="/icon-512.png"
          alt=""
          width="48"
          height="48"
          class="size-12 shrink-0 rounded-2xl"
        />
        <div class="min-w-0 flex-1">
          <h3 class="font-semibold">POS Offline</h3>
          <p class="mt-1 text-sm text-muted-foreground">Versi {{ version }}</p>
        </div>
      </div>
      <div class="px-5 pb-5">
        <Button
          variant="outline"
          class="min-h-11 w-full gap-2"
          @click="changelogOpen = true"
          ><History aria-hidden="true" />Lihat changelog</Button
        >
        <p
          v-if="versionError"
          role="alert"
          class="mt-3 text-sm text-destructive"
        >
          {{ versionError }}
        </p>
      </div>
      <div class="space-y-4 border-t border-border p-5">
        <div class="flex items-start gap-3">
          <span
            class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-info"
            ><RefreshCw aria-hidden="true" class="size-5"
          /></span>
          <div class="min-w-0">
            <h3 class="text-sm font-semibold">Pembaruan aplikasi</h3>
            <p
              role="status"
              class="mt-1 text-sm"
              :class="
                state.kind === 'current' || state.kind === 'available'
                  ? 'text-success'
                  : 'text-muted-foreground'
              "
            >
              {{ statusLabels[state.kind] }}
            </p>
          </div>
        </div>
        <p class="text-sm leading-relaxed text-muted-foreground">
          Cek versi baru saat terhubung internet. Hasil pemeriksaan disimpan
          selama 1 jam di perangkat ini.
        </p>
        <p
          v-if="state.kind === 'error'"
          role="alert"
          class="text-sm text-destructive"
        >
          {{ state.message }}
        </p>
        <div v-if="release" class="space-y-3 rounded-2xl bg-muted p-4">
          <p class="flex items-center gap-2 font-semibold">
            <CheckCircle2
              aria-hidden="true"
              class="size-4 shrink-0 text-success"
            />Tersedia {{ release.tag_name }}
          </p>
          <MarkdownContent :source="release.body ?? ''" />
          <Button
            v-if="Capacitor.isNativePlatform()"
            class="min-h-11 w-full"
            :disabled="busy"
            @click="install"
            ><Loader2
              v-if="installing"
              aria-hidden="true"
              class="animate-spin"
            /><Download v-else aria-hidden="true" />{{
              installing ? "Menyiapkan pembaruan…" : "Unduh & pasang"
            }}</Button
          >
          <p v-else class="text-sm text-muted-foreground">
            Gunakan aplikasi Android untuk memasang pembaruan.
          </p>
        </div>
        <p v-if="message" role="status" class="text-sm">{{ message }}</p>
        <p v-if="installError" role="alert" class="text-sm text-destructive">
          {{ installError }}
        </p>
        <Button
          variant="outline"
          class="min-h-11 w-full"
          :disabled="busy || coolingDown"
          :aria-describedby="coolingDown ? 'update-cooldown' : undefined"
          @click="check"
          ><Loader2
            v-if="state.kind === 'checking'"
            aria-hidden="true"
            class="animate-spin"
          /><RefreshCw v-else aria-hidden="true" />{{
            state.kind === "checking" ? "Memeriksa…" : "Cek pembaruan"
          }}</Button
        >
        <p
          v-if="coolingDown"
          id="update-cooldown"
          class="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
        >
          <Clock3 aria-hidden="true" class="mt-0.5 size-4 shrink-0" />
          <span
            >Cek lagi mulai {{ nextCheckLabel }}. Hasil tersimpan tetap tersedia
            setelah aplikasi dibuka ulang.</span
          >
        </p>
      </div>
    </div>
    <BottomSheet
      v-model:open="changelogOpen"
      title="Changelog aplikasi"
      desktop-centered
    >
      <div class="p-5 pt-1">
        <p class="mb-4 text-sm text-muted-foreground">
          Catatan perubahan bawaan · Versi {{ version }}
        </p>
        <MarkdownContent :source="changelog" />
      </div>
    </BottomSheet>
  </section>
</template>
