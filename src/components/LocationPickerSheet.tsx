import { useMemo, useState } from 'react'
import type { LocationSuggestion } from '../types'
import { hyderabadLocations, popularLocations, savedLocations, recentSearches } from '../mockData'

interface Props {
  open: boolean
  label: string
  onClose: () => void
  onSelect: (name: string, subtitle: string) => void
}

// Shared by Home's compact search card and the Search screen's Pickup/
// Drop-off fields — one implementation, one set of suggestion sources
// (current location, typed suggestions, recent, saved, popular), per the
// "same location/search component system" requirement.
export default function LocationPickerSheet({ open, label, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('')

  const suggestions = useMemo<LocationSuggestion[]>(() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()
    return hyderabadLocations.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 5)
  }, [query])

  const recentLocations = useMemo<LocationSuggestion[]>(() => {
    const seen = new Set<string>()
    const out: LocationSuggestion[] = []
    for (const s of recentSearches) {
      for (const name of [s.from, s.to]) {
        if (!seen.has(name)) {
          seen.add(name)
          out.push({ name, subtitle: 'Recent location' })
        }
      }
    }
    return out
  }, [])

  if (!open) return null

  const choose = (name: string, subtitle: string) => {
    onSelect(name, subtitle)
    setQuery('')
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl px-5 pt-5 pb-8 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '85vh' }}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4 flex-shrink-0" />

        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h3 className="text-base font-extrabold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{label}</h3>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-shrink-0 mb-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for an area, landmark…"
            aria-label={label}
            className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-sr-blue focus:ring-2 focus:ring-sr-blue-soft transition-all"
            style={{ fontFamily: "'Inter', sans-serif" }}
          />
        </div>

        <div className="overflow-y-auto hide-scrollbar flex-1">
          {query.trim() ? (
            <div className="space-y-1">
              {suggestions.length === 0 && (
                <p className="text-sm text-slate-400 py-4 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>No matches for "{query}"</p>
              )}
              {suggestions.map((s) => (
                <SuggestionRow key={s.name + s.subtitle} icon="📍" name={s.name} subtitle={s.subtitle} onClick={() => choose(s.name, s.subtitle)} />
              ))}
            </div>
          ) : (
            <>
              <button
                onClick={() => choose('Current Location', 'Using GPS')}
                className="w-full flex items-center gap-3 py-3 border-b border-slate-50 text-left"
                style={{ minHeight: 48 }}
              >
                <span className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-base flex-shrink-0">📡</span>
                <span className="text-sm font-semibold text-sr-blue" style={{ fontFamily: "'Outfit', sans-serif" }}>Use current location</span>
              </button>

              {savedLocations.length > 0 && (
                <Section title="Saved Places">
                  {savedLocations.map((s) => (
                    <SuggestionRow key={s.label} icon={s.label === 'Home' ? '🏠' : s.label === 'Work' ? '💼' : '📌'} name={s.label} subtitle={`${s.name} · ${s.subtitle}`} onClick={() => choose(s.name, s.subtitle)} />
                  ))}
                </Section>
              )}

              {recentLocations.length > 0 && (
                <Section title="Recent">
                  {recentLocations.map((s) => (
                    <SuggestionRow key={s.name} icon="🕐" name={s.name} subtitle={s.subtitle} onClick={() => choose(s.name, s.subtitle)} />
                  ))}
                </Section>
              )}

              <Section title="Popular Locations">
                <div className="flex flex-wrap gap-2 pt-1 pb-2">
                  {popularLocations.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => choose(s.name, s.subtitle)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-100 text-slate-700 hover:bg-slate-100 transition-colors"
                      style={{ fontFamily: "'Outfit', sans-serif", minHeight: 40 }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-3">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>{title}</p>
      {children}
    </div>
  )
}

function SuggestionRow({ icon, name, subtitle, onClick }: { icon: string; name: string; subtitle: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0 text-left" style={{ minHeight: 44 }}>
      <span className="w-8 text-center text-base flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-800 truncate" style={{ fontFamily: "'Outfit', sans-serif" }}>{name}</div>
        <div className="text-[11px] text-slate-400 truncate">{subtitle}</div>
      </div>
    </button>
  )
}
