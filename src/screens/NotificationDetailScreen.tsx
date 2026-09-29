import type { Notification, Screen } from '../types'

interface Props {
  notification: Notification
  onBack: () => void
  onNavigate: (screen: Screen) => void
}

const typeConfig: Record<Notification['type'], { icon: string; bg: string; color: string; darkBg: string }> = {
  booking: { icon: '✅', bg: '#D1FAE5', color: '#059669', darkBg: '#065F46' },
  message: { icon: '💬', bg: '#DBEAFE', color: '#2563EB', darkBg: '#1E40AF' },
  ride: { icon: '🚗', bg: '#EFF6FF', color: '#3B82F6', darkBg: '#1D4ED8' },
  system: { icon: '🔔', bg: '#F1F5F9', color: '#64748B', darkBg: '#334155' },
  promo: { icon: '🎉', bg: '#FEF3C7', color: '#D97706', darkBg: '#92400E' },
}

const actionConfig: Record<Notification['type'], { label: string; screen: Screen } | null> = {
  booking: { label: '🚗 View Ride Details', screen: 'ride-detail' },
  message: { label: '💬 Open Chat', screen: 'chat-detail' },
  ride: { label: '🔍 Browse Rides', screen: 'search' },
  system: null,
  promo: { label: '🔍 Find Rides', screen: 'search' },
}

function timeAgoToFull(t: string) {
  const d = new Date()
  if (t.includes('m ago')) return d.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  if (t.includes('h ago')) return d.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function NotificationDetailScreen({ notification, onBack, onNavigate }: Props) {
  const config = typeConfig[notification.type]
  const action = actionConfig[notification.type]

  return (
    <div className="absolute inset-0 bg-white flex flex-col">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 border-b border-slate-100"
        style={{ paddingTop: 56, paddingBottom: 14 }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-lg font-extrabold text-slate-900 flex-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Notification
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-5 space-y-5">
        {/* Icon + type badge */}
        <div className="flex items-center gap-3">
          {notification.avatar ? (
            <img
              src={notification.avatar}
              alt=""
              className="w-14 h-14 rounded-2xl object-cover bg-slate-100"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: config.bg }}
            >
              {config.icon}
            </div>
          )}
          <div>
            <span
              className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{
                background: config.bg,
                color: config.color,
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {notification.type}
            </span>
            <p
              className="text-[11px] text-slate-400 mt-1"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {timeAgoToFull(notification.time)}
            </p>
          </div>
        </div>

        {/* Main content card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: `1.5px solid ${config.bg}` }}
        >
          <div className="px-5 py-4" style={{ background: config.bg + '66' }}>
            <h3
              className="text-lg font-bold text-slate-900 mb-2"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {notification.title}
            </h3>
            <p
              className="text-sm text-slate-600 leading-relaxed"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {notification.body}
            </p>
          </div>

          {/* Contextual details based on type */}
          {notification.type === 'booking' && (
            <div className="px-5 py-4 bg-white space-y-2.5">
              {[
                { icon: '🚗', label: 'Route', value: 'Mumbai CST → Pune Deccan' },
                { icon: '📅', label: 'Date', value: 'Sat, 10 Aug 2026 · 07:30 AM' },
                { icon: '👤', label: 'Driver', value: 'Arjun Sharma · ⭐ 4.9' },
                { icon: '💺', label: 'Seat', value: '1 seat confirmed · ₹450' },
                { icon: '🪪', label: 'Booking ID', value: '#SR-2026-08104501' },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-base w-6">{icon}</span>
                  <span className="text-xs text-slate-400 w-16 flex-shrink-0" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</span>
                  <span className="text-xs font-semibold text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {notification.type === 'message' && (
            <div className="px-5 py-4 bg-white">
              <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
                {notification.avatar && (
                  <img src={notification.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-0.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {notification.title.replace('New message from ', '')}
                  </p>
                  <p className="text-xs text-slate-500 italic" style={{ fontFamily: "'Inter', sans-serif" }}>
                    "{notification.body.replace('I will pick you up from the main gate. ', '')}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {notification.type === 'ride' && (
            <div className="px-5 py-4 bg-white">
              <div
                className="flex items-center gap-3 bg-sr-blue-light rounded-xl p-3"
                style={{ border: '1px solid #BFDBFE' }}
              >
                <span className="text-2xl">📍</span>
                <div>
                  <p className="text-xs font-semibold text-sr-blue" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Nearby rides available
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Mumbai → Pune · Prices from ₹380 · Up to 3 seats
                  </p>
                </div>
              </div>
            </div>
          )}

          {notification.type === 'promo' && (
            <div className="px-5 py-4 bg-white">
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
                <div className="text-3xl mb-2">🎁</div>
                <div
                  className="text-2xl font-extrabold text-amber-700 mb-1"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  SHARE20
                </div>
                <p className="text-xs text-amber-600" style={{ fontFamily: "'Inter', sans-serif" }}>
                  20% off your next booking · Valid till 15 Aug 2026
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CTA button */}
        {action && (
          <button
            onClick={() => onNavigate(action.screen)}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${config.color}cc 0%, ${config.color} 100%)`,
              fontFamily: "'Outfit', sans-serif",
              boxShadow: `0 6px 20px ${config.color}44`,
            }}
          >
            {action.label}
          </button>
        )}

        {/* Meta */}
        <div className="bg-slate-50 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-500 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
            Received {notification.time} · Tap to report this notification
          </p>
        </div>
      </div>
    </div>
  )
}
