import { useState } from 'react'
import MapView from '../components/MapView'
import { rides, reviews } from '../mockData'
import type { Screen } from '../types'

interface Props {
  rideId: string
  onBack: () => void
  onNavigate: (screen: Screen) => void
  onBook: () => void
  onChat: (id: string) => void
  onViewDriverProfile?: (driverId: string) => void
}

const VerifiedBadge = () => (
  <span className="inline-flex items-center gap-1 bg-sr-blue-soft text-sr-blue text-[10px] font-semibold px-2 py-0.5 rounded-full">
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
      <circle cx="4.5" cy="4.5" r="4.5" fill="#2563EB" />
      <path d="M2.5 4.5L3.8 5.8L6.5 3" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    Verified
  </span>
)

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 12 12" fill={s <= Math.round(rating) ? '#F59E0B' : '#E2E8F0'}>
          <path d="M6 1L7.5 4.5H11L8.5 7L9.5 10.5L6 8.5L2.5 10.5L3.5 7L1 4.5H4.5L6 1Z" />
        </svg>
      ))}
    </div>
  )
}

const matchColors: Record<string, { bg: string; text: string; label: string }> = {
  great: { bg: '#D1FAE5', text: '#059669', label: '🎯 Great Route Match' },
  good:  { bg: '#DBEAFE', text: '#2563EB', label: '✅ Good Route Match' },
  ok:    { bg: '#FEF3C7', text: '#D97706', label: '🔶 Fair Route Match' },
}

export default function RideDetailScreen({ rideId, onBack, onBook, onChat, onViewDriverProfile }: Props) {
  const [shareShown, setShareShown] = useState(false)
  const ride = rides.find((r) => r.id === rideId) || rides[0]
  const [tab, setTab] = useState<'details' | 'reviews' | 'rules'>('details')

  const match = ride.matchScore ? matchColors[ride.matchScore] : null

  return (
    <div className="absolute inset-0 flex flex-col bg-white overflow-hidden">
      {/* Map */}
      <div className="relative flex-shrink-0" style={{ height: 220 }}>
        <MapView
          compact
          markers={[
            { x: 100, y: 100, type: 'user' },
            { x: 260, y: 80, type: 'destination' },
          ]}
          showRoute
        />
        <button
          onClick={onBack}
          className="absolute glass top-16 left-4 z-20 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button onClick={() => setShareShown(true)} className="absolute glass top-16 right-4 z-20 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="13" cy="3" r="2" stroke="#0F172A" strokeWidth="1.3" />
            <circle cx="3" cy="8" r="2" stroke="#0F172A" strokeWidth="1.3" />
            <circle cx="13" cy="13" r="2" stroke="#0F172A" strokeWidth="1.3" />
            <path d="M5 7L11 4M5 9L11 12" stroke="#0F172A" strokeWidth="1.3" />
          </svg>
        </button>

        {/* Share sheet */}
        {shareShown && (
          <div
            className="absolute inset-0 z-50 flex flex-col justify-end"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShareShown(false)}
          >
            <div className="bg-white rounded-t-3xl px-5 py-6" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
              <p className="text-base font-bold text-slate-900 mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>Share this Ride</p>
              <div className="bg-slate-50 rounded-2xl p-3 mb-4 border border-slate-100">
                <p className="text-xs text-slate-600" style={{ fontFamily: "'Inter', sans-serif" }}>
                  🚗 {ride.from} → {ride.to} · {ride.date} · ₹{ride.price}/person
                </p>
                <p className="text-[11px] text-sr-blue mt-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  shareride.in/ride/{ride.id}
                </p>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { icon: '📋', label: 'Copy Link' },
                  { icon: '💬', label: 'WhatsApp' },
                  { icon: '✈️', label: 'Telegram' },
                  { icon: '📨', label: 'More' },
                ].map(({ icon, label }) => (
                  <button key={label} onClick={() => setShareShown(false)} className="flex flex-col items-center gap-1.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl">{icon}</div>
                    <span className="text-[10px] text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShareShown(false)} className="w-full py-3 rounded-2xl text-slate-500 border border-slate-200 text-sm font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Route badge */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-1.5 text-xs font-semibold text-slate-700 whitespace-nowrap" style={{ fontFamily: "'Inter', sans-serif" }}>
          {ride.duration} · {ride.distance} · {ride.route}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {/* Match + pickup info */}
        {(match || ride.pickupProximity) && (
          <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-wrap">
            {match && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: match.bg, color: match.text }}>
                {match.label}
              </span>
            )}
            {ride.pickupProximity && (
              <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                📍 Pickup {ride.pickupProximity}
              </span>
            )}
            {ride.instantBook && (
              <span className="text-xs font-semibold bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-100">
                ⚡ Instant confirm
              </span>
            )}
          </div>
        )}

        {/* Driver card */}
        <div className="px-4 pt-2 pb-3 flex items-center gap-3 border-b border-slate-100">
          <button className="relative active:opacity-80" onClick={() => onViewDriverProfile?.(ride.driver.id)}>
            <img src={ride.driver.avatar} alt={ride.driver.name} className="w-14 h-14 rounded-2xl object-cover bg-slate-100" />
            <div className="absolute -bottom-1 -right-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="8" fill="#2563EB" />
                <path d="M4.5 8L6.5 10L11.5 5.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
          <button className="flex-1 text-left active:opacity-80" onClick={() => onViewDriverProfile?.(ride.driver.id)}>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{ride.driver.name}</h3>
              <VerifiedBadge />
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <StarRating rating={ride.driver.rating} />
              <span className="text-xs text-slate-600 font-medium">{ride.driver.rating}</span>
              <span className="text-xs text-slate-400">({ride.reviews} reviews)</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>🚗 {ride.driver.trips} rides</span>
              <span className="text-xs text-slate-500">📅 Since {ride.driver.memberSince}</span>
            </div>
          </button>
          <div className="flex flex-col gap-1.5">
            <button onClick={() => onChat(ride.driver.id)} className="w-9 h-9 bg-sr-blue rounded-xl flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                <path d="M14 2H2C1.45 2 1 2.45 1 3V10C1 10.55 1.45 11 2 11H5L8 14L11 11H14C14.55 11 15 10.55 15 10V3C15 2.45 14.55 2 14 2Z" />
              </svg>
            </button>
            <button className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 9.7C13 10 12.9 10.3 12.6 10.5L10.8 12.3C10.5 12.6 10.1 12.7 9.8 12.7C9.4 12.7 8.8 12.6 7.4 12C6.2 11.5 5 10.7 4 9.7S2.5 7.8 2 6.6C1.4 5.2 1.3 4.6 1.3 4.2C1.3 3.9 1.4 3.5 1.7 3.2L3.5 1.4C3.8 1.1 4.1 1 4.3 1C4.7 1 5 1.2 5.2 1.6L6.6 4.2C6.8 4.5 6.9 4.8 6.9 5S6.7 5.4 6.6 5.6L5.9 6.3C5.9 6.4 5.8 6.5 5.8 6.6C6.1 7.2 6.5 7.8 7 8.2C7.4 8.6 8 9 8.6 9.3L9.3 8.6C9.5 8.4 9.7 8.3 9.9 8.3C10.2 8.3 10.5 8.4 10.8 8.6L13 9.2C13.3 9.5 13.4 9.6 13 9.7Z"
                  stroke="#64748B" strokeWidth="1.3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Route timeline */}
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-sr-blue" />
              <div className="w-0.5 h-16 bg-slate-200 my-1" />
              {ride.stops && ride.stops.length > 0 && (
                <>
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-400 bg-white" />
                  <div className="w-0.5 h-10 bg-slate-200 my-1" />
                </>
              )}
              <div className="w-3 h-3 rounded-full bg-sr-red" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="pb-4">
                <div className="font-semibold text-slate-900 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>{ride.fromShort}</div>
                <div className="text-xs text-slate-400 mt-0.5">{ride.date} · <span className="font-semibold text-slate-600">{ride.time}</span></div>
              </div>
              {ride.stops?.map((stop) => (
                <div key={stop} className="pb-4">
                  <div className="font-medium text-slate-700 text-sm">{stop}</div>
                  <div className="text-xs text-amber-600 mt-0.5">Brief stop · ~10 min</div>
                </div>
              ))}
              <div>
                <div className="font-semibold text-slate-900 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>{ride.toShort}</div>
                <div className="text-xs text-slate-400 mt-0.5">Est. arrival <span className="font-semibold text-slate-600">~10:15 AM</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle */}
        <div className="px-4 py-4 border-b border-slate-100">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Vehicle</h4>
          <div className="flex items-center gap-4">
            {ride.vehicle.photo ? (
              <img src={ride.vehicle.photo} alt={ride.vehicle.model} className="w-20 h-14 rounded-xl object-cover bg-slate-100" />
            ) : (
              <div className="w-20 h-14 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">🚗</div>
            )}
            <div>
              <div className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {ride.vehicle.make} {ride.vehicle.model}
              </div>
              <div className="text-xs text-slate-500 mt-1">{ride.vehicle.year} · {ride.vehicle.color} · {ride.vehicle.fuelType}</div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">{ride.vehicle.regNumber}</div>
              <div className="flex gap-1.5 mt-1.5">
                {ride.vehicle.rcVerified && (
                  <span className="text-[9px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-semibold border border-green-100">✓ RC</span>
                )}
                {ride.vehicle.insuranceVerified && (
                  <span className="text-[9px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-semibold border border-green-100">✓ Insured</span>
                )}
                {ride.vehicle.ac && (
                  <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold border border-blue-100">❄️ AC</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {(['details', 'reviews', 'rules'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-3 text-sm font-semibold capitalize transition-all"
              style={{
                fontFamily: "'Outfit', sans-serif",
                color: tab === t ? '#2563EB' : '#94A3B8',
                borderBottom: tab === t ? '2px solid #2563EB' : '2px solid transparent',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'details' && (
          <div className="px-4 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Amenities</span>
              <div className="flex gap-1.5 flex-wrap justify-end">
                {ride.amenities.map((a) => (
                  <span key={a} className="text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-100">{a}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Response time</span>
              <span className="text-sm font-semibold text-slate-800">{ride.driver.responseTime}</span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-sm text-slate-600">Languages</span>
              <span className="text-sm text-slate-700 text-right">{ride.driver.languages.join(', ')}</span>
            </div>
            <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
              <span className="text-lg">👤</span>
              <p className="text-xs text-slate-500 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>"{ride.driver.bio}"</p>
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div className="px-4 py-4 space-y-4">
            {reviews.map((rv) => (
              <div key={rv.id} className="flex gap-3">
                <img src={rv.avatar} alt={rv.author} className="w-9 h-9 rounded-full object-cover flex-shrink-0 bg-slate-100" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>{rv.author}</span>
                    <StarRating rating={rv.rating} size={10} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{rv.comment}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400">{rv.date}</span>
                    {rv.rideRoute && <span className="text-[10px] text-slate-400">· {rv.rideRoute}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'rules' && (
          <div className="px-4 py-4">
            {[
              { icon: '🚭', rule: 'No smoking inside the vehicle' },
              { icon: '🎧', rule: 'Headphones for calls, please' },
              { icon: '🍕', rule: 'No strong-smelling food' },
              { icon: '🐾', rule: 'Small pets in carrier only' },
              { icon: '⏰', rule: 'Please be on time at pickup' },
              { icon: '💬', rule: 'Respect fellow passengers' },
            ].map(({ icon, rule }) => (
              <div key={rule} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
                <span className="text-lg w-7 text-center">{icon}</span>
                <span className="text-sm text-slate-700" style={{ fontFamily: "'Inter', sans-serif" }}>{rule}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ height: 96 }} />
      </div>

      {/* Booking bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3" style={{ paddingBottom: 20 }}>
        <div className="flex items-center gap-3">
          <div>
            <div className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
              ₹{ride.price}
            </div>
            <div className="text-xs text-slate-400">per person</div>
          </div>

          <button
            onClick={onBook}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-sm transition-all active:scale-95"
            style={{
              background: ride.instantBook
                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              fontFamily: "'Outfit', sans-serif",
              boxShadow: ride.instantBook ? '0 6px 20px rgba(5,150,105,0.35)' : '0 6px 20px rgba(37,99,235,0.35)',
            }}
          >
            {ride.instantBook ? '⚡ Send Request' : '✉️ Send Request'}
          </button>
        </div>
      </div>
    </div>
  )
}
