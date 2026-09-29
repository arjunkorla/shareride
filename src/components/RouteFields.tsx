import { useState } from 'react'
import type { SearchQuery } from '../types'
import LocationPickerSheet from './LocationPickerSheet'

interface Props {
  query: SearchQuery
  onChange: (patch: Partial<SearchQuery>) => void
}

const SwapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 3V13M4 13L1.5 10.5M4 13L6.5 10.5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 13V3M12 3L9.5 5.5M12 3L14.5 5.5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Shared Pickup/Drop-off editor — used verbatim by both HomeScreen's search
// card and SearchScreen, so the two never drift into separate
// implementations. Visual hierarchy uses filled dot -> line -> outlined
// square (not color alone) to distinguish Pickup from Drop-off.
export default function RouteFields({ query, onChange }: Props) {
  const [activeField, setActiveField] = useState<'pickup' | 'dropoff' | null>(null)

  const swap = () => {
    onChange({
      pickup: query.dropoff,
      pickupSubtitle: query.dropoffSubtitle,
      dropoff: query.pickup,
      dropoffSubtitle: query.pickupSubtitle,
    })
  }

  return (
    <div className="relative flex items-stretch gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-1">
      {/* Route markers: filled dot (pickup) -> line -> outlined square (drop-off) */}
      <div className="flex flex-col items-center py-3.5 flex-shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-sr-blue" aria-hidden />
        <div className="w-0.5 flex-1 bg-slate-300 my-1" style={{ minHeight: 20 }} aria-hidden />
        <div className="w-2.5 h-2.5 rounded-[2px] border-2 border-sr-red bg-white" aria-hidden />
      </div>

      <div className="flex-1 divide-y divide-slate-100">
        <button
          onClick={() => setActiveField('pickup')}
          aria-label="Pickup location"
          className="w-full text-left py-2.5"
          style={{ minHeight: 44 }}
        >
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Pickup</div>
          <div className={`text-sm font-semibold truncate ${query.pickup ? 'text-slate-900' : 'text-slate-400 font-normal'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
            {query.pickup || 'Current location or search…'}
          </div>
        </button>
        <button
          onClick={() => setActiveField('dropoff')}
          aria-label="Where are you going?"
          className="w-full text-left py-2.5"
          style={{ minHeight: 44 }}
        >
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Where are you going?</div>
          <div className={`text-sm font-semibold truncate ${query.dropoff ? 'text-slate-900' : 'text-slate-400 font-normal'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
            {query.dropoff || 'Search destination…'}
          </div>
        </button>
      </div>

      <div className="flex items-center flex-shrink-0">
        <button
          onClick={swap}
          aria-label="Swap pickup and drop-off"
          className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center active:scale-95 transition-transform"
        >
          <SwapIcon />
        </button>
      </div>

      <LocationPickerSheet
        open={activeField === 'pickup'}
        label="Pickup location"
        onClose={() => setActiveField(null)}
        onSelect={(name, subtitle) => { onChange({ pickup: name, pickupSubtitle: subtitle }); setActiveField(null) }}
      />
      <LocationPickerSheet
        open={activeField === 'dropoff'}
        label="Where are you going?"
        onClose={() => setActiveField(null)}
        onSelect={(name, subtitle) => { onChange({ dropoff: name, dropoffSubtitle: subtitle }); setActiveField(null) }}
      />
    </div>
  )
}
