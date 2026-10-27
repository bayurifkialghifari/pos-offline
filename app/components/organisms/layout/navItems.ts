import {
  BarChart3,
  CalendarClock,
  Home,
  Package,
  Printer,
  Receipt,
  Settings,
  ShoppingCart,
  Wallet,
} from "lucide-vue-next"
import type { Component } from "vue"

export interface NavItem {
  to: string
  label: string
  icon: Component

  exact?: boolean

  primary?: boolean
}

export const navItems: NavItem[] = [
  { to: "/", label: "Home", icon: Home, exact: true, primary: true },
  { to: "/pos", label: "Kasir", icon: ShoppingCart, primary: true },
  { to: "/products", label: "Produk", icon: Package },
  { to: "/transactions", label: "Transaksi", icon: Receipt, primary: true },
  { to: "/cashflow", label: "Cashflow", icon: Wallet, primary: true },
  { to: "/reports", label: "Laporan", icon: BarChart3 },
  { to: "/cashier", label: "Sesi Kasir", icon: CalendarClock },
  { to: "/printer", label: "Printer", icon: Printer },
  { to: "/settings", label: "Akun", icon: Settings, primary: true },
]

export const primaryNavItems = navItems.filter((i) => i.primary)

export function isNavActive(path: string, item: NavItem): boolean {
  return item.exact ? path === item.to : path.startsWith(item.to)
}
