export type PrinterConnection = "bluetooth" | "usb"

export interface DiscoveredPrinter {
  id: string
  name: string
  connection: PrinterConnection
}

export interface PrinterTarget {
  id: string
  connection: PrinterConnection
}

export interface PrinterTransport {
  readonly available: boolean

  readonly connections: PrinterConnection[]

  list(connection: PrinterConnection): Promise<DiscoveredPrinter[]>

  print(target: PrinterTarget, bytes: Uint8Array): Promise<void>
}

const nullTransport: PrinterTransport = {
  available: false,
  connections: [],
  async list() {
    return []
  },
  async print() {
    throw new Error("Transport printer belum terpasang di build ini.")
  },
}

let active: PrinterTransport = nullTransport

export function setPrinterTransport(t: PrinterTransport): void {
  active = t
}
export function getPrinterTransport(): PrinterTransport {
  return active
}

let selected: PrinterTarget | null = null
export function setSelectedPrinter(t: PrinterTarget | null): void {
  selected = t
}
export function getSelectedPrinter(): PrinterTarget | null {
  return selected
}
