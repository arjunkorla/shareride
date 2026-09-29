import { Circle, Line, Path, Rect, Svg } from '../lib/native-shims'
import { colors } from '../lib/theme'

// Small shared icon set ported 1:1 from the prototype's inline SVGs
// (src/components/BottomNav.tsx, RideCard.tsx, RideDetailScreen.tsx) using
// react-native-svg so screens don't fall back to emoji for anything that
// had a real vector icon on the web.

export function StarIcon({ size = 11, filled = true }: { size?: number; filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 11 11" fill={filled ? '#F59E0B' : colors.slate200}>
      <Path d="M5.5 1L6.8 4H10L7.5 6L8.5 9L5.5 7L2.5 9L3.5 6L1 4H4.2L5.5 1Z" />
    </Svg>
  )
}

export function VerifiedIcon({ size = 13 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <Circle cx={6.5} cy={6.5} r={6.5} fill={colors.blue} />
      <Path d="M3.5 6.5L5.5 8.5L9.5 4.5" stroke="white" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function LightningIcon({ width = 10, height = 12 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 10 12" fill={colors.green}>
      <Path d="M6 1L1 7H5L4 11L9 5H5L6 1Z" />
    </Svg>
  )
}

export function ChevronLeftIcon({ size = 18, color = colors.slate900 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M11 4L6 9L11 14" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function ChevronRightIcon({ size = 16, color = colors.slate300 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M6 4L10 8L6 12" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function CloseIcon({ size = 14, color = colors.slate500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path d="M2 2L12 12M12 2L2 12" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  )
}

export function SearchIconGlyph({ size = 16, color = colors.slate500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx={7} cy={7} r={5} stroke={color} strokeWidth={1.4} />
      <Line x1={11} y1={11} x2={14.5} y2={14.5} stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  )
}

export function SwapIcon({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M4 3V13M4 13L1.5 10.5M4 13L6.5 10.5" stroke={colors.blue} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 13V3M12 3L9.5 5.5M12 3L14.5 5.5" stroke={colors.blue} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function ChatBubbleIcon({ size = 16, color = 'white' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <Path d="M14 2H2C1.45 2 1 2.45 1 3V10C1 10.55 1.45 11 2 11H5L8 14L11 11H14C14.55 11 15 10.55 15 10V3C15 2.45 14.55 2 14 2Z" />
    </Svg>
  )
}

// Bottom tab icons — filled=true is the active state (matches BottomNav.tsx).
export function HomeTabIcon({ filled }: { filled: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M2 9.5L11 2L20 9.5V20C20 20.55 19.55 21 19 21H14V15H8V21H3C2.45 21 2 20.55 2 20V9.5Z"
        fill={filled ? colors.blue : 'none'} stroke={filled ? colors.blue : colors.slate400} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  )
}

export function DiscoverTabIcon({ filled }: { filled: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={10} cy={10} r={7} fill={filled ? '#EFF6FF' : 'none'} stroke={filled ? colors.blue : colors.slate400} strokeWidth={1.6} />
      <Line x1={15.5} y1={15.5} x2={20} y2={20} stroke={filled ? colors.blue : colors.slate400} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

export function TripsTabIcon({ filled }: { filled: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Rect x={2} y={4} width={18} height={15} rx={2.5} fill={filled ? '#EFF6FF' : 'none'} stroke={filled ? colors.blue : colors.slate400} strokeWidth={1.6} />
      <Line x1={2} y1={9} x2={20} y2={9} stroke={filled ? colors.blue : colors.slate400} strokeWidth={1.4} />
    </Svg>
  )
}

export function ChatTabIcon({ filled }: { filled: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M19 3H3C2.45 3 2 3.45 2 4V15C2 15.55 2.45 16 3 16H6L11 21L16 16H19C19.55 16 20 15.55 20 15V4C20 3.45 19.55 3 19 3Z"
        fill={filled ? '#EFF6FF' : 'none'} stroke={filled ? colors.blue : colors.slate400} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  )
}

export function ProfileTabIcon({ filled }: { filled: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={8} r={4} fill={filled ? '#EFF6FF' : 'none'} stroke={filled ? colors.blue : colors.slate400} strokeWidth={1.6} />
      <Path d="M3 20C3 16.7 6.6 14 11 14C15.4 14 19 16.7 19 20" stroke={filled ? colors.blue : colors.slate400} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  )
}

export function PlusIcon({ size = 26, color = 'white' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <Line x1={13} y1={5} x2={13} y2={21} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <Line x1={5} y1={13} x2={21} y2={13} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  )
}

export function BellIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path d="M11 2.5C11 2.5 5 4.5 5 10.5V15.5H4C3.45 15.5 3 15.95 3 16.5C3 17.05 3.45 17.5 4 17.5H18C18.55 17.5 19 17.05 19 16.5C19 15.95 18.55 15.5 18 15.5H17V10.5C17 4.5 11 2.5 11 2.5Z"
        fill="none" stroke={colors.slate900} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M9 17.5C9 18.6 9.9 19.5 11 19.5C12.1 19.5 13 18.6 13 17.5" stroke={colors.slate900} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={17} cy={5} r={3} fill={colors.red} />
    </Svg>
  )
}

export function FilterIcon({ size = 13, color = colors.blue }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size + 1} viewBox="0 0 13 12" fill="none">
      <Path d="M1 2H12M3 6H10M5 10H8" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  )
}

export function CheckIcon({ size = 16, color = 'white' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx={8} cy={8} r={8} fill={colors.blue} />
      <Path d="M4.5 8L6.5 10L11.5 5.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function SosIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M4.5 3H2.5C2.22 3 2 3.22 2 3.5V14.5C2 14.78 2.22 15 2.5 15H4.5" stroke="white" strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M13.5 3H15.5C15.78 3 16 3.22 16 3.5V14.5C16 14.78 15.78 15 15.5 15H13.5" stroke="white" strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M7 6H5V9H7V12H5" stroke="white" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 6H13V12H10V9H12" stroke="white" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function amenityIcon(a: string): string {
  if (a.includes('AC')) return '❄️'
  if (a.includes('Women')) return '👩'
  if (a.includes('Music')) return '🎵'
  if (a.includes('USB')) return '🔌'
  if (a.includes('Luggage')) return '🧳'
  if (a.includes('Pets')) return '🐾'
  if (a.includes('Silent')) return '🤫'
  return '✓'
}
