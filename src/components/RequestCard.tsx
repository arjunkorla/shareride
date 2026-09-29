import type { RideRequestSummary } from '../types'

interface Props {
  request: RideRequestSummary
  onClick?: () => void
  onAccept?: () => void
}

const matchColors: Record<string, { bg: string; text: string; label: string }> = {
  great: { bg: '#D1FAE5', text: '#059669', label: 'Great Match' },
  good:  { bg: '#DBEAFE', text: '#2563EB', label: 'Good Match' },
  ok:    { bg: '#FEF3C7', text: '#D97706', label: 'Fair Match' },
}

export default function RequestCard({ request: req, onClick, onAccept }: Props) {
  const mc = matchColors[req.matchScore]

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.05)' }}
      onClick={onClick}
    >
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <img src={req.passenger.avatar} alt={req.passenger.name} className="w-11 h-11 rounded-full object-cover bg-slate-100" />
          {req.passenger.verified && (
            <div className="absolute -bottom-0.5 -right-0.5">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="6.5" fill="#2563EB" />
                <path d="M3.5 6.5L5.5 8.5L9.5 4.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{req.passenger.name}</span>
            <span className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full font-bold border border-purple-100">Passenger</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <svg width="10" height="10" viewBox="0 0 11 11" fill="#F59E0B"><path d="M5.5 1L6.8 4H10L7.5 6L8.5 9L5.5 7L2.5 9L3.5 6L1 4H4.2L5.5 1Z" /></svg>
            <span className="text-[11px] text-slate-600">{req.passenger.rating}</span>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] text-slate-500">{req.passenger.trips} rides</span>
            {req.postedAt && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-[11px] text-slate-400">Posted {req.postedAt}</span>
              </>
            )}
          </div>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: mc.bg, color: mc.text }}>
          {mc.label}
        </span>
      </div>

      <div className="px-4 py-3 border-t border-slate-50">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1 mt-1 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-sr-blue" />
            <div className="w-0.5 h-7 bg-slate-200" />
            <div className="w-2 h-2 rounded-sm bg-sr-red" />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <div className="text-sm font-semibold text-slate-900">{req.from}</div>
              <div className="text-[11px] text-slate-400">{req.date} · {req.time}</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">{req.to}</div>
              <div className="text-[11px] text-slate-400">{req.distance}</div>
            </div>
          </div>
        </div>
        {req.note && (
          <div className="mt-2.5 bg-slate-50 rounded-xl px-3 py-2 flex items-start gap-2">
            <span className="text-xs">💬</span>
            <p className="text-xs text-slate-500 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>"{req.note}"</p>
          </div>
        )}
      </div>

      {onAccept && (
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={(e) => { e.stopPropagation(); onAccept() }}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', fontFamily: "'Outfit', sans-serif" }}
          >
            ✅ Accept Request
          </button>
          <button onClick={(e) => e.stopPropagation()} className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 bg-white">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 2H3C2.45 2 2 2.45 2 3V10.5C2 11.05 2.45 11.5 3 11.5H5.5L8 14L10.5 11.5H13C13.55 11.5 14 11.05 14 10.5V3C14 2.45 13.55 2 13 2Z"
                stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </button>
          <button onClick={(e) => e.stopPropagation()} className="w-10 h-10 rounded-xl border border-red-100 flex items-center justify-center text-red-400 bg-red-50">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
