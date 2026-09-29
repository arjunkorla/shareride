import { useState } from 'react'

interface Props {
  onBack: () => void
}

const transactions = [
  { id: 't1', type: 'credit', desc: 'Ride earnings: Mumbai → Pune', amount: 1350, date: '8 Aug 2026', icon: '🚗' },
  { id: 't2', type: 'debit', desc: 'Booking: Mumbai → Pune', amount: 450, date: '7 Aug 2026', icon: '💺' },
  { id: 't3', type: 'credit', desc: 'Ride earnings: Pune → Nashik', amount: 900, date: '2 Aug 2026', icon: '🚗' },
  { id: 't4', type: 'debit', desc: 'Booking: Thane → Nashik', amount: 320, date: '28 Jul 2026', icon: '💺' },
  { id: 't5', type: 'credit', desc: 'Refund: Cancelled ride', amount: 450, date: '25 Jul 2026', icon: '↩️' },
  { id: 't6', type: 'debit', desc: 'Platform fee (2%)', amount: 27, date: '25 Jul 2026', icon: '🏷️' },
]

export default function WalletScreen({ onBack }: Props) {
  const [tab, setTab] = useState<'all' | 'earnings' | 'expenses'>('all')

  const balance = 3240
  const earnings = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
  const expenses = transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0)

  const displayed = tab === 'all' ? transactions : transactions.filter((t) => tab === 'earnings' ? t.type === 'credit' : t.type === 'debit')

  return (
    <div className="absolute inset-0 bg-sr-bg flex flex-col">
      {/* Header */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 60%, #2563EB 100%)',
          paddingTop: 56,
          paddingBottom: 80,
        }}
      >
        <div className="flex items-center gap-3 px-4 mb-6">
          <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="text-lg font-extrabold text-white flex-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Wallet</h2>
          <button className="text-xs text-white/70 font-medium px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)', fontFamily: "'Inter', sans-serif" }}>
            + Add Money
          </button>
        </div>

        {/* Balance */}
        <div className="text-center">
          <p className="text-xs text-white/60 uppercase tracking-widest mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Available Balance</p>
          <div className="text-5xl font-extrabold text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
            ₹{balance.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Stats + actions */}
      <div className="relative z-10 mx-4" style={{ marginTop: -56 }}>
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
              <div className="text-xs text-green-600 mb-0.5 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Total Earned</div>
              <div className="text-lg font-extrabold text-green-700" style={{ fontFamily: "'Outfit', sans-serif" }}>₹{earnings.toLocaleString('en-IN')}</div>
            </div>
            <div className="flex-1 bg-red-50 rounded-xl p-3 text-center">
              <div className="text-xs text-red-500 mb-0.5 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Total Spent</div>
              <div className="text-lg font-extrabold text-red-600" style={{ fontFamily: "'Outfit', sans-serif" }}>₹{expenses.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: '⬆️', label: 'Withdraw', action: () => {} },
              { icon: '💳', label: 'Pay Methods', action: () => {} },
              { icon: '📄', label: 'Statement', action: () => {} },
            ].map(({ icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                className="flex flex-col items-center gap-1 py-2 bg-slate-50 rounded-xl active:bg-slate-100 transition-colors"
              >
                <span className="text-lg">{icon}</span>
                <span className="text-[10px] text-slate-600 font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="flex-1 overflow-y-auto hide-scrollbar mt-4 px-4 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Transactions</h3>
          <div className="flex bg-slate-100 rounded-xl p-0.5">
            {(['all', 'earnings', 'expenses'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-2.5 py-1.5 rounded-xl text-[10px] font-semibold capitalize transition-all"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  background: tab === t ? 'white' : 'transparent',
                  color: tab === t ? '#2563EB' : '#94A3B8',
                  boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)' }}>
          {displayed.map((tx, i) => (
            <div
              key={tx.id}
              className={`flex items-center gap-3 px-4 py-3.5 ${i < displayed.length - 1 ? 'border-b border-slate-50' : ''}`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: tx.type === 'credit' ? '#D1FAE5' : '#FEE2E2' }}
              >
                {tx.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate" style={{ fontFamily: "'Inter', sans-serif" }}>{tx.desc}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{tx.date}</p>
              </div>
              <div
                className="text-sm font-bold flex-shrink-0"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  color: tx.type === 'credit' ? '#059669' : '#EF4444',
                }}
              >
                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
