import { registerPlugin } from "@capacitor/core"

export interface NativePrinter {
  id: string
  name: string
}

export interface ThermalPrinterPlugin {
  listBluetooth(): Promise<{ printers: NativePrinter[] }>

  listUsb(): Promise<{ printers: NativePrinter[] }>

  print(options: {
    connection: "bluetooth" | "usb"
    id: string
    data: string
  }): Promise<void>
}

export const ThermalPrinterNative =
  registerPlugin<ThermalPrinterPlugin>("ThermalPrinter")
