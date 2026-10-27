export interface Capability {
  readonly id: string
  isAvailable(): Promise<boolean>
}

export interface ReceiptLine {
  text: string
  align?: "left" | "center" | "right"
  bold?: boolean
  size?: "normal" | "large"
}

export interface ReceiptJob {
  title: string
  lines: ReceiptLine[]

  html?: string
}

export interface PrinterDevice {
  id: string
  name: string
}

export interface PrinterCapability extends Capability {
  readonly id: "printer"
  print(job: ReceiptJob): Promise<void>
  listDevices?(): Promise<PrinterDevice[]>
}

export interface ScanResult {
  value: string

  format: string
}

export interface ScannerSession {
  stop(): Promise<void>
  setTorch(on: boolean): Promise<void>
  readonly torchAvailable: boolean
}

export interface ScannerStartOptions {
  mount: HTMLElement
  onScan: (result: ScanResult) => void
  onError?: (err: Error) => void
}

export interface ScannerCapability extends Capability {
  readonly id: "scanner"

  readonly rendersBehindWebview: boolean
  start(opts: ScannerStartOptions): Promise<ScannerSession>
}

export class CapabilityRegistry {
  private caps = new Map<string, Capability>()

  register<T extends Capability>(cap: T): void {
    this.caps.set(cap.id, cap)
  }

  get<T extends Capability>(id: string): T | null {
    return (this.caps.get(id) as T) ?? null
  }

  async has(id: string): Promise<boolean> {
    const cap = this.caps.get(id)
    return cap ? cap.isAvailable() : false
  }
}

export const capabilities = new CapabilityRegistry()
