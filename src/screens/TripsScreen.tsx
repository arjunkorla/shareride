import { useState } from 'react'
import { trips } from '../mockData'
import type { TripStatus } from '../types'

interface Props {
  onSelectRide?: (id: string) => void
  onTrackRide?: (rideId: string) => void
  onRateRide?: (rideId: string) => void
  onCancelRide?: (rideId: string) => void
}

const statusConfig: Record<TripStatus, { label: string; color: string; bg: string }> = {
  upcoming: { label: 'Upcoming', color: '#059669', bg: '#D1FAE5' },
  completed: { label: 'Completed', color: '#2563EB', bg: '#DBEAFE' },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEE2E2' },
}

export default function TripsScreen({ onSelectRide, onTrackRide, onRateRide, onCancelRide }: Props) {
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [tab, setTab] = useState<'upcoming' | 'completed' | 'posted'>('upcoming')

  const requestedTrips = trips.filter((t) => t.type === 'requested')
  const offeredTrips = trips.filter((t) => t.type === 'offered')

  const displayTrips = tab === 'posted'
    ? offeredTrips
    : requestedTrips.filter((t) => tab === 'upcoming' ? t.status === 'upcoming' : t.status !== 'upcoming')

  return (
    <div className="absolute inset-0 bg-sr-bg flex flex-col">
      {/* Header */}
      <div
        className="bg-white border-b border-slate-100 px-5"
        style={{ paddingTop: 56, paddingBottom: 0 }}
      >
        <h2 className="text-xl font-extrabold text-slate-900 pb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
          My Rides
        </h2>

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar">
          {([
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Completed' },
            { id: 'posted', label: 'Offered' },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-shrink-0 pb-3 px-1 mr-4 text-sm font-semibold transition-all"
              style={{
                fontFamily: "'Outfit', sans-serif",
                color: tab === t.id ? '#2563EB' : '#94A3B8',
                borderBottom: tab === t.id ? '2px solid #2563EB' : '2px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trip list */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-4 pb-24 space-y-3">
        {displayTrips.length === 0 ? (
          <EmptyTrips tab={tab} />
        ) : (
          displayTrips.map((trip) => {
            const status = statusConfig[trip.status]
            return (
              <div
                key={trip.id}
                className="bg-white rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)' }}
                onClick={() => onSelectRide?.(trip.ride.id)}
              >
                {/* Status bar */}
                <div
                  className="px-4 pt-3 pb-2 flex items-center justify-between"
                  style={{ background: status.bg }}
                >
                  <span
                    className="text-xs font-bold"
                    style={{ color: status.color, fontFamily: "'Outfit', sans-serif" }}
                  >
                    ● {status.label}
                  </span>
                  <span className="text-xs text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {trip.type === 'requested' ? 'Requested' : 'Offered'} {trip.bookingDate}
                  </span>
                </div>

                <div className="px-4 py-3">
                  {/* Route */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-sr-blue" />
                      <div className="w-0.5 h-10 bg-slate-200" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-sr-red" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between" style={{ height: 56 }}>
                      <div>
                        <div className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                          {trip.ride.fromShort}
                        </div>
                        <div className="text-[11px] text-slate-500">{trip.ride.date} · {trip.ride.time}</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                          {trip.ride.toShort}
                        </div>
                        <div className="text-[11px] text-slate-500">{trip.ride.duration}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        ₹{trip.amount}
                      </div>
                      <div className="text-[10px] text-slate-400">per person</div>
                    </div>
                  </div>

                  {/* Driver info */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                    <img
                      src={trip.ride.driver.avatar}
                      alt={trip.ride.driver.name}
                      className="w-7 h-7 rounded-full object-cover bg-slate-100"
                    />
                    <span className="text-xs text-slate-600 flex-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {trip.type === 'requested' ? 'Driver' : 'Your Offered Ride'}: <span className="font-semibold">{trip.ride.driver.name}</span>
                    </span>
                    <span className="text-xs text-slate-500">{trip.ride.vehicle.make} {trip.ride.vehicle.model}</span>
                  </div>
                </div>

                {/* Cancel confirmation modal */}
                {cancelingId === trip.id && (
                  <div className="mx-4 mb-3 bg-red-50 rounded-2xl p-3 border border-red-100">
                    <p className="text-xs font-semibold text-red-700 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Cancel this trip?</p>
                    <p className="text-[10px] text-red-500 mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                      Cancellations within 1 hour of departure may forfeit the seat amount per our policy.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCancelingId(null)}
                        className="flex-1 py-1.5 rounded-xl bg-white border border-red-200 text-red-600 text-xs font-bold"
                      >
                        Keep Ride
                      </button>
                      <button
                        onClick={() => { setCancelingId(null); onCancelRide?.(trip.ride.id) }}
                        className="flex-1 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold"
                      >
                        Yes, Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {trip.status === 'upcoming' && (
                  <div className="flex gap-2 px-4 pb-3">
                    <button
                      onClick={() => onTrackRide?.(trip.ride.id)}
                      className="flex-1 py-2 rounded-xl bg-sr-blue text-white text-xs font-bold"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      📍 Track Ride
                    </button>
                    <button
                      onClick={() => onSelectRide?.(trip.ride.id)}
                      className="flex-1 py-2 rounded-xl bg-sr-blue-light text-sr-blue text-xs font-bold border border-sr-blue-soft"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => setCancelingId(trip.id)}
                      className="flex-1 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold border border-slate-200"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {trip.status === 'completed' && (
                  <div className="flex gap-2 px-4 pb-3">
                    <button
                      onClick={() => onRateRide?.(trip.ride.id)}
                      className="flex-1 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      ⭐ Rate Ride
                    </button>
                    <button
                      onClick={() => onSelectRide?.(trip.ride.id)}
                      className="flex-1 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold border border-slate-200"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      📄 Details
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function EmptyTrips({ tab }: { tab: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 bg-white rounded-3xl shadow-card flex items-center justify-center mb-5 text-5xl">
        {tab === 'upcoming' ? '🗓️' : tab === 'completed' ? '✅' : '🚗'}
      </div>
      <h3 className="text-lg font-bold text-slate-700 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
        No {tab} trips
      </h3>
      <p className="text-sm text-slate-400 max-w-[200px] leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
        {tab === 'upcoming'
          ? 'Request a ride or offer one to get started!'
          : tab === 'completed'
          ? "You haven't completed any trips yet."
          : "You haven't offered any rides yet."}
      </p>
    </div>
  )
}
