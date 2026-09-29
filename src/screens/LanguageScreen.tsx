import { useState } from 'react'

interface Props {
  onBack: () => void
}

const languages = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', region: 'Global' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', region: 'India' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳', region: 'Maharashtra' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', region: 'Tamil Nadu' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', region: 'Andhra Pradesh' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳', region: 'Karnataka' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳', region: 'West Bengal' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳', region: 'Gujarat' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳', region: 'Punjab' },
]

export default function LanguageScreen({ onBack }: Props) {
  const [selected, setSelected] = useState('en')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

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
          <h2 className="text-lg font-extrabold text-slate-900 flex-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Language</h2>
          {saved && (
            <span className="text-xs text-green-600 font-semibold" style={{ fontFamily: "'Outfit', sans-serif" }}>✓ Saved</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-4 pb-4">
        {/* Info banner */}
        <div className="bg-sr-blue-light rounded-2xl p-3.5 flex items-center gap-3 mb-4 border border-sr-blue-soft">
          <span className="text-xl">🌐</span>
          <p className="text-xs text-sr-blue flex-1 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
            The app will restart to apply the selected language across all screens.
          </p>
        </div>

        {/* Language list */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)' }}>
          {languages.map((lang, i) => (
            <button
              key={lang.code}
              onClick={() => { setSelected(lang.code); handleSave() }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50 transition-colors ${i < languages.length - 1 ? 'border-b border-slate-50' : ''}`}
              style={{ background: selected === lang.code ? '#EFF6FF' : 'white' }}
            >
              <span className="text-2xl w-8">{lang.flag}</span>
              <div className="flex-1">
                <p
                  className="text-sm font-bold"
                  style={{ color: selected === lang.code ? '#2563EB' : '#0F172A', fontFamily: "'Outfit', sans-serif" }}
                >
                  {lang.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {lang.native} · {lang.region}
                </p>
              </div>
              {selected === lang.code && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: '#2563EB' }}
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4" style={{ fontFamily: "'Inter', sans-serif" }}>
          More languages coming soon. Help us translate ShareRide at translate.shareride.in
        </p>
      </div>
    </div>
  )
}
