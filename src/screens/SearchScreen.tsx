import { useState } from 'react'
import RideCard from '../components/RideCard'
import RequestCard from '../components/RequestCard'
import RouteFields from '../components/RouteFields'
import DateTimeFields from '../components/DateTimeFields'
import { rides, passengerRequests, recentSearches } from '../mockData'
import type { Screen, SearchQuery } from '../types'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
  onSelectRide: (id: string) => void
  query: SearchQuery
  onQueryChange: (patch: Partial<SearchQuery>) => void
  onPostRide: () => void
}

type DiscoverTab = 'offered' | 'requests' | 'nearby'
type MatchCategory = 'all' | 'best-match' | 'closest-pickup' | 'verified' | 'instant'
type SortOption = 'best-match' | 'closest-pickup' | 'closest-dropoff' | 'earliest' | 'recent'

const matchCategories: { id: MatchCategory; label: string }[] = [
  { id: 'all', label: '✦ All' },
  { id: 'best-match', label: '🎯 Best Match' },
  { id: 'closest-pickup', label: '📍 Closest Pickup' },
  { id: 'verified', label: '✓ Verified' },
  { id: 'instant', label: '⚡ Instant' },
]

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'best-match', label: 'Best Match' },
  { id: 'closest-pickup', label: 'Closest Pickup' },
  { id: 'closest-dropoff', label: 'Closest Drop-off' },
  { id: 'earliest', label: 'Earliest Departure' },
  { id: 'recent', label: 'Recently Posted' },
]

const TIME_BUCKETS = ['Any Time', 'Morning', 'Afternoon', 'Evening']

function matchRank(m?: string) {
  return m === 'great' ? 0 : m === 'good' ? 1 : m === 'ok' ? 2 : 3
}
function proximityKm(p?: string) {
  return p ? parseFloat(p) : 999
}
function postedMinutesAgo(label?: string): number {
  const m = /^(\d+)\s*(min|h)/.exec(label ?? '')
  if (!m) return 9999
  return m[2] === 'h' ? Number(m[1]) * 60 : Number(m[1])
}

export default function SearchScreen({ onBack, onSelectRide, query, onQueryChange, onPostRide }: Props) {
  const [mode, setMode] = useState<'form' | 'results'>(query.pickup && query.dropoff ? 'results' : 'form')
  const [tab, setTab] = useState<DiscoverTab>('offered')
  const [category, setCategory] = useState<MatchCategory>('all')
  const [sort, setSort] = useState<SortOption>('best-match')
  const [showSort, setShowSort] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [minPrice, setMinPrice] = useState(50)
  const [maxPrice, setMaxPrice] = useState(500)
  const [pendingMin, setPendingMin] = useState(50)
  const [pendingMax, setPendingMax] = useState(500)
  const [priceFilterActive, setPriceFilterActive] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [pendingVerifiedOnly, setPendingVerifiedOnly] = useState(false)
  const [timeBucket, setTimeBucket] = useState('Any Time')
  const [pendingTimeBucket, setPendingTimeBucket] = useState('Any Time')
  const [amenityFilters, setAmenityFilters] = useState<Record<string, boolean>>({
    AC: false, 'Women Preferred': false, 'USB Charging': false,
    'Luggage Space': false, 'Pets OK': false, 'Silent Ride': false,
  })
  const [pendingAmenities, setPendingAmenities] = useState<Record<string, boolean>>({ ...amenityFilters })

  const openFilters = () => {
    setPendingMin(minPrice); setPendingMax(maxPrice)
    setPendingAmenities({ ...amenityFilters }); setPendingVerifiedOnly(verifiedOnly); setPendingTimeBucket(timeBucket)
    setShowFilters(true)
  }
  const applyFilters = () => {
    setMinPrice(pendingMin); setMaxPrice(pendingMax)
    setAmenityFilters(pendingAmenities); setVerifiedOnly(pendingVerifiedOnly); setTimeBucket(pendingTimeBucket)
    setPriceFilterActive(pendingMin > 50 || pendingMax < 500)
    setShowFilters(false)
  }
  const resetFilters = () => {
    setPendingMin(50); setPendingMax(500); setPendingVerifiedOnly(false); setPendingTimeBucket('Any Time')
    setPendingAmenities(Object.fromEntries(Object.keys(pendingAmenities).map((k) => [k, false])))
  }

  const filteredRides = rides
    .filter((r) => {
      if (category === 'best-match' && r.matchScore !== 'great') return false
      if (category === 'closest-pickup' && proximityKm(r.pickupProximity) > 1.5) return false
      if (category === 'verified' && !r.driver.verified) return false
      if (category === 'instant' && !r.instantBook) return false
      if (verifiedOnly && !r.driver.verified) return false
      if (r.price < minPrice || r.price > maxPrice) return false
      for (const [amenity, checked] of Object.entries(amenityFilters)) {
        if (checked && !r.amenities.includes(amenity)) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sort === 'closest-pickup' || sort === 'closest-dropoff') return proximityKm(a.pickupProximity) - proximityKm(b.pickupProximity)
      if (sort === 'earliest') return a.time.localeCompare(b.time)
      if (sort === 'recent') return postedMinutesAgo(a.postedAt) - postedMinutesAgo(b.postedAt)
      return matchRank(a.matchScore) - matchRank(b.matchScore)
    })

  const filteredRequests = passengerRequests
    .filter((r) => (verifiedOnly ? r.passenger.verified : true))
    .sort((a, b) => (sort === 'recent' ? postedMinutesAgo(a.postedAt) - postedMinutesAgo(b.postedAt) : matchRank(a.matchScore) - matchRank(b.matchScore)))

  const filtersActive = priceFilterActive || verifiedOnly || timeBucket !== 'Any Time' || Object.values(amenityFilters).some(Boolean)
  const noResults = (tab === 'offered' && filteredRides.length === 0) || (tab === 'requests' && filteredRequests.length === 0)

  const changeSearch = () => setMode('form')
  const clearFiltersAndSearch = () => { resetFilters(); setMinPrice(50); setMaxPrice(500); setVerifiedOnly(false); setTimeBucket('Any Time'); setCategory('all') }

  if (mode === 'form') {
    return (
      <div className="absolute inset-0 bg-white flex flex-col">
        <div className="flex items-center gap-3 px-4 border-b border-slate-100" style={{ paddingTop: 56, paddingBottom: 14 }}>
          <button onClick={onBack} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Search Rides</h2>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-4 space-y-5">
          <RouteFields query={query} onChange={onQueryChange} />
          <DateTimeFields query={query} onChange={onQueryChange} />

          {recentSearches.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Recent Searches</p>
              <div className="space-y-2">
                {recentSearches.map((s) => (
                  <button
                    key={s.from + s.to}
                    onClick={() => { onQueryChange({ pickup: s.from, pickupSubtitle: 'Hyderabad', dropoff: s.to, dropoffSubtitle: 'Hyderabad' }); setMode('results') }}
                    className="w-full flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 text-left"
                    style={{ minHeight: 48 }}
                  >
                    <span className="text-base">🕐</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>{s.from} → {s.to}</div>
                      <div className="text-[11px] text-slate-400">{s.date}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-8 pt-3 border-t border-slate-100">
          <button
            onClick={() => setMode('results')}
            disabled={!query.pickup || !query.dropoff}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', fontFamily: "'Outfit', sans-serif", boxShadow: '0 6px 20px rgba(37,99,235,0.35)', minHeight: 48 }}
          >
            Search Rides
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-sr-bg flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 z-20" style={{ paddingTop: 56, paddingBottom: 12 }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="flex-1 text-left" onClick={changeSearch} aria-label="Edit search">
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <span className="text-sr-blue truncate max-w-[38%]">{query.pickup || 'Pickup'}</span>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="flex-shrink-0">
                <path d="M1 5H13M9 1L13 5L9 9" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-slate-800 truncate max-w-[38%]">{query.dropoff || 'Drop-off'}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 ml-0.5">
                <path d="M2 8.5L8.5 2M8.5 2H4M8.5 2V6" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
              {query.date || 'Today'} · {query.timeLabel || 'Any Time'} · Hyderabad
            </div>
          </button>
          <button
            onClick={openFilters}
            aria-label="Filters"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex-shrink-0"
            style={{ fontFamily: "'Outfit', sans-serif", border: filtersActive ? '1.5px solid #2563EB' : '1.5px solid #BFDBFE', background: filtersActive ? '#2563EB' : 'transparent', color: filtersActive ? 'white' : '#2563EB', minHeight: 40 }}
          >
            <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
              <path d="M1 2H12M3 6H10M5 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {filtersActive ? 'Filtered ✓' : 'Filter'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border border-slate-100 rounded-2xl overflow-hidden mb-3 bg-slate-50 p-0.5">
          {([
            { id: 'offered' as DiscoverTab, label: '🚗 Offered Rides' },
            { id: 'requests' as DiscoverTab, label: '🧳 Requests' },
            { id: 'nearby' as DiscoverTab, label: '📍 Near Me' },
          ]).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex-1 py-2 rounded-xl text-xs font-bold transition-all" style={{ fontFamily: "'Outfit', sans-serif", background: tab === t.id ? '#2563EB' : 'transparent', color: tab === t.id ? 'white' : '#94A3B8', minHeight: 40 }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {matchCategories.map((c) => (
            <button key={c.id} onClick={() => setCategory(c.id)} className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all" style={{ fontFamily: "'Inter', sans-serif", background: category === c.id ? '#2563EB' : 'white', color: category === c.id ? 'white' : '#475569', border: `1.5px solid ${category === c.id ? '#2563EB' : '#E2E8F0'}`, minHeight: 32 }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count + sort */}
      <div className="px-4 py-2.5 flex items-center justify-between bg-white border-b border-slate-50">
        <span className="text-sm font-semibold text-slate-700" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {tab === 'offered' ? `${filteredRides.length} offered rides` : tab === 'requests' ? `${filteredRequests.length} ride requests` : '3 nearby matches'}
        </span>
        <div className="relative">
          <button onClick={() => setShowSort((v) => !v)} className="text-xs font-semibold text-slate-500 flex items-center gap-1" style={{ minHeight: 32 }}>
            Sort: {SORT_OPTIONS.find((s) => s.id === sort)?.label} <span className="text-[10px]">▾</span>
          </button>
          {showSort && (
            <div className="absolute right-0 top-8 z-30 bg-white rounded-xl border border-slate-100 py-1 w-48" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setSort(opt.id); setShowSort(false) }}
                  className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50"
                  style={{ color: sort === opt.id ? '#2563EB' : '#334155', minHeight: 36 }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-3 pb-24 space-y-3">
        {tab === 'offered' && (
          noResults ? <SearchEmptyState onChangeSearch={changeSearch} onRequestRide={onPostRide} /> : filteredRides.map((ride) => <RideCard key={ride.id} ride={ride} onClick={() => onSelectRide(ride.id)} />)
        )}
        {tab === 'requests' && (
          noResults ? <SearchEmptyState onChangeSearch={changeSearch} onRequestRide={onPostRide} /> : filteredRequests.map((req) => <RequestCard key={req.id} request={req} onAccept={() => {}} />)
        )}
        {tab === 'nearby' && (
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-2xl px-4 py-3 flex items-center gap-3 border border-blue-100">
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-sm font-bold text-blue-800" style={{ fontFamily: "'Outfit', sans-serif" }}>Rides within 2 km of you</p>
                <p className="text-xs text-blue-600" style={{ fontFamily: "'Inter', sans-serif" }}>Showing all route activity near {query.pickup || 'Madhapur'}</p>
              </div>
            </div>
            {rides.map((ride) => <RideCard key={ride.id} ride={ride} onClick={() => onSelectRide(ride.id)} />)}
          </div>
        )}
      </div>

      {/* Filter bottom sheet */}
      {showFilters && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowFilters(false)}>
          <div className="bg-white rounded-t-3xl px-5 pt-5 pb-8" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Filters</h3>
              <button onClick={resetFilters} className="text-xs font-semibold text-sr-blue" style={{ fontFamily: "'Outfit', sans-serif" }}>Reset All</button>
            </div>

            <div className="mb-5">
              <h4 className="text-sm font-bold text-slate-700 mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>Time</h4>
              <div className="flex gap-2 flex-wrap">
                {TIME_BUCKETS.map((t) => (
                  <button key={t} onClick={() => setPendingTimeBucket(t)} className="px-3 py-2 rounded-xl text-xs font-semibold border transition-all" style={{ fontFamily: "'Outfit', sans-serif", background: pendingTimeBucket === t ? '#2563EB' : 'white', color: pendingTimeBucket === t ? 'white' : '#475569', borderColor: pendingTimeBucket === t ? '#2563EB' : '#E2E8F0', minHeight: 40 }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <h4 className="text-sm font-bold text-slate-700 mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>Verification</h4>
              <button onClick={() => setPendingVerifiedOnly((v) => !v)} className="flex items-center justify-between w-full py-1" style={{ minHeight: 40 }}>
                <span className="text-sm text-slate-700">Verified users only</span>
                <span className="w-11 h-6 rounded-full relative flex-shrink-0" style={{ background: pendingVerifiedOnly ? '#2563EB' : '#CBD5E1' }}>
                  <span className="w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all" style={{ left: pendingVerifiedOnly ? '1.375rem' : '0.125rem' }} />
                </span>
              </button>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-700" style={{ fontFamily: "'Outfit', sans-serif" }}>Price Range</h4>
                <span className="text-sm font-semibold text-sr-blue" style={{ fontFamily: "'Outfit', sans-serif" }}>₹{pendingMin} – ₹{pendingMax}</span>
              </div>
              <div className="space-y-3">
                <input type="range" min={50} max={500} value={pendingMin} onChange={(e) => setPendingMin(Math.min(Number(e.target.value), pendingMax - 50))} className="w-full accent-blue-600 h-1.5 rounded-full" aria-label="Minimum price" />
                <input type="range" min={50} max={500} value={pendingMax} onChange={(e) => setPendingMax(Math.max(Number(e.target.value), pendingMin + 50))} className="w-full accent-blue-600 h-1.5 rounded-full" aria-label="Maximum price" />
              </div>
            </div>

            <div className="mb-5">
              <h4 className="text-sm font-bold text-slate-700 mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>Preferences</h4>
              <div className="flex flex-wrap gap-2">
                {Object.keys(pendingAmenities).map((a) => (
                  <button key={a} onClick={() => setPendingAmenities((p) => ({ ...p, [a]: !p[a] }))} className="px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all" style={{ fontFamily: "'Outfit', sans-serif", background: pendingAmenities[a] ? '#EFF6FF' : 'white', color: pendingAmenities[a] ? '#2563EB' : '#475569', borderColor: pendingAmenities[a] ? '#2563EB' : '#E2E8F0', minHeight: 40 }}>
                    {a === 'AC' ? '❄️' : a === 'Women Preferred' ? '👩' : a === 'USB Charging' ? '🔌' : a === 'Luggage Space' ? '🧳' : a === 'Pets OK' ? '🐾' : '🤫'} {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowFilters(false)} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm" style={{ fontFamily: "'Outfit', sans-serif", minHeight: 48 }}>Cancel</button>
              <button onClick={applyFilters} className="flex-1 py-3 rounded-2xl text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', fontFamily: "'Outfit', sans-serif", minHeight: 48 }}>Apply Filters</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SearchEmptyState({ onChangeSearch, onRequestRide }: { onChangeSearch: () => void; onRequestRide: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 text-4xl">🔍</div>
      <h3 className="text-base font-bold text-slate-700 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>No matching rides found</h3>
      <p className="text-sm text-slate-400 max-w-[240px] leading-relaxed mb-5" style={{ fontFamily: "'Inter', sans-serif" }}>
        Try changing your pickup, drop-off, date, or preferred time.
      </p>
      <div className="flex gap-2">
        <button onClick={onChangeSearch} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold" style={{ fontFamily: "'Outfit', sans-serif", minHeight: 44 }}>
          Change Search
        </button>
        <button onClick={onRequestRide} className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', fontFamily: "'Outfit', sans-serif", minHeight: 44 }}>
          Request a Ride
        </button>
      </div>
    </div>
  )
}
