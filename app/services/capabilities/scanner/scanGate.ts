export interface ScanGate {
  accept(code: string): boolean
  reset(): void
}

export function createScanGate(
  opts: { sameCodeMs?: number; anyCodeMs?: number } = {},
): ScanGate {
  const sameCodeMs = opts.sameCodeMs ?? 1500
  const anyCodeMs = opts.anyCodeMs ?? 400

  let lastCode: string | null = null
  let lastCodeAt = 0
  let lastAcceptAt = 0

  return {
    accept(code: string): boolean {
      const now = Date.now()
      if (now - lastAcceptAt < anyCodeMs) return false
      if (code === lastCode && now - lastCodeAt < sameCodeMs) return false
      lastCode = code
      lastCodeAt = now
      lastAcceptAt = now
      return true
    },
    reset() {
      lastCode = null
      lastCodeAt = 0
      lastAcceptAt = 0
    },
  }
}

let audioCtx: AudioContext | null = null

export function scanFeedback(ok = true): void {
  try {
    navigator.vibrate?.(ok ? 40 : [30, 60, 30])
  } catch {
    // Optional feedback may be unavailable on a device; scanning continues.
  }
  try {
    if (!window.AudioContext) return
    audioCtx ??= new AudioContext()
    const ctx = audioCtx
    if (ctx.state === "suspended")
      void ctx.resume().catch(() => {
        // Audio requires a user gesture on some WebViews.
      })
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "square"
    osc.frequency.value = ok ? 1760 : 320
    gain.gain.setValueAtTime(0.06, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.13)
  } catch {
    // Optional feedback may be unavailable on a device; scanning continues.
  }
}
