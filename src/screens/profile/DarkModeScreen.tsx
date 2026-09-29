interface Props {
  onBack: () => void
  current: 'light' | 'dark' | 'system'
  onChange: (mode: 'light' | 'dark' | 'system') => void
}

const modes = [
  {
    id: 'light' as const,
    label: 'Light',
    desc: 'Always use light theme',
    preview: (
      <div className="w-full h-20 rounded-xl bg-white border border-slate-200 overflow-hidden flex flex-col">
        <div className="h-5 bg-white border-b border-slate-100 flex items-center px-2 gap-1">
          <div className="w-8 h-2 bg-slate-200 rounded" />
          <div className="ml-auto w-4 h-2 bg-slate-200 rounded" />
        </div>
        <div className="flex-1 bg-slate-50 p-2 space-y-1">
          <div className="h-2 bg-white rounded w-full" />
          <div className="h-2 bg-white rounded w-3/4" />
          <div className="h-2 bg-sr-blue rounded w-1/2" />
        </div>
      </div>
    ),
  },
  {
    id: 'dark' as const,
    label: 'Dark',
    desc: 'Always use dark theme',
    preview: (
      <div className="w-full h-20 rounded-xl bg-slate-900 overflow-hidden flex flex-col">
        <div className="h-5 bg-slate-900 border-b border-slate-700 flex items-center px-2 gap-1">
          <div className="w-8 h-2 bg-slate-700 rounded" />
          <div className="ml-auto w-4 h-2 bg-slate-700 rounded" />
        </div>
        <div className="flex-1 bg-slate-800 p-2 space-y-1">
          <div className="h-2 bg-slate-700 rounded w-full" />
          <div className="h-2 bg-slate-700 rounded w-3/4" />
          <div className="h-2 bg-blue-500 rounded w-1/2" />
        </div>
      </div>
    ),
  },
  {
    id: 'system' as const,
    label: 'System Default',
    desc: 'Follow your device setting',
    preview: (
      <div className="w-full h-20 rounded-xl overflow-hidden flex">
        <div className="flex-1 bg-white border border-slate-200 rounded-l-xl flex flex-col">
          <div className="h-5 bg-white border-b border-slate-100" />
          <div className="flex-1 bg-slate-50 p-2 space-y-1">
            <div className="h-2 bg-white rounded" />
            <div className="h-2 bg-sr-blue rounded w-3/4" />
          </div>
        </div>
        <div className="flex-1 bg-slate-900 rounded-r-xl flex flex-col">
          <div className="h-5 bg-slate-900 border-b border-slate-700" />
          <div className="flex-1 bg-slate-800 p-2 space-y-1">
            <div className="h-2 bg-slate-700 rounded" />
            <div className="h-2 bg-blue-500 rounded w-3/4" />
          </div>
        </div>
      </div>
    ),
  },
]

export default function DarkModeScreen({ onBack, current, onChange }: Props) {
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
            Appearance
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-6 pb-8 space-y-4">
        <p className="text-sm text-slate-500 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
          Choose how ShareRide looks on this device.
        </p>

        <div className="space-y-3">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onChange(mode.id)}
              className="w-full text-left transition-all active:scale-[0.99]"
            >
              <div
                className="rounded-2xl p-4 border-2 transition-all"
                style={{
                  borderColor: current === mode.id ? '#2563EB' : '#E2E8F0',
                  background: current === mode.id ? '#EFF6FF' : 'white',
                }}
              >
                {/* Preview */}
                <div className="mb-3">
                  {mode.preview}
                </div>

                {/* Label + radio */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor: current === mode.id ? '#2563EB' : '#CBD5E1',
                      background: current === mode.id ? '#2563EB' : 'white',
                    }}
                  >
                    {current === mode.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {mode.label}
                    </p>
                    <p className="text-[11px] text-slate-500" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {mode.desc}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <p className="text-xs text-slate-500 text-center leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
            Appearance changes apply immediately and are saved to your account across all your devices.
          </p>
        </div>
      </div>
    </div>
  )
}
