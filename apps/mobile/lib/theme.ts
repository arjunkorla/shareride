// Color tokens carried over from the prototype's inline hex values
// (src/index.css had no Tailwind theme extension — see docs/current-architecture.md §6)
// so RN screens share one palette instead of re-hardcoding hex strings per file.
export const colors = {
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  blueLight: '#3B82F6',
  blueSoft: '#EFF6FF',
  blueBorder: '#BFDBFE',
  green: '#059669',
  greenDark: '#047857',
  greenSoft: '#ECFDF5',
  greenBorder: '#A7F3D0',
  amber: '#D97706',
  amberSoft: '#FEF3C7',
  red: '#DC2626',
  redSoft: '#FEE2E2',
  redBorder: '#FECACA',
  purple: '#7C3AED',
  slate900: '#0F172A',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  bg: '#F8FAFC',
  white: '#FFFFFF',
} as const

export const matchColors: Record<'great' | 'good' | 'ok', { bg: string; text: string }> = {
  great: { bg: '#D1FAE5', text: colors.green },
  good: { bg: '#DBEAFE', text: colors.blue },
  ok: { bg: colors.amberSoft, text: colors.amber },
}

export const matchLabels: Record<'great' | 'good' | 'ok', string> = {
  great: 'Great match',
  good: 'Good match',
  ok: 'Fair match',
}

// Hyderabad city center — used as the default map region until Phase 7's
// matching engine supplies real request/offer coordinates.
export const HYDERABAD_CENTER = { latitude: 17.4474, longitude: 78.3762 }

export const radii = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 }
