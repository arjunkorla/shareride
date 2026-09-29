import { useState } from 'react'
import { rides } from '../mockData'

interface Props {
  rideId: string
  onDone: () => void
  onTrackRide: () => void
}

export default function BookingConfirmationScreen({ rideId, onDone, onTrackRide }: Props) {
  const ride = rides.find((r) => r.id === rideId) || rides[0]
  const [added, setAdded] = useState(false)
  const requestCode = 'SR-REQ-' + rideId.toUpperCase() + '-2026'

  const QR = () => (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="22" height="22" rx="3" fill="#0F172A" />
      <rect x="8" y="8" width="14" height="14" rx="1" fill="white" />
      <rect x="11" y="11" width="8" height="8" rx="1" fill="#0F172A" />
      <rect x="62" y="4" width="22" height="22" rx="3" fill="#0F172A" />
      <rect x="66" y="8" width="14" height="14" rx="1" fill="white" />
      <rect x="69" y="11" width="8" height="8" rx="1" fill="#0F172A" />
      <rect x="4" y="62" width="22" height="22" rx="3" fill="#0F172A" />
      <rect x="8" y="66" width="14" height="14" rx="1" fill="white" />
      <rect x="11" y="69" width="8" height="8" rx="1" fill="#0F172A" />
      {[32,36,40,44,48,52].map((x) => [32,36,40,44,48,52,56,60].map((y) => (
        Math.sin(x * y) > 0.1 ? <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" fill="#0F172A" /> : null
      )))}
      {[8,12,16,20,24,28].map((x) => [34,38,42,46,50,54,58].map((y) => (
        Math.cos(x + y) > 0.3 ? <rect key={`c${x}-${y}`} x={x} y={y} width="3" height="3" fill="#0F172A" /> : null
      )))}
      {[62,66,70,74,78,82].map((x) => [34,38,42,46,50,54,58].map((y) => (
        Math.sin(x - y) > 0.2 ? <rect key={`d${x}-${y}`} x={x} y={y} width="3" height="3" fill="#0F172A" /> : null
      )))}
    </svg>
  )

  return (
    <div className="absolute inset-0 bg-sr-bg flex flex-col overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div
        className="relative flex flex-col items-center pt-16 pb-8 px-6"
        style={{ background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 55%, #2563EB 100%)' }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.25)' }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" fill="#3B82F6" />
            {/* Paper plane */}
            <path d="M8 18L28 10L22 28L17 19L8 18Z" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Request Sent!
        </h2>
        <p className="text-sm text-white/60 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
          The driver will confirm your ride shortly.
        </p>
        <div
          className="mt-4 px-4 py-2 rounded-2xl flex items-center gap-2"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <span className="text-xs text-white/60" style={{ fontFamily: "'Inter', sans-serif" }}>Request ID</span>
          <span className="text-sm font-bold text-white tracking-wider" style={{ fontFamily: "'Outfit', sans-serif" }}>{requestCode}</span>
        </div>
      </div>

      {/* Status timeline */}
      <div className="mx-4 mt-4 bg-white rounded-2xl px-4 py-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>What happens next</p>
        <div className="space-y-2">
          {[
            { step: '✉️', label: 'Request Sent', done: true },
            { step: '⏳', label: 'Waiting for Driver Acceptance', done: false },
            { step: '✅', label: 'Ride Confirmed', done: false },
            { step: '🚗', label: 'Driver Arriving', done: false },
          ].map(({ step, label, done }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                style={{ background: done ? '#EFF6FF' : '#F8FAFC', border: `1px solid ${done ? '#BFDBFE' : '#E2E8F0'}` }}
              >
                {step}
              </div>
              <span
                className="text-sm"
                style={{ color: done ? '#1D4ED8' : '#94A3B8', fontFamily: "'Inter', sans-serif", fontWeight: done ? 600 : 400 }}
              >{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-10">
        {/* Ride summary card */}
        <div className="bg-white rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-50">
            <img src={ride.driver.avatar} alt={ride.driver.name} className="w-12 h-12 rounded-2xl object-cover bg-slate-100" />
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{ride.driver.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="#F59E0B"><path d="M6 1L7.5 4.5H11L8.5 7L9.5 10.5L6 8.5L2.5 10.5L3.5 7L1 4.5H4.5L6 1Z" /></svg>
                <span className="text-xs text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>{ride.driver.rating} · {ride.driver.trips} rides</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400" style={{ fontFamily: "'Inter', sans-serif" }}>Vehicle</p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {ride.vehicle.make} {ride.vehicle.model}
              </p>
            </div>
          </div>

          {/* Route timeline */}
          <div className="flex gap-3 mb-4">
            <div className="flex flex-col items-center gap-1 pt-1">
              <div className="w-3 h-3 rounded-full border-2 border-sr-blue bg-white" />
              <div className="w-0.5 h-8 bg-slate-200" />
              <div className="w-3 h-3 rounded-full bg-sr-blue" />
            </div>
            <div className="flex flex-col justify-between flex-1" style={{ minHeight: 52 }}>
              <div>
                <p className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{ride.from}</p>
                <p className="text-[11px] text-slate-400">{ride.date} · {ride.time}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{ride.to}</p>
                <p className="text-[11px] text-slate-400">{ride.duration} · {ride.distance}</p>
              </div>
            </div>
          </div>

          {/* Price row */}
          <div className="flex gap-3">
            <div className="flex-1 bg-slate-50 rounded-2xl px-3 py-2.5 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>Price</p>
              <p className="text-lg font-extrabold text-sr-blue mt-0.5" style={{ fontFamily: "'Outfit', sans-serif" }}>₹{ride.price}</p>
              <p className="text-[9px] text-slate-400">per person</p>
            </div>
            <div className="flex-1 bg-slate-50 rounded-2xl px-3 py-2.5 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>Status</p>
              <p className="text-sm font-extrabold text-blue-600 mt-0.5" style={{ fontFamily: "'Outfit', sans-serif" }}>Pending</p>
              <p className="text-[9px] text-slate-400">awaiting driver</p>
            </div>
            <div className="flex-1 bg-slate-50 rounded-2xl px-3 py-2.5 text-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>Match</p>
              <p className="text-sm font-extrabold text-green-600 mt-0.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {ride.matchScore === 'great' ? '🎯' : ride.matchScore === 'good' ? '✅' : '🔶'}
              </p>
              <p className="text-[9px] text-slate-400">{ride.matchScore} match</p>
            </div>
          </div>
        </div>

        {/* QR / ID card */}
        <div className="bg-white rounded-3xl p-5 flex flex-col items-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>
            Your Request Code
          </p>
          <div className="p-3 bg-white rounded-2xl border-2 border-slate-100">
            <QR />
          </div>
          <p className="text-sm font-bold text-slate-700 mt-3 tracking-widest" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {requestCode}
          </p>
        </div>

        {/* Calendar */}
        <button
          onClick={() => setAdded(true)}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-3xl border transition-all"
          style={{
            background: added ? '#F0FDF4' : 'white',
            borderColor: added ? '#BBF7D0' : '#E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <span className="text-2xl">{added ? '✅' : '📅'}</span>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold" style={{ color: added ? '#059669' : '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
              {added ? 'Added to Calendar' : 'Add to Calendar'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: added ? '#059669' : '#64748B', fontFamily: "'Inter', sans-serif" }}>
              {ride.date} · {ride.time} · {ride.from}
            </p>
          </div>
          {!added && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onTrackRide}
            className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', fontFamily: "'Outfit', sans-serif", boxShadow: '0 6px 20px rgba(37,99,235,0.35)' }}
          >
            Track Ride
          </button>
          <button
            onClick={onDone}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm border border-slate-200 text-slate-700"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            My Trips
          </button>
        </div>
      </div>
    </div>
  )
}
