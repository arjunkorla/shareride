import { useState } from 'react'

interface Props {
  onComplete: () => void
}

const slides = [
  {
    id: 0,
    title: 'Share the Journey',
    subtitle: 'Find rides going your way or offer empty seats to fellow travelers across the city.',
    color: '#EFF6FF',
    accent: '#2563EB',
    illustration: (
      <svg width="220" height="180" viewBox="0 0 220 180" fill="none">
        {/* Road */}
        <path d="M20 150 Q110 140 200 150" stroke="#CBD5E1" strokeWidth="20" strokeLinecap="round" />
        <path d="M20 150 Q110 140 200 150" stroke="white" strokeWidth="18" strokeLinecap="round" />
        {/* Dashes */}
        {[40, 80, 120, 160].map((x) => (
          <line key={x} x1={x} y1="150" x2={x + 20} y2="149" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />
        ))}
        {/* Car 1 */}
        <g transform="translate(60, 120)">
          <rect x="0" y="12" width="56" height="24" rx="6" fill="#2563EB" />
          <rect x="8" y="4" width="40" height="14" rx="4" fill="#3B82F6" />
          <rect x="10" y="6" width="16" height="10" rx="2" fill="#BAE6FD" fillOpacity="0.9" />
          <rect x="30" y="6" width="16" height="10" rx="2" fill="#BAE6FD" fillOpacity="0.9" />
          <circle cx="12" cy="36" r="6" fill="#0F172A" />
          <circle cx="44" cy="36" r="6" fill="#0F172A" />
          <circle cx="12" cy="36" r="2.5" fill="#64748B" />
          <circle cx="44" cy="36" r="2.5" fill="#64748B" />
        </g>
        {/* People icons */}
        {[100, 120, 140].map((x, i) => (
          <g key={i} transform={`translate(${x}, 50)`}>
            <circle cx="0" cy="0" r="14" fill={['#DBEAFE', '#EFF6FF', '#BFDBFE'][i]} />
            <circle cx="0" cy="-2" r="5" fill={['#2563EB', '#3B82F6', '#1D4ED8'][i]} />
            <path d="M-7 10C-7 5 7 5 7 10" stroke={['#2563EB', '#3B82F6', '#1D4ED8'][i]} strokeWidth="2" fill="none" />
          </g>
        ))}
        {/* Arrow */}
        <path d="M95 95 L125 95" stroke="#2563EB" strokeWidth="2" strokeDasharray="3 2" />
        <polygon points="125,91 133,95 125,99" fill="#2563EB" />
        {/* City buildings */}
        <rect x="160" y="60" width="16" height="80" rx="2" fill="#E2E8F0" />
        <rect x="180" y="80" width="12" height="60" rx="2" fill="#CBD5E1" />
        <rect x="195" y="70" width="18" height="70" rx="2" fill="#E2E8F0" />
        {/* Windows */}
        {[0, 1, 2, 3].map((r) =>
          [0, 1].map((c) => (
            <rect key={`${r}${c}`} x={163 + c * 6} y={65 + r * 14} width="4" height="6" rx="1" fill="#BAD9F0" />
          ))
        )}
      </svg>
    ),
  },
  {
    id: 1,
    title: 'Save Fuel & Money',
    subtitle: 'Split travel costs with fellow passengers. Drivers earn back fuel costs on every trip.',
    color: '#F0FDF4',
    accent: '#059669',
    illustration: (
      <svg width="220" height="180" viewBox="0 0 220 180" fill="none">
        {/* Coin stack */}
        <ellipse cx="110" cy="140" rx="36" ry="10" fill="#FEF3C7" />
        <ellipse cx="110" cy="128" rx="36" ry="10" fill="#FDE68A" />
        <rect x="74" y="128" width="72" height="12" fill="#FCD34D" />
        <ellipse cx="110" cy="116" rx="36" ry="10" fill="#F59E0B" />
        <rect x="74" y="116" width="72" height="12" fill="#FBBF24" />
        <ellipse cx="110" cy="104" rx="36" ry="10" fill="#D97706" />
        {/* ₹ symbol */}
        <text x="97" y="110" fill="white" fontSize="16" fontWeight="800" fontFamily="Outfit, sans-serif">₹</text>
        {/* Fuel gauge */}
        <g transform="translate(30, 50)">
          <rect x="0" y="0" width="60" height="36" rx="8" fill="#DCFCE7" />
          <rect x="6" y="6" width="34" height="24" rx="4" fill="#16A34A" />
          <rect x="6" y="6" width="12" height="24" rx="4" fill="#4ADE80" fillOpacity="0.4" />
          <path d="M45 12 L55 12 L55 24 L45 24" stroke="#16A34A" strokeWidth="2" fill="none" />
          <text x="14" y="23" fill="white" fontSize="11" fontWeight="700" fontFamily="Outfit, sans-serif">75%</text>
        </g>
        {/* Arrow down = savings */}
        <g transform="translate(150, 55)">
          <circle cx="20" cy="20" r="22" fill="#DCFCE7" />
          <path d="M20 8 L20 28 M12 22 L20 30 L28 22" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="8" y="52" fill="#059669" fontSize="9" fontWeight="600" fontFamily="Outfit, sans-serif">Save 60%</text>
        </g>
        {/* Dotted line */}
        <line x1="90" y1="68" x2="148" y2="68" stroke="#059669" strokeWidth="1.5" strokeDasharray="4 3" />
      </svg>
    ),
  },
  {
    id: 2,
    title: 'Safe & Verified',
    subtitle: 'Every driver and passenger is ID-verified. Share live trips with your emergency contacts.',
    color: '#FFF7ED',
    accent: '#D97706',
    illustration: (
      <svg width="220" height="180" viewBox="0 0 220 180" fill="none">
        {/* Shield */}
        <path d="M110 20 L160 40 L160 100 Q160 145 110 165 Q60 145 60 100 L60 40 Z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
        <path d="M110 32 L148 48 L148 98 Q148 133 110 150 Q72 133 72 98 L72 48 Z" fill="#FDE68A" fillOpacity="0.5" />
        {/* Checkmark */}
        <path d="M88 95 L103 110 L135 80" stroke="#D97706" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Shield shine */}
        <path d="M80 50 Q88 70 82 90" stroke="white" strokeWidth="3" strokeLinecap="round" fillOpacity="0.6" />
        {/* Verification badges floating */}
        {[
          { x: 20, y: 60, icon: '🪪', label: 'ID' },
          { x: 172, y: 60, icon: '🚗', label: 'Vehicle' },
          { x: 20, y: 120, icon: '📷', label: 'Selfie' },
          { x: 172, y: 120, icon: '📋', label: 'License' },
        ].map(({ x, y, label }) => (
          <g key={label} transform={`translate(${x}, ${y})`}>
            <rect x="0" y="0" width="36" height="26" rx="6" fill="white" stroke="#FDE68A" strokeWidth="1.5" />
            <circle cx="9" cy="13" r="5" fill="#F59E0B" />
            <path d="M6.5 13 L8.5 15 L11.5 10.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <text x="17" y="17" fill="#92400E" fontSize="7" fontWeight="600" fontFamily="Inter, sans-serif">{label}</text>
          </g>
        ))}
        {/* SOS badge */}
        <rect x="80" y="162" width="60" height="20" rx="6" fill="#EF4444" />
        <text x="88" y="176" fill="white" fontSize="9" fontWeight="700" fontFamily="Outfit, sans-serif">SOS Button</text>
      </svg>
    ),
  },
  {
    id: 3,
    title: 'Ready to Ride?',
    subtitle: 'Join 2 million+ verified riders across 500 cities. Post a ride or book a seat in under 60 seconds.',
    color: '#EFF6FF',
    accent: '#2563EB',
    illustration: (
      <svg width="220" height="180" viewBox="0 0 220 180" fill="none">
        {/* Map pin burst */}
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180
          const x = 110 + 70 * Math.cos(rad)
          const y = 90 + 55 * Math.sin(rad)
          return (
            <line key={angle} x1="110" y1="90" x2={x} y2={y} stroke="#DBEAFE" strokeWidth="1.5" strokeDasharray="3 3" />
          )
        })}
        {/* City dots */}
        {[
          { x: 40, y: 45, size: 16, label: 'Mumbai' },
          { x: 178, y: 38, size: 14, label: 'Pune' },
          { x: 30, y: 135, size: 12, label: 'Nashik' },
          { x: 190, y: 140, size: 12, label: 'Surat' },
          { x: 110, y: 25, size: 10, label: 'Delhi' },
          { x: 110, y: 155, size: 10, label: 'Goa' },
        ].map(({ x, y, size, label }) => (
          <g key={label}>
            <circle cx={x} cy={y} r={size} fill="#DBEAFE" />
            <circle cx={x} cy={y} r={size * 0.55} fill="#2563EB" />
            <circle cx={x} cy={y} r={size * 0.25} fill="white" />
            <text x={x} y={y + size + 10} textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="Inter, sans-serif">{label}</text>
          </g>
        ))}
        {/* Center hub */}
        <circle cx="110" cy="90" r="28" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" />
        <circle cx="110" cy="90" r="18" fill="#DBEAFE" />
        <circle cx="110" cy="90" r="10" fill="#2563EB" />
        <circle cx="110" cy="90" r="4" fill="white" />
        {/* User count */}
        <rect x="75" y="160" width="70" height="18" rx="6" fill="#2563EB" />
        <text x="85" y="172.5" fill="white" fontSize="8.5" fontWeight="600" fontFamily="Outfit, sans-serif">2M+ Riders</text>
      </svg>
    ),
  },
]

export default function OnboardingScreen({ onComplete }: Props) {
  const [current, setCurrent] = useState(0)
  const slide = slides[current]

  const next = () => {
    if (current < slides.length - 1) setCurrent(current + 1)
    else onComplete()
  }

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ background: slide.color, transition: 'background 0.5s ease' }}
    >
      {/* Skip */}
      <div className="flex justify-end px-6 pt-16 pb-2">
        <button
          onClick={onComplete}
          className="text-sm text-slate-400 font-medium"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Skip
        </button>
      </div>

      {/* Illustration */}
      <div className="flex items-center justify-center flex-1">
        <div
          key={current}
          className="animate-bounce-in"
        >
          {slide.illustration}
        </div>
      </div>

      {/* Content */}
      <div
        className="px-8 pb-4"
        key={`content-${current}`}
        style={{ animation: 'slide-up 0.4s ease-out forwards' }}
      >
        <h2
          className="text-3xl font-extrabold text-slate-900 text-center leading-tight"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {slide.title}
        </h2>
        <p
          className="text-sm text-slate-500 text-center mt-3 leading-relaxed"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {slide.subtitle}
        </p>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 py-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? 24 : 7,
              height: 7,
              background: i === current ? slide.accent : '#CBD5E1',
            }}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 pb-10">
        <button
          onClick={next}
          className="w-full py-4 rounded-2xl text-white font-bold text-base transition-transform active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${slide.accent}dd 0%, ${slide.accent} 100%)`,
            fontFamily: "'Outfit', sans-serif",
            boxShadow: `0 8px 24px ${slide.accent}44`,
          }}
        >
          {current === slides.length - 1 ? 'Get Started →' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}
