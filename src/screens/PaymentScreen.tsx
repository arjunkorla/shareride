import { useState } from 'react'
import { rides } from '../mockData'

interface Props {
  rideId: string
  seats: number
  onBack: () => void
  onSuccess: () => void
}

type Method = 'upi' | 'card' | 'wallet'

export default function PaymentScreen({ rideId, seats, onBack, onSuccess }: Props) {
  const ride = rides.find((r) => r.id === rideId) || rides[0]
  const [method, setMethod] = useState<Method>('upi')
  const [upiId, setUpiId] = useState('')
  const [paying, setPaying] = useState(false)
  const [cardNum, setCardNum] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')

  const total = ride.price * seats
  const walletBalance = 1240

  const pay = () => {
    setPaying(true)
    setTimeout(() => { setPaying(false); onSuccess() }, 1800)
  }

  const methods: { id: Method; icon: string; label: string; sub: string }[] = [
    { id: 'upi', icon: '📱', label: 'UPI', sub: 'GPay, PhonePe, Paytm' },
    { id: 'card', icon: '💳', label: 'Debit / Credit Card', sub: 'Visa, Mastercard, Rupay' },
    { id: 'wallet', icon: '👛', label: 'ShareRide Wallet', sub: `Balance: ₹${walletBalance}` },
  ]

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
          <div className="flex-1">
            <h2 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Payment</h2>
            <p className="text-xs text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>Secure payment via SSL encryption</p>
          </div>
          <span className="text-lg">🔒</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-4 pb-4 space-y-4">
        {/* Order summary */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Order Summary</p>
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-50">
            <div className="w-10 h-10 bg-sr-blue-light rounded-xl flex items-center justify-center text-xl">🚗</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{ride.from} → {ride.to}</p>
              <p className="text-xs text-slate-500">{ride.date} · {ride.time}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>Ride fare</span>
              <span className="font-semibold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>₹{total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Platform fee</span>
              <span className="font-semibold text-slate-800">₹{Math.round(total * 0.05)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Promo discount</span>
              <span className="font-semibold">−₹20</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-slate-100 pt-2 mt-1">
              <span className="text-slate-900">Total</span>
              <span className="text-sr-blue text-base">₹{total + Math.round(total * 0.05) - 20}</span>
            </div>
          </div>
        </div>

        {/* Payment methods */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1" style={{ fontFamily: "'Inter', sans-serif" }}>Payment Method</p>
          <div className="space-y-2">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all text-left"
                style={{
                  background: method === m.id ? '#EFF6FF' : 'white',
                  borderColor: method === m.id ? '#2563EB' : '#E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: method === m.id ? '#2563EB' : '#0F172A', fontFamily: "'Outfit', sans-serif" }}>{m.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{m.sub}</p>
                </div>
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: method === m.id ? '#2563EB' : '#CBD5E1', background: method === m.id ? '#2563EB' : 'white' }}
                >
                  {method === m.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic input area */}
        {method === 'upi' && (
          <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: "'Inter', sans-serif" }}>UPI ID</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-sr-blue transition-all"
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
            <div className="flex gap-2 mt-3 flex-wrap">
              {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                <button
                  key={app}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 active:bg-slate-100"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {app}
                </button>
              ))}
            </div>
          </div>
        )}

        {method === 'card' && (
          <div className="bg-white rounded-2xl p-4 space-y-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {[
              { label: 'Card Number', value: cardNum, set: setCardNum, placeholder: '4242 4242 4242 4242', type: 'tel' },
            ].map(({ label, value, set, placeholder, type }) => (
              <div key={label}>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder={placeholder}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-sr-blue transition-all"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>
            ))}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: "'Inter', sans-serif" }}>Expiry</label>
                <input
                  type="tel"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-sr-blue"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: "'Inter', sans-serif" }}>CVV</label>
                <input
                  type="password"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  placeholder="•••"
                  maxLength={3}
                  className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-sr-blue"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>
            </div>
          </div>
        )}

        {method === 'wallet' && (
          <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Wallet Balance</p>
                <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>Available for this transaction</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold text-green-600" style={{ fontFamily: "'Outfit', sans-serif" }}>₹{walletBalance}</p>
                {walletBalance < total && (
                  <p className="text-[10px] text-red-500">Insufficient balance</p>
                )}
              </div>
            </div>
            {walletBalance >= total && (
              <div className="mt-3 bg-green-50 rounded-xl px-3 py-2 text-xs text-green-700 flex items-center gap-2">
                <span>✅</span>
                <span style={{ fontFamily: "'Inter', sans-serif" }}>Wallet balance sufficient for this payment</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pay button */}
      <div className="px-4 pb-6 pt-3 bg-white border-t border-slate-100">
        <button
          onClick={pay}
          disabled={paying}
          className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            fontFamily: "'Outfit', sans-serif",
            boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
            opacity: paying ? 0.8 : 1,
          }}
        >
          {paying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ₹${total + Math.round(total * 0.05) - 20} Securely`
          )}
        </button>
        <p className="text-center text-[10px] text-slate-400 mt-2" style={{ fontFamily: "'Inter', sans-serif" }}>
          🔒 Secured by 256-bit SSL · PCI DSS Compliant
        </p>
      </div>
    </div>
  )
}
