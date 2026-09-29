import type { Ride } from '../types'

interface Props {
  ride: Ride
  onClick?: () => void
}

const StarIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="#F59E0B">
    <path d="M5.5 1L6.8 4H10L7.5 6L8.5 9L5.5 7L2.5 9L3.5 6L1 4H4.2L5.5 1Z" />
  </svg>
)

const VerifiedIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="6.5" cy="6.5" r="6.5" fill="#2563EB" />
    <path d="M3.5 6.5L5.5 8.5L9.5 4.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const LightningIcon = () => (
  <svg width="10" height="12" viewBox="0 0 10 12" fill="#059669">
    <path d="M6 1L1 7H5L4 11L9 5H5L6 1Z" />
  </svg>
)

function amenityIcon(a: string) {
  if (a.includes('AC')) return '❄️'
  if (a.includes('Women')) return '👩'
  if (a.includes('Music')) return '🎵'
  if (a.includes('USB')) return '🔌'
  if (a.includes('Luggage')) return '🧳'
  if (a.includes('Pets')) return '🐾'
  if (a.includes('Silent')) return '🤫'
  return '✓'
}

const matchColors: Record<string, { bg: string; text: string; label: string }> = {
  great: { bg: '#D1FAE5', text: '#059669', label: 'Great match' },
  good:  { bg: '#DBEAFE', text: '#2563EB', label: 'Good match' },
  ok:    { bg: '#FEF3C7', text: '#D97706', label: 'Fair match' },
}

export default function RideCard({ ride, onClick }: Props) {
  const match = ride.matchScore ? matchColors[ride.matchScore] : null

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.05)' }}
      onClick={onClick}
    >
      {/* Header - driver + price */}
      <div className="flex items-center px-4 pt-4 pb-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0 mr-3">
          <img
            src={ride.driver.avatar}
            alt={ride.driver.name}
            className="w-11 h-11 rounded-full object-cover bg-slate-100"
          />
          {ride.driver.verified && (
            <div className="absolute -bottom-0.5 -right-0.5">
              <VerifiedIcon />
            </div>
          )}
        </div>

        {/* Driver info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-sm font-semibold text-slate-900 truncate"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {ride.driver.name}
            </span>
            {ride.instantBook && (
              <span className="flex items-center gap-0.5 bg-green-50 text-green-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                <LightningIcon /> Instant
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <StarIcon />
            <span className="text-[11px] font-medium text-slate-700">{ride.driver.rating}</span>
            <span className="text-[11px] text-slate-400">({ride.reviews})</span>
            <span className="text-slate-300 mx-0.5">·</span>
            <span className="text-[11px] text-slate-500">{ride.vehicle.make} {ride.vehicle.model}</span>
          </div>
        </div>

        {/* Price */}
        <div className="text-right ml-2">
          <div
            className="text-xl font-bold text-slate-900"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            ₹{ride.price}
          </div>
          <div className="text-[10px] text-slate-400">per person</div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-50 mx-4" />

      {/* Route */}
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          {/* Timeline dots */}
          <div className="flex flex-col items-center mt-1 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-sr-blue" />
            <div className="w-0.5 h-8 bg-slate-200 my-1" />
            <div className="w-2 h-2 rounded-full border-2 border-sr-blue bg-white" />
          </div>

          {/* Locations */}
          <div className="flex-1 space-y-2">
            <div>
              <div className="text-sm font-semibold text-slate-900">{ride.fromShort}</div>
              <div className="text-[11px] text-slate-500">{ride.date} · {ride.time}</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">{ride.toShort}</div>
              <div className="text-[11px] text-slate-500">{ride.duration} · {ride.distance}</div>
            </div>
          </div>

          {/* Match indicator */}
          <div className="text-right flex flex-col items-end gap-1">
            {match && (
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: match.bg, color: match.text }}
              >
                {match.label}
              </span>
            )}
            {ride.pickupProximity && (
              <span className="text-[10px] text-slate-400">📍 {ride.pickupProximity}</span>
            )}
          </div>
        </div>
      </div>

      {/* Amenities */}
      {ride.amenities.length > 0 && (
        <div className="flex items-center gap-1.5 px-4 pb-3 flex-wrap">
          {ride.amenities.slice(0, 4).map((a) => (
            <span
              key={a}
              className="text-[10px] bg-slate-50 text-slate-600 px-2 py-1 rounded-full border border-slate-100"
            >
              {amenityIcon(a)} {a}
            </span>
          ))}
        </div>
      )}

      {/* Footer - action buttons */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={(e) => { e.stopPropagation(); onClick?.() }}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity active:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {ride.instantBook ? '⚡ Send Request' : '✉️ Send Request'}
        </button>
        <button
          onClick={(e) => e.stopPropagation()}
          className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 bg-white"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 2H3C2.45 2 2 2.45 2 3V10.5C2 11.05 2.45 11.5 3 11.5H5.5L8 14L10.5 11.5H13C13.55 11.5 14 11.05 14 10.5V3C14 2.45 13.55 2 13 2Z"
              stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={(e) => e.stopPropagation()}
          className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 bg-white"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 10.7C14 11 13.9 11.3 13.6 11.5L11.8 13.3C11.5 13.6 11.1 13.7 10.8 13.7C10.4 13.7 9.8 13.6 8.4 13C7.2 12.5 6 11.7 5 10.7S3.5 8.8 3 7.6C2.4 6.2 2.3 5.6 2.3 5.2C2.3 4.9 2.4 4.5 2.7 4.2L4.5 2.4C4.8 2.1 5.1 2 5.3 2C5.7 2 6 2.2 6.2 2.6L7.6 5.2C7.8 5.5 7.9 5.8 7.9 6S7.7 6.4 7.6 6.6L6.9 7.3C6.9 7.4 6.8 7.5 6.8 7.6C7.1 8.2 7.5 8.8 8 9.2C8.4 9.6 9 10 9.6 10.3L10.3 9.6C10.5 9.4 10.7 9.3 10.9 9.3C11.2 9.3 11.5 9.4 11.8 9.6L14 10.2C14.3 10.5 14.4 10.6 14 10.7Z"
              stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </button>
      </div>
    </div>
  )
}
