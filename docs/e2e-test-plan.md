# End-to-end test plan

The full passenger/driver journey, broken into stages. For each stage: what
it covers, what's automatable today (and where), and what genuinely needs a
live provider or a physical device before it can be exercised for real.

This is a plan, not an implemented Playwright/Detox suite — Phase 13
explicitly scoped out building a full browser/device E2E harness ("do not
build an enormous browser E2E suite unless infrastructure already supports
it"); none existed before this phase. What *is* automatable per stage below
is covered today by the API's unit tests (`apps/api/src/**/*.spec.ts`) and
integration tests (`apps/api/test/*.e2e-spec.ts`), and by the mobile unit
tests (`apps/mobile/**/*.test.ts(x)`) — this document is the map of what
those already prove versus what a real device/provider run would still need
to confirm.

## 1. Auth (phone OTP via Supabase)

- **Flow**: enter phone → `sendOtp` → receive SMS code → `verifyOtp` →
  session established → `GET /auth/me` resolves/creates the local `User`
  row (JIT provisioning) → `DriverProfile`/`PassengerProfile` created.
- **Automatable now**: `store/auth-store.test.ts` covers `sendOtp`/
  `verifyOtp`/`refreshProfile`/`signOut` against a mocked Supabase client —
  success, Supabase error surfaced, API-unreachable-after-verify. API-side,
  `SupabaseStrategy`'s JWT verification is exercised indirectly by
  `test/auth-boundary.e2e-spec.ts` (missing/malformed token → 401) and unit
  tests on `AuthService`.
- **Needs a real provider/device**: an actual SMS OTP round-trip (Supabase
  Auth + a real phone number), JWKS verification against a live Supabase
  project, session persistence across app restart on a physical device.

## 2. Passenger: post a ride request

- **Flow**: `POST /ride-requests` with origin/destination/time window →
  request stored `ACTIVE` with a PostGIS point for each location.
- **Automatable now**: `ride-requests.controller.ts`'s Zod validation +
  ownership scoping is covered by `payments-order.e2e-spec.ts`-style
  integration coverage pattern (not yet duplicated onto this specific
  endpoint — see "Remaining gaps" below); service-level tests exist for
  the request lifecycle (`match-transitions.util.spec.ts`).
- **Needs a real provider/device**: nothing — this stage is pure
  request/response + Postgres, no third-party dependency once a live DB
  exists.

## 3. Driver: post a ride offer

- **Flow**: `POST /ride-offers` (requires an `ACTIVE` `Vehicle` with
  `isActive: true`) → offer stored `ACTIVE`.
- **Automatable now**: `vehicles.service.spec.ts`, ride-offer creation
  covered by unit tests.
- **Needs a real provider/device**: nothing additional beyond stage 2.

## 4. Matching

- **Flow**: `GET /ride-requests/:id/matches` (or the offer-side
  equivalent) runs the PostGIS `ST_DWithin` proximity query + scoring
  (`matching-score.util.ts`) and upserts `Match` rows.
- **Automatable now**: `matching-score.util.spec.ts` (pure scoring math),
  `matching.service.spec.ts` (notification producers on
  request/accept/decline). The `ST_DWithin` raw SQL itself is **not**
  exercised by any test in this repo — it needs a real PostGIS-enabled
  Postgres to run at all (confirmed by reading `matching.service.ts`;
  no SQLite/mock substitute is semantically equivalent to PostGIS
  geography functions).
- **Needs a real provider/device**: a live PostgreSQL + PostGIS instance.
  This is the single highest-value target for the CI database-integration
  job flagged as future work in the Phase 13 report (see
  `docs/migration-plan.md`'s Phase 13 entry) — running the real
  `ST_DWithin` query against seeded coordinates, including a check that the
  new GiST indexes (`ride_requests`/`ride_offers` `originCoordinates`/
  `destinationCoordinates`) are actually used (`EXPLAIN ANALYZE`, not just
  present in the migration).

## 5. Match lifecycle: request → accept → trip created

- **Flow**: passenger `request()`s a `SUGGESTED` match → driver
  `accept()`s → one Prisma `$transaction` creates `RideAgreement` + `Trip`,
  cancels the request's other pending candidates, and (outside the
  transaction, by design) notifies the passenger.
- **Automatable now**: fully covered — `matching.service.spec.ts` exercises
  `request()`/`accept()`/`decline()` including the transaction shape and
  the "notify the other side only" rule, with a hand-built Prisma fake.
- **Needs a real provider/device**: nothing — this is pure DB logic, real
  Postgres would only add end-to-end confidence, not new behavior to test.

## 6. Trip completion

- **Flow**: `POST /trips/:id/complete` → `Trip.status = COMPLETED`.
- **Automatable now**: `trips.service.spec.ts`.
- **Needs a real provider/device**: real GPS-driven trip tracking (the
  `DRIVER_ARRIVING`/`AT_PICKUP`/`STARTED`/`ONGOING` states this repo
  deliberately never implemented — see `docs/migration-plan.md`'s Phase
  10 entry) — out of scope for this plan since the feature doesn't exist.

## 7. Chat

- **Flow**: matched pair only (`ChatService.assertMatched`) → `start()` →
  `sendMessage()` → Socket.IO `message:new` to the recipient → mobile
  cache dedup/unread update.
- **Automatable now**: `chat.service.spec.ts` (authorization boundary,
  pairKey race recovery, message cap/ordering); mobile
  `lib/realtime/useChatRealtimeSync.test.tsx` (dedup, unread bump,
  conversation reordering) against a fake socket.
- **Needs a real provider/device**: a real Socket.IO round-trip (two
  connected clients, one authenticated JWT each) — this repo's tests fake
  the socket at the `useSocketEvent` boundary on the client and never
  exercise `RealtimeGateway`'s actual `handleConnection`/room-join logic
  over a real WebSocket. Also needs two physical/simulator devices (or two
  Expo Go sessions) to observe delivery latency and reconnect behavior.

## 8. Notifications

- **Flow**: `NotificationsService.create()` persists + emits
  `notification:new`.
- **Automatable now**: `notifications.service.spec.ts`; mobile
  `useNotificationsRealtimeSync.test.tsx`.
- **Needs a real provider/device**: push delivery (FCM/APNs/Expo Push) —
  not configured anywhere in this repo (confirmed: no `expo-notifications`
  push-token registration exists); today's realtime notification is
  in-app-only and requires the app to be foregrounded with a live socket.

## 9. Payment

- **Flow**: `POST /payments/orders` (server-computed amount from
  `RideOffer.pricePerPerson`, idempotent per trip) → Razorpay Checkout on
  device → `POST /payments/verify` (fast-path UX) → Razorpay webhook
  (`payment.captured`/`.failed`/`.authorized`, and `refund.processed`/
  `.failed` since Phase 13) → durable status.
- **Automatable now**: `payments.service.spec.ts` (89+ cases: eligibility,
  idempotency, signature verification, webhook idempotency/ordering,
  refund reconciliation); `test/webhook.e2e-spec.ts` (real HMAC signature
  over HTTP, missing/invalid signature → 403, missing event id → 400);
  `test/payments-order.e2e-spec.ts` (authenticated Controller → Validation
  → Service wiring). Mobile: `lib/razorpay.test.ts` covers every
  `openRazorpayCheckout` outcome (success/cancelled/unavailable/error)
  against a mocked native module — **never a real Razorpay call**, per
  this phase's explicit constraint.
- **Needs a real provider/device**: the actual Razorpay Checkout sheet (a
  native module requiring a custom EAS/dev-client build — confirmed not to
  run in Expo Go, see `docs/migration-plan.md`'s Phase 11 entry) and a real
  webhook delivery from Razorpay's servers to a publicly reachable
  endpoint with a real `RAZORPAY_WEBHOOK_SECRET`. A Razorpay *test-mode*
  account (test API keys, test webhook endpoint via ngrok or similar)
  would close this gap without any risk of a real charge.

## 10. Review

- **Flow**: `POST /reviews` on a `COMPLETED` trip the caller participated
  in, unique per `(tripId, authorId, recipientId)`.
- **Automatable now**: `reviews.service.spec.ts`.
- **Needs a real provider/device**: nothing beyond a live Postgres.

## 11. Safety & support

- **Flow**: reports, emergency contacts, support tickets — all
  own-scoped CRUD with server-side ownership checks.
- **Automatable now**: `reports.service.spec.ts`,
  `emergency-contacts.service.spec.ts`, `support.service.spec.ts`.
- **Needs a real provider/device**: nothing — no third-party dependency in
  this slice at all (no SMS/emergency-services integration exists, by
  design — see `docs/migration-plan.md`'s Phase 10 entry on SOS).

## Admin console (RBAC, verification, vehicles, reports, support, payments)

- **Automatable now**: RBAC enforcement is tested server-side (API
  guards), not via a browser E2E suite — see the Phase 13 report's
  explicit deferral of admin browser/E2E testing (no existing Next.js test
  infra, and API-level RBAC coverage already proves the enforcement that
  matters; a browser suite would mostly be re-testing the same
  authorization decisions through a UI layer).
- **Needs manual verification / a future Playwright pass**: the admin
  UI's own rendering (tables, filters, the audit log view) has no
  automated coverage of any kind yet.

## Remaining gaps in "automatable now" coverage (for the next testing pass)

- No integration test yet for the ride-request/ride-offer/matches HTTP
  boundary specifically (stage 2-4 above) — `payments-order.e2e-spec.ts`
  and the auth/health/webhook suites establish the pattern
  (`test/utils/build-scoped-test-app.ts`); extending it to rides/matching
  is mechanical, not a new technique.
- `RealtimeGateway.handleConnection`/room-join has no test at all (unit or
  integration) — Socket.IO's own testing story (a real `socket.io-client`
  connecting to a real `socket.io` server bound to an ephemeral port) is a
  different harness than the HTTP-based ones built in this phase, and was
  not attempted here.
- Admin's own Next.js UI has zero test coverage of any kind (deliberate
  Phase 13 deferral, see above).

## What a live-infrastructure pass would need, end to end

1. A real PostgreSQL + PostGIS instance (the migration in
   `packages/database/prisma/migrations/` applied via `prisma migrate
   deploy`) — closes the single biggest gap (stage 4, matching).
2. Redis (session revocation checks in `AuthService`/`SupabaseStrategy`
   depend on it — `GET /health/ready` already reports this dependency).
3. A real Supabase project (JWKS-verified JWTs, phone OTP delivery).
4. A Razorpay *test-mode* account + a public HTTPS tunnel for webhook
   delivery.
5. An EAS/dev-client build of the mobile app (for `react-native-razorpay`)
   on a physical or simulated Android/iOS device.
6. FCM/APNs credentials, if/when push notifications are actually built —
   not attempted in any phase so far.

None of the above existed in this environment at any point in this
project's history; every phase's "Verified" section says so explicitly.
