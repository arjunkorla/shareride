import type { Screen } from '../types'

interface Props {
  active: Screen
  onNavigate: (screen: Screen) => void
  onPostRide: () => void
  unreadNotifications?: number
}

const HomeIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M2 9.5L11 2L20 9.5V20C20 20.55 19.55 21 19 21H14V15H8V21H3C2.45 21 2 20.55 2 20V9.5Z"
      fill={filled ? '#2563EB' : 'none'} stroke={filled ? '#2563EB' : '#94A3B8'} strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
)

const SearchIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="10" cy="10" r="7" fill={filled ? '#EFF6FF' : 'none'} stroke={filled ? '#2563EB' : '#94A3B8'} strokeWidth="1.6" />
    <line x1="15.5" y1="15.5" x2="20" y2="20" stroke={filled ? '#2563EB' : '#94A3B8'} strokeWidth="1.8" strokeLinecap="round" />
    {filled && <circle cx="10" cy="10" r="3.5" fill="#2563EB" fillOpacity="0.3" />}
  </svg>
)

const TripsIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="4" width="18" height="15" rx="2.5" fill={filled ? '#EFF6FF' : 'none'} stroke={filled ? '#2563EB' : '#94A3B8'} strokeWidth="1.6" />
    <line x1="2" y1="9" x2="20" y2="9" stroke={filled ? '#2563EB' : '#94A3B8'} strokeWidth="1.4" />
    <circle cx="7" cy="3" r="1.5" fill={filled ? '#2563EB' : '#94A3B8'} />
    <circle cx="15" cy="3" r="1.5" fill={filled ? '#2563EB' : '#94A3B8'} />
    <line x1="6" y1="13.5" x2="11" y2="13.5" stroke={filled ? '#2563EB' : '#94A3B8'} strokeWidth="1.4" strokeLinecap="round" />
    <line x1="6" y1="16.5" x2="9" y2="16.5" stroke={filled ? '#2563EB' : '#94A3B8'} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)

const ChatIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M19 3H3C2.45 3 2 3.45 2 4V15C2 15.55 2.45 16 3 16H6L11 21L16 16H19C19.55 16 20 15.55 20 15V4C20 3.45 19.55 3 19 3Z"
      fill={filled ? '#EFF6FF' : 'none'} stroke={filled ? '#2563EB' : '#94A3B8'} strokeWidth="1.6" strokeLinejoin="round" />
    {filled && <>
      <circle cx="7.5" cy="9.5" r="1.2" fill="#2563EB" />
      <circle cx="11" cy="9.5" r="1.2" fill="#2563EB" />
      <circle cx="14.5" cy="9.5" r="1.2" fill="#2563EB" />
    </>}
  </svg>
)

const ProfileIcon = ({ filled }: { filled: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="8" r="4" fill={filled ? '#EFF6FF' : 'none'} stroke={filled ? '#2563EB' : '#94A3B8'} strokeWidth="1.6" />
    <path d="M3 20C3 16.7 6.6 14 11 14C15.4 14 19 16.7 19 20"
      stroke={filled ? '#2563EB' : '#94A3B8'} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

const PlusIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <line x1="13" y1="5" x2="13" y2="21" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="5" y1="13" x2="21" y2="13" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)

export default function BottomNav({ active, onNavigate, onPostRide, unreadNotifications = 0 }: Props) {
  const items = [
    { id: 'home' as Screen, label: 'Home', Icon: HomeIcon },
    { id: 'search' as Screen, label: 'Discover', Icon: SearchIcon },
    { id: 'trips' as Screen, label: 'My Rides', Icon: TripsIcon },
    { id: 'chat-list' as Screen, label: 'Chat', Icon: ChatIcon },
    { id: 'profile' as Screen, label: 'Profile', Icon: ProfileIcon },
  ]

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-40 shadow-bottom"
      style={{ height: 80, paddingBottom: 20 }}
    >
      <div className="absolute inset-0 bg-white border-t border-slate-100" />
      <div className="relative h-full flex items-center justify-around px-2">
        {items.map((item, i) => {
          const isMiddle = i === 2
          if (isMiddle) {
            return (
              <button
                key={item.id}
                onClick={onPostRide}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 60%, #1D4ED8 100%)',
                    boxShadow: '0 6px 20px rgba(37,99,235,0.4)',
                  }}
                >
                  <PlusIcon />
                </div>
                <span className="text-[10px] mt-1 font-medium text-sr-blue" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Post
                </span>
              </button>
            )
          }

          const isActive = active === item.id
          const showBadge = item.id === 'chat-list' && unreadNotifications > 0
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center justify-center gap-0.5 w-12 pt-2 relative"
            >
              <div className="relative">
                <item.Icon filled={isActive} />
                {showBadge && (
                  <div
                    className="absolute -top-1 -right-1 min-w-[14px] h-3.5 rounded-full flex items-center justify-center px-0.5"
                    style={{ background: '#EF4444', fontSize: 8, color: 'white', fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
                  >
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </div>
                )}
              </div>
              <span
                className="text-[10px] font-medium mt-0.5"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: isActive ? '#2563EB' : '#94A3B8',
                }}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-sr-blue mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
