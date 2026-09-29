# ShareRide — Current Architecture Audit

Status: **Prototype (Figma Make)**. This document is a read-only audit of the codebase as it exists today. No application behavior was changed while producing it.

## 1. What this project actually is today

A single-page **Vite + React 19 + TypeScript + Tailwind v4** app that renders one component tree (`App.tsx`) inside a hand-drawn iPhone frame (`PhoneFrame.tsx`). There is no router, no backend, no network calls, no persistence, and no auth — `App.tsx` holds a `screen: Screen` string in `useState` and conditionally renders one of ~35 screen components based on it. All data comes from one static file, `src/mockData.ts`.

This is a *design/UX prototype*, not a production client. Nothing here talks to a server; every "action" (login, publish a ride, send a request, pay, cancel) is a local state transition or a `setTimeout`-simulated delay.

## 2. Stack inventory

| Concern | Current | Target (per production spec) |
|---|---|---|
| UI runtime | React 19 DOM (Vite, browser) | React Native + Expo |
| Language | TypeScript 5.7 | TypeScript (unchanged) |
| Styling | Tailwind v4 (`@tailwindcss/vite`) + heavy inline `style={{}}` objects | NativeWind / RN design tokens |
| Navigation | `useState<Screen>` + big conditional block in `App.tsx` | Expo Router |
| Server state | none (static imports from `mockData.ts`) | TanStack Query against NestJS REST |
| Forms | uncontrolled local `useState` objects, no schema validation | React Hook Form + Zod |
| Backend | none | NestJS + PostgreSQL/PostGIS + Redis + BullMQ |
| Auth | none (button click jumps to `home`) | Supabase Auth |
| Maps | hand-drawn SVG city (`MapView.tsx`) — no real geodata, no real coordinates | Google Maps SDK / Places / Routes |
| Payments | fake UPI/card/wallet form, `setTimeout` "success" | Razorpay via backend-verified webhook flow, modular |

`package.json` has exactly two runtime dependencies (`react`, `react-dom`) and a handful of dev tools (`vite`, `tailwindcss`, `typescript`, `oxfmt`). There is no `pnpm-workspace.yaml`, no `turbo.json`, no `apps/`/`packages/` split — the whole target monorepo structure in section 5 of the product spec does not exist yet.

## 3. Screen inventory (30 screen components + 3 shared components)

Navigation graph is entirely owned by `src/App.tsx`, which imports every screen and switches on the `screen` state. Prop callbacks (`onBack`, `onNavigate`, etc.) are passed down explicitly — there is no context, no global store, no URL state.

### Onboarding / auth
- `SplashScreen` — auto-advances to `onboarding` after 2.8s (`App.tsx:57-62`).
- `OnboardingScreen` → `onComplete` → `login`.
- `LoginScreen` → `onLogin` → `home`; `onRegister` → `register`; `onForgotPassword` → `forgot-password`. No real OTP/session, just callbacks.
- `RegisterScreen`, `ForgotPasswordScreen` — same pattern, no backend.

### Core (bottom-nav) tabs
- `HomeScreen` — map header (`MapView`) + "Request a Ride" / "Offer a Ride" CTA pair, driver/passenger mode toggle, "Recommended Matches" list, "Popular Routes", "Recent Searches", SOS button. This screen already reflects the two-way matching model well.
- `SearchScreen` ("Discover") — three tabs: **Offered Rides**, **Requests** (passenger requests a driver can accept), **Near Me**. Has a filter bottom-sheet (price range + amenity toggles) and match-category chips (`Best Match`, `Closest Pickup`, `Best Time`, `Verified`, `Instant`).
- `TripsScreen` ("My Rides") — tabs: Upcoming / Completed / Offered, sourced from `mockData.trips`. Has inline cancel-confirmation UI.
- `ChatListScreen`, `ChatDetailScreen` — static contact list / message thread from `mockData.chatContacts` / `chatMessages`. No websocket, no persistence, no typing indicators beyond visual mock.
- `ProfileScreen` — hub screen linking out to all `profile/*` settings screens.

### Ride flow (non-tab)
- `RideDetailScreen` — map, driver card, route timeline, vehicle card, details/reviews/rules tabs, sticky **"Send Request"** CTA (`onBook`).
- `PostRideScreen` — the two-way posting wizard: mode picker (Passenger "Request a Ride" vs Driver "Offer a Ride"), then a multi-step wizard (`PASSENGER_STEPS` = Route/Schedule/Preferences/Note/Review; `DRIVER_STEPS` = Route/Stops/Schedule/Preferences/Vehicle/Review).
- `PublicProfileScreen` — driver's public profile, reachable from ride detail; has `onBookRide` callback.
- `PaymentScreen`, `BookingConfirmationScreen` — see legacy-model section below.
- `RideTrackingScreen`, `RateReviewScreen` — post-confirmation trip tracking and review submission.
- `SOSScreen` — safety/emergency overlay, reachable from Home and Ride Tracking.
- `SuccessScreen` — generic success screen parameterized by `type: 'booking' | 'ride-published'`.

### Notifications
- `NotificationsScreen`, `NotificationDetailScreen` — list + detail, sourced from `mockData.notifications`.

### Profile settings (`src/screens/profile/`)
`EditProfileScreen`, `VerificationScreen`, `WalletScreen`, `NotificationSettingsScreen`, `PrivacySecurityScreen`, `DarkModeScreen`, `EmergencyContactsScreen`, `HelpSupportScreen`, `LegalScreen` (terms/privacy, `type` prop), `LanguageScreen` — all self-contained settings UI with local state only; none call a backend.

### Shared components (`src/components/`)
- `PhoneFrame.tsx` — decorative iPhone chrome (status bar, dynamic island, home indicator). Figma-Make-only concept; has no place in a React Native app (RN screens fill the real device viewport).
- `BottomNav.tsx` — 5-tab bar (Home, Discover, My Rides + center "Post" FAB, Chat, Profile). Maps cleanly to Expo Router tabs.
- `RideCard.tsx` — the offered-ride list/detail card, reused in `SearchScreen`/`HomeScreen`.
- `MapView.tsx` — a **hand-drawn SVG fake map** (fake roads, fake buildings, fake parks) with fake pin markers. This is purely decorative; it has zero relationship to real geocoordinates and must be fully replaced by Google Maps SDK.

## 4. Data models (`src/types.ts`, `src/mockData.ts`)

Current in-memory model:

```
Driver, Vehicle, Ride, ChatContact, ChatMessage, Trip, Notification, Review
```

Notable characteristics:
- `Ride` is a single flattened type that conflates "driver's offered ride" with legacy booking fields (`instantBook`, `matchScore`, `pickupProximity`) — there is no separate `RideRequest` vs `RideOffer` model, and no `Match` model. The product-model update (§13 below) was applied at the *copy/label* layer but not at the *data model* layer.
- `Trip.type: 'requested' | 'offered'` is the closest thing to a passenger/driver distinction that exists in the type system today.
- `Trip.bookingDate` and `Trip.amount` are historical-record-style fields (acceptable to keep per the product spec's carve-out for historical transaction naming), but `Trip` still just wraps a whole `Ride` rather than referencing a `Match`/`RideAgreement`.
- All data is hardcoded for 3 drivers / 3 rides / 1 chat thread / 5 notifications / 3 reviews, all Hyderabad-based (Madhapur, Gachibowli, Kondapur, HITEC City, Secunderabad).
- All avatar/vehicle images are remote `images.unsplash.com` URLs — fine for a prototype, not appropriate as a permanent data source.

## 5. Legacy seat/booking model — what's actually left

An earlier prompt (`src/imports/pasted_text/shareride-product-update.md`) already instructed Figma Make to strip seat-selection UI and rename "booking" language to "request/match" language across the app, and the *screen-level copy* mostly reflects that (buttons say "Send Request", "Post Ride Request", "Publish Ride"; ride cards show "Great Match" / pickup proximity instead of seat counts). However, the migration was **not applied consistently**, and real seat-booking mechanics remain underneath:

| File | What's still legacy | Why it matters |
|---|---|---|
| `PaymentScreen.tsx` | `Props.seats: number`; `total = ride.price * seats` | Pricing is still literally computed as **price × seat count**. This is the clearest violation of "payment must not depend on seat selection." |
| `App.tsx:196` | `<PaymentScreen rideId={selectedRideId} seats={1} .../>` | Hardcodes `seats={1}` just to satisfy the prop — confirms the seat concept is vestigial plumbing, not a real feature. |
| `types.ts` / `mockData.ts` / `RideCard.tsx` / `HomeScreen.tsx` / `RideDetailScreen.tsx` / `SearchScreen.tsx` / `PostRideScreen.tsx` | `Ride.instantBook: boolean`, filter category `'instant'`, toggle "⚡ Instant match (auto-confirm requests)" | Relabeled from "Instant Book" to "Instant Match", which is directionally fine (it now reads as an auto-confirm preference, not a seat-booking feature) — but the underlying field name `instantBook` and its car- rental-style lightning-bolt badge still read as booking terminology and should be renamed (e.g. `autoConfirm`) in the real domain model. |
| `NotificationDetailScreen.tsx:114-121, 160-163` | Hardcoded mock content: `"💺 Seat" → "1 seat confirmed · ₹450"`, `"Booking ID"`, route `"Mumbai CST → Pune Deccan"`, `"Up to 3 seats"` | Stale leftover content that predates both the seat-removal pass and the Hyderabad-first pass — wrong city, wrong terminology, wrong model. |
| `HelpSupportScreen.tsx:9-10` | FAQ copy: *"choose a date and the number of seats... tap 'Book Now' or 'Request Seat'"*, *"Follow the 6-step wizard to set your route, schedule, seats, pricing..."* | Support copy documents a UX that no longer exists in the actual `PostRideScreen` wizard. |
| `OnboardingScreen.tsx:11, 132` | *"offer empty seats to fellow travelers"*, *"Post a ride or book a seat in under 60 seconds"* | Onboarding marketing copy still frames the product as seat-inventory based. |
| `TripsScreen.tsx:142`, `LegalScreen.tsx:30` | *"Cancellations within 1 hour of departure may forfeit the seat amount"* | Cancellation-policy copy still references a "seat amount." |
| `PublicProfileScreen.tsx` | `onBookRide` prop name; `BookingConfirmationScreen.tsx` file name | Naming only — the screen content itself ("Request Sent!", request code, no seat/price-per-seat math) is already aligned with the match/request model, so this is a rename, not a rebuild. |

**Net assessment:** the UI copy layer is ~80% migrated to the request/offer/match vocabulary; the **payment flow is the one place seat-based booking survives as actual logic**, and there are five or six pockets of stale copy (onboarding, help, legal, notification-detail mock content) that never got touched by the earlier product-update pass. There is no seat *selector* UI anywhere (confirmed: no seat-count stepper, no seat map, no "select seats" step exists in `PostRideScreen`'s wizard) — so the highest-priority legacy item is exclusively `PaymentScreen`'s `seats × price` math and its hardcoded `seats={1}` call site.

## 6. Reusable components & duplication

Very little duplication risk today because there are only 3 shared components. Styling is **not** componentized — nearly every screen inlines its own `style={{...}}` objects with hardcoded hex colors (`#2563EB`, `#059669`, `#DC2626`, etc.) and repeats the same gradient/shadow declarations dozens of times across files instead of using Tailwind theme tokens or a shared style module. There is no design-token file (no `tailwind.config` theme extension, despite Tailwind v4 supporting CSS-based `@theme`) — `src/index.css` is minimal. Colors, fonts (`'Outfit'`, `'Inter'` referenced ad hoc via inline `fontFamily`), spacing, and shadows are all hand-repeated per screen. This is the biggest source of technical debt for a design-system extraction pass, independent of the seat-booking cleanup.

## 7. Hard-coded data / prototype-only behavior

- Every "async" action (login, publish, pay, send request) is either instant or a fixed `setTimeout` (e.g. `PaymentScreen.tsx` fakes an 1800ms "Processing…" spinner then always succeeds).
- `HomeScreen` greets a hardcoded user "Priya" with a hardcoded avatar.
- Popular routes, recent searches, quick-select dates/times in `PostRideScreen` are all hardcoded arrays, not derived from any location/geocoding service.
- `MapView.tsx` is entirely a decorative SVG — no real map provider, no real coordinates; `RideDetailScreen`/`HomeScreen` markers are literal pixel `{x, y}` positions on a fake canvas, not lat/lng.
- `NotificationDetailScreen`'s "booking" mock content (Mumbai→Pune, seats) doesn't match the rest of the app's Hyderabad data — a leftover from before the Hyderabad-first pass.

## 8. Dependencies / unused files

- Runtime deps are minimal and clean (`react`, `react-dom` only) — no dead npm dependencies to prune.
- `src/imports/pasted_text/*.md` (4 files: `share-ride-prompt.md`, `share-ride-prompt-1.md`, `share-ride-prompt-2.md`, `shareride-product-update.md`) are prior prompt/spec documents, not application code — useful as historical context (the product-update doc directly explains *why* the request/offer language exists) but should eventually move under `docs/` rather than `src/imports/pasted_text/`, since they're not imported by any component.
- `.figma/` directory contains Figma Make's own tooling config (`dev`, `deploy`, `analyze-routes`, etc.) — environment-specific, not part of the app's architecture.

## 9. Recommended migration path (summary — see `docs/migration-plan.md` for detail)

1. Keep this Vite app as the **visual/UX reference** during the rebuild; do not delete it until the RN app reaches parity.
2. Stand up the monorepo (`pnpm` + `Turborepo`, `apps/mobile` on Expo, `apps/api` on NestJS, `apps/admin` on Next.js, `packages/types` etc.) alongside it.
3. Port screens into `apps/mobile` one flow at a time, translating Tailwind/inline-style JSX to NativeWind/RN primitives, and Expo Router routes for the current `Screen` union.
4. Replace `mockData.ts` consumption with TanStack Query hooks against the new API, screen by screen.
5. Fix the seat-booking survivals identified in §5 (`PaymentScreen` seat×price math, `instantBook` field rename, stale copy in Onboarding/Help/Legal/NotificationDetail) as part of porting those specific screens — do not fix them in place in the Vite app, since it's being replaced, not maintained long-term.
6. Replace `MapView.tsx`'s fake SVG map with Google Maps SDK + real Hyderabad seed coordinates once the mobile shell exists.

This document intentionally does not propose file-by-file code changes — see `docs/migration-plan.md` for the phased implementation plan.
