import { useState } from 'react'

interface Props {
  onBack: () => void
}

type Status = 'verified' | 'pending' | 'required' | 'rejected'

interface DocItem {
  id: string
  label: string
  desc: string
  status: Status
  icon: string
  driverOnly?: boolean
}

const docs: DocItem[] = [
  { id: 'photo', label: 'Profile Photo', desc: 'Clear selfie, no sunglasses', status: 'verified', icon: '📷' },
  { id: 'id', label: 'Government ID', desc: 'Aadhaar, PAN, or Passport', status: 'verified', icon: '🪪' },
  { id: 'selfie', label: 'Selfie Verification', desc: 'Live selfie with ID', status: 'pending', icon: '🤳' },
  { id: 'license', label: 'Driving License', desc: 'Valid DL (for drivers)', status: 'required', icon: '🚗', driverOnly: true },
  { id: 'rc', label: 'Vehicle RC Book', desc: 'Registration certificate', status: 'required', icon: '📋', driverOnly: true },
  { id: 'insurance', label: 'Vehicle Insurance', desc: 'Valid insurance document', status: 'required', icon: '🛡️', driverOnly: true },
  { id: 'vehicle-photo', label: 'Vehicle Photo', desc: 'Clear photo of your vehicle', status: 'rejected', icon: '🚙', driverOnly: true },
]

const statusConfig: Record<Status, { label: string; bg: string; color: string; icon: string }> = {
  verified: { label: 'Verified', bg: '#D1FAE5', color: '#059669', icon: '✓' },
  pending: { label: 'Under Review', bg: '#FEF3C7', color: '#D97706', icon: '⏳' },
  required: { label: 'Required', bg: '#F1F5F9', color: '#64748B', icon: '↑' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', color: '#DC2626', icon: '✗' },
}

export default function VerificationScreen({ onBack }: Props) {
  const [isDriver, setIsDriver] = useState(true)
  const verified = docs.filter((d) => d.status === 'verified' && (!d.driverOnly || isDriver)).length
  const total = docs.filter((d) => !d.driverOnly || isDriver).length
  const progress = Math.round((verified / total) * 100)

  const displayed = docs.filter((d) => !d.driverOnly || isDriver)

  return (
    <div className="absolute inset-0 bg-sr-bg flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4" style={{ paddingTop: 56, paddingBottom: 14 }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="text-lg font-extrabold text-slate-900 flex-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Verification
          </h2>
        </div>

        {/* Progress */}
        <div className="bg-slate-50 rounded-2xl p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {verified}/{total} documents verified
            </span>
            <span className="text-sm font-bold text-sr-blue" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {progress}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full">
            <div
              className="h-full bg-sr-blue rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress < 100 && (
            <p className="text-xs text-slate-500 mt-2" style={{ fontFamily: "'Inter', sans-serif" }}>
              Complete verification to unlock all features and build trust with passengers.
            </p>
          )}
        </div>

        {/* Driver / Passenger toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1">
          {(['driver', 'passenger'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setIsDriver(t === 'driver')}
              className="flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all"
              style={{
                fontFamily: "'Outfit', sans-serif",
                background: (t === 'driver') === isDriver ? 'white' : 'transparent',
                color: (t === 'driver') === isDriver ? '#2563EB' : '#64748B',
                boxShadow: (t === 'driver') === isDriver ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {t === 'driver' ? '🚗 Driver' : '👤 Passenger'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-4 pb-8 space-y-3">
        {displayed.map((doc) => {
          const sc = statusConfig[doc.status]
          return (
            <div
              key={doc.id}
              className="bg-white rounded-2xl p-4 flex items-center gap-4"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)' }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: sc.bg }}
              >
                {doc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {doc.label}
                  </span>
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase"
                    style={{ background: sc.bg, color: sc.color, fontFamily: "'Outfit', sans-serif" }}
                  >
                    {sc.icon} {sc.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {doc.desc}
                </p>
                {doc.status === 'rejected' && (
                  <p className="text-xs text-sr-red mt-1 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Photo was blurry. Please re-upload a clear image.
                  </p>
                )}
              </div>
              {doc.status !== 'verified' && (
                <button
                  className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                  style={{
                    background: doc.status === 'rejected' ? '#FEE2E2' : '#EFF6FF',
                    color: doc.status === 'rejected' ? '#DC2626' : '#2563EB',
                    border: `1px solid ${doc.status === 'rejected' ? '#FECACA' : '#BFDBFE'}`,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {doc.status === 'rejected' ? 'Re-upload' : doc.status === 'pending' ? 'View' : 'Upload'}
                </button>
              )}
            </div>
          )
        })}

        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-xs text-blue-700 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
            🔒 Your documents are encrypted and stored securely. They are used only for identity verification and are never shared with other users.
          </p>
        </div>
      </div>
    </div>
  )
}
