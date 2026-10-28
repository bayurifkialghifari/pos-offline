import { useHardwareBack } from "@/composables/useHardwareBack"
import { App, type BackButtonListener } from "@capacitor/app"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { onMounted } from "vue"

const router = vi.hoisted(() => ({
  currentRoute: { value: { name: "settings", path: "/settings" } },
  back: vi.fn(),
  replace: vi.fn(),
}))
vi.mock("vue-router", () => ({ useRouter: () => router }))
vi.mock("@capacitor/app", () => ({
  App: { addListener: vi.fn(), exitApp: vi.fn() },
}))
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true },
}))
vi.mock("vue", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue")>()),
  onMounted: vi.fn(),
  onUnmounted: vi.fn(),
}))

let back: BackButtonListener
const dialogs: EventTarget[] = []
class KeyEvent extends Event {
  readonly key: string
  constructor(type: string, init: KeyboardEventInit) {
    super(type, init)
    this.key = init.key ?? ""
  }
}

beforeEach(async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-10-28T02:00:00Z"))
  vi.clearAllMocks()
  dialogs.length = 0
  router.currentRoute.value = { name: "settings", path: "/settings" }
  vi.stubGlobal("window", { history: { state: { back: "/" } } })
  vi.stubGlobal("document", {
    querySelectorAll: () => ({
      length: dialogs.length,
      item: (index: number) => dialogs[index] ?? null,
    }),
  })
  vi.stubGlobal("KeyboardEvent", KeyEvent)
  vi.mocked(App.addListener).mockImplementation(async (_event, listener) => {
    back = listener
    return { remove: vi.fn() }
  })
  useHardwareBack()
  const mounted = vi.mocked(onMounted).mock.calls[0]?.[0]
  if (!mounted)
    throw new TypeError("Back listener lifecycle was not registered")
  await mounted()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it("dismisses the top dialog without navigating or exiting", () => {
  const lower = new EventTarget(),
    top = new EventTarget()
  const lowerKey = vi.fn(),
    topKey = vi.fn()
  lower.addEventListener("keydown", lowerKey)
  top.addEventListener("keydown", topKey)
  dialogs.push(lower, top)
  back({ canGoBack: true })
  expect(topKey.mock.calls[0]?.[0].key).toBe("Escape")
  expect(lowerKey).not.toHaveBeenCalled()
  expect(router.back).not.toHaveBeenCalled()
  expect(router.replace).not.toHaveBeenCalled()
  expect(App.exitApp).not.toHaveBeenCalled()
})

it("navigates back after the dialog has closed", () => {
  back({ canGoBack: true })
  expect(router.back).toHaveBeenCalledOnce()
})

it("keeps the root double-back exit and PIN lock behavior", () => {
  router.currentRoute.value = { name: "lock", path: "/lock" }
  back({ canGoBack: true })
  expect(router.back).not.toHaveBeenCalled()
  router.currentRoute.value = { name: "index", path: "/" }
  back({ canGoBack: true })
  expect(App.exitApp).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1000)
  back({ canGoBack: true })
  expect(App.exitApp).toHaveBeenCalledOnce()
})
