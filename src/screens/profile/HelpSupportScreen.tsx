import { useState } from 'react'

interface Props {
  onBack: () => void
  onReplayOnboarding?: () => void
}

const faqs = [
  { q: 'How do I book a ride?', a: 'Go to the Search tab, enter your origin and destination, choose a date and the number of seats, then browse available rides and tap "Book Now" or "Request Seat".' },
  { q: 'How do I post a ride as a driver?', a: 'Tap the "+" button in the bottom navigation. Follow the 6-step wizard to set your route, schedule, seats, pricing, and vehicle details, then publish.' },
  { q: 'How does payment work?', a: 'Payments can be made in-app via card or wallet, or in cash directly to the driver at the start of the ride — as agreed between you and the driver.' },
  { q: 'What if my driver cancels?', a: 'If a driver cancels, you will be notified immediately and fully refunded within 24–48 hours. You can search for alternative rides right away.' },
  { q: 'How do I verify my account?', a: 'Go to Profile → Verification and upload the required documents. Verification typically takes 1–2 business days.' },
  { q: 'Is it safe to share a ride with strangers?', a: 'All users are ID-verified. Drivers undergo additional license and vehicle checks. You can also see ratings, reviews, and verified badges before booking.' },
]

export default function HelpSupportScreen({ onBack, onReplayOnboarding }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [ticketOpen, setTicketOpen] = useState(false)
  const [ticketText, setTicketText] = useState('')
  const [ticketSent, setTicketSent] = useState(false)

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
            Help & Support
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-4 pb-8 space-y-4">
        {/* Contact options */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '💬', label: 'Live Chat', sub: 'Online now', color: '#EFF6FF', textColor: '#2563EB' },
            { icon: '📞', label: 'Call Us', sub: '1800-000-0000', color: '#F0FDF4', textColor: '#059669' },
            { icon: '✉️', label: 'Email', sub: 'Reply in 24h', color: '#FEF3C7', textColor: '#D97706' },
          ].map(({ icon, label, sub, color, textColor }) => (
            <button
              key={label}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center active:scale-95 transition-transform border"
              style={{ background: color, borderColor: color }}
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-xs font-bold" style={{ color: textColor, fontFamily: "'Outfit', sans-serif" }}>{label}</span>
              <span className="text-[9px] text-slate-500">{sub}</span>
            </button>
          ))}
        </div>

        {/* Replay Tutorial */}
        <button
          onClick={onReplayOnboarding}
          className="w-full bg-indigo-50 rounded-2xl p-4 flex items-center gap-3 border border-indigo-100 active:opacity-80 transition-opacity text-left"
        >
          <span className="text-2xl">🎓</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-indigo-700" style={{ fontFamily: "'Outfit', sans-serif" }}>Replay App Tutorial</p>
            <p className="text-xs text-indigo-500 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>Walk through the onboarding again to rediscover features</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Safety Center */}
        <div className="bg-red-50 rounded-2xl p-4 flex items-center gap-3 border border-red-100">
          <span className="text-2xl">🛡️</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700" style={{ fontFamily: "'Outfit', sans-serif" }}>Safety Center</p>
            <p className="text-xs text-red-500 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>Report safety issues, block users, emergency resources</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* FAQ */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1" style={{ fontFamily: "'Inter', sans-serif" }}>
            Frequently Asked Questions
          </h3>
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)' }}>
            {faqs.map((faq, i) => (
              <div key={i} className={i < faqs.length - 1 ? 'border-b border-slate-50' : ''}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50 transition-colors"
                >
                  <span className="flex-1 text-sm font-medium text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {faq.q}
                  </span>
                  <svg
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    className="transition-transform flex-shrink-0"
                    style={{ transform: openFaq === i ? 'rotate(90deg)' : 'none' }}
                  >
                    <path d="M6 4L10 8L6 12" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-slate-500 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Raise ticket */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1" style={{ fontFamily: "'Inter', sans-serif" }}>
            Raise a Ticket
          </h3>
          {!ticketSent ? (
            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              {!ticketOpen ? (
                <button
                  onClick={() => setTicketOpen(true)}
                  className="w-full flex items-center gap-3 active:bg-slate-50 transition-colors rounded-xl p-2"
                >
                  <span className="text-xl">🎫</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>Contact Support Team</p>
                    <p className="text-xs text-slate-400">Describe your issue in detail</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4L10 8L6 12" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : (
                <div className="space-y-3">
                  <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 outline-none" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <option>Booking Issue</option>
                    <option>Payment Problem</option>
                    <option>Safety Concern</option>
                    <option>Account / Verification</option>
                    <option>Other</option>
                  </select>
                  <textarea
                    value={ticketText}
                    onChange={(e) => setTicketText(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 outline-none focus:border-sr-blue resize-none"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                  <button
                    onClick={() => { if (ticketText) setTicketSent(true) }}
                    disabled={!ticketText}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', fontFamily: "'Outfit', sans-serif" }}
                  >
                    Submit Ticket
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-green-50 rounded-2xl p-5 text-center border border-green-100">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm font-bold text-green-700 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Ticket Submitted!</p>
              <p className="text-xs text-green-600" style={{ fontFamily: "'Inter', sans-serif" }}>
                Reference #SR-TKT-2026-4892 · We'll respond within 24 hours
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
