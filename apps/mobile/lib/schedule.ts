// Converts post-ride.tsx's free-text Schedule step labels ("Today" /
// "Tomorrow" / a typed custom string, "08:00 AM" / a typed custom string)
// into the ISO date ("YYYY-MM-DD") and 24-hour time ("HH:mm") the API's
// createRideRequestSchema requires. RN has no native date/time picker (see
// components/DateTimeFields.tsx), so a hand-typed custom value is
// best-effort parsed with a sane fallback rather than rejected outright.

export function toPreferredDateISO(label: string): string {
  const today = new Date()
  if (label === 'Today') return today.toISOString().slice(0, 10)
  if (label === 'Tomorrow') {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().slice(0, 10)
  }
  const parsed = new Date(label)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)

  const fallback = new Date(today)
  fallback.setDate(fallback.getDate() + 1)
  return fallback.toISOString().slice(0, 10)
}

export function toTime24(label: string): string {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label.trim())
  if (!match) return '09:00'
  let hour = parseInt(match[1], 10)
  const minute = match[2]
  const period = match[3].toUpperCase()
  if (period === 'PM' && hour !== 12) hour += 12
  if (period === 'AM' && hour === 12) hour = 0
  return `${String(hour).padStart(2, '0')}:${minute}`
}

// The wizard only collects one preferred time, but a request needs a
// window — a placeholder one-hour range until there's a real "time range"
// step in the UI.
export function addOneHour(time24: string): string {
  const [hour, minute] = time24.split(':').map(Number)
  const totalMinutes = (hour * 60 + minute + 60) % (24 * 60)
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`
}
