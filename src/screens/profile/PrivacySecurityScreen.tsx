import { useState } from 'react'

interface Props {
  onBack: () => void
}

export default function PrivacySecurityScreen({ onBack }: Props) {
  const [biometric, setBiometric] = useState(true)
  const [twoFactor, setTwoFactor] = useState(false)
  const [locationAlways, setLocationAlways] = useState(false)
  const [showActivity, setShowActivity] = useState(true)
  const [showPhone, setShowPhone] = useState(false)
  const [changePass, setChangePass] = useState(false)
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' })

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
            Privacy & Security
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-4 pb-8 space-y-4">
        {/* Security */}
        <Section title="Security">
          <ToggleRow label="Biometric Login" desc="Use Face ID / fingerprint to sign in" value={biometric} onChange={setBiometric} icon="🔐" />
          <ToggleRow label="Two-Factor Authentication" desc="Extra OTP verification on login" value={twoFactor} onChange={setTwoFactor} icon="🛡️" />
          <ActionRow
            label="Change Password"
            desc="Update your account password"
            icon="🔑"
            onTap={() => setChangePass(!changePass)}
            badge={changePass ? 'Hide' : 'Change'}
          />
          {changePass && (
            <div className="px-4 py-3 bg-slate-50 space-y-3">
              {[
                { key: 'current', label: 'Current Password' },
                { key: 'newPass', label: 'New Password' },
                { key: 'confirm', label: 'Confirm New Password' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1 block" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</label>
                  <input
                    type="password"
                    value={passForm[key as keyof typeof passForm]}
                    onChange={(e) => setPassForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-sr-blue transition-all"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                </div>
              ))}
              <button
                className="w-full py-2.5 rounded-xl text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', fontFamily: "'Outfit', sans-serif" }}
              >
                Update Password
              </button>
            </div>
          )}
          <ActionRow label="Active Sessions" desc="Manage where you're logged in" icon="📱" onTap={() => {}} badge="View" />
          <ActionRow label="Blocked Users" desc="People you've blocked" icon="🚫" onTap={() => {}} badge="2" badgeStyle="danger" />
        </Section>

        {/* Privacy */}
        <Section title="Privacy">
          <ToggleRow label="Show Online Status" desc="Let others see when you're active" value={showActivity} onChange={setShowActivity} icon="🟢" />
          <ToggleRow label="Show Phone Number" desc="Visible to matched ride partners only" value={showPhone} onChange={setShowPhone} icon="📞" />
          <ToggleRow label="Always-On Location" desc="Share location even when app is closed" value={locationAlways} onChange={setLocationAlways} icon="📍" />
          <ActionRow label="Data & Privacy" desc="Download or delete your data" icon="📊" onTap={() => {}} badge="Manage" />
        </Section>

        {/* Danger zone */}
        <div className="bg-red-50 rounded-2xl border border-red-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-red-100">
            <p className="text-xs font-bold text-sr-red uppercase tracking-wider" style={{ fontFamily: "'Outfit', sans-serif" }}>Danger Zone</p>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-red-100 transition-colors">
            <span className="text-lg">⚠️</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-sr-red" style={{ fontFamily: "'Inter', sans-serif" }}>Delete Account</p>
              <p className="text-xs text-slate-500 mt-0.5">Permanently remove your data</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1" style={{ fontFamily: "'Inter', sans-serif" }}>{title}</h3>
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)' }}>
        {children}
      </div>
    </div>
  )
}

function ToggleRow({ label, desc, value, onChange, icon }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void; icon: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0">
      <span className="text-lg w-7">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</p>
        {desc && <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => onChange(!value)} className="w-11 h-6 rounded-full transition-all relative flex-shrink-0" style={{ background: value ? '#2563EB' : '#CBD5E1' }}>
        <div className="w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all" style={{ left: value ? '1.375rem' : '0.125rem' }} />
      </button>
    </div>
  )
}

function ActionRow({ label, desc, icon, onTap, badge, badgeStyle }: { label: string; desc?: string; icon: string; onTap: () => void; badge?: string; badgeStyle?: 'danger' }) {
  return (
    <button onClick={onTap} className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0 active:bg-slate-50 transition-colors text-left">
      <span className="text-lg w-7">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-800" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</p>
        {desc && <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>}
      </div>
      {badge && (
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{
            fontFamily: "'Outfit', sans-serif",
            background: badgeStyle === 'danger' ? '#FEE2E2' : '#EFF6FF',
            color: badgeStyle === 'danger' ? '#DC2626' : '#2563EB',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  )
}
