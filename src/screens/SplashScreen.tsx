import { useEffect, useState } from 'react'

export default function SplashScreen() {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400)
    const t2 = setTimeout(() => setPhase(2), 1000)
    const t3 = setTimeout(() => setPhase(3), 1800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 50%, #1D4ED8 100%)' }}
    >
      {/* Background orbs */}
      <div
        className="absolute rounded-full"
        style={{
          width: 300, height: 300,
          top: -80, right: -80,
          background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 250, height: 250,
          bottom: 60, left: -60,
          background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Grid overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-10" style={{ pointerEvents: 'none' }}>
        <defs>
          <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Logo mark */}
      <div
        className="relative mb-6"
        style={{
          transform: phase >= 1 ? 'scale(1) translateY(0)' : 'scale(0.7) translateY(20px)',
          opacity: phase >= 1 ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center relative"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            {/* Road / path */}
            <path
              d="M8 40 Q14 28 26 20 Q38 12 44 8"
              stroke="rgba(255,255,255,0.3)" strokeWidth="10" strokeLinecap="round"
            />
            <path
              d="M8 40 Q14 28 26 20 Q38 12 44 8"
              stroke="white" strokeWidth="3" strokeLinecap="round"
              strokeDasharray="4 6"
            />
            {/* Car dot */}
            <circle cx="26" cy="20" r="7" fill="white" />
            <circle cx="26" cy="20" r="3.5" fill="#2563EB" />
            {/* Speed lines */}
            <line x1="10" y1="35" x2="3" y2="35" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="40" x2="4" y2="40" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="10" y1="45" x2="3" y2="45" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {/* Pulse ring */}
          <div
            className="absolute inset-0 rounded-3xl border-2 border-white/20"
            style={{
              animation: phase >= 2 ? 'pulse-ring 2.5s ease-out infinite' : 'none',
            }}
          />
        </div>
      </div>

      {/* Brand name */}
      <div
        style={{
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.5s ease-out 0.1s',
        }}
      >
        <h1
          className="text-4xl font-extrabold text-white tracking-tight text-center"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Share<span style={{ color: '#60A5FA' }}>Ride</span>
        </h1>
        <p
          className="text-sm text-white/60 text-center mt-1.5 tracking-wide"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Travel together. Save more.
        </p>
      </div>

      {/* Loading indicator */}
      <div
        className="absolute bottom-20 flex flex-col items-center gap-4"
        style={{
          opacity: phase >= 3 ? 1 : 0,
          transition: 'opacity 0.4s ease-out',
        }}
      >
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-white"
              style={{
                animation: phase >= 3 ? `pulse 1.2s ease-in-out ${i * 0.2}s infinite` : 'none',
                opacity: 0.6,
              }}
            />
          ))}
        </div>
        <span className="text-[11px] text-white/40 tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
          v2.4.0
        </span>
      </div>
    </div>
  )
}
