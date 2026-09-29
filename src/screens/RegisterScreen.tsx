import { useState } from 'react'

interface Props {
  onBack: () => void
  onSuccess: () => void
  onSignIn: () => void
}

export default function RegisterScreen({ onBack, onSuccess, onSignIn }: Props) {
  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [agreed, setAgreed] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Partial<typeof form>>({})

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e: Partial<typeof form> = {}
    if (!form.fullName.trim()) e.fullName = 'Required'
    if (form.mobile.replace(/\D/g, '').length < 10) e.mobile = 'Enter a valid 10-digit number'
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (form.password.length < 8) e.password = 'Minimum 8 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (validate() && agreed) onSuccess()
  }

  const canSubmit = form.fullName && form.mobile.length >= 10 && form.email && form.password.length >= 8 && form.password === form.confirm && agreed

  return (
    <div className="absolute inset-0 overflow-y-auto hide-scrollbar bg-white">
      {/* Header */}
      <div className="relative overflow-hidden" style={{ height: 170 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #0F172A 0%, #1E3A8A 50%, #2563EB 100%)' }} />
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

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="1.6" />
              <path d="M4 20C4 16.7 7.6 14 12 14C16.4 14 20 16.7 20 20" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="18" cy="6" r="3" fill="#10B981" />
              <path d="M16.5 6L17.5 7L19.5 5" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Create Account
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="px-6 pt-4 pb-8">
        <div className="space-y-4">
          {/* Full Name */}
          <Field
            label="Full Name"
            error={errors.fullName}
          >
            <input
              type="text"
              value={form.fullName}
              onChange={update('fullName')}
              placeholder="Rahul Verma"
              className={inputClass(!!errors.fullName)}
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
          </Field>

          {/* Mobile */}
          <Field label="Mobile Number" error={errors.mobile}>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-3 bg-slate-50 text-sm text-slate-700 font-medium flex-shrink-0">
                🇮🇳 +91
              </div>
              <input
                type="tel"
                value={form.mobile}
                onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                placeholder="98765 43210"
                className={`flex-1 ${inputClass(!!errors.mobile)}`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>
          </Field>

          {/* Email */}
          <Field label="Email Address" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
              className={inputClass(!!errors.email)}
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
          </Field>

          {/* Password */}
          <Field label="Password" error={errors.password}>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                placeholder="Minimum 8 characters"
                className={`${inputClass(!!errors.password)} pr-12`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            {/* Password strength */}
            {form.password.length > 0 && (
              <div className="flex gap-1 mt-1.5">
                {[1, 2, 3, 4].map((lvl) => {
                  const s = form.password.length < 6 ? 1 : form.password.length < 8 ? 2 : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? 4 : 3
                  return (
                    <div key={lvl} className="flex-1 h-1 rounded-full" style={{ background: lvl <= s ? (s <= 1 ? '#EF4444' : s <= 2 ? '#F59E0B' : s <= 3 ? '#3B82F6' : '#059669') : '#E2E8F0' }} />
                  )
                })}
              </div>
            )}
          </Field>

          {/* Confirm Password */}
          <Field label="Confirm Password" error={errors.confirm}>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirm}
                onChange={update('confirm')}
                placeholder="Re-enter your password"
                className={`${inputClass(!!errors.confirm)} pr-12`}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  borderColor: form.confirm.length > 0 ? (form.password === form.confirm ? '#059669' : undefined) : undefined,
                }}
              />
              <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
            {form.confirm.length > 0 && form.password === form.confirm && (
              <p className="text-xs text-green-600 mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>✓ Passwords match</p>
            )}
          </Field>
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3 mt-5 cursor-pointer">
          <button
            onClick={() => setAgreed(!agreed)}
            className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
            style={{ borderColor: agreed ? '#2563EB' : '#CBD5E1', background: agreed ? '#2563EB' : 'white' }}
          >
            {agreed && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path d="M1 4.5L4 7.5L10 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <p className="text-xs text-slate-500 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
            I agree to the{' '}
            <span className="text-sr-blue font-semibold">Terms of Service</span>
            {' '}and{' '}
            <span className="text-sr-blue font-semibold">Privacy Policy</span>
            . I consent to the processing of my personal data.
          </p>
        </label>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full mt-6 py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            fontFamily: "'Outfit', sans-serif",
            boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
          }}
        >
          Create Account →
        </button>

        {/* Social signup */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">or sign up with</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button
          onClick={onSuccess}
          className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3 bg-white text-sm font-semibold text-slate-700 transition-all active:bg-slate-50 mb-4"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
            <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>
          Already have an account?{' '}
          <button onClick={onSignIn} className="text-sr-blue font-semibold">
            Sign In
          </button>
        </p>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: "'Inter', sans-serif" }}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-sr-red mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>{error}</p>}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return `w-full border rounded-xl px-4 py-3 text-sm text-slate-900 bg-slate-50 outline-none focus:ring-2 focus:ring-sr-blue-soft transition-all ${hasError ? 'border-sr-red' : 'border-slate-200 focus:border-sr-blue'}`
}
