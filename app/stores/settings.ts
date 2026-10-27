import { getDb } from "@/db/sqlite"
import { devicePrefixOf, deviceUuid } from "@/lib/uuid"
import { SettingsRepository } from "@/repositories/settings.repo"
import { defineStore } from "pinia"
import { computed, ref } from "vue"

export type SplashBg = "brand" | "light" | "dark"

const KEYS = {
  storeName: "store_name",
  storeOwner: "store_owner",
  storeLogo: "store_logo",
  loginEnabled: "login_enabled",
  pinHash: "pin_hash",
  deviceId: "device_id",
  theme: "theme",
  splashEnabled: "splash_enabled",
  splashBg: "splash_bg",
  qrisPayload: "qris_payload",
  qrisDynamic: "qris_dynamic",
} as const

export const useSettingsStore = defineStore("settings", () => {
  const loaded = ref(false)
  const storeName = ref("POS Offline")
  const storeOwner = ref("")
  const storeLogo = ref<string | null>(null)
  const loginEnabled = ref(false)
  const pinHash = ref<string | null>(null)
  const deviceId = ref("")
  const theme = ref<"light" | "dark">("light")
  const splashEnabled = ref(false)
  const splashBg = ref<SplashBg>("brand")
  const qrisPayload = ref<string | null>(null)
  const qrisDynamic = ref(false)

  const hasPin = computed(() => !!pinHash.value)

  const devicePrefix = computed(() => devicePrefixOf(deviceId.value))

  function repo() {
    return new SettingsRepository(getDb())
  }

  async function load() {
    const all = await repo().getAll()
    storeName.value = all[KEYS.storeName] || "POS Offline"
    storeOwner.value = all[KEYS.storeOwner] || ""
    storeLogo.value = all[KEYS.storeLogo] || null
    loginEnabled.value = all[KEYS.loginEnabled] === "1"
    pinHash.value = all[KEYS.pinHash] || null
    theme.value = all[KEYS.theme] === "dark" ? "dark" : "light"

    splashEnabled.value = all[KEYS.splashEnabled] === "1"
    const bg = all[KEYS.splashBg]
    splashBg.value = bg === "light" || bg === "dark" ? bg : "brand"
    qrisPayload.value = all[KEYS.qrisPayload] || null
    qrisDynamic.value = all[KEYS.qrisDynamic] === "1"

    deviceId.value = all[KEYS.deviceId] || ""
    if (!deviceId.value || deviceId.value.length < 36) {
      deviceId.value = deviceUuid()
      await repo().set(KEYS.deviceId, deviceId.value)
    }
    applyTheme()
    loaded.value = true
  }

  function applyTheme() {
    document.documentElement.classList.toggle("dark", theme.value === "dark")
  }

  async function setProfile(name: string, owner: string) {
    storeName.value = name
    storeOwner.value = owner
    await repo().setMany({ [KEYS.storeName]: name, [KEYS.storeOwner]: owner })
  }

  async function setLogo(ref_: string | null) {
    storeLogo.value = ref_
    await repo().set(KEYS.storeLogo, ref_ ?? "")
  }

  async function setSplash(opts: { enabled?: boolean; bg?: SplashBg }) {
    const patch: Record<string, string> = {}
    if (opts.enabled !== undefined) {
      splashEnabled.value = opts.enabled
      patch[KEYS.splashEnabled] = opts.enabled ? "1" : "0"
    }
    if (opts.bg !== undefined) {
      splashBg.value = opts.bg
      patch[KEYS.splashBg] = opts.bg
    }
    if (Object.keys(patch).length) await repo().setMany(patch)
  }

  async function setQris(payload: string | null) {
    qrisPayload.value = payload
    await repo().set(KEYS.qrisPayload, payload ?? "")

    if (!payload && qrisDynamic.value) await setQrisDynamic(false)
  }

  async function setQrisDynamic(enabled: boolean) {
    qrisDynamic.value = enabled
    await repo().set(KEYS.qrisDynamic, enabled ? "1" : "0")
  }

  async function setLoginEnabled(enabled: boolean) {
    loginEnabled.value = enabled
    await repo().set(KEYS.loginEnabled, enabled ? "1" : "0")
  }

  async function setPinHash(hash: string | null) {
    pinHash.value = hash
    await repo().set(KEYS.pinHash, hash ?? "")
  }

  async function toggleTheme() {
    theme.value = theme.value === "dark" ? "light" : "dark"
    applyTheme()
    await repo().set(KEYS.theme, theme.value)
  }

  return {
    loaded,
    storeName,
    storeOwner,
    storeLogo,
    loginEnabled,
    pinHash,
    deviceId,
    theme,
    splashEnabled,
    splashBg,
    qrisPayload,
    qrisDynamic,
    hasPin,
    devicePrefix,
    load,
    setProfile,
    setLogo,
    setSplash,
    setQris,
    setQrisDynamic,
    setLoginEnabled,
    setPinHash,
    toggleTheme,
  }
})
