import type {
  ScannerCapability,
  ScannerSession,
  ScannerStartOptions,
} from "../registry"
import { getDetector, type Detector } from "./detector"

interface TorchCapabilities extends MediaTrackCapabilities {
  torch?: boolean
}

const DECODE_INTERVAL_MS = 100

export class WebScanner implements ScannerCapability {
  readonly id = "scanner" as const
  readonly rendersBehindWebview = false

  async isAvailable(): Promise<boolean> {
    return (
      typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia
    )
  }

  async start(opts: ScannerStartOptions): Promise<ScannerSession> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    })

    const video = document.createElement("video")
    video.autoplay = true
    video.muted = true
    video.playsInline = true
    video.setAttribute("playsinline", "")
    video.className = "size-full object-cover"
    video.srcObject = stream
    opts.mount.appendChild(video)
    await video.play().catch(() => undefined)

    const track = stream.getVideoTracks()[0]
    const caps = (track?.getCapabilities?.() ?? {}) as TorchCapabilities
    const torchAvailable = !!caps.torch

    const detector: Detector = await getDetector()

    let canvas: HTMLCanvasElement | null = null
    let ctx: CanvasRenderingContext2D | null = null
    if (detector.wantsCanvas) {
      canvas = document.createElement("canvas")
      ctx = canvas.getContext("2d", { willReadFrequently: true })
    }

    let stopped = false
    let rafId = 0
    let lastRun = 0
    let busy = false

    const loop = (ts: number) => {
      if (stopped) return
      rafId = requestAnimationFrame(loop)
      if (busy || ts - lastRun < DECODE_INTERVAL_MS) return
      if (video.readyState < 2 || !video.videoWidth) return
      lastRun = ts
      busy = true

      void (async () => {
        try {
          let source: HTMLVideoElement | HTMLCanvasElement = video
          if (canvas && ctx) {
            const w = video.videoWidth
            const h = Math.round(video.videoHeight * 0.4)
            const y = Math.round((video.videoHeight - h) / 2)
            if (canvas.width !== w || canvas.height !== h) {
              canvas.width = w
              canvas.height = h
            }
            ctx.drawImage(video, 0, y, w, h, 0, 0, w, h)
            source = canvas
          }
          const found = await detector.detect(source)
          if (!stopped && found.length) opts.onScan(found[0]!)
        } catch (err) {
          opts.onError?.(err instanceof Error ? err : new Error(String(err)))
        } finally {
          busy = false
        }
      })()
    }
    rafId = requestAnimationFrame(loop)

    return {
      torchAvailable,
      async setTorch(on: boolean) {
        if (!torchAvailable || !track) return
        try {
          await track.applyConstraints({
            advanced: [{ torch: on } as MediaTrackConstraintSet],
          })
        } catch (error) {
          opts.onError?.(
            error instanceof Error ? error : new Error(String(error)),
          )
        }
      },
      async stop() {
        if (stopped) return
        stopped = true
        cancelAnimationFrame(rafId)
        detector.close()
        for (const t of stream.getTracks()) t.stop()
        video.srcObject = null
        video.remove()
      },
    }
  }
}
