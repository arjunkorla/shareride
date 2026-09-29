import { useEffect, useState } from 'react'

interface Props {
  type: 'booking' | 'ride-published'
  onDone: () => void
}

export default function SuccessScreen({ type, onDone }: Props) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 200)
    return () => clearTimeout(t)
  }, [])

  const isRequest = type === 'booking'

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
      style={{
        background: isRequest
          ? 'linear-gradient(160deg, #EFF6FF 0%, #DBEAFE 100%)'
          : 'linear-gradient(160deg, #ECFDF5 0%, #D1FAE5 100%)',
      }}
    >
      {/* Animated circle */}
      <div
        className="relative mb-8"
        style={{
          transform: phase ? 'scale(1)' : 'scale(0)',
          opacity: phase ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{
            background: isRequest ? '#2563EB' : '#059669',
            boxShadow: isRequest
              ? '0 0 0 16px rgba(37,99,235,0.12), 0 0 0 32px rgba(37,99,235,0.06)'
              : '0 0 0 16px rgba(5,150,105,0.12), 0 0 0 32px rgba(5,150,105,0.06)',
          }}
        >
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            {isRequest ? (
              /* Paper plane icon for Request Sent */
              <path
                d="M10 26L42 10L30 42L24 28L10 26Z"
                stroke="white"
                strokeWidth="3"
                strokeLinejoin="round"
                fill="none"
                style={{
                  strokeDasharray: 80,
                  strokeDashoffset: phase ? 0 : 80,
                  transition: 'stroke-dashoffset 0.6s ease 0.3s',
                }}
              />
            ) : (
              /* Checkmark for published */
              <path
                d="M12 26L22 36L40 16"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: 50,
                  strokeDashoffset: phase ? 0 : 50,
                  transition: 'stroke-dashoffset 0.6s ease 0.3s',
                }}
              />
            )}
          </svg>
        </div>
      </div>

      <div
        style={{
          opacity: phase ? 1 : 0,
          transform: phase ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.5s ease 0.4s',
        }}
      >
        <h2
          className="text-3xl font-extrabold mb-3"
          style={{ fontFamily: "'Outfit', sans-serif", color: isRequest ? '#1D4ED8' : '#047857' }}
        >
          {isRequest ? 'Request Sent!' : 'Ride Published!'}
        </h2>
        <p
          className="text-sm leading-relaxed mb-8"
          style={{ fontFamily: "'Inter', sans-serif", color: isRequest ? '#1E40AF' : '#065F46' }}
        >
          {isRequest
            ? 'Your ride request is live. Matching drivers will be notified and can accept your request.'
            : 'Your offered ride is live! Passengers on matching routes can now send you a ride request.'}
        </p>

        {/* Info card */}
        <div
          className="rounded-2xl p-4 mb-8 text-left"
          style={{ background: 'rgba(255,255,255,0.6)', border: `1px solid ${isRequest ? '#BFDBFE' : '#A7F3D0'}` }}
        >
          {isRequest ? (
            <div className="space-y-2">
              {[
                { icon: '🗺️', label: 'Madhapur → Gachibowli' },
                { icon: '📅', label: 'Tomorrow · 08:00 AM' },
                { icon: '🔍', label: '3 matching drivers found nearby' },
                { icon: '⏱️', label: 'Driver will confirm shortly' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-slate-700" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { icon: '🗺️', label: 'Madhapur → Gachibowli' },
                { icon: '📅', label: 'Tomorrow · 08:00 AM' },
                { icon: '📢', label: 'Visible to matching passengers' },
                { icon: '🔔', label: 'Notify me when someone requests' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-slate-700" style={{ fontFamily: "'Inter', sans-serif" }}>
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onDone}
          className="w-full py-3.5 rounded-2xl font-bold text-base text-white transition-all active:scale-95"
          style={{
            background: isRequest
              ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
              : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            fontFamily: "'Outfit', sans-serif",
            boxShadow: isRequest ? '0 8px 24px rgba(37,99,235,0.4)' : '0 8px 24px rgba(5,150,105,0.4)',
          }}
        >
          {isRequest ? 'View My Requests →' : 'View My Rides →'}
        </button>
      </div>
    </div>
  )
}
