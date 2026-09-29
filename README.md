# ShareRide

Passenger posts where they want to go (**Ride Request**). Driver posts where they're already going (**Ride Offer**). ShareRide matches compatible routes and connects them — there is no seat inventory or seat booking anywhere in this product. See `docs/current-architecture.md` for why that distinction matters and `docs/migration-plan.md` for the phased build-out.

## Layout

```text
shareride/
├── src/               ← original Figma Make prototype (Vite + React), kept running as the visual/UX reference
├── apps/
│   ├── mobile/         React Native + Expo (Expo Router)
│   ├── api/            NestJS + Prisma + PostgreSQL/PostGIS
│   └── admin/           Next.js Super Admin console
├── packages/
│   ├── types/           shared domain TypeScript types
│   ├── validation/       shared Zod schemas
│   ├── api-client/       typed HTTP client used by mobile + admin
│   ├── config/           shared tsconfig/eslint base config
│   └── database/         Prisma schema, migrations, seed data
├── infrastructure/docker/
└── docker-compose.yml    Postgres+PostGIS, Redis
```

The prototype at the repo root (`src/`, its own `package.json`, `vite.config.ts`) is unrelated to the monorepo below it and keeps running exactly as it did before — `pnpm dev` at the root still starts that Vite preview. Everything under `apps/` and `packages/` is the production rebuild described in `docs/migration-plan.md`.

## Local development

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Install dependencies (from repo root)
pnpm install

# 3. Copy env template and fill in real values
cp .env.example .env

# 4. Run database migrations + seed Hyderabad demo data
pnpm db:migrate
pnpm db:seed

# 5. Run an individual app
pnpm --filter @shareride/api dev
pnpm --filter @shareride/mobile dev
pnpm --filter @shareride/admin dev

# ...or everything via Turborepo
pnpm turbo run dev --filter=./apps/*
```

## Commands

| Command | What it does |
|---|---|
| `pnpm turbo run build` | Build every app/package |
| `pnpm turbo run lint` | Lint every app/package |
| `pnpm turbo run typecheck` | Typecheck every app/package |
| `pnpm turbo run test` | Unit tests |
| `pnpm turbo run test:e2e` | End-to-end tests (Playwright/Detox, once added) |
| `pnpm turbo run format` | Format |
| `pnpm db:generate` | Regenerate the Prisma client (`packages/database`) |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:seed` | Seed Hyderabad demo data (drivers, passengers, a sample request/offer pair) |
| `pnpm db:studio` | Open Prisma Studio |

`db:*` commands run from `packages/database`; either `cd packages/database && pnpm <script>` or `pnpm --filter @shareride/database <script>` from the root.

## API docs

Once `@shareride/api` is running: `http://localhost:4000/api/docs` (Swagger UI), health check at `http://localhost:4000/health`.

## Auth setup (Phase 2)

Mobile and admin talk to Supabase Auth directly (phone OTP on mobile, email/password on admin); the API only ever verifies the resulting access token via Supabase's JWKS endpoint — it never issues or refreshes tokens itself. To run any of this beyond `pnpm turbo run typecheck`/`lint`/`build`, create a Supabase project and fill in `.env`:

- API needs `SUPABASE_URL` (used to build the JWKS URL) plus `DATABASE_URL`/`REDIS_URL` from Docker Compose.
- Mobile needs `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Admin needs `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, plus `API_URL` (server-side only) to call `/auth/me` for the `ADMIN` role check.

An admin account is created by promoting an existing Supabase user via the Roles &amp; Permissions page (or `pnpm db:studio` before any admin exists to bootstrap the first one) — never automatic.

## Admin console

`apps/admin` (`pnpm --filter @shareride/admin dev`, port 4100) has: a real dashboard (live KPI counts), Users, Drivers &amp; Verification, Rides (requests/offers/matches/trips), Safety &amp; Reports, Roles &amp; Permissions (9 seeded role templates, editable), and read-only Audit Logs. Every action is permission-gated both in the UI (hidden/disabled) and, independently, on the API (`@RequirePermission` — the actual security boundary). See `docs/migration-plan.md`'s "Phase 12 (pulled forward)" section for exactly what's real vs. explicitly deferred (notification templates, app settings, verification document viewer, bulk actions).

## Status

Phases 0–8 plus Phase 12 pulled forward (`docs/migration-plan.md`): monorepo scaffold, shared type/validation/api-client packages (now with real compiled builds — see below), Prisma schema (now including RBAC roles, Safety reports, notification-template/app-setting tables) + Hyderabad seed data, NestJS health endpoint + Swagger, Supabase Auth wired into all three apps (JWKS verification, granular permission-based RBAC, Redis-backed logout, mobile OTP login/register/forgot-password with real session persistence, app-wide route protection, admin email/password login gated on real admin permissions), a working admin console backed by real endpoints, `apps/mobile`'s full screen set ported from the prototype (32+ Expo Router routes — every tab and secondary screen, no `seats`/booking model anywhere, real Google Maps SDK), real passenger Ride Request and driver Ride Offer endpoints (create/list/detail/cancel for both) wired into the mobile Post Ride wizard and My Rides' Upcoming/Offered tabs, a minimal real vehicles endpoint so a driver can actually register a vehicle to offer rides with, a real geospatial matching engine (PostGIS proximity + Google Routes API-backed distance scoring), and real match request/accept/decline with automatic `RideAgreement`+`Trip` creation on acceptance — wired into a new passenger "Candidate Matches" screen and Discover's driver-facing Requests tab — with the repo's first passing test suite (11 tests), the Home screen prototype's map/header overlap bug fixed, Docker Compose, base CI. `apps/api` now actually boots in this environment (verified via `nest start`) — `packages/types`/`validation`/`database`/`api-client` previously shipped only raw TypeScript source with no build step, which is fixed now. Not yet done: no direct Trip-tracking/chat endpoints in `apps/api` yet (Phase 9), no real Docker/Supabase/Postgres project has been run against this code in this environment — see the migration plan for what's next and what's unverified.
