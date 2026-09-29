import { useState } from 'react'

interface Props {
  onLogin: () => void
  onRegister: () => void
  onForgotPassword?: () => void
}

export default function LoginScreen({ onLogin, onRegister, onForgotPassword }: Props) {
  const [mode, setMode] = useState<'phone' | 'email'>('phone')
  const [step, setStep] = useState<'input' | 'otp'>('input')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])

  const handleOtpChange = (i: number, val: string) => {
    if (val.length > 1) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) {
      const el = document.getElementById(`otp-${i + 1}`)
      el?.focus()
    }
  }

  const handleSendOtp = () => {
    if (phone.length >= 10) setStep('otp')
  }

  return (
    <div className="absolute inset-0 overflow-y-auto hide-scrollbar bg-white">
      {/* Top wave background */}
      <div className="relative overflow-hidden" style={{ height: 220 }}>
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 50%, #2563EB 100%)',
          }}
        />
        <svg className="absolute bottom-0 w-full" viewBox="0 0 390 60" preserveAspectRatio="none">
          <path d="M0 60 Q195 0 390 60 Z" fill="white" />
        </svg>

        {/* Logo in header */}
        <div className="relative z-10 flex flex-col items-center pt-16 px-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M5 24 Q9 16 16 12 Q23 8 27 5" stroke="rgba(255,255,255,0.3)" strokeWidth="6" strokeLinecap="round" />
              <path d="M5 24 Q9 16 16 12 Q23 8 27 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 4" />
              <circle cx="16" cy="12" r="5" fill="white" />
              <circle cx="16" cy="12" r="2.5" fill="#2563EB" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Share<span style={{ color: '#93C5FD' }}>Ride</span>
          </h1>
        </div>
      </div>

      {/* Form content */}
      <div className="px-6 pt-2 pb-8">
        {step === 'input' ? (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Welcome back
            </h2>
            <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
              Sign in to continue your journey
            </p>

            {/* Mode tabs */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
              {(['phone', 'email'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    background: mode === m ? 'white' : 'transparent',
                    color: mode === m ? '#2563EB' : '#64748B',
                    boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {m === 'phone' ? '📱 Mobile OTP' : '✉️ Email'}
                </button>
              ))}
            </div>

            {mode === 'phone' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-3 bg-slate-50 text-sm text-slate-700 font-medium">
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210"
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 text-slate-900 outline-none focus:border-sr-blue focus:ring-2 focus:ring-sr-blue-soft transition-all"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleSendOtp}
                  disabled={phone.length < 10}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    fontFamily: "'Outfit', sans-serif",
                    boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
                  }}
                >
                  Send OTP →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 text-slate-900 outline-none focus:border-sr-blue focus:ring-2 focus:ring-sr-blue-soft transition-all"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 text-slate-900 outline-none focus:border-sr-blue focus:ring-2 focus:ring-sr-blue-soft transition-all"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>
                <div className="text-right">
                  <button onClick={onForgotPassword} className="text-xs text-sr-blue font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Forgot password?
                  </button>
                </div>
                <button
                  onClick={onLogin}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    fontFamily: "'Outfit', sans-serif",
                    boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
                  }}
                >
                  Sign In →
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or continue with</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Social login */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={onLogin}
                className="flex-1 flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3 bg-white text-sm font-semibold text-slate-700 transition-all active:bg-slate-50"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
                  <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button
                onClick={onLogin}
                className="flex-1 flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3 bg-black text-sm font-semibold text-white transition-all active:bg-slate-900"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <svg width="16" height="18" viewBox="0 0 16 18" fill="white">
                  <path d="M13.35 9.57c-.02-2.42 1.98-3.59 2.07-3.64-1.13-1.65-2.88-1.87-3.5-1.9-1.5-.15-2.93.88-3.69.88-.76 0-1.93-.86-3.17-.84-1.63.02-3.13.95-3.97 2.41-1.69 2.93-.43 7.27 1.22 9.65.81 1.16 1.77 2.46 3.03 2.41 1.22-.05 1.68-.79 3.15-.79s1.89.79 3.17.77c1.31-.02 2.14-1.18 2.95-2.35.93-1.35 1.31-2.66 1.33-2.73-.03-.01-2.55-.97-2.59-3.87zm-2.43-7.12c.67-.82 1.13-1.95.1-3.12C9.93.38 8.9.72 8.17 1.55c-.69.79-1.26 2.02-.93 3.15 1.1.08 2.17-.56 2.68-2.25z" />
                </svg>
                Apple
              </button>
            </div>

            {/* Register link */}
            <p className="text-center text-sm text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>
              New to ShareRide?{' '}
              <button onClick={onRegister} className="text-sr-blue font-semibold">
                Create account
              </button>
            </p>

            {/* Terms */}
            <p className="text-center text-[10px] text-slate-400 mt-4 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              By continuing you agree to our{' '}
              <span className="text-sr-blue">Terms of Service</span>
              {' '}and{' '}
              <span className="text-sr-blue">Privacy Policy</span>
            </p>
          </>
        ) : (
          /* OTP screen */
          <div className="animate-slide-up">
            <button
              onClick={() => setStep('input')}
              className="flex items-center gap-2 text-sr-blue text-sm font-medium mb-6"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Enter OTP
            </h2>
            <p className="text-sm text-slate-500 mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
              We sent a 6-digit code to{' '}
              <span className="font-semibold text-slate-700">+91 {phone}</span>
            </p>

            {/* OTP inputs */}
            <div className="flex gap-2 justify-between mb-6">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  className="w-12 h-14 border-2 rounded-xl text-center text-xl font-bold text-slate-900 outline-none transition-all"
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    borderColor: digit ? '#2563EB' : '#E2E8F0',
                    background: digit ? '#EFF6FF' : '#F8FAFC',
                  }}
                />
              ))}
            </div>

            <button
              onClick={onLogin}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-95 mb-4"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
              }}
            >
              Verify & Sign In →
            </button>

            <p className="text-center text-sm text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>
              Didn't receive it?{' '}
              <button className="text-sr-blue font-semibold">Resend OTP</button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
