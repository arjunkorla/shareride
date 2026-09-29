import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  darkMode?: boolean
}

export default function PhoneFrame({ children, darkMode }: Props) {
  return (
    <div className="relative flex-shrink-0" style={{ width: 390, height: 844 }}>
      {/* Outer shell */}
      <div
        className="absolute inset-0 rounded-[44px]"
        style={{
          background: darkMode
            ? 'linear-gradient(145deg, #2a2a2e 0%, #1a1a1e 100%)'
            : 'linear-gradient(145deg, #2d2d30 0%, #1c1c1e 100%)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      />

      {/* Left volume buttons */}
      <div className="absolute -left-[3px] top-[120px] w-[4px] h-9 bg-gradient-to-r from-[#3a3a3c] to-[#2a2a2c] rounded-l-[3px]" />
      <div className="absolute -left-[3px] top-[168px] w-[4px] h-14 bg-gradient-to-r from-[#3a3a3c] to-[#2a2a2c] rounded-l-[3px]" />
      <div className="absolute -left-[3px] top-[196px] w-[4px] h-14 bg-gradient-to-r from-[#3a3a3c] to-[#2a2a2c] rounded-l-[3px]" />

      {/* Right power button */}
      <div className="absolute -right-[3px] top-[152px] w-[4px] h-20 bg-gradient-to-l from-[#3a3a3c] to-[#2a2a2c] rounded-r-[3px]" />

      {/* Screen bezel */}
      <div
        className="absolute rounded-[42px] overflow-hidden"
        style={{ inset: 4, background: darkMode ? '#0F172A' : '#F8FAFF' }}
      >
        {/* Status bar */}
        <div
          className="absolute top-0 left-0 right-0 z-50 flex items-center px-7 pt-[14px] pb-1"
          style={{ height: 52 }}
        >
          <span
            className="text-[13px] font-semibold tracking-tight"
            style={{
              fontFamily: "'Outfit', sans-serif",
              color: darkMode ? '#F1F5F9' : '#0F172A',
            }}
          >
            9:41
          </span>
          <div className="ml-auto flex items-center gap-[5px]">
            {/* Signal bars */}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <rect x="0" y="7" width="3" height="5" rx="0.5" fill={darkMode ? '#F1F5F9' : '#0F172A'} />
              <rect x="4.5" y="5" width="3" height="7" rx="0.5" fill={darkMode ? '#F1F5F9' : '#0F172A'} />
              <rect x="9" y="2.5" width="3" height="9.5" rx="0.5" fill={darkMode ? '#F1F5F9' : '#0F172A'} />
              <rect x="13.5" y="0" width="2.5" height="12" rx="0.5" fill={darkMode ? '#F1F5F9' : '#0F172A'} />
            </svg>
            {/* WiFi */}
            <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
              <path d="M7.5 9.5C8.05 9.5 8.5 9.95 8.5 10.5S8.05 11.5 7.5 11.5 6.5 11.05 6.5 10.5 6.95 9.5 7.5 9.5Z" fill={darkMode ? '#F1F5F9' : '#0F172A'} />
              <path d="M4.5 7C5.8 5.8 7 5.2 7.5 5.2S9.2 5.8 10.5 7" stroke={darkMode ? '#F1F5F9' : '#0F172A'} strokeWidth="1.2" strokeLinecap="round" fill="none" />
              <path d="M2 4.5C3.8 2.8 5.6 2 7.5 2S11.2 2.8 13 4.5" stroke={darkMode ? '#F1F5F9' : '#0F172A'} strokeWidth="1.2" strokeLinecap="round" fill="none" />
            </svg>
            {/* Battery */}
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke={darkMode ? '#F1F5F9' : '#0F172A'} strokeOpacity="0.5" />
              <rect x="22" y="3.5" width="2.5" height="5" rx="1.25" fill={darkMode ? '#F1F5F9' : '#0F172A'} fillOpacity="0.5" />
              <rect x="2" y="2" width="16" height="8" rx="2" fill={darkMode ? '#F1F5F9' : '#0F172A'} />
            </svg>
          </div>
        </div>

        {/* Dynamic Island */}
        <div
          className="absolute z-50 bg-black rounded-full"
          style={{ top: 12, left: '50%', transform: 'translateX(-50%)', width: 126, height: 36 }}
        />

        {/* Main content */}
        <div className="absolute inset-0 overflow-hidden" style={{ top: 0 }}>
          {children}
        </div>

        {/* Home indicator */}
        <div
          className="absolute bottom-2 left-1/2 z-50 rounded-full"
          style={{
            transform: 'translateX(-50%)',
            width: 128,
            height: 5,
            background: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.18)',
          }}
        />
      </div>
    </div>
  )
}
