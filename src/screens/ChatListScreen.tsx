import { chatContacts } from '../mockData'

interface Props {
  onBack?: () => void
  onOpenChat: (id: string) => void
}

export default function ChatListScreen({ onOpenChat }: Props) {
  const totalUnread = chatContacts.reduce((s, c) => s + c.unread, 0)

  return (
    <div className="absolute inset-0 bg-white flex flex-col">
      {/* Header */}
      <div
        className="px-5 border-b border-slate-100"
        style={{ paddingTop: 56, paddingBottom: 14 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Messages
            </h2>
            {totalUnread > 0 && (
              <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="#64748B" strokeWidth="1.4" />
              <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="#64748B" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {chatContacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => onOpenChat(contact.id)}
            className="w-full flex items-start gap-3 px-5 py-4 border-b border-slate-50 active:bg-slate-50 transition-colors text-left"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {contact.avatar ? (
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-12 h-12 rounded-full object-cover bg-slate-100"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', fontFamily: "'Outfit', sans-serif" }}
                >
                  S
                </div>
              )}
              {contact.online && (
                <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-semibold text-slate-900"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {contact.name}
                </span>
                <span
                  className="text-[11px] text-slate-400"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {contact.lastTime}
                </span>
              </div>

              {contact.rideInfo && (
                <div
                  className="text-[10px] text-sr-blue font-medium mb-0.5 flex items-center gap-1"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <span>🚗</span>
                  {contact.rideInfo}
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <p
                  className="text-xs text-slate-500 truncate flex-1"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {contact.lastMessage}
                </p>
                {contact.unread > 0 && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ background: '#2563EB', fontFamily: "'Outfit', sans-serif" }}
                  >
                    {contact.unread}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}

        {/* Empty state hint */}
        <div className="px-5 py-8 text-center">
          <p className="text-xs text-slate-400" style={{ fontFamily: "'Inter', sans-serif" }}>
            Messages are end-to-end encrypted 🔒
          </p>
        </div>
      </div>
    </div>
  )
}
