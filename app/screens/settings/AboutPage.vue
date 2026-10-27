<script setup lang="ts">
import { Button } from "@/components/atoms/ui/button"
import AppHeader from "@/components/organisms/layout/AppHeader.vue"
import { APP_VERSION } from "@/lib/version"
import type { Release } from "@/services/updates/release"
import {
  checkUpdate,
  installedVersion,
  installUpdate,
} from "@/services/updates/updater"
import { Capacitor } from "@capacitor/core"
import { Download, RefreshCw, ShieldCheck } from "lucide-vue-next"
import { onMounted, ref } from "vue"
import changelog from "../../../CHANGELOG.md?raw"
const version = ref(APP_VERSION),
  busy = ref(false),
  error = ref(""),
  message = ref(""),
  release = ref<Release | null>(null)
onMounted(async () => {
  try {
    version.value = await installedVersion()
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Versi tidak bisa dibaca"
  }
})
async function check() {
  if (busy.value) return
  busy.value = true
  error.value = ""
  message.value = ""
  try {
    release.value = await checkUpdate()
    message.value = release.value
      ? "Versi baru tersedia."
      : "Belum ada versi lebih baru yang tersedia."
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Pemeriksaan gagal"
  } finally {
    busy.value = false
  }
}
async function install() {
  if (!release.value || busy.value) return
  busy.value = true
  error.value = ""
  try {
    const status = await installUpdate(release.value)
    message.value =
      status === "permission_required"
        ? "Izinkan pemasangan dari aplikasi ini, lalu tekan Unduh & pasang lagi."
        : "Installer Android dibuka. Ikuti konfirmasi sistem untuk menyelesaikan pembaruan."
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Pembaruan gagal"
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="pb-8">
    <AppHeader title="Tentang aplikasi" subtitle="Versi dan pembaruan" back />
    <div class="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
      <section class="rounded-[20px] border border-border bg-card p-6">
        <img src="/icon-512.png" alt="" class="size-16 rounded-2xl" />
        <h1 class="mt-4 text-2xl font-semibold">POS Offline</h1>
        <p class="mt-2 text-muted-foreground">Versi {{ version }}</p>
        <p class="mt-4 text-sm leading-relaxed text-muted-foreground">
          Kasir, stok, laporan, dan data usaha tersimpan di perangkat. Tidak
          perlu akun Google atau sinkronisasi.
        </p>
      </section>
      <section
        class="space-y-4 rounded-[20px] border border-border bg-card p-5"
      >
        <h2 class="text-lg font-semibold">Pembaruan aplikasi</h2>
        <p class="text-sm text-muted-foreground">
          Pemeriksaan ini memerlukan internet dan hanya berjalan saat tombol
          ditekan. Data toko tidak dikirim.
        </p>
        <Button class="min-h-11 gap-2" :disabled="busy" @click="check"
          ><RefreshCw class="size-4" />{{
            busy ? "Memproses…" : "Periksa pembaruan"
          }}</Button
        >
        <p v-if="message" role="status" class="text-sm">{{ message }}</p>
        <p v-if="error" role="alert" class="text-sm text-destructive">
          {{ error }}
        </p>
        <div v-if="release" class="space-y-4 border-t border-border pt-4">
          <p class="font-semibold">Tersedia {{ release.tag_name }}</p>
          <pre
            class="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed"
            >{{ release.body }}</pre>
          <p class="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck class="size-5 shrink-0" />APK diperiksa checksum,
            identitas aplikasi, versi, dan tanda tangannya.
          </p>
          <Button
            v-if="Capacitor.isNativePlatform()"
            class="min-h-11 gap-2"
            :disabled="busy"
            @click="install"
            ><Download class="size-4" />Unduh & pasang</Button
          >
          <p v-else class="text-sm text-muted-foreground">
            Gunakan aplikasi Android untuk memasang pembaruan.
          </p>
        </div>
      </section>
      <section class="rounded-[20px] border border-border bg-card p-5">
        <h2 class="mb-4 text-lg font-semibold">Changelog bawaan</h2>
        <pre
          class="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-muted-foreground"
          >{{ changelog }}</pre>
      </section>
    </div>
  </div>
</template>
