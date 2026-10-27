import jsQR from "jsqr"
import QRCode from "qrcode"

export { crc16, isValidQris, makeDynamicPayload } from "./qris-payload"

export async function decodeQrFromDataUrl(
  dataUrl: string,
): Promise<string | null> {
  const img = await loadImage(dataUrl)
  const canvas = document.createElement("canvas")
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.drawImage(img, 0, 0)
  const { data, width, height } = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  )
  const result = jsQR(data, width, height)
  return result?.data ?? null
}

export function encodeQrToDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    margin: 1,
    width: 320,
    errorCorrectionLevel: "M",
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Gagal memuat gambar"))
    img.src = src
  })
}
