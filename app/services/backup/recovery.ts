import { Capacitor } from "@capacitor/core"
import { Directory, Filesystem } from "@capacitor/filesystem"
import { BackupError, fromBase64, toBase64 } from "./archive"
const PATH = "recovery/latest.posbackup.zip"
export async function saveRecovery(bytes: Uint8Array): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: PATH,
      data: toBase64(bytes),
      directory: Directory.Data,
      recursive: true,
    })
    return
  }
  await webRecovery("write", bytes)
}
export async function readRecovery(): Promise<Uint8Array | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Filesystem.stat({ path: PATH, directory: Directory.Data })
    } catch (error) {
      if (
        error instanceof Error &&
        /not exist|not found|ENOENT/i.test(error.message)
      )
        return null
      throw error
    }
    const file = await Filesystem.readFile({
      path: PATH,
      directory: Directory.Data,
    })
    if (typeof file.data !== "string")
      throw new BackupError("Cadangan pemulihan tidak bisa dibaca")
    return fromBase64(file.data)
  }
  return webRecovery("read")
}
function webRecovery(
  mode: "read" | "write",
  bytes?: Uint8Array,
): Promise<Uint8Array | null> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open("pos-offline-recovery", 1)
    open.onupgradeneeded = () => open.result.createObjectStore("copies")
    open.onerror = () =>
      reject(new BackupError("Penyimpanan cadangan pemulihan gagal"))
    open.onsuccess = () => {
      const db = open.result,
        tx = db.transaction(
          "copies",
          mode === "write" ? "readwrite" : "readonly",
        )
      let result: Uint8Array | null = null
      if (mode === "write") tx.objectStore("copies").put(bytes, "latest")
      else {
        const request = tx.objectStore("copies").get("latest")
        request.onsuccess = () => {
          if (request.result instanceof Uint8Array) result = request.result
        }
      }
      tx.oncomplete = () => {
        db.close()
        resolve(result)
      }
      tx.onabort = () => {
        db.close()
        reject(new BackupError("Cadangan pemulihan tidak berhasil disimpan"))
      }
      tx.onerror = () =>
        reject(new BackupError("Penyimpanan cadangan pemulihan gagal"))
    }
  })
}
