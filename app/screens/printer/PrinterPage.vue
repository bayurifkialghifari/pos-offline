<script setup lang="ts">
import { Badge } from "@/components/atoms/ui/badge"
import { Button } from "@/components/atoms/ui/button"
import { Card, CardContent } from "@/components/atoms/ui/card"
import AppHeader from "@/components/organisms/layout/AppHeader.vue"
import { formatDateTime, nowMs } from "@/lib/datetime"
import type {
  DiscoveredPrinter,
  PrinterConnection,
} from "@/services/capabilities/printers/transport"
import type { PrinterCapability } from "@/services/capabilities/registry"
import { capabilities } from "@/services/capabilities/registry"
import { usePrinterStore } from "@/stores/printer"
import { Capacitor } from "@capacitor/core"
import {
  Bluetooth,
  Check,
  CheckCircle2,
  Loader2,
  Printer,
  RefreshCw,
  Trash2,
  Usb,
  XCircle,
} from "lucide-vue-next"
import { storeToRefs } from "pinia"
import { onMounted, ref } from "vue"

const isNative = Capacitor.isNativePlatform()
const printer = usePrinterStore()
const {
  connection,
  deviceName,
  paperWidth,
  devices,
  scanning,
  error,
  transportAvailable,
  supportedConnections,
  selected,
} = storeToRefs(printer)

const cap = ref<PrinterCapability | null>(null)
const canPrint = ref(false)
const printing = ref(false)
const message = ref("")

const CONN_META: Record<PrinterConnection, { label: string; icon: unknown }> = {
  bluetooth: { label: "Bluetooth", icon: Bluetooth },
  usb: { label: "USB", icon: Usb },
}

const activeConn = ref<PrinterConnection>("bluetooth")

onMounted(async () => {
  cap.value = capabilities.get<PrinterCapability>("printer")
  await printer.load()
  const firstConnection = supportedConnections.value[0]
  if (firstConnection) activeConn.value = firstConnection
  await refreshCanPrint()
})

async function refreshCanPrint() {
  canPrint.value = await capabilities.has("printer")
}

async function scan(conn: PrinterConnection) {
  activeConn.value = conn
  await printer.scan(conn)
}

async function pick(d: DiscoveredPrinter) {
  await printer.select(d)
  await refreshCanPrint()
}

async function forget() {
  await printer.clear()
  await refreshCanPrint()
}

async function testPrint() {
  if (!cap.value || printing.value) return
  printing.value = true
  message.value = ""
  const w = paperWidth.value
  try {
    await cap.value.print({
      title: "Test Print",
      lines: [
        { text: "POS KACAW", align: "center", bold: true, size: "large" },
        { text: "Struk Percobaan", align: "center" },
        { text: "" },
        { text: formatDateTime(nowMs()), align: "center" },
        { text: "-".repeat(w), align: "center" },
        { text: "Printer berfungsi", align: "center" },
      ],
    })
    message.value = "Perintah cetak terkirim."
  } catch (e) {
    message.value = e instanceof Error ? e.message : "Gagal mencetak."
  } finally {
    printing.value = false
  }
}
</script>

<template>
  <div>
    <AppHeader title="Printer" back />
    <div class="space-y-4 p-4">
      <Card>
        <CardContent class="flex items-center gap-3 p-4">
          <div
            class="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-foreground"
          >
            <Printer class="size-5" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold">
              {{
                isNative ? "Printer Thermal (ESC/POS)" : "Preview Web Printer"
              }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{
                isNative
                  ? selected
                    ? deviceName
                    : "Belum ada printer dipilih"
                  : "Cetak via dialog browser"
              }}
            </p>
          </div>
          <Badge :variant="canPrint ? 'success' : 'secondary'" class="gap-1">
            <CheckCircle2 v-if="canPrint" class="size-3" />
            <XCircle v-else class="size-3" />
            {{ canPrint ? "Siap" : "Belum siap" }}
          </Badge>
        </CardContent>
      </Card>

      <template v-if="isNative">
        <Card v-if="!transportAvailable">
          <CardContent class="space-y-1 p-4">
            <p class="text-sm font-semibold">
              Transport printer belum terpasang
            </p>
            <p class="text-xs text-muted-foreground">
              Layer software (encoder ESC/POS + pemilihan device) sudah siap.
              Plugin koneksi Bluetooth/USB akan diaktifkan pada update
              berikutnya — setelah itu tombol pindai & cetak di sini langsung
              berfungsi tanpa ubah alur.
            </p>
          </CardContent>
        </Card>

        <template v-else>
          <div class="flex gap-2">
            <Button
              v-for="c in supportedConnections"
              :key="c"
              :variant="activeConn === c ? 'default' : 'outline'"
              size="sm"
              class="flex-1 gap-1.5"
              :disabled="scanning"
              @click="scan(c)"
            >
              <component :is="CONN_META[c].icon" class="size-4" />
              {{ CONN_META[c].label }}
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="scanning"
              @click="scan(activeConn)"
            >
              <Loader2 v-if="scanning" class="size-4 animate-spin" />
              <RefreshCw v-else class="size-4" />
            </Button>
          </div>

          <p v-if="error" class="px-1 text-xs text-destructive">{{ error }}</p>

          <div
            v-if="devices.length"
            class="overflow-hidden rounded-xl border border-border"
          >
            <button
              v-for="d in devices"
              :key="d.id"
              type="button"
              class="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left last:border-0 transition active:bg-accent"
              @click="pick(d)"
            >
              <component
                :is="CONN_META[d.connection].icon"
                class="size-4 text-muted-foreground"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ d.name }}</p>
                <p class="truncate text-xs text-muted-foreground">{{ d.id }}</p>
              </div>
              <Check
                v-if="selected?.id === d.id"
                class="size-4 text-foreground"
              />
            </button>
          </div>

          <Card v-if="selected">
            <CardContent class="flex items-center gap-3 p-4">
              <component
                :is="CONN_META[connection ?? 'bluetooth'].icon"
                class="size-5 text-foreground"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ deviceName }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ CONN_META[connection ?? "bluetooth"].label }}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                class="text-destructive"
                @click="forget"
              >
                <Trash2 class="size-4" />
              </Button>
            </CardContent>
          </Card>

          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">Lebar kertas</span>
            <div class="ml-auto flex gap-1.5">
              <Button
                :variant="paperWidth === 32 ? 'default' : 'outline'"
                size="sm"
                @click="printer.setWidth(32)"
                >58mm</Button
              >
              <Button
                :variant="paperWidth === 48 ? 'default' : 'outline'"
                size="sm"
                @click="printer.setWidth(48)"
                >80mm</Button
              >
            </div>
          </div>
        </template>
      </template>

      <Button
        class="w-full"
        size="lg"
        :disabled="!canPrint || printing"
        @click="testPrint"
      >
        <Loader2 v-if="printing" class="mr-1.5 size-4 animate-spin" />
        Test Print Struk
      </Button>
      <p v-if="message" class="px-1 text-center text-xs text-muted-foreground">
        {{ message }}
      </p>

      <p v-if="!isNative" class="px-1 text-xs text-muted-foreground">
        Di Android, printer thermal (Bluetooth/USB) akan tampil di sini untuk
        dipindai & dipilih. Di web, cetak memakai dialog browser sebagai
        preview.
      </p>
    </div>
  </div>
</template>
