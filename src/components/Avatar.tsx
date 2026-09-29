import { useState, useEffect } from 'react'

interface Props {
  src?: string
  name: string
  size?: number
  className?: string
}

const PALETTE = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2']

// Deterministic (not random) so the same person always gets the same
// fallback color/initials across renders and sessions.
function colorForName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Avatar({ src, name, size = 36, className = '' }: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error')

  useEffect(() => {
    setStatus(src ? 'loading' : 'error')
  }, [src])

  const showFallback = status !== 'loaded'

  return (
    <div
      className={`relative overflow-hidden rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size, background: showFallback ? colorForName(name) : '#E2E8F0' }}
    >
      {showFallback && (
        <span
          className="font-bold text-white select-none"
          style={{ fontSize: size * 0.38, fontFamily: "'Outfit', sans-serif" }}
        >
          {initialsForName(name)}
        </span>
      )}
      {src && status !== 'error' && (
        <img
          src={src}
          alt={name}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: status === 'loaded' ? 1 : 0, transition: 'opacity 150ms ease-in' }}
        />
      )}
    </div>
  )
}
