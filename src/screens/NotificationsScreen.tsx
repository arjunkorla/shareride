import { useState } from 'react'
import { notifications } from '../mockData'
import type { Notification } from '../types'

interface Props {
  onBack: () => void
  onSelectNotification?: (id: string) => void
}

const typeConfig: Record<Notification['type'], { icon: string; bg: string; color: string }> = {
  booking: { icon: '✅', bg: '#D1FAE5', color: '#059669' },
  message: { icon: '💬', bg: '#DBEAFE', color: '#2563EB' },
  ride: { icon: '🚗', bg: '#EFF6FF', color: '#3B82F6' },
  system: { icon: '🔔', bg: '#F1F5F9', color: '#64748B' },
  promo: { icon: '🎉', bg: '#FEF3C7', color: '#D97706' },
}

export default function NotificationsScreen({ onBack, onSelectNotification }: Props) {
  const [notifs, setNotifs] = useState(notifications)

  const markAllRead = () => setNotifs((n) => n.map((x) => ({ ...x, read: true })))
  const unreadCount = notifs.filter((n) => !n.read).length

  return (
    <div className="absolute inset-0 bg-white flex flex-col">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 border-b border-slate-100"
        style={{ paddingTop: 56, paddingBottom: 14 }}
      >
        <button onClick={onBack} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-extrabold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Notifications
          </h2>
          {unreadCount > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">{unreadCount} new</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-sr-blue font-semibold px-3 py-1.5 rounded-xl border border-sr-blue-soft"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">No notifications</h3>
            <p className="text-sm text-slate-400">You're all caught up!</p>
          </div>
        ) : (
          notifs.map((notif) => {
            const config = typeConfig[notif.type]
            return (
              <button
                key={notif.id}
                onClick={() => {
                  setNotifs((n) => n.map((x) => x.id === notif.id ? { ...x, read: true } : x))
                  onSelectNotification?.(notif.id)
                }}
                className="w-full flex items-start gap-3 px-5 py-4 border-b border-slate-50 active:bg-slate-50 text-left transition-colors"
                style={{ background: notif.read ? 'white' : '#F8FAFF' }}
              >
                {/* Icon or avatar */}
                {notif.avatar ? (
                  <img src={notif.avatar} alt="" className="w-11 h-11 rounded-full object-cover bg-slate-100 flex-shrink-0" />
                ) : (
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{ background: config.bg }}
                  >
                    {config.icon}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="text-sm font-semibold text-slate-900 leading-snug"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      {notif.title}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] text-slate-400">{notif.time}</span>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-sr-blue flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  <p
                    className="text-xs text-slate-500 mt-0.5 leading-relaxed"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {notif.body}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
