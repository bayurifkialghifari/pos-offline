<script setup lang="ts">
import BottomSheet from "@/components/molecules/common/BottomSheet.vue"
import CameraScanner from "@/components/organisms/pos/CameraScanner.vue"
import type { ScanResult } from "@/services/capabilities/registry"
import { scanFeedback } from "@/services/capabilities/scanner/scanGate"

defineProps<{ open: boolean; title?: string }>()
const emit = defineEmits<{
  "update:open": [value: boolean]
  scan: [code: string]
}>()

function onScan(r: ScanResult) {
  scanFeedback(true)
  emit("scan", r.value)
  emit("update:open", false)
}
</script>

<template>
  <BottomSheet
    :open="open"
    :title="title ?? 'Scan Barcode'"
    @update:open="emit('update:open', $event)"
  >
    <div class="p-4">
      <div class="h-64 overflow-hidden rounded-2xl">
        <CameraScanner
          v-if="open"
          hint="Arahkan barcode produk ke dalam kotak"
          @scan="onScan"
        />
      </div>
    </div>
  </BottomSheet>
</template>
