import { useState } from 'react'

interface Props {
  onBack: () => void
  onSuccess: () => void
}

type Step = 'email' | 'otp' | 'new-password' | 'done'

export default function ForgotPasswordScreen({ onBack, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleOtpChange = (i: number, val: string) => {
    if (val.length > 1) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) {
      document.getElementById(`fp-otp-${i + 1}`)?.focus()
    }
  }

  const passwordsMatch = password.length >= 8 && password === confirm

  return (
    <div className="absolute inset-0 overflow-y-auto hide-scrollbar bg-white">
      {/* Top wave header */}
      <div className="relative overflow-hidden" style={{ height: 180 }}>
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 50%, #2563EB 100%)',
          }}
        />
        <svg className="absolute bottom-0 w-full" viewBox="0 0 390 50" preserveAspectRatio="none">
          <path d="M0 50 Q195 0 390 50 Z" fill="white" />
        </svg>
        <button
          onClick={onBack}
          className="absolute top-14 left-4 z-10 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="absolute inset-0 flex items-center justify-center pt-4">
          <div className="text-center">
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-2"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="4" y="12" width="20" height="14" rx="3" stroke="white" strokeWidth="1.6" />
                <path d="M8 12V9C8 6.24 10.24 4 13 4H15C17.76 4 20 6.24 20 9V12" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="14" cy="19" r="2" fill="white" />
                <line x1="14" y1="21" x2="14" y2="23" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pt-2 pb-8">
        {/* Step: Enter Email */}
        {step === 'email' && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Forgot Password?
            </h2>
            <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
              Enter your registered email or phone number. We'll send you a reset code.
            </p>

            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: "'Inter', sans-serif" }}>
                Email or Mobile Number
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com or +91 98765 43210"
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-sr-blue focus:ring-2 focus:ring-sr-blue-soft transition-all"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>

            <button
              onClick={() => setStep('otp')}
              disabled={email.length < 5}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
              }}
            >
              Send Reset Code →
            </button>

            <button
              onClick={onBack}
              className="w-full mt-4 py-3 text-sm text-slate-500 font-medium"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              ← Back to Sign In
            </button>
          </div>
        )}

        {/* Step: OTP Verification */}
        {step === 'otp' && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Verify Code
            </h2>
            <p className="text-sm text-slate-500 mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
              We sent a 6-digit code to
            </p>
            <p className="text-sm font-semibold text-slate-800 mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
              {email}
            </p>

            <div className="flex gap-2 justify-between mb-6">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`fp-otp-${i}`}
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
              onClick={() => setStep('new-password')}
              disabled={otp.some((d) => !d)}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50 mb-4"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
              }}
            >
              Verify Code →
            </button>

            <div className="text-center space-y-2">
              <p className="text-sm text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                Didn't receive it?{' '}
                <button className="text-sr-blue font-semibold">Resend Code</button>
              </p>
              <button
                onClick={() => setStep('email')}
                className="text-sm text-slate-400"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                ← Change email/phone
              </button>
            </div>
          </div>
        )}

        {/* Step: New Password */}
        {step === 'new-password' && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Create New Password
            </h2>
            <p className="text-sm text-slate-500 mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
              Choose a strong password that you haven't used before.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: "'Inter', sans-serif" }}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 pr-12 text-sm text-slate-900 outline-none focus:border-sr-blue focus:ring-2 focus:ring-sr-blue-soft transition-all"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                  <button
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {/* Strength indicator */}
                {password.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4].map((lvl) => {
                      const strength = password.length < 6 ? 1 : password.length < 8 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3
                      return (
                        <div
                          key={lvl}
                          className="flex-1 h-1 rounded-full"
                          style={{
                            background: lvl <= strength
                              ? strength <= 1 ? '#EF4444' : strength <= 2 ? '#F59E0B' : strength <= 3 ? '#3B82F6' : '#059669'
                              : '#E2E8F0',
                          }}
                        />
                      )
                    })}
                    <span className="text-[10px] text-slate-400 ml-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {password.length < 6 ? 'Weak' : password.length < 8 ? 'Fair' : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'Strong' : 'Good'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition-all"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      borderColor: confirm.length > 0 ? (password === confirm ? '#059669' : '#EF4444') : '#E2E8F0',
                    }}
                  />
                  <button
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {confirm.length > 0 && (
                  <p
                    className="text-xs mt-1"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      color: password === confirm ? '#059669' : '#EF4444',
                    }}
                  >
                    {password === confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setStep('done')}
              disabled={!passwordsMatch}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: '0 6px 20px rgba(5,150,105,0.35)',
              }}
            >
              Reset Password →
            </button>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="animate-bounce-in flex flex-col items-center text-center pt-8">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                boxShadow: '0 0 0 16px rgba(5,150,105,0.12)',
              }}
            >
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path
                  d="M10 24L20 34L38 14"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Password Reset!
            </h2>
            <p className="text-sm text-slate-500 mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <button
              onClick={onSuccess}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
              }}
            >
              Sign In Now →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
