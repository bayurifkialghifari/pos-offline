<script setup lang="ts">
import { formatRupiah } from "@/lib/money"
import { computed, ref } from "vue"
const props = defineProps<{
  categories: readonly string[]
  series: readonly { name: string; data: readonly number[] }[]
}>()
const selected = ref<number | null>(null)
const maximum = computed(() =>
  Math.max(1, ...props.series.flatMap((s) => s.data)),
)
const colors = computed(() => [
  props.series[0]?.name === "Pemasukan" ? "var(--success)" : "var(--info)",
  "var(--destructive)",
])
const points = computed(() =>
  props.series.map((series) =>
    series.data
      .map(
        (v, i) =>
          40 +
          (i * 720) / Math.max(1, props.categories.length - 1) +
          "," +
          (210 - (v / maximum.value) * 175),
      )
      .join(" "),
  ),
)
const displayIndex = computed(() =>
  Math.min(
    selected.value ?? props.categories.length - 1,
    props.categories.length - 1,
  ),
)
function compact(value: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}
</script>
<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span class="text-muted-foreground">{{
        categories[displayIndex] || "Belum ada data"
      }}</span>
      <div class="flex flex-wrap gap-4">
        <span
          v-for="(line, i) in series"
          :key="line.name"
          class="flex items-center gap-2"
          ><span
            class="size-2 rounded-full"
            :style="{ background: colors[i % colors.length] }"
          />{{ line.name }}
          <strong class="tabular-nums">{{
            formatRupiah(line.data[displayIndex] ?? 0)
          }}</strong></span
        >
      </div>
    </div>
    <svg
      viewBox="0 0 800 250"
      class="w-full"
      role="img"
      aria-label="Grafik nominal per periode. Pilih tanggal di bawah grafik untuk melihat nilai."
    >
      <g v-for="tick in [0, 0.5, 1]" :key="tick">
        <line
          x1="40"
          x2="760"
          :y1="210 - tick * 175"
          :y2="210 - tick * 175"
          stroke="var(--border)"
          stroke-dasharray="4 4"
        />
        <text
          x="40"
          :y="200 - tick * 175"
          fill="var(--muted-foreground)"
          font-size="12"
        >
          {{ compact(maximum * tick) }}
        </text>
      </g>
      <polyline
        v-for="(line, i) in points"
        :key="i"
        :points="line"
        fill="none"
        :stroke="colors[i % colors.length]"
        stroke-width="3"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      <text x="40" y="240" fill="var(--muted-foreground)" font-size="12">
        {{ categories[0] }}
      </text>
      <text
        x="760"
        y="240"
        text-anchor="end"
        fill="var(--muted-foreground)"
        font-size="12"
      >
        {{ categories.at(-1) }}
      </text>
    </svg>
    <label
      class="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"
      >Lihat tanggal
      <select
        class="min-h-11 rounded-xl border border-border bg-background px-3 text-foreground"
        :value="displayIndex"
        @change="selected = Number(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="(date, i) in categories" :key="i" :value="i">
          {{ date }}
        </option>
      </select>
    </label>
  </div>
</template>
