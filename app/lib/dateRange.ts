import { dayKey, endOfDay, formatDate, nowMs, startOfDay } from "./datetime"

export type RangePreset = "today" | "yesterday" | "week" | "month" | "custom"

export interface DateRange {
  from: number
  to: number
  preset: RangePreset
}

export const PRESET_LABEL: Record<RangePreset, string> = {
  today: "Hari ini",
  yesterday: "Kemarin",
  week: "Minggu ini",
  month: "Bulan ini",
  custom: "Kustom",
}

export function presetRange(
  preset: Exclude<RangePreset, "custom">,
  now = nowMs(),
): DateRange {
  const d = new Date(now)
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now), preset }
    case "yesterday": {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      return {
        from: startOfDay(y.getTime()),
        to: endOfDay(y.getTime()),
        preset,
      }
    }
    case "week": {
      const offsetToMonday = (d.getDay() + 6) % 7
      const monday = new Date(now)
      monday.setDate(d.getDate() - offsetToMonday)
      return { from: startOfDay(monday.getTime()), to: endOfDay(now), preset }
    }
    case "month": {
      const first = new Date(d.getFullYear(), d.getMonth(), 1)
      return { from: startOfDay(first.getTime()), to: endOfDay(now), preset }
    }
  }
}

export function customRange(fromDay: string, toDay: string): DateRange {
  return {
    from: startOfDay(new Date(`${fromDay}T00:00:00`).getTime()),
    to: endOfDay(new Date(`${toDay}T00:00:00`).getTime()),
    preset: "custom",
  }
}

export function rangeLabel(r: DateRange): string {
  if (r.preset !== "custom") return PRESET_LABEL[r.preset]
  const f = dayKey(r.from)
  const t = dayKey(r.to)
  return f === t
    ? formatDate(r.from)
    : `${formatDate(r.from)} – ${formatDate(r.to)}`
}
