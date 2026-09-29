import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { GeoPoint } from '@shareride/types'
import { haversineMeters, ROAD_DISTANCE_FUDGE_FACTOR } from './geo.util'

const ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'

interface ComputeRoutesResponse {
  routes?: { distanceMeters?: number }[]
}

// Real road distance between two points, for scoring how much of a
// detour a pickup/drop-off is relative to an offer's own route
// (matching.service.ts). Uses the Google Routes API when
// GOOGLE_MAPS_API_KEY is configured with that API enabled; otherwise
// falls back to a straight-line estimate — same "written for real, not
// verified against a live key in this sandbox" status as the mobile
// MapView's Google Maps SDK usage (see apps/mobile/components/MapView.tsx).
@Injectable()
export class RouteDistanceService {
  private readonly logger = new Logger(RouteDistanceService.name)

  constructor(private readonly config: ConfigService) {}

  async getDrivingDistanceMeters(origin: GeoPoint, destination: GeoPoint): Promise<number> {
    const apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY')
    if (!apiKey) {
      return haversineMeters(origin, destination) * ROAD_DISTANCE_FUDGE_FACTOR
    }

    try {
      const res = await fetch(ROUTES_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.distanceMeters',
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
          destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
          travelMode: 'DRIVE',
        }),
      })

      if (!res.ok) {
        this.logger.warn(`Google Routes API returned ${res.status}; falling back to straight-line distance`)
        return haversineMeters(origin, destination) * ROAD_DISTANCE_FUDGE_FACTOR
      }

      const data = (await res.json()) as ComputeRoutesResponse
      const distanceMeters = data.routes?.[0]?.distanceMeters
      if (typeof distanceMeters !== 'number') {
        return haversineMeters(origin, destination) * ROAD_DISTANCE_FUDGE_FACTOR
      }
      return distanceMeters
    } catch (error) {
      this.logger.warn(`Google Routes API request failed; falling back to straight-line distance: ${(error as Error).message}`)
      return haversineMeters(origin, destination) * ROAD_DISTANCE_FUDGE_FACTOR
    }
  }
}
