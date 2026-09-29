import { haversineMeters, ROAD_DISTANCE_FUDGE_FACTOR } from './geo.util'
import {
  combineScore,
  computeProximityScore,
  computeRouteCompatibility,
  computeTimeCompatibility,
  scoreToLabel,
  MIN_CANDIDATE_SCORE,
} from './matching-score.util'

// Same Hyderabad coordinates as packages/database/prisma/seed.ts's AREAS
// table, so this test reasons about the exact real-world pair the seed
// data creates (Madhapur -> Gachibowli passenger request vs Kondapur ->
// Financial District 8:15am driver offer) — per docs/migration-plan.md
// Phase 7's "seed and test against realistic Hyderabad pairs."
const MADHAPUR = { lat: 17.4483, lng: 78.3915 }
const GACHIBOWLI = { lat: 17.4401, lng: 78.3489 }
const KONDAPUR = { lat: 17.4615, lng: 78.3627 }
const FINANCIAL_DISTRICT = { lat: 17.4136, lng: 78.3418 }

describe('computeTimeCompatibility', () => {
  it('scores 1 when the departure falls inside the preferred window', () => {
    expect(computeTimeCompatibility('2026-08-10', '08:00', '09:00', '2026-08-10', '08:30')).toBe(1)
  })

  it('decays with distance outside the window and reaches 0 at the grace boundary', () => {
    const justOutside = computeTimeCompatibility('2026-08-10', '08:00', '09:00', '2026-08-10', '09:15')
    const wayOutside = computeTimeCompatibility('2026-08-10', '08:00', '09:00', '2026-08-10', '11:00')
    expect(justOutside).toBeGreaterThan(0)
    expect(justOutside).toBeLessThan(1)
    expect(wayOutside).toBe(0)
  })

  it('scores 0 on a different date regardless of time', () => {
    expect(computeTimeCompatibility('2026-08-10', '08:00', '09:00', '2026-08-11', '08:30')).toBe(0)
  })
})

describe('computeProximityScore', () => {
  it('scores 1 for a coincident pickup/drop-off and decays with distance', () => {
    expect(computeProximityScore(0, 0)).toBe(1)
    expect(computeProximityScore(1500, 1500)).toBeCloseTo(0.5, 1)
    expect(computeProximityScore(3000, 3000)).toBe(0)
    expect(computeProximityScore(10000, 10000)).toBe(0)
  })
})

describe('computeRouteCompatibility', () => {
  it('scores 1 for a zero detour and decays as the detour approaches the trip length', () => {
    expect(computeRouteCompatibility(0, 0, 10000)).toBe(1)
    expect(computeRouteCompatibility(5000, 0, 10000)).toBeCloseTo(0.5, 1)
    expect(computeRouteCompatibility(10000, 10000, 10000)).toBe(0)
  })

  it('scores 0 for a degenerate zero-length offer route rather than dividing by zero', () => {
    expect(computeRouteCompatibility(100, 100, 0)).toBe(0)
  })
})

describe('scoreToLabel', () => {
  it('maps thresholds to great/good/ok', () => {
    expect(scoreToLabel(0.9)).toBe('great')
    expect(scoreToLabel(0.6)).toBe('good')
    expect(scoreToLabel(0.1)).toBe('ok')
  })
})

describe('realistic Hyderabad pair: Madhapur->Gachibowli request vs Kondapur->Financial District 8:15am offer', () => {
  it('produces a well-formed score without crashing, matching the seed comment that this is "not a guaranteed match"', () => {
    const pickupDetourMeters = haversineMeters(MADHAPUR, KONDAPUR) * ROAD_DISTANCE_FUDGE_FACTOR
    const dropoffDetourMeters = haversineMeters(GACHIBOWLI, FINANCIAL_DISTRICT) * ROAD_DISTANCE_FUDGE_FACTOR
    const totalRouteMeters = haversineMeters(KONDAPUR, FINANCIAL_DISTRICT) * ROAD_DISTANCE_FUDGE_FACTOR

    const routeCompatibility = computeRouteCompatibility(pickupDetourMeters, dropoffDetourMeters, totalRouteMeters)
    const proximityScore = computeProximityScore(
      haversineMeters(MADHAPUR, KONDAPUR),
      haversineMeters(GACHIBOWLI, FINANCIAL_DISTRICT),
    )
    const timeCompatibility = computeTimeCompatibility('2026-08-10', '08:00', '09:00', '2026-08-10', '08:15')
    const score = combineScore(routeCompatibility, timeCompatibility, proximityScore)

    // These two areas are a few km apart in real Hyderabad geography — a
    // real candidate worth surfacing, but not assumed to be a "great"
    // match, which is exactly what the seed data's own comment says.
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(1)
    expect(['great', 'good', 'ok']).toContain(scoreToLabel(score))
    expect(timeCompatibility).toBe(1)
  })

  it('is at least the minimum candidate score, given the offer departs inside the request\'s preferred window', () => {
    const pickupDetourMeters = haversineMeters(MADHAPUR, KONDAPUR) * ROAD_DISTANCE_FUDGE_FACTOR
    const dropoffDetourMeters = haversineMeters(GACHIBOWLI, FINANCIAL_DISTRICT) * ROAD_DISTANCE_FUDGE_FACTOR
    const totalRouteMeters = haversineMeters(KONDAPUR, FINANCIAL_DISTRICT) * ROAD_DISTANCE_FUDGE_FACTOR
    const routeCompatibility = computeRouteCompatibility(pickupDetourMeters, dropoffDetourMeters, totalRouteMeters)
    const proximityScore = computeProximityScore(
      haversineMeters(MADHAPUR, KONDAPUR),
      haversineMeters(GACHIBOWLI, FINANCIAL_DISTRICT),
    )
    const score = combineScore(routeCompatibility, 1, proximityScore)
    expect(score).toBeGreaterThanOrEqual(MIN_CANDIDATE_SCORE)
  })
})
