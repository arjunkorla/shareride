import Avatar from '../components/Avatar'
import RouteFields from '../components/RouteFields'
import RequestCard from '../components/RequestCard'
import type { Screen, SearchQuery } from '../types'
import { rides, passengerRequests, currentUser, popularLocations, popularRoutes, recentSearches } from '../mockData'

interface Props {
  onNavigate: (screen: Screen) => void
  onNotifications: () => void
  onSearch: () => void
  onPostRide: () => void
  onSOS: () => void
  driverMode: boolean
  onToggleDriverMode: () => void
  query: SearchQuery
  onQueryChange: (patch: Partial<SearchQuery>) => void
  onSelectRide: (id: string) => void
}

const SosIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M4.5 3H2.5C2.22 3 2 3.22 2 3.5V14.5C2 14.78 2.22 15 2.5 15H4.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M13.5 3H15.5C15.78 3 16 3.22 16 3.5V14.5C16 14.78 15.78 15 15.5 15H13.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M7 6H5V9H7V12H5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 6H13V12H10V9H12" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const matchColors: Record<string, { bg: string; text: string }> = {
  great: { bg: '#D1FAE5', text: '#059669' },
  good:  { bg: '#DBEAFE', text: '#2563EB' },
  ok:    { bg: '#FEF3C7', text: '#D97706' },
}

function postedMinutesAgo(label: string): number {
  const m = /^(\d+)\s*(min|h)/.exec(label)
  if (!m) return 9999
  return m[2] === 'h' ? Number(m[1]) * 60 : Number(m[1])
}

export default function HomeScreen({ onNavigate, onNotifications, onSearch, onPostRide, onSOS, driverMode, onToggleDriverMode, query, onQueryChange, onSelectRide }: Props) {
  // Latest Posted Rides: offered rides + passenger requests, newest first.
  const latestItems = [
    ...rides.map((r) => ({ kind: 'ride' as const, item: r, minutesAgo: postedMinutesAgo(r.postedAt ?? '') })),
    ...passengerRequests.map((r) => ({ kind: 'request' as const, item: r, minutesAgo: postedMinutesAgo(r.postedAt) })),
  ]
    .sort((a, b) => a.minutesAgo - b.minutesAgo)
    .slice(0, 4)

  // Recommended: rides matching a route the user has actually searched
  // before. No history to reason from -> fall back to a couple of popular
  // Hyderabad routes, clearly labeled as such rather than invented as
  // personal history.
  const recommendedRides = rides.filter((r) =>
    recentSearches.some((s) => r.fromShort === s.from && r.toShort === s.to),
  )
  const fallbackRoutes = recommendedRides.length === 0 ? popularRoutes.slice(0, 2) : []

  const goToDestination = (name: string, subtitle: string) => {
    onQueryChange({ dropoff: name, dropoffSubtitle: subtitle })
    onSearch()
  }

  const goToRoute = (from: string, to: string) => {
    onQueryChange({ pickup: from, pickupSubtitle: 'Hyderabad', dropoff: to, dropoffSubtitle: 'Hyderabad' })
    onSearch()
  }

  return (
    <div className="absolute inset-0 overflow-y-auto hide-scrollbar bg-slate-50 flex flex-col pb-24">
      {/* Header */}
      <div className="flex-shrink-0 bg-white" style={{ paddingTop: 52 }}>
        <div className="flex items-center justify-between px-5 pt-2 pb-1">
          <div>
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(37,99,235,0.9)' }}>
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                  <path d="M3 14 Q6 9 9 7 Q12 5 15 3" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round" />
                  <path d="M3 14 Q6 9 9 7 Q12 5 15 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 3" />
                  <circle cx="9" cy="7" r="3.5" fill="white" />
                  <circle cx="9" cy="7" r="1.8" fill="#2563EB" />
                </svg>
              </div>
              <span className="text-base font-extrabold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Share<span style={{ color: '#2563EB' }}>Ride</span>
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1C3.34 1 2 2.34 2 4C2 6.25 5 9 5 9C5 9 8 6.25 8 4C8 2.34 6.66 1 5 1Z" fill="#2563EB" />
                <circle cx="5" cy="4" r="1.2" fill="white" />
              </svg>
              <span className="text-[11px] text-slate-600 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Hyderabad</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onNotifications} aria-label="Notifications" className="rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center relative" style={{ width: 44, height: 44 }}>
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                <path d="M11 2.5C11 2.5 5 4.5 5 10.5V15.5H4C3.45 15.5 3 15.95 3 16.5C3 17.05 3.45 17.5 4 17.5H18C18.55 17.5 19 17.05 19 16.5C19 15.95 18.55 15.5 18 15.5H17V10.5C17 4.5 11 2.5 11 2.5Z"
                  fill="none" stroke="#0F172A" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M9 17.5C9 18.6 9.9 19.5 11 19.5C12.1 19.5 13 18.6 13 17.5" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="17" cy="5" r="3" fill="#EF4444" />
              </svg>
            </button>
            <button onClick={() => onNavigate('profile')} aria-label="Your profile" className="rounded-full border-2 border-white shadow-sm" style={{ width: 44, height: 44 }}>
              <Avatar src={currentUser.avatar} name={currentUser.name} size={40} />
            </button>
          </div>
        </div>

        <div className="px-5 pt-2 pb-1">
          <p className="text-sm text-slate-600 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
            {getGreeting()}, <span className="font-bold text-slate-900">{currentUser.name.split(' ')[0]}</span> 👋
          </p>
        </div>
      </div>

      {/* Primary search area */}
      <div className="flex-shrink-0 px-5 pt-3 pb-4 bg-white border-b-8 border-slate-50">
        <h2 className="text-lg font-extrabold text-slate-900 mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Where do you want to go?
        </h2>
        <RouteFields query={query} onChange={onQueryChange} />
        <button
          onClick={onSearch}
          disabled={!query.pickup || !query.dropoff}
          className="w-full mt-3 py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
            fontFamily: "'Outfit', sans-serif",
            minHeight: 48,
          }}
        >
          Search Rides
        </button>

        {/* Quick actions — separate from the search flow */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={onSearch}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-blue-100 bg-blue-50 text-sr-blue transition-all active:scale-95"
            style={{ fontFamily: "'Outfit', sans-serif", minHeight: 48 }}
          >
            <span>🧳</span>
            <span className="text-sm font-bold">Request a Ride</span>
          </button>
          <button
            onClick={onPostRide}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-green-100 bg-green-50 text-green-700 transition-all active:scale-95"
            style={{ fontFamily: "'Outfit', sans-serif", minHeight: 48 }}
          >
            <span>🚗</span>
            <span className="text-sm font-bold">Offer a Ride</span>
          </button>
        </div>
      </div>

      {/* Latest Posted Rides */}
      <div className="px-4 pt-5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-extrabold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Latest Rides</h3>
          <button onClick={onSearch} className="text-xs font-semibold text-sr-blue" style={{ fontFamily: "'Outfit', sans-serif" }}>See all →</button>
        </div>
        <div className="space-y-3">
          {latestItems.map(({ kind, item }) =>
            kind === 'ride' ? (
              <button
                key={item.id}
                onClick={() => onSelectRide(item.id)}
                className="w-full bg-white rounded-2xl p-4 text-left transition-all active:scale-[0.99]"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.05)' }}
              >
                <div className="flex items-center gap-3">
                  <img src={item.driver.avatar} alt={item.driver.name} className="w-10 h-10 rounded-xl object-cover bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: "'Outfit', sans-serif" }}>{item.fromShort} → {item.toShort}</span>
                      {item.driver.verified && <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">✓ Verified</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{item.date} · {item.time}</span>
                      <span className="text-slate-300">·</span>
                      <span>⭐ {item.rating}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Posted {item.postedAt}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {item.matchScore && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: matchColors[item.matchScore].bg, color: matchColors[item.matchScore].text }}>
                        {item.matchScore === 'great' ? 'Best Match' : item.matchScore === 'good' ? 'Good Match' : 'Fair Match'}
                      </span>
                    )}
                    <div className="text-xs font-semibold text-sr-blue mt-1">View Ride →</div>
                  </div>
                </div>
              </button>
            ) : (
              <RequestCard key={item.id} request={item} onClick={onSearch} />
            ),
          )}
        </div>
      </div>

      {/* Recommended */}
      <div className="px-4 pt-2 pb-2">
        <h3 className="text-base font-extrabold text-slate-900 mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>Recommended for You</h3>
        <div className="space-y-3">
          {recommendedRides.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelectRide(r.id)}
              className="w-full bg-white rounded-2xl p-4 text-left border border-blue-50 transition-all active:scale-[0.99]"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{r.fromShort} → {r.toShort}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-sr-blue">Matches your usual route</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{r.date} · {r.time}</div>
            </button>
          ))}
          {fallbackRoutes.map(({ from, to }) => (
            <button
              key={from + to}
              onClick={() => goToRoute(from, to)}
              className="w-full bg-white rounded-2xl p-4 text-left border border-slate-100 transition-all active:scale-[0.99]"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{from} → {to}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-500">Popular in Hyderabad</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Popular Locations */}
      <div className="px-4 pt-2 pb-2">
        <h3 className="text-base font-extrabold text-slate-900 mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>Popular Locations</h3>
        <div className="flex flex-wrap gap-2">
          {popularLocations.map((loc) => (
            <button
              key={loc.name}
              onClick={() => goToDestination(loc.name, loc.subtitle)}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-100 text-slate-700 transition-all active:scale-95"
              style={{ fontFamily: "'Outfit', sans-serif", minHeight: 44, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Popular Routes */}
      <div className="px-4 pt-2 pb-2">
        <h3 className="text-base font-extrabold text-slate-900 mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>Popular Routes</h3>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {popularRoutes.map(({ from, to }) => (
            <button
              key={from + to}
              onClick={() => goToRoute(from, to)}
              className="flex-shrink-0 flex items-center gap-2 bg-white rounded-2xl px-4 py-3 transition-all active:scale-95"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', minHeight: 44 }}
            >
              <span className="text-xs font-bold text-slate-800 whitespace-nowrap" style={{ fontFamily: "'Outfit', sans-serif" }}>{from} → {to}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SOS + role switch — quick access, not competing with the search flow above */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <button
          onClick={onSOS}
          aria-label="Emergency SOS"
          className="flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-bold text-white"
          style={{ minHeight: 44, background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', boxShadow: '0 4px 16px rgba(220,38,38,0.35)', fontFamily: "'Outfit', sans-serif" }}
        >
          <SosIcon />
          SOS
        </button>

        <div className="rounded-2xl p-1 flex" style={{ background: '#F1F5F9' }}>
          {(['passenger', 'driver'] as const).map((mode) => (
            <button
              key={mode}
              onClick={onToggleDriverMode}
              className="px-3 rounded-xl text-[11px] font-bold capitalize transition-all"
              style={{
                minHeight: 40,
                background: (driverMode ? 'driver' : 'passenger') === mode ? '#2563EB' : 'transparent',
                color: (driverMode ? 'driver' : 'passenger') === mode ? 'white' : '#64748B',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {mode === 'passenger' ? '🧳' : '🚗'} {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
