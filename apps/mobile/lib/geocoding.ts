import type { GeoPoint } from '@shareride/types'
import { HYDERABAD_CENTER } from './theme'

// Placeholder geocoding until a real Places/geocoding API is wired up
// (post-ride.tsx's Route step is free-text, not a map picker). Mirrors the
// same named-area coordinates packages/database/prisma/seed.ts uses, so a
// request for "Madhapur" here and the seeded demo data represent the same
// physical point. Anything not in this table falls back to the Hyderabad
// city center rather than failing the request outright.
const AREA_COORDINATES: Record<string, GeoPoint> = {
  Madhapur: { lat: 17.4483, lng: 78.3915 },
  Gachibowli: { lat: 17.4401, lng: 78.3489 },
  'HITEC City': { lat: 17.4435, lng: 78.3772 },
  Kondapur: { lat: 17.4615, lng: 78.3627 },
  'Financial District': { lat: 17.4136, lng: 78.3418 },
  'Jubilee Hills': { lat: 17.4325, lng: 78.4071 },
  'Banjara Hills': { lat: 17.4156, lng: 78.4347 },
  Secunderabad: { lat: 17.4399, lng: 78.4983 },
  Kukatpally: { lat: 17.4849, lng: 78.4138 },
  Miyapur: { lat: 17.4966, lng: 78.3616 },
  Ameerpet: { lat: 17.4374, lng: 78.4487 },
  'LB Nagar': { lat: 17.3466, lng: 78.5531 },
  Uppal: { lat: 17.3995, lng: 78.5591 },
  Shamshabad: { lat: 17.2403, lng: 78.4294 },
}

export function resolveCoordinates(placeName: string): GeoPoint {
  const match = Object.keys(AREA_COORDINATES).find(
    (name) => name.toLowerCase() === placeName.trim().toLowerCase(),
  )
  if (match) return AREA_COORDINATES[match]

  const partial = Object.keys(AREA_COORDINATES).find((name) =>
    placeName.toLowerCase().includes(name.toLowerCase()),
  )
  if (partial) return AREA_COORDINATES[partial]

  return { lat: HYDERABAD_CENTER.latitude, lng: HYDERABAD_CENTER.longitude }
}
