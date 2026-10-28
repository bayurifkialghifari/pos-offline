import { APP_VERSION } from "@/lib/version"
import type { Release } from "@/services/updates/release"
import {
  checkUpdate,
  installedVersion,
  installUpdate,
} from "@/services/updates/updater"
import { computed, onMounted, ref } from "vue"

type UpdateState =
  | { readonly kind: "unchecked" }
  | { readonly kind: "checking" }
  | { readonly kind: "current" }
  | { readonly kind: "available"; readonly release: Release }
  | { readonly kind: "error"; readonly message: string }

export function useAppUpdate() {
  const version = ref(APP_VERSION)
  const versionError = ref("")
  const state = ref<UpdateState>({ kind: "unchecked" })
  const installing = ref(false)
  const installError = ref("")
  const message = ref("")
  const busy = computed(
    () => state.value.kind === "checking" || installing.value,
  )
  const release = computed(() =>
    state.value.kind === "available" ? state.value.release : null,
  )

  onMounted(async () => {
    try {
      version.value = await installedVersion()
    } catch (error) {
      versionError.value =
        error instanceof Error ? error.message : "Versi tidak bisa dibaca"
    }
  })

  async function check() {
    if (busy.value) return
    state.value = { kind: "checking" }
    installError.value = ""
    message.value = ""
    try {
      const latest = await checkUpdate()
      state.value = latest
        ? { kind: "available", release: latest }
        : { kind: "current" }
    } catch (error) {
      state.value = {
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Pemeriksaan gagal. Periksa koneksi dan coba lagi.",
      }
    }
  }

  async function install() {
    if (!release.value || busy.value) return
    installing.value = true
    installError.value = ""
    message.value = ""
    try {
      const status = await installUpdate(release.value)
      message.value =
        status === "permission_required"
          ? "Izinkan pemasangan dari aplikasi ini, lalu tekan Unduh & pasang lagi."
          : "Installer Android dibuka. Ikuti konfirmasi sistem untuk menyelesaikan pembaruan."
    } catch (error) {
      installError.value =
        error instanceof Error ? error.message : "Pembaruan gagal"
    } finally {
      installing.value = false
    }
  }

  return {
    version,
    versionError,
    state,
    busy,
    release,
    installing,
    installError,
    message,
    check,
    install,
  }
}
