import { useState } from 'react'
import { reviews } from '../mockData'
import type { Screen } from '../types'

interface Props {
  onNavigate: (screen: Screen) => void
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width="11" height="11" viewBox="0 0 12 12" fill={s <= Math.round(rating) ? '#F59E0B' : '#E2E8F0'}>
          <path d="M6 1L7.5 4.5H11L8.5 7L9.5 10.5L6 8.5L2.5 10.5L3.5 7L1 4.5H4.5L6 1Z" />
        </svg>
      ))}
    </div>
  )
}

export default function ProfileScreen({ onNavigate }: Props) {
  const [tab, setTab] = useState<'about' | 'reviews' | 'vehicles'>('about')

  return (
    <div className="absolute inset-0 bg-sr-bg flex flex-col">
      {/* Header gradient */}
      <div
        className="relative flex-shrink-0"
        style={{
          background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 60%, #2563EB 100%)',
          paddingTop: 56,
          paddingBottom: 70,
        }}
      >
        {/* Settings button */}
        <div className="absolute top-16 right-4 flex items-center gap-2">
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="white" opacity="0.9">
              <path d="M14.5 9C14.5 9.3 14.48 9.6 14.44 9.88L16.1 11.18C16.26 11.31 16.3 11.54 16.2 11.72L14.6 14.5C14.5 14.68 14.27 14.74 14.09 14.68L12.16 13.9C11.74 14.22 11.28 14.48 10.78 14.66L10.5 16.73C10.46 16.93 10.28 17.07 10.07 17.07H6.87C6.66 17.07 6.48 16.93 6.44 16.73L6.16 14.66C5.66 14.48 5.2 14.22 4.78 13.9L2.85 14.68C2.67 14.74 2.44 14.68 2.34 14.5L0.74 11.72C0.64 11.54 0.68 11.31 0.84 11.18L2.5 9.88C2.46 9.6 2.44 9.3 2.44 9C2.44 8.7 2.46 8.4 2.5 8.12L0.84 6.82C0.68 6.69 0.64 6.46 0.74 6.28L2.34 3.5C2.44 3.32 2.67 3.26 2.85 3.32L4.78 4.1C5.2 3.78 5.66 3.52 6.16 3.34L6.44 1.27C6.48 1.07 6.66 0.93 6.87 0.93H10.07C10.28 0.93 10.46 1.07 10.5 1.27L10.78 3.34C11.28 3.52 11.74 3.78 12.16 4.1L14.09 3.32C14.27 3.26 14.5 3.32 14.6 3.5L16.2 6.28C16.3 6.46 16.26 6.69 16.1 6.82L14.44 8.12C14.48 8.4 14.5 8.7 14.5 9ZM9 11.5C10.38 11.5 11.5 10.38 11.5 9C11.5 7.62 10.38 6.5 9 6.5C7.62 6.5 6.5 7.62 6.5 9C6.5 10.38 7.62 11.5 9 11.5Z" />
            </svg>
          </button>
        </div>

        {/* Profile info */}
        <div className="flex flex-col items-center px-6">
          <div className="relative mb-3">
            <div
              className="w-20 h-20 rounded-3xl overflow-hidden border-3 border-white"
              style={{ border: '3px solid rgba(255,255,255,0.3)' }}
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Verification badge */}
            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: '#2563EB', border: '2px solid white' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
                <path d="M2 6L5 9L10 3" strokeWidth="1.8" stroke="white" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <h2
            className="text-xl font-extrabold text-white mb-0.5"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Arjun Sharma
          </h2>
          <p className="text-sm text-white/70 mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>
            +91 98765 43210 · Member since Jan 2022
          </p>

          {/* Stats */}
          <div className="flex gap-6">
            {[
              { value: '4.9', label: 'Rating' },
              { value: '247', label: 'Trips' },
              { value: '3 yrs', label: 'Experience' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div
                  className="text-2xl font-extrabold text-white"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {value}
                </div>
                <div className="text-[11px] text-white/60">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* White card overlapping gradient */}
      <div className="flex-1 overflow-y-auto hide-scrollbar" style={{ marginTop: -40 }}>
        <div className="bg-white rounded-t-3xl overflow-hidden">
          {/* Action buttons */}
          <div className="flex gap-3 px-5 pt-5 pb-4">
            <button
              onClick={() => onNavigate('edit-profile')}
              className="flex-1 flex flex-col items-center gap-1.5 bg-sr-blue-light rounded-2xl py-3 border border-sr-blue-soft active:opacity-80 transition-opacity"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#2563EB">
                <path d="M4 16C4 12.7 6.7 10 10 10S16 12.7 16 16H4ZM10 9C8.3 9 7 7.7 7 6C7 4.3 8.3 3 10 3C11.7 3 13 4.3 13 6C13 7.7 11.7 9 10 9Z" />
              </svg>
              <span className="text-xs font-semibold text-sr-blue" style={{ fontFamily: "'Outfit', sans-serif" }}>Edit Profile</span>
            </button>
            <button onClick={() => onNavigate('verification')} className="flex-1 flex flex-col items-center gap-1.5 bg-amber-50 rounded-2xl py-3 border border-amber-100 active:opacity-80 transition-opacity">
              <span className="text-xl">🪪</span>
              <span className="text-xs font-semibold text-amber-700" style={{ fontFamily: "'Outfit', sans-serif" }}>Verification</span>
            </button>
            <button onClick={() => onNavigate('wallet')} className="flex-1 flex flex-col items-center gap-1.5 bg-green-50 rounded-2xl py-3 border border-green-100 active:opacity-80 transition-opacity">
              <span className="text-xl">💳</span>
              <span className="text-xs font-semibold text-green-700" style={{ fontFamily: "'Outfit', sans-serif" }}>Wallet</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 px-5">
            {(['about', 'reviews', 'vehicles'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 pb-3 text-sm font-semibold capitalize transition-all"
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

          {tab === 'about' && (
            <div className="px-5 py-4 space-y-5">
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-sm text-slate-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                  "Professional driver with a passion for safe travel. I value punctuality and keep my car clean. Non-smoker. Love good music for long drives!"
                </p>
              </div>

              {[
                { icon: '🌍', label: 'Languages', value: 'Hindi, English, Punjabi' },
                { icon: '⏱️', label: 'Response Time', value: '< 5 minutes' },
                { icon: '📅', label: 'Member Since', value: 'January 2022' },
                { icon: '✅', label: 'Verification', value: 'ID, License, Vehicle' },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <span className="text-lg w-8">{icon}</span>
                  <span className="text-sm text-slate-500 flex-1" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</span>
                  <span className="text-sm font-semibold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'reviews' && (
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4">
                <div className="text-center">
                  <div className="text-4xl font-extrabold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>4.9</div>
                  <StarRating rating={4.9} />
                  <div className="text-xs text-slate-500 mt-1">247 reviews</div>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((s) => {
                    const pct = s === 5 ? 85 : s === 4 ? 12 : s === 3 ? 2 : 1
                    return (
                      <div key={s} className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-3">{s}</span>
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 w-5">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {reviews.map((rv) => (
                <div key={rv.id} className="flex gap-3">
                  <img src={rv.avatar} alt={rv.author} className="w-9 h-9 rounded-full object-cover bg-slate-100 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>{rv.author}</span>
                      <StarRating rating={rv.rating} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{rv.comment}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] text-slate-400">{rv.date}</span>
                      {rv.rideRoute && <span className="text-[10px] text-slate-400">· {rv.rideRoute}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'vehicles' && (
            <div className="px-5 py-4 space-y-3">
              {[
                { make: 'Honda', model: 'City ZX', year: '2022', fuel: 'Petrol', color: 'Pearl White', rc: true, ins: true },
                { make: 'Maruti', model: 'Ertiga VXI', year: '2021', fuel: 'CNG', color: 'Cerulean Blue', rc: true, ins: true },
              ].map((v) => (
                <div key={v.model} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl shadow-sm">
                      🚗
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        {v.make} {v.model}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{v.year} · {v.color} · {v.fuel}</div>
                      <div className="flex gap-1.5 mt-1">
                        {v.rc && <span className="text-[9px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full border border-green-100 font-semibold">✓ RC</span>}
                        {v.ins && <span className="text-[9px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full border border-green-100 font-semibold">✓ Insured</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-medium">
                + Add Vehicle
              </button>
            </div>
          )}

          {/* Settings section */}
          <div className="px-5 pb-28 mt-2">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {([
                { icon: '🔔', label: 'Notifications', screen: 'notification-settings' as const },
                { icon: '🔒', label: 'Privacy & Security', screen: 'privacy-security' as const },
                { icon: '🌙', label: 'Dark Mode', screen: 'dark-mode' as const },
                { icon: '🌐', label: 'Language', screen: 'language' as const },
                { icon: '📞', label: 'Emergency Contacts', screen: 'emergency-contacts' as const },
                { icon: '❓', label: 'Help & Support', screen: 'help-support' as const },
                { icon: '📋', label: 'Terms & Conditions', screen: 'terms' as const },
                { icon: '🔐', label: 'Privacy Policy', screen: 'privacy-policy' as const },
              ] as const).map(({ icon, label, screen }, i, arr) => (
                <button
                  key={label}
                  onClick={() => onNavigate(screen)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50 transition-colors ${i < arr.length - 1 ? 'border-b border-slate-50' : ''}`}
                >
                  <span className="text-lg w-7">{icon}</span>
                  <span className="flex-1 text-sm text-slate-700 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4L10 8L6 12" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>

            <button className="w-full mt-3 py-3 rounded-2xl border-2 border-red-100 text-sr-red text-sm font-bold bg-red-50 active:bg-red-100 transition-colors" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
