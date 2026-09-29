import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { PrismaService } from './prisma/prisma.service'
import type { MetricsService } from './metrics/metrics.service'
import type { StructuredLogger } from './logger/structured-logger.service'
import type { RouteDistanceService } from '../matching/route-distance.service'
import type { NotificationsService } from '../notifications/notifications.service'
import { MatchingService } from '../matching/matching.service'
import { RideOffersService } from '../rides/ride-offers.service'
import { RideRequestsService } from '../rides/ride-requests.service'

// Spatial SQL contract. PostGIS lives in the dedicated `extensions` schema
// (Supabase's recommended layout; see packages/database/prisma/schema.prisma
// and infrastructure/docker/postgres/init/01-extensions.sql), while
// DATABASE_URL's `schema=public` can leave only `public` on the search_path.
// So every PostGIS function/type reference must be `extensions.`-qualified,
// and raw-SQL ride tables `public.`-qualified — an unqualified reference
// compiles fine and only fails at runtime against the real database.

const UNQUALIFIED_POSTGIS: ReadonlyArray<[string, RegExp]> = [
  ['PostGIS function call', /(?<![\w.])ST_[A-Za-z0-9_]+\s*\(/],
  ['geometry/geography cast', /::\s*(?:geometry|geography)\b/],
  ['geometry/geography type', /(?<![\w.:"])(?:geometry|geography)\s*\(/],
]
const UNQUALIFIED_RIDE_TABLE = /\b(?:FROM|INTO|JOIN|UPDATE)\s+(?!public\.)"?ride_(?:requests|offers)\b/i

function unqualifiedPostgisIn(sql: string): string[] {
  return UNQUALIFIED_POSTGIS.filter(([, pattern]) => pattern.test(sql)).map(([label]) => label)
}

function expectQualifiedSpatialSql(sql: string): void {
  expect(unqualifiedPostgisIn(sql)).toEqual([])
  expect(sql).not.toMatch(UNQUALIFIED_RIDE_TABLE)
}

// ---------------------------------------------------------------------------
// 1. The SQL the services actually send to Prisma at runtime.
// ---------------------------------------------------------------------------

type RawCall = { kind: '$queryRaw' | '$executeRaw'; sql: string }

// Prisma's tagged-template raw calls receive (strings, ...values); the SQL
// text is the static strings with a placeholder where each value goes.
function recordRaw(calls: RawCall[], kind: RawCall['kind'], results: unknown[] = []) {
  return jest.fn((strings: TemplateStringsArray) => {
    calls.push({ kind, sql: strings.join('$?') })
    return Promise.resolve(results.length > 0 ? results.shift() : [])
  })
}

const POINT_ROW = { originLat: 17.44, originLng: 78.39, destinationLat: 17.44, destinationLng: 78.35 }

describe('spatial SQL sent by services is schema-qualified', () => {
  it('RideRequestsService: INSERT and coordinate read', async () => {
    const calls: RawCall[] = []
    const prisma = {
      client: {
        $executeRaw: recordRaw(calls, '$executeRaw', [1]),
        $queryRaw: recordRaw(calls, '$queryRaw'),
        rideRequest: {
          findUnique: jest.fn().mockResolvedValue(null),
          findMany: jest.fn().mockResolvedValue([{ id: 'request-1' }]),
        },
      },
    } as unknown as PrismaService
    const service = new RideRequestsService(prisma)

    await service
      .create('passenger-1', {
        origin: 'Madhapur',
        destination: 'Gachibowli',
        originCoordinates: { lat: 17.44, lng: 78.39 },
        destinationCoordinates: { lat: 17.44, lng: 78.35 },
        preferredDate: '2026-03-01',
        preferredTimeStart: '08:00',
        preferredTimeEnd: '09:00',
      })
      .catch(() => undefined) // follow-up get() of a fake row is irrelevant here
    await service.list('passenger-1').catch(() => undefined)

    expect(calls.map((c) => c.kind)).toEqual(['$executeRaw', '$queryRaw'])
    const [insert, read] = calls
    expect(insert.sql).toContain('INSERT INTO public.ride_requests')
    expect(insert.sql).toContain('extensions.ST_SetSRID(extensions.ST_MakePoint(')
    expect(read.sql).toContain('extensions.ST_Y("originCoordinates"::extensions.geometry)')
    expect(read.sql).toContain('FROM public.ride_requests')
    calls.forEach((c) => expectQualifiedSpatialSql(c.sql))
  })

  it('RideOffersService: INSERT and coordinate read', async () => {
    const calls: RawCall[] = []
    const prisma = {
      client: {
        $executeRaw: recordRaw(calls, '$executeRaw', [1]),
        $queryRaw: recordRaw(calls, '$queryRaw'),
        vehicle: { findUnique: jest.fn().mockResolvedValue({ id: 'vehicle-1', driverId: 'driver-1', isActive: true }) },
        rideOffer: {
          findUnique: jest.fn().mockResolvedValue(null),
          findMany: jest.fn().mockResolvedValue([{ id: 'offer-1' }]),
        },
      },
    } as unknown as PrismaService
    const service = new RideOffersService(prisma)

    await service
      .create('driver-1', {
        vehicleId: 'vehicle-1',
        origin: 'Kondapur',
        destination: 'Financial District',
        originCoordinates: { lat: 17.46, lng: 78.36 },
        destinationCoordinates: { lat: 17.41, lng: 78.34 },
        departureDate: '2026-03-01',
        departureTime: '08:15',
        stops: [],
        pricePerPerson: 120,
      })
      .catch(() => undefined)
    await service.list('driver-1').catch(() => undefined)

    expect(calls.map((c) => c.kind)).toEqual(['$executeRaw', '$queryRaw'])
    const [insert, read] = calls
    expect(insert.sql).toContain('INSERT INTO public.ride_offers')
    expect(insert.sql).toContain('extensions.ST_SetSRID(extensions.ST_MakePoint(')
    expect(read.sql).toContain('extensions.ST_X("originCoordinates"::extensions.geometry)')
    expect(read.sql).toContain('FROM public.ride_offers')
    calls.forEach((c) => expectQualifiedSpatialSql(c.sql))
  })

  function makeMatchingService(calls: RawCall[], client: Record<string, unknown>) {
    const prisma = { client: { $queryRaw: recordRaw(calls, '$queryRaw', [[POINT_ROW], []]), ...client } } as unknown as PrismaService
    const metrics = { matchingRunDurationSeconds: { startTimer: () => () => undefined } } as unknown as MetricsService
    const logger = { setContext: jest.fn(), error: jest.fn() } as unknown as StructuredLogger
    return new MatchingService(
      prisma,
      {} as RouteDistanceService,
      {} as NotificationsService,
      metrics,
      logger,
    )
  }

  it('MatchingService.findForRideRequest: point read + ST_DWithin candidate query', async () => {
    const calls: RawCall[] = []
    const service = makeMatchingService(calls, {
      rideRequest: { findUnique: jest.fn().mockResolvedValue({ passengerId: 'passenger-1', preferredDate: new Date('2026-03-01') }) },
    })

    await expect(service.findForRideRequest('request-1', 'passenger-1')).resolves.toEqual([])

    expect(calls).toHaveLength(2)
    const [point, candidates] = calls
    expect(point.sql).toContain('FROM public.ride_requests')
    expect(candidates.sql).toContain('FROM public.ride_offers')
    expect(candidates.sql.match(/extensions\.ST_DWithin\(/g)).toHaveLength(2)
    expect(candidates.sql).toContain('"originCoordinates"::extensions.geography')
    calls.forEach((c) => expectQualifiedSpatialSql(c.sql))
  })

  it('MatchingService.findForRideOffer: point read + ST_DWithin candidate query', async () => {
    const calls: RawCall[] = []
    const service = makeMatchingService(calls, {
      rideOffer: { findUnique: jest.fn().mockResolvedValue({ driverId: 'driver-1', departureDate: new Date('2026-03-01') }) },
    })

    await expect(service.findForRideOffer('offer-1', 'driver-1')).resolves.toEqual([])

    expect(calls).toHaveLength(2)
    const [point, candidates] = calls
    expect(point.sql).toContain('FROM public.ride_offers')
    expect(candidates.sql).toContain('FROM public.ride_requests')
    expect(candidates.sql.match(/extensions\.ST_DWithin\(/g)).toHaveLength(2)
    calls.forEach((c) => expectQualifiedSpatialSql(c.sql))
  })

  it('the checker itself rejects each unqualified form (guards the guard)', () => {
    expect(unqualifiedPostgisIn('AND ST_DWithin(a, b, 1)')).toEqual(['PostGIS function call'])
    expect(unqualifiedPostgisIn('"originCoordinates"::geography')).toEqual(['geometry/geography cast'])
    expect(unqualifiedPostgisIn('col geometry(Point, 4326)')).toEqual(['geometry/geography type'])
    expect(unqualifiedPostgisIn('extensions.ST_DWithin(x::extensions.geography, extensions.geometry(Point, 4326))')).toEqual([])
    expect('SELECT id FROM ride_offers').toMatch(UNQUALIFIED_RIDE_TABLE)
    expect('SELECT id FROM public.ride_offers').not.toMatch(UNQUALIFIED_RIDE_TABLE)
  })
})

// ---------------------------------------------------------------------------
// 2. Code-level rule: catches NEW raw SQL anywhere in apps/api/src or the
//    seed, not just the call sites exercised above. Comments are stripped
//    first (they legitimately mention ST_DWithin etc.).
// ---------------------------------------------------------------------------

const REPO_ROOT = resolve(__dirname, '../../../..')

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return name.endsWith('.ts') && !name.endsWith('.spec.ts') ? [path] : []
  })
}

describe('no unqualified PostGIS in application code', () => {
  const files = [...sourceFiles(join(REPO_ROOT, 'apps/api/src')), join(REPO_ROOT, 'packages/database/prisma/seed.ts')]

  it.each(files.map((f) => [f.slice(REPO_ROOT.length + 1)]))('%s', (relativePath) => {
    const code = stripComments(readFileSync(join(REPO_ROOT, relativePath), 'utf8'))
    expect(unqualifiedPostgisIn(code)).toEqual([])
    expect(code).not.toMatch(UNQUALIFIED_RIDE_TABLE)
  })
})

// ---------------------------------------------------------------------------
// 3. Schema / baseline migration / local Docker agree on `extensions`.
// ---------------------------------------------------------------------------

describe('PostGIS lives in the extensions schema everywhere', () => {
  const read = (path: string) => readFileSync(join(REPO_ROOT, path), 'utf8')

  it('schema.prisma declares postgis in extensions and qualifies every Unsupported geometry', () => {
    const schema = read('packages/database/prisma/schema.prisma')
    expect(schema).toMatch(/extensions\s*=\s*\[postgis\(schema:\s*"extensions"\)\]/)
    const unsupported = schema.match(/Unsupported\("[^"]*"\)/g) ?? []
    expect(unsupported).toHaveLength(4)
    unsupported.forEach((u) => expect(u).toBe('Unsupported("extensions.geometry(Point, 4326)")'))
  })

  it('baseline migration creates postgis in extensions and uses extensions.geometry', () => {
    const sql = read('packages/database/prisma/migrations/20260101000000_init/migration.sql')
    expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";')
    expect(sql.match(/extensions\.geometry\(Point, 4326\)/g)).toHaveLength(4)
    expect(unqualifiedPostgisIn(sql)).toEqual([])
  })

  it('local Docker init installs postgis into extensions, never public', () => {
    const init = stripComments(read('infrastructure/docker/postgres/init/01-extensions.sql').replace(/--.*$/gm, ''))
    expect(init).toMatch(/CREATE SCHEMA IF NOT EXISTS extensions;/)
    expect(init).toMatch(/CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;/)
    expect(init).not.toMatch(/CREATE EXTENSION IF NOT EXISTS postgis;/)
  })
})
