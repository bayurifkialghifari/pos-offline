import { getDb } from "@/db/sqlite"
import { SettingsRepository } from "@/repositories/settings.repo"
import { draftSchema, type CartDraft } from "@/services/cart-draft"
import { Capacitor } from "@capacitor/core"
import { ref, watch, type ComputedRef } from "vue"
import { z } from "zod"

export function usePersistedCart(
  state: ComputedRef<CartDraft>,
  restore: (draft: CartDraft) => void,
) {
  const draftError = ref("")
  const journalKey = "posoffline:pending-cart"
  const isWeb = Capacitor.getPlatform() === "web"
  let loaded = false
  let revision = 0
  let writes: Promise<void> = Promise.resolve()
  async function loadDraft() {
    let pending: string | null = null
    try {
      if (isWeb) pending = localStorage.getItem(journalKey)
    } catch (error) {
      if (!(error instanceof DOMException)) throw error
      draftError.value = "Jurnal keranjang tidak tersedia: " + error.message
    }
    const raw =
      pending ?? (await new SettingsRepository(getDb()).get("active_cart"))
    if (raw) {
      try {
        restore(draftSchema.parse(JSON.parse(raw)))
      } catch (error) {
        if (error instanceof z.ZodError || error instanceof SyntaxError)
          draftError.value =
            "Keranjang tersimpan tidak valid. Data transaksi tetap aman."
        else throw error
      }
    }
    loaded = true
    if (pending && !draftError.value) await flushDraft()
  }
  function flushDraft(): Promise<void> {
    const raw = JSON.stringify(state.value)
    const writeRevision = ++revision
    try {
      if (isWeb) localStorage.setItem(journalKey, raw)
    } catch (error) {
      if (!(error instanceof DOMException)) throw error
      draftError.value = "Jurnal keranjang gagal disimpan: " + error.message
    }
    writes = writes.then(async () => {
      try {
        await new SettingsRepository(getDb()).set("active_cart", raw)
        if (
          isWeb &&
          revision === writeRevision &&
          localStorage.getItem(journalKey) === raw
        )
          localStorage.removeItem(journalKey)
        draftError.value = ""
      } catch (error) {
        draftError.value =
          "Keranjang gagal disimpan: " +
          (error instanceof Error ? error.message : "Kesalahan penyimpanan")
      }
    })
    return writes
  }
  watch(
    state,
    () => {
      if (loaded) void flushDraft()
    },
    { deep: true, flush: "sync" },
  )
  return { draftError, loadDraft, flushDraft }
}
