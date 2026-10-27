import { makePinHash, verifyPin } from "@/lib/crypto"
import { useSettingsStore } from "@/stores/settings"
import { defineStore } from "pinia"
import { computed, ref } from "vue"

export const useAuthStore = defineStore("auth", () => {
  const settings = useSettingsStore()
  const unlocked = ref(false)

  const isLocked = computed(
    () => settings.loginEnabled && settings.hasPin && !unlocked.value,
  )

  async function verify(pin: string): Promise<boolean> {
    const ok = await verifyPin(pin, settings.pinHash)
    if (ok) unlocked.value = true
    return ok
  }

  async function setPin(pin: string): Promise<void> {
    await settings.setPinHash(await makePinHash(pin))
    unlocked.value = true
  }

  async function enableLogin(): Promise<void> {
    await settings.setLoginEnabled(true)
  }

  async function disableLogin(): Promise<void> {
    await settings.setLoginEnabled(false)
    await settings.setPinHash(null)
    unlocked.value = false
  }

  function lock(): void {
    unlocked.value = false
  }

  return { unlocked, isLocked, verify, setPin, enableLogin, disableLogin, lock }
})
