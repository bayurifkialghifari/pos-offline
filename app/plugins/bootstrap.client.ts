import { defineNuxtPlugin } from "#app"
import { initDb } from "@/db/sqlite"
import { registerCapabilities } from "@/services/capabilities/bootstrap"
import { useCartStore } from "@/stores/cart"
import { usePrinterStore } from "@/stores/printer"
import { useSettingsStore } from "@/stores/settings"
import { useUnitsStore } from "@/stores/units"
export default defineNuxtPlugin(async () => {
  await initDb()
  registerCapabilities()
  await useSettingsStore().load()
  await useUnitsStore().load()
  await usePrinterStore().load()
  await useCartStore().loadDraft()
})
