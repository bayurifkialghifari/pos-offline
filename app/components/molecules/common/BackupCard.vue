<script setup lang="ts">
import {
  ArrowUpRight,
  DatabaseBackup,
  HardDriveDownload,
} from "lucide-vue-next"
import { RouterLink } from "vue-router"
</script>
<template>
  <section aria-labelledby="backup-heading" class="space-y-3">
    <h2 id="backup-heading" class="text-base font-semibold">Cadangkan data</h2>
    <div class="rounded-3xl border border-border bg-card p-5 md:p-6">
      <div class="flex items-start gap-4">
        <div
          class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-info"
        >
          <DatabaseBackup aria-hidden="true" class="size-6" />
        </div>
        <div class="min-w-0">
          <h3 class="font-semibold">Data siap dibawa ke perangkat baru</h3>
          <p
            class="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground"
          >
            Simpan produk, satuan, foto, transaksi, dan arus kas dalam satu
            file. Impor kembali saat pindah perangkat.
          </p>
        </div>
      </div>
      <RouterLink
        to="/settings/backup"
        class="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 sm:w-fit"
      >
        <HardDriveDownload aria-hidden="true" class="size-4" /> Cadangkan data
        <ArrowUpRight aria-hidden="true" class="size-4" />
      </RouterLink>
    </div>
  </section>
</template>
