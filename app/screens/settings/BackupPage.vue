<script setup lang="ts">
import { Button } from "@/components/atoms/ui/button"
import BottomSheet from "@/components/molecules/common/BottomSheet.vue"
import AppHeader from "@/components/organisms/layout/AppHeader.vue"
import { getDb } from "@/db/sqlite"
import { formatDateTime } from "@/lib/datetime"
import {
  BackupService,
  inspectBackup,
  type ValidatedBackup,
} from "@/services/backup/backup.service"
import { readRecovery } from "@/services/backup/recovery"
import { pickBackup, saveBackup } from "@/services/documents/documents"
import { useCartStore } from "@/stores/cart"
import {
  Download,
  FileArchive,
  RotateCcw,
  ShieldCheck,
  Upload,
} from "lucide-vue-next"
import { ref } from "vue"
const busy = ref(false),
  message = ref(""),
  error = ref(""),
  preview = ref<ValidatedBackup | null>(null),
  filename = ref(""),
  confirm = ref(false)
async function task(fn: () => Promise<void>) {
  if (busy.value) return
  busy.value = true
  error.value = ""
  message.value = ""
  try {
    await fn()
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Cadangan gagal diproses"
  } finally {
    busy.value = false
  }
}
function exportData() {
  return task(async () => {
    await useCartStore().flushDraft()
    const bytes = await new BackupService(getDb()).export()
    if (
      await saveBackup(
        "pos-offline-" +
          new Date().toISOString().slice(0, 10) +
          ".posbackup.zip",
        bytes,
      )
    )
      message.value = "Cadangan siap. Simpan salinan di tempat yang aman."
  })
}
function importData() {
  return task(async () => {
    const file = await pickBackup()
    if (!file) return
    preview.value = await inspectBackup(file.bytes)
    filename.value = file.name
    confirm.value = true
  })
}
function recovery() {
  return task(async () => {
    const bytes = await readRecovery()
    if (!bytes) {
      message.value =
        "Belum ada cadangan pemulihan. Cadangan dibuat sebelum setiap penggantian data."
      return
    }
    preview.value = await inspectBackup(bytes)
    filename.value = "Cadangan sebelum import terakhir"
    confirm.value = true
  })
}
function replace() {
  return task(async () => {
    if (!preview.value) return
    await new BackupService(getDb()).replace(preview.value)
    confirm.value = false
    window.location.assign("/")
  })
}
</script>
<template>
  <div class="pb-8">
    <AppHeader
      title="Cadangan data"
      subtitle="Pindahkan usaha ke perangkat lain"
      back
    />
    <div class="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
      <section class="rounded-[20px] bg-hero p-6 text-hero-foreground">
        <ShieldCheck class="size-8" />
        <h1 class="mt-4 text-2xl font-semibold">Data toko ada di tanganmu</h1>
        <p class="mt-3 text-sm leading-relaxed opacity-85">
          Satu file ZIP berisi produk, satuan, foto, transaksi, Open Bill, sesi
          kasir, arus kas, dan profil toko. PIN, identitas perangkat, serta
          pasangan printer tetap milik perangkat ini.
        </p>
      </section>
      <div class="grid gap-4 sm:grid-cols-2">
        <section class="rounded-[20px] border border-border bg-card p-5">
          <Download class="size-6" />
          <h2 class="mt-3 text-lg font-semibold">Simpan cadangan</h2>
          <p class="my-3 text-sm text-muted-foreground">
            Simpan ke penyimpanan perangkat atau folder pilihan. File ini berisi
            data usaha tanpa enkripsi.
          </p>
          <Button class="min-h-11 w-full" :disabled="busy" @click="exportData"
            >Ekspor semua data</Button
          >
        </section>
        <section class="rounded-[20px] border border-border bg-card p-5">
          <Upload class="size-6" />
          <h2 class="mt-3 text-lg font-semibold">Pindah perangkat</h2>
          <p class="my-3 text-sm text-muted-foreground">
            Pilih cadangan POS Offline. Aplikasi memeriksa versi, isi, foto, dan
            referensi sebelum menampilkan konfirmasi.
          </p>
          <Button
            variant="outline"
            class="min-h-11 w-full"
            :disabled="busy"
            @click="importData"
            >Pilih file cadangan</Button
          >
        </section>
      </div>
      <p class="text-sm text-muted-foreground">
        Batas file 64 MB, isi arsip 128 MB, dan satu foto 8 MB. Keranjang aktif
        tidak dipindahkan; tahan sebagai Open Bill jika perlu.
      </p>
      <p v-if="busy" role="status" class="font-medium">Memproses cadangan…</p>
      <p
        v-if="error"
        role="alert"
        class="rounded-xl bg-destructive/10 p-4 text-destructive"
      >
        {{ error }}
      </p>
      <p v-if="message" role="status" class="rounded-xl bg-muted p-4">
        {{ message }}
      </p>
      <button
        class="flex min-h-11 items-center gap-2 text-sm underline"
        :disabled="busy"
        @click="recovery"
      >
        <RotateCcw class="size-4" /> Pulihkan data sebelum import terakhir
      </button>
    </div>
    <BottomSheet v-model:open="confirm" title="Ganti data toko?">
      <div v-if="preview" class="space-y-4 p-5">
        <FileArchive class="size-8" />
        <p class="break-words font-semibold">{{ filename }}</p>
        <p class="text-sm text-muted-foreground">
          Dibuat {{ formatDateTime(preview.manifest.createdAt) }} · versi
          {{ preview.manifest.appVersion }}
        </p>
        <dl class="grid grid-cols-2 gap-2 text-sm">
          <dt>Produk</dt>
          <dd>
            {{
              preview.manifest.tables.products.filter(
                (p) => p.deleted_at === null,
              ).length
            }}
          </dd>
          <dt>Transaksi & Open Bill</dt>
          <dd>
            {{
              preview.manifest.tables.sales.filter((s) => s.deleted_at === null)
                .length
            }}
          </dd>
          <dt>Foto</dt>
          <dd>{{ preview.manifest.tables.media.length }}</dd>
        </dl>
        <p class="rounded-xl bg-muted p-4 text-sm">
          Seluruh data usaha saat ini akan diganti. Cadangan pemulihan disimpan
          dulu. Aplikasi akan memuat ulang setelah selesai.
        </p>
        <p v-if="error" role="alert" class="text-sm text-destructive">
          {{ error }}
        </p>
        <div class="flex gap-3">
          <Button
            variant="outline"
            class="min-h-11 flex-1"
            :disabled="busy"
            @click="confirm = false"
            >Batal</Button
          ><Button
            variant="destructive"
            class="min-h-11 flex-1"
            :disabled="busy"
            @click="replace"
            >Ganti semua data</Button
          >
        </div>
      </div>
    </BottomSheet>
  </div>
</template>
