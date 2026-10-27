import { Capacitor } from "@capacitor/core"
import { CapacitorThermalTransport } from "./printers/capacitorThermalTransport"
import { ThermalPrinter } from "./printers/thermalPrinter"
import { setPrinterTransport } from "./printers/transport"
import { WebPreviewPrinter } from "./printers/webPreviewPrinter"
import { capabilities } from "./registry"
import { WebScanner } from "./scanner/webScanner"

export function registerCapabilities(): void {
  if (Capacitor.isNativePlatform()) {
    setPrinterTransport(new CapacitorThermalTransport())
    capabilities.register(new ThermalPrinter())
  } else {
    capabilities.register(new WebPreviewPrinter())
  }

  capabilities.register(new WebScanner())
}
