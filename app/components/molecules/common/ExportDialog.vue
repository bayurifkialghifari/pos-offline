<script setup lang="ts">
import { Button } from "@/components/atoms/ui/button"
import BottomSheet from "@/components/molecules/common/BottomSheet.vue"
import DateRangeFilter from "@/components/molecules/common/DateRangeFilter.vue"
import { rangeLabel, type DateRange } from "@/lib/dateRange"
import { dayKey } from "@/lib/datetime"
import { exportXlsx, type ExportSheet } from "@/lib/xlsx"
import { FileSpreadsheet, Loader2 } from "lucide-vue-next"
import { ref, watch } from "vue"

const props = defineProps<{
  open: boolean
  title: string

  filenameBase: string

  initialRange: DateRange

  buildSheets: (range: DateRange) => Promise<ExportSheet[]>
}>()
const emit = defineEmits<{ "update:open": [value: boolean] }>()

const range = ref<DateRange>(props.initialRange)
const busy = ref(false)
const error = ref("")

watch(
  () => props.open,
  (v) => {
    if (v) {
      range.value = props.initialRange
      error.value = ""
      busy.value = false
    }
  },
)

function close() {
  if (busy.value) return
  emit("update:open", false)
}

async function run() {
  if (busy.value) return
  busy.value = true
  error.value = ""
  try {
    const sheets = await props.buildSheets(range.value)
    const rowCount = sheets.reduce((n, s) => n + s.rows.length, 0)
    if (rowCount === 0) {
      error.value = "Tidak ada data pada rentang ini."
      return
    }
    const name = `${props.filenameBase}-${dayKey(range.value.from)}_${dayKey(range.value.to)}.xlsx`
    await exportXlsx(name, sheets)
    emit("update:open", false)
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Gagal mengekspor."
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <BottomSheet :open="open" :title="title" @update:open="close">
    <div class="space-y-4 px-1 pb-5">
      <p class="px-4 pt-1 text-sm text-muted-foreground">
        Pilih rentang tanggal, lalu ekspor ke file Excel (.xlsx).
      </p>

      <DateRangeFilter
        :model-value="range"
        @update:model-value="range = $event"
      />

      <div class="px-4 text-sm">
        <span class="text-muted-foreground">Rentang: </span>
        <span class="font-medium">{{ rangeLabel(range) }}</span>
      </div>

      <p v-if="error" class="px-4 text-sm text-destructive">{{ error }}</p>

      <div class="flex gap-2 px-4">
        <Button variant="outline" class="flex-1" :disabled="busy" @click="close"
          >Batal</Button
        >
        <Button class="flex-1" :disabled="busy" @click="run">
          <Loader2 v-if="busy" class="mr-1.5 size-4 animate-spin" />
          <FileSpreadsheet v-else class="mr-1.5 size-4" />
          {{ busy ? "Menyiapkan…" : "Export Excel" }}
        </Button>
      </div>
    </div>
  </BottomSheet>
</template>
