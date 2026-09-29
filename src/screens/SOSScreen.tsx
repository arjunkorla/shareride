import { useState } from 'react'

interface Props {
  onClose: () => void
}

export default function SOSScreen({ onClose }: Props) {
  const [calling, setCalling] = useState<string | null>(null)
  const [shared, setShared] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  const startCall = (type: string) => {
    setCalling(type)
    setCountdown(3)
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c === null || c <= 1) { clearInterval(t); return null }
        return c - 1
      })
    }, 1000)
  }

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ background: 'linear-gradient(160deg, #7F1D1D 0%, #991B1B 40%, #DC2626 100%)' }}
    >
      {/* Close button */}
      <div className="flex justify-end px-5 pt-14">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Pulsing SOS badge */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative mb-8">
          <div
            className="absolute inset-0 rounded-full bg-white/10"
            style={{ animation: 'pulse-ring 1.5s ease-out infinite', transform: 'scale(1.4)' }}
          />
          <div
            className="absolute inset-0 rounded-full bg-white/10"
            style={{ animation: 'pulse-ring 1.5s ease-out 0.5s infinite', transform: 'scale(1.2)' }}
          />
          <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center relative z-10">
            <span className="text-5xl">🆘</span>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-2 text-center" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Emergency SOS
        </h1>
        <p className="text-sm text-white/70 text-center mb-10 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
          Your location is being tracked. Choose an action below.
        </p>

        {/* Emergency actions */}
        <div className="w-full space-y-3">
          {[
            { id: 'police', icon: '🚔', label: 'Call Police', sub: '100', color: 'rgba(255,255,255,0.15)' },
            { id: 'ambulance', icon: '🚑', label: 'Call Ambulance', sub: '108', color: 'rgba(255,255,255,0.15)' },
            { id: 'helpline', icon: '📞', label: "Women's Helpline", sub: '1091', color: 'rgba(255,255,255,0.15)' },
          ].map(({ id, icon, label, sub, color }) => (
            <button
              key={id}
              onClick={() => startCall(id)}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl active:scale-[0.98] transition-transform text-left"
              style={{ background: calling === id ? 'rgba(255,255,255,0.3)' : color, border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <span className="text-3xl">{icon}</span>
              <div className="flex-1">
                <p className="text-base font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{label}</p>
                <p className="text-sm text-white/70" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {calling === id && countdown !== null ? `Calling in ${countdown}s...` : `Dial ${sub}`}
                </p>
              </div>
              {calling === id ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M6 4L12 9L6 14" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Share location */}
        <button
          onClick={() => setShared(true)}
          className="w-full mt-4 flex items-center gap-3 px-5 py-4 rounded-2xl text-left"
          style={{
            background: shared ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${shared ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.15)'}`,
          }}
        >
          <span className="text-2xl">{shared ? '✅' : '📡'}</span>
          <div>
            <p className="text-sm font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {shared ? 'Location Shared!' : 'Share Live Location'}
            </p>
            <p className="text-xs text-white/60" style={{ fontFamily: "'Inter', sans-serif" }}>
              {shared ? 'Sent to Meera Sharma & Ravi Sharma' : 'Send to your emergency contacts now'}
            </p>
          </div>
        </button>
      </div>

      {/* Safe footer */}
      <div className="px-5 pb-10">
        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-bold text-sm text-white/80 border border-white/20"
          style={{ fontFamily: "'Outfit', sans-serif", background: 'rgba(255,255,255,0.08)' }}
        >
          I am Safe — Dismiss
        </button>
      </div>
    </div>
  )
}
