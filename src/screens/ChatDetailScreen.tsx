import { useState, useRef, useEffect } from 'react'
import { chatContacts, chatMessages } from '../mockData'

interface Props {
  contactId: string
  onBack: () => void
  onViewRide?: () => void
}

export default function ChatDetailScreen({ contactId, onBack, onViewRide }: Props) {
  const contact = chatContacts.find((c) => c.id === contactId) || chatContacts[0]
  const [messages, setMessages] = useState(chatMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim()) return
    const msg = {
      id: `m${Date.now()}`,
      senderId: 'me',
      text: input,
      time: 'Now',
      read: false,
      type: 'text' as const,
    }
    setMessages((m) => [...m, msg])
    setInput('')

    // Simulate typing then reply
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessages((m) => [
        ...m,
        {
          id: `m${Date.now()}`,
          senderId: contact.id,
          text: 'Got it! See you there. Safe travels! 👍',
          time: 'Now',
          read: true,
          type: 'text' as const,
        },
      ])
    }, 2000)
  }

  const quickReplies = [
    'Where should we meet?',
    "I'm on my way",
    "I'm here!",
    'Running 5 min late',
    'Can you share location?',
    'See you then! 👍',
  ]

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50">
      {/* Header */}
      <div
        className="bg-white border-b border-slate-100 flex items-center gap-3 px-4 shadow-sm"
        style={{ paddingTop: 56, paddingBottom: 12 }}
      >
        <button onClick={onBack} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {contact.avatar ? (
          <div className="relative">
            <img src={contact.avatar} alt={contact.name} className="w-9 h-9 rounded-full object-cover bg-slate-100" />
            {contact.online && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
            )}
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-sr-blue flex items-center justify-center text-white font-bold text-sm">S</div>
        )}

        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {contact.name}
          </h3>
          {contact.rideInfo && (
            <p className="text-[10px] text-sr-blue font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
              🚗 {contact.rideInfo}
            </p>
          )}
          {!contact.rideInfo && (
            <p className="text-[10px] text-slate-400" style={{ fontFamily: "'Inter', sans-serif" }}>
              {contact.online ? 'Online' : 'Last seen 1h ago'}
            </p>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="3" r="1.2" fill="#64748B" />
              <circle cx="8" cy="8" r="1.2" fill="#64748B" />
              <circle cx="8" cy="13" r="1.2" fill="#64748B" />
            </svg>
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-11 bg-white rounded-2xl overflow-hidden z-50"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)', minWidth: 180 }}
            >
              {[
                { icon: '🚗', label: 'View Ride', action: () => { setShowMenu(false); onViewRide?.() } },
                { icon: '🔇', label: 'Mute Notifications', action: () => setShowMenu(false) },
                { icon: '🚩', label: 'Report User', action: () => { setShowMenu(false); setShowReport(true) } },
                { icon: '🚫', label: 'Block User', action: () => setShowMenu(false) },
              ].map(({ icon, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                  style={{ fontFamily: "'Inter', sans-serif", color: label.includes('Block') || label.includes('Report') ? '#DC2626' : '#0F172A' }}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report modal */}
      {showReport && (
        <div
          className="absolute inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowReport(false)}
        >
          <div className="bg-white rounded-t-3xl px-5 pt-5 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <h3 className="text-base font-extrabold text-slate-900 mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>Report User</h3>
            <div className="space-y-2">
              {['Inappropriate behavior', 'No show / late pickup', 'Unsafe driving', 'Harassment', 'Spam', 'Other'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setShowReport(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 text-sm text-slate-700 text-left hover:bg-slate-100 transition-colors"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <div className="w-2 h-2 rounded-full border-2 border-slate-300 flex-shrink-0" />
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ride info banner */}
      {contact.rideInfo && (
        <div
          className="mx-4 mt-3 bg-sr-blue-light rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ border: '1px solid #BFDBFE' }}
        >
          <span className="text-xl">🚗</span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-sr-blue" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {contact.rideInfo}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
              Ride confirmed · Match accepted
            </p>
          </div>
          <button
            onClick={onViewRide}
            className="text-xs text-sr-blue font-semibold px-2 py-1 bg-white rounded-lg border border-sr-blue-soft active:bg-slate-50 transition-colors"
          >
            View
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-4 pb-2 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === 'me'
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {!isMe && (
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-7 h-7 rounded-full object-cover bg-slate-100 flex-shrink-0 mb-1"
                />
              )}
              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    background: isMe ? '#2563EB' : 'white',
                    color: isMe ? 'white' : '#0F172A',
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: isMe ? 16 : 4,
                    boxShadow: isMe ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  {msg.text}
                </div>
                <div className={`flex items-center gap-1 mt-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px] text-slate-400">{msg.time}</span>
                  {isMe && (
                    <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
                      <path d="M1 4L4 7L9 1" stroke={msg.read ? '#2563EB' : '#94A3B8'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5 4L8 7L13 1" stroke={msg.read ? '#2563EB' : '#94A3B8'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-end gap-2">
            <img src={contact.avatar} alt="" className="w-7 h-7 rounded-full object-cover bg-slate-100 mb-1" />
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-slate-400 rounded-full"
                  style={{ animation: `pulse 1.2s ease-in-out ${i * 0.3}s infinite` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto hide-scrollbar">
        {quickReplies.map((qr) => (
          <button
            key={qr}
            onClick={() => { setInput(qr); }}
            className="flex-shrink-0 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-600 font-medium whitespace-nowrap"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {qr}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div
        className="bg-white border-t border-slate-100 px-4 py-3 flex items-end gap-2"
        style={{ paddingBottom: 16 }}
      >
        <button className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2C5.1 2 2 5.1 2 9C2 12.9 5.1 16 9 16C12.9 16 16 12.9 16 9" stroke="#64748B" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M12 2L13.5 3.5L16 2L14.5 5L16 6.5L13 5.5L11 8L10.5 5L8 4L10 3L9 1L11.5 2.5Z" stroke="#64748B" strokeWidth="1" fill="none" />
          </svg>
        </button>
        <div
          className="flex-1 bg-slate-50 rounded-2xl px-4 py-2.5 flex items-end gap-2"
          style={{ border: '1.5px solid #E2E8F0', minHeight: 42 }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-900 outline-none resize-none placeholder-slate-400"
            style={{ fontFamily: "'Inter', sans-serif", maxHeight: 80 }}
          />
        </div>
        <button
          onClick={sendMessage}
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          style={{
            background: input.trim()
              ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
              : '#E2E8F0',
            boxShadow: input.trim() ? '0 4px 12px rgba(37,99,235,0.35)' : 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill={input.trim() ? 'white' : '#94A3B8'}>
            <path d="M14 1L1 6L6 8.5L14 1ZM14 1L8.5 14L6 8.5L14 1Z" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
