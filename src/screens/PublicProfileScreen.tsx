import { rides } from '../mockData'

interface Props {
  driverId: string
  onBack: () => void
  onChat?: () => void
  onBookRide?: () => void
}

export default function PublicProfileScreen({ driverId, onBack, onChat, onBookRide }: Props) {
  const ride = rides.find((r) => r.driver.id === driverId) || rides[0]
  const driver = ride.driver

  const stats = [
    { value: String(driver.rating), label: 'Rating' },
    { value: String(driver.trips), label: 'Trips' },
    { value: `${driver.yearsActive}yr`, label: 'Active' },
  ]

  const reviews = [
    { author: 'Priya Nair', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop', rating: 5, comment: 'Very punctual and friendly. Car was spotless!', date: '2 days ago' },
    { author: 'Ravi Kumar', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop', rating: 4, comment: 'Great ride, took the best route. Would book again.', date: '1 week ago' },
  ]

  return (
    <div className="absolute inset-0 bg-sr-bg flex flex-col overflow-y-auto hide-scrollbar">
      {/* Gradient header */}
      <div
        className="relative flex-shrink-0 flex flex-col items-center pb-8"
        style={{
          background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 60%, #2563EB 100%)',
          paddingTop: 60,
        }}
      >
        <button
          onClick={onBack}
          className="absolute top-14 left-4 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Verified badge */}
        {driver.verified && (
          <div
            className="absolute top-14 right-4 px-2.5 py-1 rounded-xl flex items-center gap-1"
            style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5L4 7L8 3" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] font-bold text-green-400">Verified</span>
          </div>
        )}

        <div className="relative mb-3">
          <div className="w-24 h-24 rounded-3xl overflow-hidden" style={{ border: '3px solid rgba(255,255,255,0.25)' }}>
            <img src={driver.avatar} alt={driver.name} className="w-full h-full object-cover" />
          </div>
          <div
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: '#2563EB', border: '2px solid white' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="white">
              <path d="M2 6L5 9L10 3" strokeWidth="1.8" stroke="white" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-extrabold text-white mb-0.5" style={{ fontFamily: "'Outfit', sans-serif" }}>{driver.name}</h2>
        <p className="text-sm text-white/60 mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Member since {driver.memberSince}</p>

        <div className="flex gap-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</div>
              <div className="text-[11px] text-white/60">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-t-3xl flex-1 px-5 pt-5 pb-8 space-y-5" style={{ marginTop: -20 }}>
        {/* Bio */}
        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-sm text-slate-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
            "{driver.bio}"
          </p>
        </div>

        {/* Info grid */}
        <div className="space-y-3">
          {[
            { icon: '🌍', label: 'Languages', value: driver.languages.join(', ') },
            { icon: '⏱️', label: 'Response time', value: driver.responseTime },
            { icon: '🚗', label: 'Vehicle', value: `${ride.vehicle.make} ${ride.vehicle.model} (${ride.vehicle.year})` },
            { icon: '⛽', label: 'Fuel type', value: ride.vehicle.fuelType },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
              <span className="text-lg w-8">{icon}</span>
              <span className="text-sm text-slate-500 flex-1" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</span>
              <span className="text-sm font-semibold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Amenities */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>Ride Amenities</p>
          <div className="flex flex-wrap gap-2">
            {ride.amenities.map((a) => (
              <span key={a} className="text-xs bg-sr-blue-light text-sr-blue font-semibold px-3 py-1.5 rounded-xl border border-sr-blue-soft" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Recent reviews */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Recent Reviews</p>
          <div className="space-y-3">
            {reviews.map((rv, i) => (
              <div key={i} className="flex gap-3">
                <img src={rv.avatar} alt={rv.author} className="w-9 h-9 rounded-full object-cover bg-slate-100 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>{rv.author}</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <svg key={s} width="10" height="10" viewBox="0 0 12 12" fill={s <= rv.rating ? '#F59E0B' : '#E2E8F0'}>
                          <path d="M6 1L7.5 4.5H11L8.5 7L9.5 10.5L6 8.5L2.5 10.5L3.5 7L1 4.5H4.5L6 1Z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{rv.comment}</p>
                  <span className="text-[10px] text-slate-400">{rv.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {onChat && (
            <button
              onClick={onChat}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm border-2 border-sr-blue text-sr-blue active:bg-sr-blue-light transition-colors"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Message
            </button>
          )}
          {onBookRide && (
            <button
              onClick={onBookRide}
              className="flex-[2] py-3.5 rounded-2xl text-white font-bold text-sm"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
              }}
            >
              Book a Ride
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
