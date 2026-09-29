import { useState } from 'react'
import type { SearchQuery } from '../types'

interface Props {
  query: SearchQuery
  onChange: (patch: Partial<SearchQuery>) => void
}

const DATE_OPTIONS = ['Today', 'Tomorrow']
const TIME_OPTIONS: { label: string; range: string }[] = [
  { label: 'Any Time', range: 'Any Time' },
  { label: 'Morning', range: '6:00 AM – 11:00 AM' },
  { label: 'Afternoon', range: '11:00 AM – 4:00 PM' },
  { label: 'Evening', range: '4:00 PM – 9:00 PM' },
]

// Shared by Home (compact) and Search (full) — a reasonable time *range*
// is the default interaction; "Specific" is available but not forced.
export default function DateTimeFields({ query, onChange }: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showSpecificTime, setShowSpecificTime] = useState(false)

  const isCustomDate = !DATE_OPTIONS.includes(query.date)
  const isSpecificTime = !TIME_OPTIONS.some((t) => t.range === query.timeLabel) && query.timeLabel !== 'Any Time'

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Date</div>
        <div className="flex gap-2 flex-wrap">
          {DATE_OPTIONS.map((d) => (
            <Pill key={d} active={query.date === d} onClick={() => { onChange({ date: d }); setShowDatePicker(false) }}>
              {d}
            </Pill>
          ))}
          <Pill active={isCustomDate || showDatePicker} onClick={() => setShowDatePicker((v) => !v)}>
            📅 {isCustomDate ? query.date : 'Select Date'}
          </Pill>
        </div>
        {showDatePicker && (
          <input
            type="date"
            aria-label="Select date"
            autoFocus
            onChange={(e) => {
              if (!e.target.value) return
              const label = new Date(e.target.value).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
              onChange({ date: label })
              setShowDatePicker(false)
            }}
            className="mt-2 w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sr-blue"
          />
        )}
      </div>

      <div>
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Time</div>
        <div className="flex gap-2 flex-wrap">
          {TIME_OPTIONS.map((t) => (
            <Pill key={t.label} active={query.timeLabel === t.range} onClick={() => { onChange({ timeLabel: t.range }); setShowSpecificTime(false) }}>
              {t.label}
            </Pill>
          ))}
          <Pill active={isSpecificTime || showSpecificTime} onClick={() => setShowSpecificTime((v) => !v)}>
            🕐 {isSpecificTime ? query.timeLabel : 'Specific Time'}
          </Pill>
        </div>
        {showSpecificTime && (
          <input
            type="time"
            aria-label="Select specific time"
            autoFocus
            onChange={(e) => {
              if (!e.target.value) return
              onChange({ timeLabel: e.target.value })
              setShowSpecificTime(false)
            }}
            className="mt-2 w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sr-blue"
          />
        )}
      </div>
    </div>
  )
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 rounded-xl text-xs font-semibold border transition-all"
      style={{
        fontFamily: "'Outfit', sans-serif",
        minHeight: 40,
        background: active ? '#2563EB' : 'white',
        color: active ? 'white' : '#475569',
        borderColor: active ? '#2563EB' : '#E2E8F0',
      }}
    >
      {children}
    </button>
  )
}
