import { useState } from 'react'

interface Props {
  onBack: () => void
}

interface SettingGroup {
  title: string
  items: { id: string; label: string; desc?: string; default: boolean }[]
}

const groups: SettingGroup[] = [
  {
    title: 'Ride Activity',
    items: [
      { id: 'ride_req', label: 'Ride Requests', desc: 'When a passenger requests your ride', default: true },
      { id: 'booking_conf', label: 'Booking Confirmed', desc: 'When your booking is accepted', default: true },
      { id: 'ride_cancel', label: 'Ride Cancelled', desc: 'When a ride or booking is cancelled', default: true },
      { id: 'ride_update', label: 'Ride Updates', desc: 'Driver arriving, ride started, completed', default: true },
    ],
  },
  {
    title: 'Messages',
    items: [
      { id: 'new_msg', label: 'New Messages', desc: 'Chat messages from drivers or passengers', default: true },
      { id: 'typing', label: 'Typing Indicators', default: false },
      { id: 'read_rcpts', label: 'Read Receipts', default: true },
    ],
  },
  {
    title: 'Nearby & Discovery',
    items: [
      { id: 'nearby_rides', label: 'Nearby Rides', desc: 'New rides matching your saved routes', default: true },
      { id: 'price_drop', label: 'Price Drops', desc: 'When ride prices on your route drop', default: false },
    ],
  },
  {
    title: 'Account & Security',
    items: [
      { id: 'verify_update', label: 'Verification Updates', desc: 'Status changes on your documents', default: true },
      { id: 'login_alert', label: 'Login Alerts', desc: 'New sign-in from unfamiliar device', default: true },
    ],
  },
  {
    title: 'Promotions',
    items: [
      { id: 'offers', label: 'Offers & Discounts', desc: 'Special deals and promo codes', default: false },
      { id: 'newsletter', label: 'Newsletter', default: false },
    ],
  },
]

export default function NotificationSettingsScreen({ onBack }: Props) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.flatMap((g) => g.items.map((i) => [i.id, i.default])))
  )

  const toggle = (id: string) => setEnabled((e) => ({ ...e, [id]: !e[id] }))

  return (
    <div className="absolute inset-0 bg-sr-bg flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4" style={{ paddingTop: 56, paddingBottom: 14 }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="text-lg font-extrabold text-slate-900 flex-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Notification Settings
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-4 pb-8 space-y-4">
        {/* Push notifications banner */}
        <div className="bg-sr-blue-light rounded-2xl p-4 flex items-center gap-3 border border-sr-blue-soft">
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-sr-blue" style={{ fontFamily: "'Outfit', sans-serif" }}>Push Notifications Enabled</p>
            <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>Notifications are allowed for ShareRide</p>
          </div>
          <span className="text-xs text-sr-blue font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>Change</span>
        </div>

        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              {group.title}
            </h3>
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)' }}>
              {group.items.map((item, i) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${i < group.items.length - 1 ? 'border-b border-slate-50' : ''}`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>{item.label}</p>
                    {item.desc && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                    )}
                  </div>
                  <button
                    onClick={() => toggle(item.id)}
                    className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
                    style={{ background: enabled[item.id] ? '#2563EB' : '#CBD5E1' }}
                  >
                    <div
                      className="w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all"
                      style={{ left: enabled[item.id] ? '1.375rem' : '0.125rem' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
