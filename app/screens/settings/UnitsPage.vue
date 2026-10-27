<script setup lang="ts">
import { Button } from "@/components/atoms/ui/button"
import AppHeader from "@/components/organisms/layout/AppHeader.vue"
import { useUnitsStore } from "@/stores/units"
import { ref } from "vue"
const units = useUnitsStore()
const label = ref(""),
  symbol = ref(""),
  factor = ref("1"),
  dimension = ref<"count" | "weight" | "volume">("count"),
  busy = ref(false),
  error = ref("")
const dimensions = { count: "Jumlah", weight: "Berat", volume: "Volume" }
async function create() {
  if (busy.value) return
  busy.value = true
  error.value = ""
  try {
    await units.create({
      label: label.value,
      symbol: symbol.value,
      dimension: dimension.value,
      factor: Number(factor.value),
      active: 1,
    })
    label.value = ""
    symbol.value = ""
    factor.value = "1"
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Satuan gagal disimpan"
  } finally {
    busy.value = false
  }
}
async function toggle(id: string) {
  error.value = ""
  try {
    await units.toggle(units.byId(id))
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Satuan gagal diubah"
  }
}
</script>
<template>
  <div class="pb-8">
    <AppHeader
      title="Satuan produk"
      subtitle="Jumlah, berat, dan volume"
      back
    />
    <div class="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
      <section class="rounded-[20px] border border-border bg-card p-5">
        <h1 class="text-lg font-semibold">Satuan tersedia</h1>
        <p class="mt-2 text-sm text-muted-foreground">
          Stok disimpan sebagai buah, gram, atau mililiter. Satuan nonaktif
          tetap terbaca pada riwayat. Konversi satuan yang pernah dipakai tidak
          diubah.
        </p>
        <div
          v-for="unit in units.items"
          :key="unit.id"
          class="flex items-center justify-between gap-3 border-b border-border py-4 last:border-0"
        >
          <div>
            <p class="font-medium">
              {{ unit.label }}
              <span class="text-muted-foreground">({{ unit.symbol }})</span>
            </p>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ dimensions[unit.dimension] }} · 1 {{ unit.symbol }} =
              {{ unit.factor }}
              {{
                unit.dimension === "weight"
                  ? "gram"
                  : unit.dimension === "volume"
                    ? "ml"
                    : "buah"
              }}
            </p>
          </div>
          <button
            class="min-h-11 rounded-xl bg-muted px-3 text-sm font-medium"
            @click="toggle(unit.id)"
          >
            {{ unit.active ? "Nonaktifkan" : "Aktifkan" }}
          </button>
        </div>
      </section>
      <form
        class="space-y-4 rounded-[20px] border border-border bg-card p-5"
        @submit.prevent="create"
      >
        <h2 class="text-lg font-semibold">Tambah satuan</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="space-y-2 text-sm"
            >Nama<input
              v-model="label"
              required
              maxlength="40"
              class="block min-h-11 w-full rounded-xl border bg-background px-3"
              placeholder="Contoh: Gram" /></label
          ><label class="space-y-2 text-sm"
            >Simbol<input
              v-model="symbol"
              required
              pattern="[A-Za-z0-9]+"
              maxlength="12"
              class="block min-h-11 w-full rounded-xl border bg-background px-3"
              placeholder="Contoh: g" /></label
          ><label class="space-y-2 text-sm"
            >Jenis<select
              v-model="dimension"
              class="block min-h-11 w-full rounded-xl border bg-background px-3"
            >
              <option value="count">Jumlah (buah)</option>
              <option value="weight">Berat (gram)</option>
              <option value="volume">Volume (ml)</option>
            </select></label
          ><label class="space-y-2 text-sm"
            >Konversi ke satuan dasar<input
              v-model="factor"
              required
              type="number"
              min="1"
              max="1000000"
              step="1"
              class="block min-h-11 w-full rounded-xl border bg-background px-3"
            /><span class="block text-muted-foreground"
              >Contoh: lusin = 12 buah, kg = 1000 gram</span
            ></label
          >
        </div>
        <p v-if="error" role="alert" class="text-sm text-destructive">
          {{ error }}
        </p>
        <Button class="min-h-11" :disabled="busy">Simpan satuan</Button>
      </form>
    </div>
  </div>
</template>
