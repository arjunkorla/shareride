interface Marker {
  x: number
  y: number
  label?: string
  type?: 'user' | 'ride' | 'destination'
}

interface Props {
  markers?: Marker[]
  showRoute?: boolean
  compact?: boolean
  onClick?: () => void
}

export default function MapView({ markers, showRoute, compact, onClick }: Props) {
  const defaultMarkers: Marker[] = [
    { x: 195, y: 220, type: 'user' },
    { x: 290, y: 155, label: '₹450', type: 'ride' },
    { x: 310, y: 290, label: '₹380', type: 'ride' },
    { x: 140, y: 310, label: '₹520', type: 'ride' },
    { x: 85, y: 180, label: '₹410', type: 'ride' },
  ]

  const activeMarkers = markers ?? defaultMarkers
  const h = compact ? 280 : 480

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: h, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <svg
        viewBox={`0 0 390 ${h}`}
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Land */}
        <rect width="390" height={h} fill="#EDE9DF" />

        {/* Sea / water body top-left */}
        <path d="M0,0 L110,0 L140,35 L110,90 L60,120 L0,110 Z" fill="#BAD9F0" />
        <path d="M0,0 L110,0 L130,25 L100,75 L55,105 L0,95 Z" fill="#C5E2F5" fillOpacity="0.7" />

        {/* Park / green zones */}
        <rect x="148" y="22" width="96" height="68" rx="8" fill="#C8E6C9" />
        <circle cx="170" cy="44" r="10" fill="#A5D6A7" />
        <circle cx="188" cy="36" r="13" fill="#81C784" />
        <circle cx="210" cy="48" r="11" fill="#A5D6A7" />
        <circle cx="228" cy="38" r="9" fill="#66BB6A" />
        <circle cx="174" cy="64" r="8" fill="#81C784" />
        <circle cx="196" cy="74" r="10" fill="#A5D6A7" />
        <circle cx="220" cy="66" r="8" fill="#66BB6A" />

        {/* Park 2 */}
        <rect x="300" y="160" width="60" height="80" rx="6" fill="#C8E6C9" />
        <circle cx="320" cy="185" r="9" fill="#A5D6A7" />
        <circle cx="340" cy="178" r="11" fill="#81C784" />
        <circle cx="330" cy="210" r="8" fill="#A5D6A7" />

        {/* Building blocks */}
        {[
          [130, 108, 36, 36], [172, 108, 52, 36], [230, 108, 40, 36], [276, 108, 34, 36],
          [130, 152, 44, 34], [182, 152, 38, 34], [228, 152, 48, 34],
          [130, 194, 36, 38], [174, 194, 52, 38], [234, 194, 40, 38],
          [130, 240, 44, 34], [182, 240, 36, 34], [226, 240, 52, 34], [286, 240, 36, 34],
          [130, 282, 40, 36], [178, 282, 44, 36], [230, 282, 38, 36],
          [130, 326, 46, 32], [184, 326, 38, 32], [230, 326, 44, 32],
          [130, 366, 44, 34], [182, 366, 48, 34], [238, 366, 40, 34], [286, 366, 36, 34],
          [130, 408, 52, 34], [190, 408, 40, 34], [238, 408, 48, 34],
          [40, 140, 30, 30], [40, 178, 30, 30], [40, 216, 30, 38], [40, 262, 30, 34],
          [40, 304, 30, 36], [40, 348, 30, 34], [40, 390, 30, 34],
        ].map(([x, y, w, bh], i) => (
          <rect key={i} x={x} y={y} width={w} height={bh} rx="2.5" fill="#E5DFCF" stroke="#D8D1BF" strokeWidth="0.5" />
        ))}

        {/* Horizontal major roads */}
        {[100, 144, 188, 232, 276, 320, 362, 408, 448].map((y, i) => (
          y <= h && <line key={i} x1="0" y1={y} x2="390" y2={y} stroke="white" strokeWidth={i < 2 ? 5.5 : 4} />
        ))}

        {/* Vertical major roads */}
        {[80, 126, 168, 222, 268, 322, 368].map((x, i) => (
          <line key={i} x1={x} y1="0" x2={x} y2={h} stroke="white" strokeWidth={i === 0 || i === 4 ? 5.5 : 3.5} />
        ))}

        {/* Diagonal / curved road (coastal) */}
        <path
          d="M0,110 Q40,130 70,160 Q100,185 118,230 Q130,260 132,300"
          stroke="white" strokeWidth="5" fill="none"
        />

        {/* Minor streets */}
        {[50, 64, 76].map((y, i) => (
          <line key={i} x1="130" y1={y + 60} x2="390" y2={y + 60} stroke="white" strokeWidth="2" opacity="0.7" />
        ))}

        {/* Route line */}
        {showRoute && (
          <path
            d="M195,220 Q230,190 260,165 Q285,150 295,155"
            stroke="#2563EB" strokeWidth="3.5" fill="none"
            strokeDasharray="8,4" strokeLinecap="round"
          />
        )}

        {/* Road labels */}
        <text x="134" y="97" fill="#999" fontSize="7" fontFamily="Inter, sans-serif">MG ROAD</text>
        <text x="134" y="141" fill="#999" fontSize="7" fontFamily="Inter, sans-serif">MARINE DR</text>
        <text x="134" y="185" fill="#999" fontSize="7" fontFamily="Inter, sans-serif">SV ROAD</text>

        {/* Vertical labels */}
        <text x="85" y="108" fill="#999" fontSize="6.5" fontFamily="Inter, sans-serif" transform="rotate(-90, 85, 108)" textAnchor="middle">LINK ROAD</text>

        {/* Markers */}
        {activeMarkers.map((m, i) => {
          if (m.type === 'user') {
            return (
              <g key={i}>
                <circle cx={m.x} cy={m.y} r="20" fill="#2563EB" fillOpacity="0.15" />
                <circle cx={m.x} cy={m.y} r="10" fill="#2563EB" fillOpacity="0.25" />
                <circle cx={m.x} cy={m.y} r="7" fill="#2563EB" />
                <circle cx={m.x} cy={m.y} r="3.5" fill="white" />
                <circle cx={m.x - 1.5} cy={m.y - 1.5} r="1.2" fill="white" fillOpacity="0.7" />
              </g>
            )
          }
          if (m.type === 'destination') {
            return (
              <g key={i}>
                <circle cx={m.x} cy={m.y} r="10" fill="#DC2626" />
                <circle cx={m.x} cy={m.y} r="4" fill="white" />
                <rect x={m.x - 1.5} y={m.y + 10} width="3" height="8" rx="1.5" fill="#DC2626" />
              </g>
            )
          }
          // ride marker
          return (
            <g key={i}>
              <rect
                x={m.x - 22} y={m.y - 14}
                width={44} height={26}
                rx="13" fill="white"
                stroke="#2563EB" strokeWidth="1.5"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
              />
              <text
                x={m.x} y={m.y + 4}
                textAnchor="middle" fill="#2563EB"
                fontSize="9.5" fontWeight="700" fontFamily="Outfit, sans-serif"
              >
                {m.label}
              </text>
              <polygon
                points={`${m.x - 4},${m.y + 12} ${m.x + 4},${m.y + 12} ${m.x},${m.y + 17}`}
                fill="white" stroke="#2563EB" strokeWidth="1.5"
              />
            </g>
          )
        })}

        {/* Map attribution */}
        <rect x="0" y={h - 16} width="390" height="16" fill="white" fillOpacity="0.6" />
        <text x="8" y={h - 5} fill="#aaa" fontSize="7" fontFamily="Inter, sans-serif">
          © ShareRide Maps · OpenStreetMap contributors
        </text>
      </svg>

      {/* Overlay controls (compass, zoom) */}
      <div className="absolute right-3 bottom-6 flex flex-col gap-2">
        <button className="w-8 h-8 bg-white rounded-lg shadow-card flex items-center justify-center text-slate-600 text-base font-bold">
          +
        </button>
        <button className="w-8 h-8 bg-white rounded-lg shadow-card flex items-center justify-center text-slate-600 text-base font-bold">
          −
        </button>
        <button className="w-8 h-8 bg-white rounded-lg shadow-card flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L9.5 6H4.5L7 1Z" fill="#2563EB" />
            <path d="M7 13L4.5 8H9.5L7 13Z" fill="#94A3B8" />
            <circle cx="7" cy="7" r="1.5" fill="#0F172A" />
          </svg>
        </button>
      </div>
    </div>
  )
}
