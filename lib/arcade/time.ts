/** Twelve-hour lighting preview. Bare hours default to AM; invalid input uses live time. */
export function previewHour(params: URLSearchParams): number | null {
  const raw = params.get("hour")?.trim().toLowerCase()
  if (!raw) return null
  const match = /^(\d{1,2}(?:\.\d+)?)\s*(am|pm)?$/.exec(raw)
  if (!match) return null
  const hour = Number(match[1])
  if (hour < 0 || hour > 12) return null
  const period = (match[2] ?? params.get("period") ?? "am").trim().toLowerCase()
  if (period !== "am" && period !== "pm") return null
  return (hour % 12) + (period === "pm" ? 12 : 0)
}

export function twelveHourLabel(hour: number): string {
  const total = Math.floor(hour * 60) % 1440
  const hours = Math.floor(total / 60)
  return `${hours % 12 || 12}:${String(total % 60).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`
}
