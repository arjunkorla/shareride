import { useState, useEffect } from 'react'
import { rides } from '../mockData'
import MapView from '../components/MapView'

interface Props {
  rideId: string
  onBack: () => void
  onSOS: () => void
}

export default function RideTrackingScreen({ rideId, onBack, onSOS }: Props) {
  const ride = rides.find((r) => r.id === rideId) || rides[0]
  const [etaMinutes, setEtaMinutes] = useState(38)
  const [progress, setProgress] = useState(22)
  const [shareShown, setShareShown] = useState(false)

  useEffect(() => {
    const t = setInterval(() => {
      setEtaMinutes((m) => Math.max(0, m - 1))
      setProgress((p) => Math.min(100, p + 2))
    }, 8000)
    return () => clearInterval(t)
  }, [])

  const formatEta = (m: number) => {
    if (m <= 0) return 'Arriving now'
    const h = Math.floor(m / 60)
    const min = m % 60
    return h > 0 ? `${h}h ${min}m` : `${min} min`
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-900">
      {/* Map fills most of the screen */}
      <div className="flex-1 relative">
        <MapView compact={false} showRoute />

        {/* Top overlay: back + SOS */}
        <div className="absolute top-14 left-4 right-4 flex items-center justify-between z-10">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div
            className="px-3 py-1.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          >
            <p className="text-xs font-bold text-slate-700" style={{ fontFamily: "'Outfit', sans-serif" }}>Live Tracking</p>
          </div>

          <button
            onClick={onSOS}
            className="px-3 py-2 rounded-2xl flex items-center gap-1.5 font-bold text-xs text-white"
            style={{ background: '#DC2626', boxShadow: '0 2px 12px rgba(220,38,38,0.5)' }}
          >
            <span className="text-base leading-none">🆘</span>
            SOS
          </button>
        </div>

        {/* Driver location pulse on map */}
        <div className="absolute" style={{ bottom: '40%', left: '45%' }}>
          <div className="relative">
            <div
              className="w-5 h-5 rounded-full bg-sr-blue border-2 border-white z-10 relative"
              style={{ boxShadow: '0 0 0 4px rgba(37,99,235,0.3)' }}
            />
          </div>
        </div>

        {/* ETA pill */}
        <div
          className="absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl"
          style={{ bottom: 16, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)' }}
        >
          <p className="text-sm font-extrabold text-white text-center" style={{ fontFamily: "'Outfit', sans-serif" }}>
            ETA: {formatEta(etaMinutes)}
          </p>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="bg-white rounded-t-3xl px-5 pt-5 pb-6">
        {/* Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>
            <span>{ride.from}</span>
            <span>{ride.to}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #2563EB, #3B82F6)' }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
            {progress}% complete · {ride.distance}
          </p>
        </div>

        {/* Driver card */}
        <div className="flex items-center gap-3 mb-4 bg-slate-50 rounded-2xl px-4 py-3">
          <img src={ride.driver.avatar} alt={ride.driver.name} className="w-12 h-12 rounded-2xl object-cover" />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{ride.driver.name}</p>
            <p className="text-xs text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>
              {ride.vehicle.make} {ride.vehicle.model} · {ride.vehicle.regNumber}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg active:scale-95 transition-transform"
            >
              📞
            </button>
            <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg active:scale-95 transition-transform">
              💬
            </button>
          </div>
        </div>

        {/* Share location */}
        <button
          onClick={() => setShareShown(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed transition-all"
          style={{
            borderColor: shareShown ? '#BBF7D0' : '#BFDBFE',
            background: shareShown ? '#F0FDF4' : '#EFF6FF',
          }}
        >
          <span className="text-base">{shareShown ? '✅' : '📡'}</span>
          <span
            className="text-sm font-semibold"
            style={{ color: shareShown ? '#059669' : '#2563EB', fontFamily: "'Outfit', sans-serif" }}
          >
            {shareShown ? 'Location shared with emergency contacts' : 'Share live location with contacts'}
          </span>
        </button>
      </div>
    </div>
  )
}
