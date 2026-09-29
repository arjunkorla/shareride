import type { GeoPoint } from '@shareride/types'

const EARTH_RADIUS_METERS = 6371000

// Straight-line ("as the crow flies") distance — used for scoring once
// candidates are already narrowed down by the PostGIS proximity query in
// matching.service.ts, and as the fallback distance estimate when
// RouteDistanceService has no live Google Routes API key to call.
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h))
}

// Real road distance is reliably longer than straight-line distance
// (roads aren't straight); this is a rough multiplier for when there's no
// live routing API to ask, not a claim of accuracy.
export const ROAD_DISTANCE_FUDGE_FACTOR = 1.3
