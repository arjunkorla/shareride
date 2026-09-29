import type { Match } from '@shareride/types'

// Mirrors apps/api/src/matching/matching-score.util.ts's combineScore/
// scoreToLabel exactly (same weights and thresholds) so the mobile-side
// "Great match"/"Good match"/"Fair match" labels are consistent with the
// numbers apps/api computed server-side — Match only carries the raw
// routeCompatibility/timeCompatibility/distances, not a label, so turning
// them into a human-readable badge is a presentation concern that lives
// here, same as the existing fixture-driven matchColors/matchLabels in
// lib/theme.ts.
const PROXIMITY_ZERO_METERS = 3000
const WEIGHTS = { route: 0.5, time: 0.3, proximity: 0.2 } as const
const GREAT_THRESHOLD = 0.75
const GOOD_THRESHOLD = 0.5

export function computeMatchLabel(
  match: Pick<Match, 'routeCompatibility' | 'timeCompatibility' | 'originDistanceMeters' | 'destinationDistanceMeters'>,
): 'great' | 'good' | 'ok' {
  const avgDistance = (match.originDistanceMeters + match.destinationDistanceMeters) / 2
  const proximityScore = Math.max(0, Math.min(1, 1 - avgDistance / PROXIMITY_ZERO_METERS))
  const score = match.routeCompatibility * WEIGHTS.route + match.timeCompatibility * WEIGHTS.time + proximityScore * WEIGHTS.proximity
  if (score >= GREAT_THRESHOLD) return 'great'
  if (score >= GOOD_THRESHOLD) return 'good'
  return 'ok'
}

export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km away` : `${Math.round(meters)} m away`
}
