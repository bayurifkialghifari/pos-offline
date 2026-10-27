import { getDb } from "@/db/sqlite"
import { SettingsRepository } from "@/repositories/settings.repo"
import { draftSchema, type CartDraft } from "@/services/cart-draft"
import { ref, watch, type ComputedRef } from "vue"
import { z } from "zod"

export function usePersistedCart(
  state: ComputedRef<CartDraft>,
  restore: (draft: CartDraft) => void,
) {
  const draftError = ref("")
  let loaded = false
  let writes: Promise<void> = Promise.resolve()
  async function loadDraft() {
    const raw = await new SettingsRepository(getDb()).get("active_cart")
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
  }
  function flushDraft(): Promise<void> {
    const raw = JSON.stringify(state.value)
    writes = writes.then(async () => {
      try {
        await new SettingsRepository(getDb()).set("active_cart", raw)
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
