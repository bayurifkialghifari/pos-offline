import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.karuhundeveloper.posoffline",
  appName: "POS Offline",
  webDir: ".output/public",
  android: { allowMixedContent: false },
}
export default config
