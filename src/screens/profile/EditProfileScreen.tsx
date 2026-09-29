import { useState } from 'react'

interface Props {
  onBack: () => void
  onSave: () => void
}

export default function EditProfileScreen({ onBack, onSave }: Props) {
  const [form, setForm] = useState({
    fullName: 'Arjun Sharma',
    mobile: '98765 43210',
    email: 'arjun.sharma@email.com',
    bio: 'Professional driver with a passion for safe travel. I value punctuality and keep my car clean. Non-smoker.',
    languages: 'Hindi, English, Punjabi',
    gender: 'Male',
    dob: '1992-03-15',
  })
  const [saved, setSaved] = useState(false)

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => { setSaved(false); onSave() }, 1200)
  }

  return (
    <div className="absolute inset-0 bg-white flex flex-col">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 border-b border-slate-100 bg-white"
        style={{ paddingTop: 56, paddingBottom: 14 }}
      >
        <button onClick={onBack} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-lg font-extrabold text-slate-900 flex-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Edit Profile
        </h2>
        <button
          onClick={handleSave}
          className="text-sm font-bold text-white px-4 py-2 rounded-xl transition-all active:scale-95"
          style={{
            background: saved ? '#059669' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-8">
        {/* Avatar */}
        <div className="flex flex-col items-center py-6">
          <div className="relative">
            <div className="w-22 h-22 rounded-3xl overflow-hidden bg-slate-100 border-2 border-white shadow-card" style={{ width: 88, height: 88 }}>
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ background: '#2563EB', border: '2px solid white' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9.5 1.5L12.5 4.5M2 10.5L10 2.5C10.8 1.7 12.1 1.7 12.9 2.5C13.7 3.3 13.7 4.6 12.9 5.4L4.5 13.5H2V10.5Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <button className="mt-3 text-xs text-sr-blue font-semibold" style={{ fontFamily: "'Inter', sans-serif" }}>
            Change Profile Photo
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {[
            { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Your full name' },
            { key: 'mobile', label: 'Mobile Number', type: 'tel', placeholder: '+91 98765 43210' },
            { key: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
            { key: 'languages', label: 'Languages', type: 'text', placeholder: 'e.g. Hindi, English' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: "'Inter', sans-serif" }}>
                {label}
              </label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={update(key as keyof typeof form)}
                placeholder={placeholder}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-sr-blue focus:ring-2 focus:ring-sr-blue-soft transition-all"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>
          ))}

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: "'Inter', sans-serif" }}>
              Gender
            </label>
            <select
              value={form.gender}
              onChange={update('gender')}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-sr-blue transition-all"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Non-binary</option>
              <option>Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: "'Inter', sans-serif" }}>
              Date of Birth
            </label>
            <input
              type="date"
              value={form.dob}
              onChange={update('dob')}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-sr-blue transition-all"
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block" style={{ fontFamily: "'Inter', sans-serif" }}>
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={update('bio')}
              rows={3}
              placeholder="Tell other riders about yourself..."
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-sr-blue focus:ring-2 focus:ring-sr-blue-soft resize-none transition-all"
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
            <p className="text-[10px] text-slate-400 text-right mt-1">{form.bio.length}/200</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full mt-6 py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-95"
          style={{
            background: saved ? '#059669' : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            fontFamily: "'Outfit', sans-serif",
            boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
          }}
        >
          {saved ? '✓ Changes Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
