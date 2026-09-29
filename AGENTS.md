# ShareRide — Agent Engineering Contract

Common contract for every coding agent working in this repository (Claude
Code as lead implementer, Codex as independent reviewer, and anyone else).
If you are an agent and haven't read this file yet, read it before touching
anything.

## What this product is

ShareRide is a ride-**matching** platform, not a seat-booking platform.

- Passenger posts a **Ride Request** (where they want to go).
- Driver posts a **Ride Offer** (where they're already going).
- The backend **matches** compatible routes — there is no seat inventory,
  no seat booking, anywhere in this product. If an implementation idea
  implies seats, capacity, or booking a slot, it's wrong for this product.
- Flow: `Ride Request` + `Ride Offer` → `Match` → `Trip` → `Payment` →
  `Completion` → `Review`.

See `docs/current-architecture.md` for the full reasoning and
`docs/migration-plan.md` for the phase-by-phase build history (read the
latest phase entries before starting new work — they record what was
built, what was deliberately deferred, and why).

### Non-negotiable invariants

- **Business, security, and payment logic stays server-side** (`apps/api`).
  Mobile and admin are clients, never the source of truth.
- **Mobile is never authoritative** for authorization or payment state. A
  Razorpay Checkout success callback is a UX fast-path only — the only
  authoritative payment confirmation is the server-verified webhook
  (`apps/api/src/payments/payments.service.ts`'s `handleWebhookEvent`).
  Never trust a client-supplied amount, status, or verification result.
- **One `Payment` per `Trip`** (`Payment.tripId` is `@unique`) — payment
  logic must stay idempotent by construction, not by convention.

## Repository layout

```text
shareride/
├── src/                 ← legacy Figma Make prototype (Vite + React).
│                           Kept running as a visual/UX reference only.
│                           Unrelated to the product below — its own
│                           package.json/vite.config.ts, root `pnpm dev`
│                           starts THIS, not the ShareRide product.
├── apps/
│   ├── mobile/           React Native + Expo Router (Expo SDK 52,
│   │                       React 18.3.1, React Native 0.76.5 — pinned
│   │                       exact; do not bump without checking every
│   │                       dependency's compatibility first)
│   ├── api/               NestJS 10 + Prisma 5 + PostgreSQL/PostGIS
│   └── admin/              Next.js 15 Super Admin console
├── packages/
│   ├── types/               shared domain TypeScript types
│   ├── validation/           shared Zod schemas (mobile + API both
│   │                           validate against these — don't duplicate
│   │                           a shape as a class-validator DTO if a Zod
│   │                           schema for it already exists here)
│   ├── api-client/            typed HTTP client (mobile + admin)
│   ├── config/                 shared tsconfig/eslint base config
│   └── database/                Prisma schema, migrations, seed data
├── docs/
│   ├── current-architecture.md   why "matching, not booking" matters
│   ├── migration-plan.md          phase-by-phase build history — READ THIS
│   ├── e2e-test-plan.md            full journey test plan, stage by stage
│   └── agent-handoff.md             Claude <-> Codex review protocol (below)
├── infrastructure/docker/, docker-compose.yml   Postgres+PostGIS, Redis
```

The root `package.json` (`"name": "figma-make-app"`) and root
`turbo.json`/`pnpm-workspace.yaml` belong to the workspace as a whole, but
root-level `pnpm dev`/`pnpm build`/`pnpm preview` run the **legacy `src/`
prototype**, not any ShareRide app. To run a real app, always `--filter`
into it or `cd` into `apps/<name>` — see Commands below.

## Commands (verified — do not guess new ones)

Every command below was actually run in this environment and its result is
recorded in `docs/migration-plan.md`'s Phase 13 entry and
`docs/agent-handoff.md`. If a command in this section stops working, that's
signal something is actually broken — fix it, don't route around it with a
different, unverified command.

```bash
# Install (workspace-wide, from repo root)
pnpm install

# Whole-monorepo sweep (lint + typecheck + test + build, all packages)
pnpm turbo run lint typecheck test build
# NOTE: running `typecheck` and `build` together for @shareride/admin in
# the SAME invocation can show a false @shareride/admin#typecheck failure
# (TS6053, files under .next/types/**/*.ts not found) — Next.js generates
# those type files as a side effect of `next build`, and turbo.json has no
# dependency edge from admin's own typecheck to admin's own build (only to
# ^build, i.e. upstream workspace packages). If you see this, re-run
# `cd apps/admin && npx tsc --noEmit` on its own — it will be clean once a
# build has completed at least once. Not a real regression.

# ---- apps/api (NestJS) ----
cd apps/api
npx tsc --noEmit                      # typecheck
npx eslint "{src,test}/**/*.ts"       # lint
npx jest                              # unit tests (132 as of Phase 13)
npx jest --config ./test/jest-e2e.json  # integration tests (16 as of Phase 13)
npx nest build                        # build

# ---- apps/mobile (Expo) ----
cd apps/mobile
npx tsc --noEmit                      # typecheck
npx eslint .                          # lint
npx jest                              # unit tests (29 as of Phase 13)
npx expo export --platform ios --platform android   # build (this IS the "build" script)

# ---- apps/admin (Next.js) ----
cd apps/admin
npx tsc --noEmit                      # typecheck (run AFTER a build at least once — see note above)
npx eslint .                          # lint
npx next build                        # build

# ---- packages/database (Prisma) ----
cd packages/database
# No live Postgres exists in this environment. DATABASE_URL/DIRECT_DATABASE_URL
# still need to be SET (even to dummy values) for the Prisma CLI to parse
# the schema — it does not need to actually connect for validate/generate/
# the --from-empty diff mode used below.
DATABASE_URL="postgresql://x:x@localhost:5432/x" DIRECT_DATABASE_URL="postgresql://x:x@localhost:5432/x" npx prisma validate --schema prisma/schema.prisma
DATABASE_URL="postgresql://x:x@localhost:5432/x" DIRECT_DATABASE_URL="postgresql://x:x@localhost:5432/x" npx prisma generate
npx tsc --noEmit                      # typecheck

# Dependency/security audit (root)
pnpm audit --json
```

### What "PASS" has actually meant so far

Every "PASS" recorded in `docs/migration-plan.md` up through Phase 13 was
produced by the commands above, against **mocked** `PrismaService`/
`RedisService` (API integration tests) or **no live infrastructure at
all**. Live PostgreSQL/PostGIS, Redis, a real Supabase project, real
Razorpay webhook delivery, an EAS/dev-client native build, and physical
Android/iOS devices have **never been exercised** in this environment.
Never report any of those as verified unless you actually ran something
against them — see `docs/agent-handoff.md`'s Known Limitations section for
the current, standing list.

## Coding rules

- **Inspect before editing.** Read the actual current file, the tests
  covering it, and the relevant `docs/migration-plan.md` phase entry
  before changing behavior. Don't assume a described architecture is
  still accurate — verify against the code.
- **Preserve the existing architecture.** Don't introduce a new pattern
  (a new validation approach, a new state-management library, a new ORM
  usage style) when an established one already covers the case elsewhere
  in the codebase.
- Avoid `any` — this codebase is strict-TypeScript throughout; an `any`
  here is a bug waiting to happen, not a shortcut.
- No unnecessary dependencies. Check whether an existing dependency
  already solves the problem before adding a new one.
- No fake integrations. If live infrastructure isn't available to test
  against (see above), say so explicitly — never fabricate a "verified"
  claim or a mocked success dressed up as a real one.
- No hardcoded secrets, anywhere, ever — not even as a "temporary" test
  value in a committed file. Test doubles use obviously-fake values
  (`test-webhook-secret`, `sk_test_fake_...`), never anything resembling a
  real credential shape.
- **No destructive database operations.** No `prisma migrate reset`, no
  hand-edited migration SQL, no dropping/truncating tables — this
  environment has no live database to lose, but the migration *files* are
  real, committed, reviewed artifacts. Do not casually regenerate or
  overwrite the baseline migration
  (`packages/database/prisma/migrations/20260101000000_init/`) — see
  `docs/migration-plan.md`'s Phase 13 entry for how and why it was built.
  A genuine schema change gets its own new migration on top of it.
- Prefer the shared `packages/types`/`packages/validation`/
  `packages/api-client` over redefining a shape locally in `apps/*`.
- Authorization and payment truth belong in `apps/api` services, checked
  against the database, never inferred from a request body or trusted from
  a client claim.
- **Known landmine, do not reintroduce**: `@UsePipes(new
  ZodValidationPipe(schema))` at the **method** level in a NestJS
  controller applies to every parameter of that method, including
  `@CurrentUser()` — not just `@Body()`. This caused a real, previously-
  shipped bug across 11 endpoints (found and fixed in Phase 13; see
  `docs/migration-plan.md`). Validation pipes go on the specific parameter:
  `@Body(new ZodValidationPipe(schema)) body: X`. If you see the method-
  level form anywhere, that's a regression — fix it the same way.

## Validation rule

Every implementation task ends with the relevant subset of: typecheck,
lint, tests (unit and, for `apps/api`, integration), build — for every
package your change actually touches, run from that package's own
directory using the commands above. Record the real commands and their
real output in `docs/agent-handoff.md`, not a paraphrase.

## Agent collaboration

- **Claude Code** is the primary implementer.
- **Codex** is the independent reviewer (architecture, security,
  correctness, test gaps) — and only implements when explicitly told to
  (`Codex: implement/fix this`).
- Neither agent treats the other's claim as true without checking the
  code/tests itself.
- The handoff protocol, review cycle, and severity levels live in
  `docs/agent-handoff.md` — read it before starting or reviewing any task.
