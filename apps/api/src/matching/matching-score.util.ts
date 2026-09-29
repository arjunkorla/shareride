export type MatchLabel = 'great' | 'good' | 'ok'

// Below this combined score, a candidate isn't surfaced as a match at all
// (see matching.service.ts) — matches the "not a guaranteed match" framing
// in packages/database/prisma/seed.ts's demo pair.
export const MIN_CANDIDATE_SCORE = 0.25

const GREAT_THRESHOLD = 0.75
const GOOD_THRESHOLD = 0.5

// Proximity contributes less than route/time compatibility once a
// candidate has already passed the PostGIS ST_DWithin filter (it's a
// tie-breaker among already-nearby candidates, not the primary signal).
const WEIGHTS = { route: 0.5, time: 0.3, proximity: 0.2 } as const

// A pickup/drop-off this far from the offer's own route contributes ~0
// proximity credit — same order of magnitude as the ST_DWithin radius
// matching.service.ts uses to find candidates in the first place.
const PROXIMITY_ZERO_METERS = 3000

export function computeProximityScore(originDistanceMeters: number, destinationDistanceMeters: number): number {
  const avg = (originDistanceMeters + destinationDistanceMeters) / 2
  return clamp01(1 - avg / PROXIMITY_ZERO_METERS)
}

// detourMeters is how far out of the way the offer's route is from the
// request's route (pickup + drop-off legs); totalRouteMeters is the
// offer's own origin->destination distance. A short detour relative to
// the whole trip scores well; a detour comparable to (or longer than) the
// trip itself scores near zero.
export function computeRouteCompatibility(pickupDetourMeters: number, dropoffDetourMeters: number, totalRouteMeters: number): number {
  if (totalRouteMeters <= 0) return 0
  const detourRatio = (pickupDetourMeters + dropoffDetourMeters) / totalRouteMeters
  return clamp01(1 - detourRatio)
}

// Both dates as "YYYY-MM-DD", both times as "HH:mm". A departure inside
// the passenger's preferred window scores 1; outside it, credit decays
// linearly and reaches 0 at GRACE_MINUTES past either edge.
const GRACE_MINUTES = 45

export function computeTimeCompatibility(
  preferredDate: string,
  preferredTimeStart: string,
  preferredTimeEnd: string,
  candidateDate: string,
  candidateTime: string,
): number {
  if (preferredDate !== candidateDate) return 0

  const start = toMinutes(preferredTimeStart)
  const end = toMinutes(preferredTimeEnd)
  const t = toMinutes(candidateTime)

  if (t >= start && t <= end) return 1
  const minutesOutside = t < start ? start - t : t - end
  return clamp01(1 - minutesOutside / GRACE_MINUTES)
}

export function combineScore(routeCompatibility: number, timeCompatibility: number, proximityScore: number): number {
  return routeCompatibility * WEIGHTS.route + timeCompatibility * WEIGHTS.time + proximityScore * WEIGHTS.proximity
}

export function scoreToLabel(score: number): MatchLabel {
  if (score >= GREAT_THRESHOLD) return 'great'
  if (score >= GOOD_THRESHOLD) return 'good'
  return 'ok'
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}
