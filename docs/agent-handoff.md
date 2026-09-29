# Agent Handoff

Communication channel between Claude Code (lead implementer) and Codex
(independent reviewer). See `AGENTS.md` for the full protocol. This file
holds **only the current task and current review cycle** — git history is
the record of everything before it; don't turn this into a log.

---

# Current Task

**Phase 14A — first installable Android APK.** Narrow, explicitly scoped
task: get ShareRide's existing Expo app producing a real, installable
Android APK via EAS (preview profile) for the first physical-device test.
Not a production release, not a Play Store submission, no real Razorpay
transaction. Everything below `# Claude Changes (Phase 13 cycle)` through
`# Known Limitations` is the **prior** cycle's record (Phase 13 build +
two Codex review rounds) — preserved as-is because several of its findings
(C05, C06, C09–C14, C17, R01, R02) are still open per a full 30-part
production-readiness audit that ran just before this task and independently
re-confirmed R01 is real. This Android APK task deliberately does not touch
any of that — see `# Phase 14A Changes` below for what actually changed
this cycle.

# Implementation Status

`CONFIGURATION READY — BLOCKED ON EAS LOGIN`. Expo/EAS config for a Preview
APK build is written and verified (typecheck/lint/tests/expo-doctor all
green). Actually running `eas build` requires an interactive `eas login`
under a real Expo account, which this environment does not have — stopped
there per explicit instruction, nothing fabricated. See `# Phase 14A
Changes` and the Codex request at the bottom of this file (scoped to this
task only, not the full Phase 14 audit).

# Phase 14A Changes

- `apps/mobile/app.json` → replaced with `apps/mobile/app.config.ts`. Only
  reason: needs to conditionally set Android's `usesCleartextTraffic`
  (`expo-build-properties` plugin) based on a `SHARERIDE_ALLOW_CLEARTEXT`
  env var that only `development`/`preview` EAS profiles set — a physical
  device testing against a plain-HTTP LAN dev API needs this (Android 9+
  blocks cleartext by default), but it must never apply to a production
  build. Every other field is unchanged from the original `app.json`,
  including the already-established `in.shareride.app` package/bundle ID
  (not changed). Added `android.versionCode: 1` (was unset).
- `apps/mobile/eas.json` — new. `development`/`preview`/`production`
  profiles. Android `buildType: "apk"` for development/preview,
  `"app-bundle"` for production. `development`/`preview` profiles carry
  `env` placeholders (`REPLACE_WITH_...`) for `EXPO_PUBLIC_API_URL`,
  `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` — these are
  **not filled in**; I have no real Supabase project or the developer's
  LAN IP, and fabricating either would produce a build that crashes on
  launch (`apps/mobile/lib/supabase.ts` throws at module load if the
  Supabase vars are unset — confirmed by reading it directly).
- Added `expo-build-properties`, `expo-constants`, `expo-linking` to
  `apps/mobile/package.json`. The first is new plumbing for the cleartext
  toggle above. The latter two were a genuine pre-existing gap found by
  `npx expo-doctor`, not something I introduced: `expo-router` requires
  both as native peer dependencies and neither was installed —
  expo-doctor's own words were "Your app may crash outside of Expo Go
  without these dependencies." Installed via `npx expo install
  expo-constants expo-linking` so versions match SDK 52
  (`expo-constants@~17.0.8`, `expo-linking@~7.0.5`).
- Did **not** touch: `react-native@0.76.5` vs expo-doctor's suggested
  `0.76.9` (AGENTS.md pins this exact version deliberately; not bumping
  without checking every dependency's compatibility first, and the task
  explicitly says don't mass-upgrade Expo packages). No Google Maps API
  key added (none available; maps will render blank on-device, not a
  crash). No location/notification permissions added (grepped the whole
  app — zero uses of `expo-location`, `getCurrentPosition`,
  `PermissionsAndroid`; nothing in this product currently needs them). No
  custom icon/splash assets (none exist to configure; Expo's own defaults
  apply, documented here as TEMPORARY — REPLACE BEFORE RELEASE, not
  fabricated). `metro.config.js` not added — `expo export` already
  resolves the pnpm-workspace `@shareride/*` packages correctly without
  one, so nothing to fix there.
- Verified after every change, from `apps/mobile`: `npx tsc --noEmit`
  clean, `npx eslint .` clean (exit 0), `npx jest` → 36/36, `npx
  expo-doctor` → 17/18 (the one failure is the deliberately-untouched
  `react-native` patch-version note above), `npx expo config --type
  public` confirmed `app.config.ts` resolves correctly and
  `usesCleartextTraffic` defaults to `false` outside an EAS build profile
  that explicitly sets `SHARERIDE_ALLOW_CLEARTEXT=true`.
- Confirmed EAS CLI itself works in this environment
  (`pnpm dlx eas-cli@latest whoami` → `Not logged in`) — this is the
  actual, current blocker on producing a real APK, not a code problem.

**Update — EAS login completed, first two build attempts:**

- EAS account authenticated as `arjunkorla`. Linked a new EAS project via
  `eas init --account arjunkorla --non-interactive` →
  `@arjunkorla/shareride`, project ID `a66fbd0f-ed2b-4bc1-8a2e-6e32b9e17980`.
  Wired into `apps/mobile/app.config.ts` (dynamic config can't be
  auto-written by `eas init`, so this was done by hand).
- **First build (`45947941-39b3-4cc4-b9f9-c80018e644e1`) failed** at the
  `EAGER_BUNDLE` (Metro/JS bundling) phase, not Gradle/native. Root cause,
  confirmed by downloading and reading the actual build log (not guessed):
  Metro couldn't resolve `@shareride/api-client`'s `main` field
  (`dist/index.js`) because the cloud build never ran the shared
  packages' own `build` script — `dist/` is gitignored and only existed on
  this machine because I'd built it manually earlier in the session. EAS
  Build's `pnpm install` step does not run Turborepo's build graph on its
  own.
- **Fix**: added an `eas-build-post-install` npm hook to
  `apps/mobile/package.json` (Expo's documented mechanism for this exact
  monorepo problem — https://docs.expo.dev/build-reference/npm-hooks/):
  `cd ../.. && pnpm turbo run build --filter=@shareride/types --filter=@shareride/validation --filter=@shareride/api-client`.
  Verified the exact filter set locally first (`--dry` run) before trusting
  it in the cloud — an earlier attempt using turbo's `...^<pkg>` ancestor-
  exclusion microsyntax silently resolved to 0 packages in this turbo
  version (2.10.10), which would have "fixed" nothing; the explicit
  three-package filter form was confirmed correct (right packages, right
  topological order, `@shareride/mobile` itself correctly NOT included so
  the hook doesn't waste time re-running `expo export`).
- **Second build (`f0013be2-7056-4673-b315-a2d348e3342b`) got past JS
  bundling** (confirming the fix above worked) but **failed in the native
  `Run gradlew` phase**, specifically task `:app:createBundleReleaseJsAndAssets`.
  Again diagnosed from the actual downloaded/decompressed build log, not
  guessed: `Error: The required package 'expo-asset' cannot be found`,
  thrown from `@expo/metro-config`'s `getAssetPlugins()` during the
  release embed-bundle step (a different code path than the earlier
  preflight `EAGER_BUNDLE` check, which doesn't hit this resolution).
  `expo-asset` was present transitively (Gradle's own native build found
  and compiled it fine — visible in the task list) but never an explicit
  `apps/mobile` dependency, so pnpm's strict/non-hoisted resolution
  couldn't resolve it from Metro's perspective. Same category of gap as
  the `expo-constants`/`expo-linking` fix, just one `expo-doctor` doesn't
  check for. **Fix**: `npx expo install expo-asset` (added
  `expo-asset@~11.0.5`), plus added `'expo-asset'` to
  `app.config.ts`'s `plugins` array per Expo CLI's own printed
  instruction (dynamic config can't be auto-written).
- **Third build (`2ecf5bd4-7061-443c-a57a-0ccfd87c7b37`, ERRORED) got past
  the JS embed-bundle step** (confirming Build 2's `expo-asset` fix held)
  but **failed later in `Run gradlew`**, task
  `:expo-modules-core:compileReleaseKotlin`. Exact error from the log:
  "This version (1.5.15) of the Compose Compiler requires Kotlin version
  1.9.25 but you appear to be using Kotlin version 1.9.24 which is not
  known to be compatible." Root cause: an Android-toolchain version
  mismatch between the Jetpack Compose Compiler pulled in by Expo SDK 52's
  `newArchEnabled: true` native build and the project's resolved Kotlin
  version — not a JS/dependency-resolution problem, not related to Build
  1 or Build 2's fixes (both confirmed still holding — bundling and asset
  embedding both completed cleanly in this run before the Kotlin failure).
  **Fix applied**: `android.kotlinVersion: '1.9.25'` under the existing
  `expo-build-properties` plugin config in `app.config.ts` — a native
  Android toolchain pin via Expo's own documented mechanism, no RN/Expo/
  npm package version touched, AGENTS.md's exact-pin stays intact.
- A fourth build attempt (with the Kotlin fix applied) was already
  launched in the background before an explicit user instruction arrived
  to hold further builds for approval. It was allowed to keep running
  (already in flight, not newly started).
- **Fourth build (`c6fa186d-8723-4cbf-bfb1-63030d8f5e1f`, ERRORED) —
  furthest progress yet (9m into `RUN_GRADLEW`, past JS bundling, past
  asset embedding, past Kotlin/Compose compilation), failed at
  `:app:compileReleaseJavaWithJavac`**: `cannot find symbol` for
  `expo.core.ExpoModulesPackage` in the generated `PackageList.java`.
  Root cause **not conclusively identified this cycle** — traced
  extensively (see conversation): `expo-modules-core`'s own config
  disables classic RN autolinking for itself; the `expo` package's config
  generates a similarly-named but different string
  (`expo.modules.ExpoModulesPackage`, not `expo.core.ExpoModulesPackage`);
  an exhaustive search of the entire local `node_modules` tree found the
  literal failing string nowhere. Leading unverified hypothesis: a stale
  EAS-side Gradle/autolinking cache from an earlier attempt. Proposed
  smallest next step (awaiting explicit approval, not yet run): retry
  with `eas build --clear-cache` — no dependency version or code change,
  just forces a clean cache on EAS's side.
- **Root cause of the Build 4 `expo.core.ExpoModulesPackage` failure,
  fully confirmed (not just hypothesized) via local reproduction**:
  `expo-modules-autolinking@2.0.8`'s `loadConfigAsync`/`requireConfig`
  (`src/reactNativeConfig/config.ts`) wraps `requireFromString()` in a
  try/catch that silently returns `null` on any error. `expo`'s own
  `react-native.config.js` calls `require('expo-modules-autolinking/exports')`
  at its top — under pnpm's default non-flat/symlinked layout,
  `expo-modules-autolinking` isn't reachable from `expo`'s nested
  `requireFromString` resolution context, so that inner require throws,
  gets silently swallowed, and `expo`'s config (which correctly declares
  `packageImportPath: 'import expo.modules.ExpoModulesPackage;'`) is
  discarded entirely. Autolinking then falls back to its generic
  heuristic: parses `expo/android/build.gradle`'s `namespace "expo.core"`
  (a stale value bundled inside the `expo@52.0.49` npm package itself,
  inconsistent with its own Kotlin source) combined with the glob-matched
  class name `ExpoModulesPackage` (real file:
  `expo/android/src/main/java/expo/modules/ExpoModulesPackage.kt`,
  actual package `expo.modules`) — concatenating into the impossible,
  non-existent `expo.core.ExpoModulesPackage`. Reproduced locally byte-
  for-byte via `expo-modules-autolinking`'s own `react-native-config` CLI
  subcommand, and directly confirmed `loadConfigAsync` returns `null` for
  `expo`'s package root before the fix.
- **Fix applied**: new root `.npmrc` with
  `public-hoist-pattern[]=expo-modules-autolinking` (narrow, not blanket
  `shamefully-hoist`). Verified after `pnpm install`: `loadConfigAsync`
  now returns the loaded config (not `null`); the reproduction command
  now outputs `expo.modules.ExpoModulesPackage`. `pnpm-lock.yaml` showed
  "Lockfile is up to date, resolution step is skipped" — zero dependency
  version changes from this fix. Full local verification (typecheck,
  lint, 36/36 tests, expo-doctor 17/18 — same pre-existing
  `react-native@0.76.5` note, untouched) all green.

# BUILD 5 — SUCCESS

**EAS Build ID:** `d7045eed-10d7-4a1a-acf2-8944c3201c97`
**Status:** FINISHED
**Profile:** preview | **Distribution:** internal | **Build type:** APK
**Package:** `in.shareride.app` | **Version:** `0.1.0` | **VersionCode:** `1`
**Command:** `eas build --platform android --profile preview --clear-cache --non-interactive` (run from `apps/mobile`)
**Duration:** 11m 33s Gradle build (`BUILD SUCCESSFUL in 11m 33s`), ~13 min total including clean-cache install.
**Artifact:** `https://expo.dev/artifacts/eas/uaZRUJhzi88xYuOgQz0xTz2yn0b4yd4Ab8DsHyk_1Vc.apk`

All 10 requested checkpoints verified directly against the downloaded/decompressed cloud log (not inferred):
1. `pnpm install` — clean, `INSTALL_DEPENDENCIES` phase completed normally.
2. `eas-build-post-install` hook — ran, built all 3 workspace packages.
3. `@shareride/types`/`@shareride/validation`/`@shareride/api-client` build — "3 successful, 3 total" via Turbo.
4. Expo autolinking — `:app:generateAutolinkingPackageList` and `:expo:generateExpoModulesPackageListTask` both ran without error.
5. Metro/JS bundling (`EAGER_BUNDLE`) — "Android Bundled 15199ms ... (1255 modules)", clean.
6. Asset embedding (`:app:createBundleReleaseJsAndAssets`) — completed (only standard Hermes-bundle syntax warnings, no errors).
7. Kotlin/Compose compilation (`:expo-modules-core:compileReleaseKotlin`, `:app:compileReleaseKotlin`, etc.) — all completed, no Kotlin-version errors (Build 3's fix held).
8. **`PackageList.java`/`ExpoModulesPackage` compilation (`:app:compileReleaseJavaWithJavac`, `:expo:compileReleaseJavaWithJavac`) — completed with zero errors.** This was Build 4's exact failure point; confirmed fully resolved.
9. Remaining Gradle tasks — all executed, no failures anywhere in the 3229-line Gradle log (`grep` for `error:`/`FAILED`/`expo.core` returned zero matches).
10. APK artifact generation (`:app:assembleRelease`) — `BUILD SUCCESSFUL`, artifact uploaded.

**Physical device test, Build 5**: APK installed successfully; launch resulted in a **blank screen** (not a crash dialog).

# Build 5 Blank-Screen Diagnosis

Traced from source (Expo Router entry → `app/_layout.tsx` → `store/auth-store.ts` → `lib/supabase.ts`) and reproduced locally: `lib/supabase.ts` called `createClient(url, anonKey, {...})` unconditionally at **module top level**. `eas.json`'s `preview` profile env still had the unfilled `"REPLACE_WITH_SUPABASE_PROJECT_URL"` / `"REPLACE_WITH_SUPABASE_ANON_KEY"` placeholders (non-empty strings, so `lib/supabase.ts`'s own `if (!url || !anonKey) throw` guard never fired). Reproduced the exact failure locally: `createClient('REPLACE_WITH_SUPABASE_PROJECT_URL', 'REPLACE_WITH_SUPABASE_ANON_KEY', {})` throws synchronously — `Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.` This propagates up through `store/auth-store.ts`'s import of `lib/supabase.ts` and `app/_layout.tsx`'s import of the auth store, unwinding before React ever mounts anything. No `expo-splash-screen` usage exists anywhere in this app, so nothing holds the native splash open waiting for JS — it auto-hides on its own JS-ready signal regardless, revealing nothing underneath. Root cause: **CONFIRMED** (later also verified via runtime-config-fix testing, not just local reproduction).

# Build 6 — Runtime Configuration Fix

Goal: the milestone is "APK installs → app launches → React mounts → visible UI appears," not full Supabase/backend functionality. Fixed so invalid/missing/placeholder configuration can never throw during module import, and renders a visible configuration-required screen instead of crashing or going blank.

**Files changed:**
- `apps/mobile/lib/supabase.ts` — rewritten. `createClient()` no longer runs unconditionally. New `getSupabaseConfigError(url, anonKey)` (pure validation: missing/empty/`REPLACE_WITH_*` placeholder/non-HTTP(S) URL), `supabaseConfigError` (computed once), `supabase: SupabaseClient | null` (null whenever config is invalid).
- `apps/mobile/lib/startup-config.ts` — new. `getApiConfigError`, `combineStartupConfigErrors` (both pure, explicit-args), `getStartupConfigError()` — the single gate `_layout.tsx` checks (Supabase checked first, then an `EXPO_PUBLIC_API_URL` placeholder check).
- `apps/mobile/lib/api.ts` — `getAuthToken` guards `if (!supabase) return undefined`.
- `apps/mobile/store/auth-store.ts` — `init`/`sendOtp`/`verifyOtp`/`signOut` all guard against `supabase` being `null`; no fake/weakened auth path introduced.
- `apps/mobile/components/ConfigurationRequiredScreen.tsx` — new. Renders "ShareRide / Development configuration required / Supabase and/or API configuration has not been provided for this build."
- `apps/mobile/app/_layout.tsx` — split into `RootLayout` (checks `getStartupConfigError()` once, renders `ConfigurationRequiredScreen` or `AppRoot`) and `AppRoot` (the previous body, unchanged — still calls all its own hooks unconditionally, so no conditional-hooks issue).
- New tests: `apps/mobile/lib/supabase.test.ts`, `apps/mobile/lib/startup-config.test.ts`, `apps/mobile/components/ConfigurationRequiredScreen.test.tsx`.

**Notable mid-implementation finding**: `babel-preset-expo` inlines every `process.env.EXPO_PUBLIC_*` reference to a literal value at Babel **transform time** (`inline-env-vars.js`), and Jest's transform cache doesn't key on `process.env` — so mutating env vars at test runtime and re-requiring via `jest.isolateModules()` does not change what a module evaluates to. An early draft of these tests was passing for the wrong reason (silently matching the ambient "unset" env by coincidence). Caught and fixed by redesigning both `getSupabaseConfigError` and `getStartupConfigError`'s helpers around pure, explicitly-parameterized functions instead of env-mutation tricks — genuinely reliable now, not just green.

**Verification**: typecheck PASS, lint PASS, tests 54/54 (all genuinely exercising their claimed scenario), expo-doctor 17/18 (same pre-existing `react-native@0.76.5` note, untouched), zero dependency-version changes.

# BUILD 6 — SUCCESS

**EAS Build ID:** `cf2bfcad-e745-477f-8985-d3c8b34aaf98`
**Status:** FINISHED
**Profile:** preview | **Distribution:** internal | **Build type:** APK
**Package:** `in.shareride.app` | **Version:** `0.1.0` | **VersionCode:** `1`
**Command:** `eas build --platform android --profile preview --clear-cache --non-interactive`
**Duration:** `BUILD SUCCESSFUL in 7m 12s`
**Artifact:** `https://expo.dev/artifacts/eas/KxFknpbIG2Ce0u9eoASD6xQqDTkR8RbXqq9LDG5G2fM.apk`

Verified directly from the downloaded/decompressed cloud log: `pnpm install` clean, `eas-build-post-install` hook built all 3 workspace packages, Metro bundled 1257 modules cleanly, `:app:generateAutolinkingPackageList` and `:app:compileReleaseJavaWithJavac` (Build 4's original failure point, still fixed) both completed with zero errors, `BUILD SUCCESSFUL`. Zero occurrences of `expo.core`/`error:`/`FAILED` anywhere in the 3223-line Gradle log.

**Next step, per explicit instruction**: install Build 6 on the same physical Android phone used for Build 5. Expected result: instead of a blank screen, the phone should show "ShareRide / Development configuration required / Supabase and/or API configuration has not been provided for this build." Physical-device verification remains pending until the user personally confirms what actually appears on the phone.

**Physical device test, Build 6**: installs, launches, process stays open, **blank white screen**. Static APK inspection confirmed the Build 6 fix is present. No adb access (phone can't connect to the dev PC). Root cause: **UNKNOWN** — not guessed.

# Build 7 — On-Device Diagnostic Preparation (TEMPORARY, not yet built)

Goal: make "how far does the production Hermes bundle get?" visible on screen without adb. Everything below is temporary diagnostic scaffolding, to be reverted once the blank-screen cause is known.

**Findings from reading the code (these matter for interpreting Build 7):**
- In Build 6, `app/_layout.tsx` still statically imported the auth store, realtime hooks and `lib/startup-config.ts` → `lib/supabase.ts` (→ `react-native-url-polyfill/auto`, AsyncStorage, `@supabase/supabase-js`). All of that was evaluated at module load, **before** the config gate ran — even on the invalid-config path.
- expo-router 4.0.22 (`build/getRoutesCore.js`, `getLayoutNode` / `crawlAndAppendInitialRoutesAndEntryFiles`) calls `loadRoute()` — i.e. `require()`s — **every `_layout` file** while building the route tree at startup, in production too. So `app/(tabs)/_layout.tsx`'s imports (auth store, `lib/api` → Supabase, `components/icons` → react-native-svg) were also evaluated at startup, before `RootLayout` rendered. Screen (non-layout) routes are loaded lazily.
- React Native 0.76's built-in `URL` (`Libraries/Blob/URL.js`) throws `URL.protocol is not implemented` unless the polyfill is loaded, so the config check can't simply move off the polyfill while still using `new URL().protocol`.

**Changes (all `apps/mobile`):**
- `lib/config-validation.ts` — new, **zero imports**. Build 6's `getSupabaseConfigError` / `getApiConfigError` moved here verbatim except the HTTP(S) URL check is now the regex `^https?://[^\s/?#]+` (polyfill-free, see above). Adds display-only `classifyUrl` (CONFIGURED/INVALID/PLACEHOLDER/MISSING) and `classifyKey` (CONFIGURED/PLACEHOLDER/MISSING) — states only, never values.
- `lib/supabase.ts` — imports/re-exports `getSupabaseConfigError` from the above; otherwise unchanged.
- `lib/startup-config.ts` — no longer imports `lib/supabase.ts`; same gate logic via `lib/config-validation.ts`.
- `lib/startup-diagnostics.ts` — new. Startup markers (module evaluated / RootLayout rendered / config evaluated), safe config snapshot, and `installGlobalErrorCapture()` (wraps `ErrorUtils` global handler: records the error for on-screen display; **fatal errors are not forwarded** to the default handler so the diagnostic screen survives; non-fatal ones still are).
- `components/diagnostics/DiagnosticModeScreen.tsx` — new. Invalid-config screen using only `View`/`Text`/`StyleSheet` with hard-coded colors: "ShareRide / DIAGNOSTIC MODE / React Native rendering: OK / Configuration: INVALID / Supabase: NOT CONFIGURED / API: NOT CONFIGURED / Build: 7 Diagnostic", plus stage markers and per-field config states.
- `components/diagnostics/StartupErrorBoundary.tsx` — new. Top-level error boundary: "ShareRide Diagnostic / Runtime Error / Error: … / Stack: …" (component stack, plus JS stack). Also displays errors captured by the global handler. Uses `ScrollView` (core RN) so long stacks are readable.
- `app/_layout.tsx` — rewritten. Static imports limited to react-native + the diagnostics modules. Wraps everything in `StartupErrorBoundary`; invalid config → `DiagnosticModeScreen`; valid config → `require()`s `components/app-shell/AppRoot` lazily **inside render** (so a module-scope throw lands in the boundary) with a small "Build 7 Diagnostic · config VALID · app shell loaded" banner overlaid.
- `components/app-shell/AppRoot.tsx` — new; the previous `app/_layout.tsx` body, unchanged.
- `app/(tabs)/_layout.tsx` — now a thin wrapper that lazily `require()`s `components/app-shell/TabsLayout.tsx` (the previous content, unchanged apart from the icons import path).
- `components/ConfigurationRequiredScreen.tsx` — no longer rendered (kept, with its test, for restoring after diagnostics).
- Tests: `test/diagnostic-startup.test.tsx` (placed in `test/`, not `app/`, since every file under `app/` is a bundled route) mocks Supabase, `lib/api`, auth store, both app shells, expo-router, react-query, supabase-js, react-native-svg and socket.io-client with factories that **throw**, then renders `RootLayout` and loads `app/(tabs)/_layout.tsx`. Mutation-checked: temporarily re-adding `import './supabase'` to `lib/startup-config.ts` made the suite fail with "lib/supabase must not load on the diagnostic path". Plus `components/diagnostics/StartupErrorBoundary.test.tsx`, `lib/config-validation.test.ts`, `lib/startup-diagnostics.test.ts`.

**Verification (run from `apps/mobile`):**
- `npx tsc --noEmit` → exit 0
- `npx eslint .` → exit 0
- `npx jest` → `Test Suites: 13 passed, 13 total` / `Tests: 75 passed, 75 total`
- `npx expo-doctor` → `17/18 checks passed` — only failure: `react-native@0.76.5 - expected version: 0.76.9` (pre-existing, pinned per AGENTS.md, untouched)
- `npx expo export --platform android --output-dir <scratchpad>` → `_expo/static/js/android/entry-….hbc (4.1 MB)` — Hermes bytecode compiles locally. This is NOT Build 7 and proves nothing about on-device behavior.
- Dependency changes: none.

**Limits**: the diagnostic path can't see anything that fails before `app/_layout.tsx` is required (native init, the expo-router entry itself, or a native-side white screen). If Build 7 still shows only white, that itself narrows the problem to before/outside the JS render path. Physical-device verification: **pending**.

**Pre-build (after approval):** tagged all diagnostic code `TEMPORARY_DIAGNOSTIC_CODE` (comment-only; the global fatal-error suppression in `lib/startup-diagnostics.ts` is marked at both the section and the `setGlobalHandler` call — **must be removed before any normal beta/release build**). Re-ran: `npx tsc --noEmit` exit 0, `npx eslint .` exit 0, `npx jest` 13/13 suites, 75/75 tests, `npx expo-doctor` 17/18 (only `react-native@0.76.5 - expected version: 0.76.9`). Root `.npmrc` still `public-hoist-pattern[]=expo-modules-autolinking`. `apps/mobile/package.json` / `pnpm-lock.yaml` untouched this cycle. `eas.json` preview env still all `REPLACE_WITH_*` placeholders.

# BUILD 7 — DIAGNOSTIC (cloud result)

**EAS Build ID:** `1b126ea1-3582-4e36-920d-28424b895823`
**Status:** FINISHED
**Profile:** preview | **Distribution:** internal | **Build type:** APK
**Package:** `in.shareride.app` | **Version:** `0.1.0` | **VersionCode:** `1` | **SDK:** 52.0.0
**Command:** `pnpm dlx eas-cli@latest build --platform android --profile preview --clear-cache --non-interactive` (from `apps/mobile`; same CLI invocation as earlier builds — `eas` isn't on PATH)
**Artifact:** `https://expo.dev/artifacts/eas/rxJg119WdwSrViq2XldOBEf6i33-ULTN0lLckQykJa8.apk` (83,396,656 bytes)
**Logs:** `https://expo.dev/accounts/arjunkorla/projects/shareride/builds/1b126ea1-3582-4e36-920d-28424b895823`

From the downloaded cloud log (3508 lines):
- `pnpm install`: `Packages: +1440`, `Done in 14.2s`.
- `eas-build-post-install`: `Tasks: 3 successful, 3 total`.
- EAS's own expo-doctor phase: `16/17 checks passed`, only `react-native@0.76.5 - expected version: 0.76.9` — the log's only `error:` line is this non-blocking phase exiting 1 (known, same note as locally).
- Metro: `Android Bundled … expo-router/entry.js (1262 modules)` (1257 in Build 6 — the added diagnostics modules). Hermes compile emitted only the usual "variable … was not declared" warnings.
- Gradle: `:app:generateAutolinkingPackageList`, `:expo:generateExpoModulesPackageListTask`, `:expo:compileReleaseJavaWithJavac`, `:expo-modules-core:compileReleaseKotlin`, `:app:compileReleaseJavaWithJavac`, `:app:assembleRelease` all executed; `628 actionable tasks: 628 executed`; `BUILD SUCCESSFUL in 7m 5s`. Zero `FAILED`, zero `expo.core` occurrences.
- Static APK check: `assets/index.android.bundle` is Hermes bytecode (magic `c6 1f bc 03`) and contains `DIAGNOSTIC MODE`, `7 Diagnostic`, `React Native rendering: OK`, `ShareRide Diagnostic`, `Runtime Error`, and the `REPLACE_WITH_SUPABASE_PROJECT_URL` placeholder.

**Physical-device verification: PENDING** — awaiting the user's report of what appears on the phone (expected outcomes A–D: diagnostic screen / runtime-error screen / blank white / crash). No further builds or code changes until then.

**Physical device test, Build 7 (user-reported)**: install PASS, process launches PASS, display **FAIL — completely blank white screen**; the Build 7 diagnostic UI did not appear. So the failure is before/outside the `app/_layout.tsx` render path. Per instruction, Supabase/API/auth/tabs/navigation/maps/Razorpay are no longer being investigated.

# Build 8 — Expo Router Bypass Diagnostic Preparation (TEMPORARY, not yet built)

All changes tagged `TEMPORARY_BUILD_8_DIAGNOSTIC` and **must be reverted after diagnosis** (restore `"main": "expo-router/entry"`, delete the `"//"` marker key, `build8-entry.tsx` and `test/build8-entry.test.tsx`). The Build 7 `TEMPORARY_DIAGNOSTIC_CODE` changes are left in place (unreachable while `main` bypasses expo-router).

**Changes (`apps/mobile`):**
- `build8-entry.tsx` — new. Imports only `registerRootComponent` from `expo` and `View`/`Text`/`StyleSheet` from `react-native`; renders a blue full-screen "SHARERIDE NATIVE TEST / BUILD 8 / React Native rendered successfully. / Expo Router: BYPASSED / Supabase: NOT LOADED / API: NOT LOADED / Auth: NOT LOADED / If you can see this screen, the native React/Hermes render path works." `registerRootComponent` still runs `expo`'s own `Expo.fx` init (winter polyfills, `expo-asset`, `expo-constants`, `expo-modules-core`) — the same init `expo-router/entry` runs — and in production then just calls `AppRegistry.registerComponent('main', …)`. So expo-router is the single JS-side variable removed vs Build 7.
- `package.json` — `"main": "expo-router/entry"` → `"./build8-entry.tsx"`, plus a `"//"` marker key. No dependency/script changes.
- `test/build8-entry.test.tsx` — new. Mocks expo-router, `app/_layout`, `lib/supabase`, `@supabase/supabase-js`, `lib/api`, `@shareride/api-client`, auth store, react-query, socket.io-client, react-native-svg, react-native-maps, react-native-razorpay and AsyncStorage with throwing factories (real `expo` NOT mocked), requires the entry, and renders the last-registered `'main'` component. Mutation-checked: adding `import './lib/supabase'` to the entry fails it with "lib/supabase must not load in the Build 8 entry".

**Config facts (read-only, nothing changed):** `npx expo config --type public` → `newArchEnabled: true`; `jsEngine` unset (SDK 52 default = Hermes; Build 7 APK contains `libhermes.so` + `HermesExecutor`); `runtimeVersion` unset; `updates` unset; plugins `expo-router`, `expo-asset`, `expo-build-properties` (`android.usesCleartextTraffic`, `android.kotlinVersion: 1.9.25`); no `splash`/`android.splash` config; `userInterfaceStyle: automatic`. `expo-splash-screen` is not installed anywhere in the workspace; expo-router 4.0.22 accesses it via `requireOptionalNativeModule('ExpoSplashScreen')`, so its splash calls are no-ops. Build 7 APK: no `ExpoSplashScreen`/`androidx.core.splashscreen` classes; resources contain the prebuild template's `Theme.App.SplashScreen`, `AppTheme`, `splashscreen_background`, `splashscreen_logo`; `in/shareride/app/MainActivity` + `MainApplication` present, generated by EAS prebuild (no `android/` in repo). Build 7 PREBUILD log warning: `android: userInterfaceStyle: Install expo-system-ui in your project to enable this feature.` These are recorded facts, not a diagnosis.

**Verification (from `apps/mobile`):** `npx tsc --noEmit` exit 0; `npx eslint .` exit 0; `npx jest` 14/14 suites, 76/76 tests; `npx expo-doctor` 17/18 (only `react-native@0.76.5 - expected version: 0.76.9`); `npx expo export --platform android --output-dir <scratchpad>` → `Android Bundled … build8-entry.tsx (548 modules)`, `build8-entry-….hbc (1.55 MB)` (Build 7: 1262 modules, 4.1 MB).

**Production bundle string inspection** (Build 8 local `.hbc` vs Build 7 APK `index.android.bundle` as positive control): Build 8 contains `SHARERIDE NATIVE TEST`, `BUILD 8`, `Expo Router: BYPASSED`, `React Native rendered successfully.` (all 0 in Build 7). Present in Build 7 but **absent** in Build 8: `_sitemap`, `+not-found` (expo-router), `DIAGNOSTIC MODE` (app/_layout), `supabase-js`, `EXPO_PUBLIC_SUPABASE`, `Supabase is not configured for this build.` (auth store), `/admin/admin-users` (api-client), `No QueryClient set` (react-query), `io server disconnect` (socket.io), `RNSVGPath` (svg), `AIRMap` (maps), `RazorpayCheckout` (razorpay), `RNCAsyncStorage` (AsyncStorage).

**Limit:** this bypasses JS only. Native modules are still autolinked from `package.json` dependencies, so the APK's native side (MainApplication, New Architecture, every native module's package registration) is unchanged from Build 7.

# BUILD 8 — ROUTER BYPASS (cloud result)

Pre-build (re-run after approval, no changes since prep): `npx tsc --noEmit` PASS, `npx eslint .` PASS, `npx jest` 14/14 suites 76/76 tests, `npx expo-doctor` 17/18 (only `react-native@0.76.5 - expected version: 0.76.9`), fresh `npx expo export --platform android` → `build8-entry.tsx (548 modules)`, `.hbc` contains all 4 Build 8 strings. `.npmrc` unchanged.

**EAS Build ID:** `4047c8f6-6693-4103-be30-40d9fb250b90`
**Status:** FINISHED
**Profile:** preview | **Distribution:** internal | **Build type:** APK
**Package:** `in.shareride.app` | **Version:** `0.1.0` | **VersionCode:** `1`
**Command:** `pnpm dlx eas-cli@latest build --platform android --profile preview --clear-cache --non-interactive` (from `apps/mobile`)
**Artifact:** `https://expo.dev/artifacts/eas/G3Mb9yK2k3nUlCMXvuBHYF6wt9-X7GwJU6U4Cx8gSB0.apk` (82,649,940 bytes)
**Logs:** `https://expo.dev/accounts/arjunkorla/projects/shareride/builds/4047c8f6-6693-4103-be30-40d9fb250b90`

From the downloaded cloud log (3419 lines): `pnpm install` `Packages: +1440`, `Done in 14.4s`; `eas-build-post-install` `Tasks: 3 successful, 3 total`; EAS expo-doctor phase `16/17` (only the RN patch note — the log's only `error:` line is that non-blocking `RUN_EXPO_DOCTOR` phase); prebuild `Using current versions instead of recommended react-native@0.76.9`; Metro `Android Bundled … apps/mobile/build8-entry.tsx (548 modules)` and, in Gradle's `createBundleReleaseJsAndAssets`, `… build8-entry.tsx (531 modules)`; `:app:generateAutolinkingPackageList`, `:expo:generateExpoModulesPackageListTask`, `:expo:compileReleaseJavaWithJavac`, `:app:compileReleaseJavaWithJavac`, `:app:assembleRelease` all ran; `628 actionable tasks: 628 executed`; `BUILD SUCCESSFUL in 7m 42s`. Zero `FAILED`, zero `expo.core`.

APK inspection: `assets/index.android.bundle` is Hermes bytecode (`c6 1f bc 03`); contains `SHARERIDE NATIVE TEST`, `BUILD 8`, `React Native rendered successfully.`, `Expo Router: BYPASSED` (1 each); does NOT contain `_sitemap`, `DIAGNOSTIC MODE`, `supabase-js`, `RazorpayCheckout`, `RNSVGPath`, `AIRMap`, `No QueryClient set`.

**Physical-device verification: PENDING** — awaiting the user's report. No code changes, no Build 9.

**Physical device test, Build 8 (user-reported): PASS** — the phone showed "SHARERIDE NATIVE TEST / BUILD 8 / React Native rendered successfully / Expo Router: BYPASSED / …". Confirmed on the real device: APK/native startup, Hermes, React Native init, `registerRootComponent`, basic View/Text rendering. Per instruction, native layer / Hermes / New Architecture / RN version are not being investigated.

# Build 9 — Minimal Expo Router Diagnostic Preparation (TEMPORARY, not yet built)

All changes tagged `TEMPORARY_BUILD_9_ROUTER_DIAGNOSTIC`; **revert after diagnosis**: delete `app/` (2 files) and `test/build9-router.test.tsx`, move `app-isolated-build9/` back to `app/` (delete its marker `.md`), point `test/diagnostic-startup.test.tsx` back at `../app/`, remove the `"//"` key from `apps/mobile/package.json`.

**Why the real route tree had to be moved, not just gated:** expo-router 4.0.22 discovers routes with Metro `require.context(process.env.EXPO_ROUTER_APP_ROOT, true, …)` (`node_modules/expo-router/_ctx.android.js`), which puts **every** `.tsx` under `app/` into the production bundle, and `getRoutesCore.js` `require()`s every `_layout` at startup. Changing the router root would mean changing the `expo-router` plugin config (forbidden), so the real tree was moved.

**Changes (`apps/mobile`):**
- `package.json` — `"main"` restored to `"expo-router/entry"` (identical to the committed baseline); `"//"` marker updated. `build8-entry.tsx` kept, inactive.
- `app/` → moved unchanged (35 files) to `app-isolated-build9/` (+ marker `TEMPORARY_BUILD_9_ROUTER_DIAGNOSTIC.md`). Same directory depth, so all relative imports inside it still typecheck.
- New minimal `app/_layout.tsx` (`<Slot />` from expo-router only — no Stack/Tabs/providers) and `app/index.tsx` (View/Text/StyleSheet: "SHARERIDE ROUTER TEST / BUILD 9 / Expo Router rendered successfully. / React Native: OK / Expo Router: OK / ShareRide app shell: NOT LOADED / Supabase: NOT LOADED / API: NOT LOADED / Auth: NOT LOADED", green background).
- `test/diagnostic-startup.test.tsx` — imports retargeted to `app-isolated-build9/` (Build 7 tests still pass).
- `test/build9-router.test.tsx` — new; 15 throwing mocks (AppRoot, TabsLayout, lib/supabase, supabase-js, lib/api, api-client, auth store, react-query, socket.io, svg, maps, razorpay, AsyncStorage, Build 7 diagnostics, icons); real expo-router.

## Build 9 finding — two React copies on the expo-router path (local evidence, NOT device-verified, NOT fixed)

- Repo **root** `package.json` (legacy Figma prototype) depends on `react`/`react-dom` `^19.0.0` → `shareride/node_modules/react` → `react@19.2.4`.
- `expo-router@4.0.22` does not declare `react` (dependency or peer), so pnpm gives its virtual-store dir no `react` link; `require('react')` from expo-router walks up to the repo root and gets **19.2.4**. Same for `expo-modules-core`, `expo-constants`, `@expo/metro-runtime`. Everything else on the startup path (`react-native`, `expo`, `expo-asset`, `expo-linking`, `expo-status-bar`, `react-native-screens`, `react-native-safe-area-context`, all `@react-navigation/*`, `react-native-helmet-async`, `@radix-ui/react-slot`, and app code) gets **18.3.1**.
- Production bundles: Build 7 APK, Build 8 APK and the local Build 9 export all contain both `19.2.4` and `18.3.1`, `react.transitional.element` (React 19) and `react.element` (React 18). Build 9 sourcemap: `react@18.3.1` (`react.production.min.js`, `react-jsx-runtime.production.min.js`) **and** `react@19.2.4` (`react.production.js`, `react-jsx-runtime.production.js`). Build 8 rendered despite both copies being bundled because its rendered tree never used expo-router's React-19 code.
- Jest reproduction (real expo-router, `renderRouter('./app')` over the 2-file tree): `Objects are not valid as a React child (found: object with keys {$$typeof, type, key, props, _owner, _store})` — i.e. React 19 elements rejected by the React 18 renderer. Resolution check: `expected 18.3.1, received 19.2.4`.
- **Control** (scratchpad-only Jest config, identical except `moduleNameMapper` forcing `react` to the app's 18.3.1): the same Build 9 render test **passes**.
- Conclusion: strong local evidence that expo-router renders with a different React than React Native under this pnpm layout. Whether this is what blanks the phone is **not verified on device**.

**Verification (from `apps/mobile`):** `npx tsc --noEmit` PASS; `npx eslint .` PASS; `npx jest` — `Tests: 2 failed, 78 passed, 80 total` (15 suites, 1 failing): the two failures are exactly the React-copy check and the render test above, deliberately left failing; route-graph isolation tests pass. `npx expo-doctor` 17/18 (only the RN 0.76.5 vs 0.76.9 note). `npx expo export --platform android --source-maps` → `expo-router/entry.js (901 modules)`, `.hbc` 1.46 MB; contains `SHARERIDE ROUTER TEST`, `BUILD 9`, `Expo Router rendered successfully.`; does not contain `SHARERIDE NATIVE TEST`, `DIAGNOSTIC MODE`, auth-store / react-query / svg / maps / razorpay / AsyncStorage markers. Sourcemap (899 sources): only app files are `app/_layout.tsx`, `app/index.tsx` and the route `require.context`; zero `packages/*`, `@supabase`, `@tanstack`, `socket.io`, `react-native-svg`, `react-native-maps`, `react-native-razorpay`, `async-storage`, `zustand`, `app-isolated-build9` sources. No dependency changes.

## Build 9 — single-React fix (approved by user; validated locally, not yet built)

User decision: do not build the known-failing Build 9; apply a mobile-only Metro fix. No package versions, no root React 19 removal, no pnpm config changes.

**Fix (permanent, not a diagnostic tag):**
- `apps/mobile/metro.config.js` — new. `getDefaultConfig(__dirname)` from `expo/metro-config` (Expo SDK 52 / Metro 0.81.5; Expo's default sets no `resolveRequest`, and its `nodeModulesPaths` includes the repo-root `node_modules`, which is where React 19 was found). Adds `resolver.resolveRequest` that, **only** for the exact specifier `react` or `react/*`, delegates to Metro's own resolver (`context.resolveRequest`, or an upstream `resolveRequest` if one ever exists) with `originModulePath` set to `apps/mobile/package.json`, i.e. resolves React as if imported by the app → `apps/mobile/node_modules/react` → `react@18.3.1`. All other specifiers (`react-native`, `react-dom`, `react-*`) untouched.
- `apps/mobile/jest.config.js` — equivalent `moduleNameMapper` (`^react$`, `^react/(.*)$` → apps/mobile's react dir) so Jest matches Metro.
- `apps/mobile/eslint.config.mjs` — `metro.config.js` added to the existing CommonJS-config ignore list (same as `babel.config.js`/`jest.config.js`).
- `apps/mobile/test/metro-single-react.test.ts` — new, permanent: runs the real `metro.config.js` rule (with `expo/metro-config` stubbed — Jest can't load `@expo/metro-config`'s internal `metro/src/...` imports) and asserts `react`, `react/jsx-runtime`, `react/jsx-dev-runtime` from `expo-router`, `expo-modules-core`, `expo-constants`, `@expo/metro-runtime`, `react-native`, `expo` all resolve into apps/mobile's React 18.3.1, and that `react-native` is not redirected.
- `apps/mobile/test/build9-router.test.tsx` — the Node-resolution check was removed (Node resolution is not what ships; replaced by the test above); real `renderRouter('./app')` render test kept.

**Before fix:** `Tests: 2 failed, 78 passed, 80 total`; render test failed with `Objects are not valid as a React child (found: object with keys {$$typeof, type, key, props, _owner, _store})`. **After fix:** that render test passes; the error is gone.

**Verification (from `apps/mobile`):** `npx tsc --noEmit` PASS; `npx eslint .` PASS; `npx jest` → `Test Suites: 16 passed, 16 total`, `Tests: 87 passed, 87 total` (80 − 1 removed Node-resolution check + 8 new Metro-pin tests); `npx expo-doctor` 17/18 (only RN 0.76.5 vs 0.76.9); `node -e "require('./metro.config.js')"` loads.

**Production export** (`npx expo export --platform android --source-maps --clear`): `expo-router/entry.js (897 modules)` (901 before — the 4 React 19 files dropped), `.hbc` 1.45 MB. Sourcemap (895 sources): exactly **one** `node_modules/react/` location — `.pnpm/react@18.3.1/node_modules/react/` (`index.js`, `cjs/react.production.min.js`, `jsx-runtime.js`, `cjs/react-jsx-runtime.production.min.js`); **zero** paths containing `react@19`; zero `react-dom`. Bytecode: `19.2.4` **0**, `18.3.1` 1, `__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE` (React 19 internals) **0**, `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED` (React 18 internals) 1. The single remaining `react.transitional.element` string comes from `react-is@19.2.8` — a declared dependency of `@react-navigation/core@7.21.12` (`react-is ^19.1.0`, peer `react >= 18.2.0`) — which only calls `isValidElementType` (component-type check, version-agnostic); it is not a React runtime. Build 9 strings present; app files still only `app/_layout.tsx`, `app/index.tsx` + route context; still zero Supabase/API/auth/react-query/svg/maps/razorpay/AsyncStorage/zustand/`packages/*`/`app-isolated-build9`/app-shell/diagnostics sources.

Physical device: **not tested** — Build 9 cloud build awaits approval.

# BUILD 9 — MINIMAL EXPO ROUTER + SINGLE-REACT FIX (cloud result)

**EAS Build ID:** `9b31ecaf-85a4-4d32-a911-9a65514a087a`
**Status:** FINISHED
**Profile:** preview | **Distribution:** internal | **Build type:** APK
**Package:** `in.shareride.app` | **Version:** `0.1.0` | **VersionCode:** `1` | **SDK:** 52.0.0
**Command:** `pnpm dlx eas-cli@latest build --platform android --profile preview --clear-cache --non-interactive` (from `apps/mobile`)
**Artifact:** `https://expo.dev/artifacts/eas/1aqjES7egOXh3RR-LK3w6mwzEgvH8n1aO8i5AIFE3fk.apk` (82,930,104 bytes)
**Logs:** `https://expo.dev/accounts/arjunkorla/projects/shareride/builds/9b31ecaf-85a4-4d32-a911-9a65514a087a`

Pre-build: `app/` = `_layout.tsx`, `index.tsx` only; `main` = `expo-router/entry`; `git check-ignore` confirms `metro.config.js`, `app/index.tsx`, `app-isolated-build9` are not ignored (so the upload contents match the local tree). No code changes since the validated state.

From the downloaded cloud log: `pnpm install` `Packages: +1440`, `Done in 14.4s`; `eas-build-post-install` `Tasks: 3 successful, 3 total`; EAS expo-doctor phase 16/17 (only RN 0.76.5 vs 0.76.9 — the log's only `error:` line is that non-blocking `RUN_EXPO_DOCTOR` phase); Metro `Android Bundled … expo-router/entry.js (897 modules)` in both the EAS bundle step and Gradle's `createBundleReleaseJsAndAssets` — same 897 as the fixed local export (901 before the fix), consistent with `metro.config.js` being applied in the cloud; `:app:generateAutolinkingPackageList`, `:expo:generateExpoModulesPackageListTask`, `:expo:compileReleaseJavaWithJavac`, `:app:compileReleaseJavaWithJavac`, `:app:assembleRelease`; `628 actionable tasks: 628 executed`; `BUILD SUCCESSFUL in 7m 44s`. Zero `FAILED`, zero `expo.core`.

**Shipped APK bundle** (`assets/index.android.bundle`, Hermes bytecode `c6 1f bc 03`), compared with Build 8 / Build 7 APKs:
- Build 9 strings present: `SHARERIDE ROUTER TEST`, `BUILD 9`, `Expo Router rendered successfully.`, `ShareRide app shell: NOT LOADED` (1 each; 0 in Builds 7/8).
- Single React: `19.2.4` **0** (Build 8: 1, Build 7: 1); React 19 internals `__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE` **0** (Build 8: 1, Build 7: 1); `18.3.1` 1; React 18 internals `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED` 1. The one `react.transitional.element` is `react-is@19.2.8` (see fix section above), not a React runtime.
- Still minimal: 0 for `SHARERIDE NATIVE TEST`, `DIAGNOSTIC MODE`, `supabase-js`, auth-store message, `No QueryClient set`, `RNSVGPath`, `AIRMap`, `RazorpayCheckout`, `RNCAsyncStorage`, `/admin/admin-users`. `_sitemap` present (expo-router's built-in route — expected with expo-router active).

**Physical-device verification: PENDING** — awaiting the user's report. No further builds or code changes.

**Physical device test, Build 9 (user-reported): PASS** — the phone showed "SHARERIDE ROUTER TEST / BUILD 9 / Expo Router rendered successfully. / React Native: OK / Expo Router: OK / …". Confirmed on device: native startup, Hermes, RN rendering, `registerRootComponent`, `expo-router/entry`, minimal Expo Router route rendering, and the single-React Metro fix. The Build 5–7 white screen is strongly associated with the duplicate-React condition. The Metro single-React fix is to be kept permanently.

# Build 10 — Real App Restoration Preparation (not yet built)

**Restored:**
- `apps/mobile/app/` ← `app-isolated-build9/` (moved back; 35 route files; `TEMPORARY_BUILD_9_ROUTER_DIAGNOSTIC.md` marker deleted). Checked against `HEAD`: all 35 committed route files present, none missing/duplicated; only `_layout.tsx` and `sos.tsx` differ from `HEAD` (`sos.tsx` = pre-existing Build 1–6 working-tree change, untouched).
- `app/(tabs)/_layout.tsx` — `git checkout HEAD --` (it was unmodified before Build 7, so `HEAD` is its exact original).
- `app/_layout.tsx` — restored to its exact Build 6 form (config gate `RootLayout` → `ConfigurationRequiredScreen` or `AppRoot` with the original QueryClient/realtime/protected-route body).
- `apps/mobile/package.json` — `"main": "expo-router/entry"`, `"//"` marker removed (now identical to its pre-Build-7 state).

**Removed (temporary diagnostics):** `app/_layout.tsx` + `app/index.tsx` (Build 9 minimal tree), `app-isolated-build9/` (moved back), `build8-entry.tsx`, `components/app-shell/AppRoot.tsx`, `components/app-shell/TabsLayout.tsx`, `components/diagnostics/DiagnosticModeScreen.tsx`, `components/diagnostics/StartupErrorBoundary.tsx`, `lib/startup-diagnostics.ts` (incl. the **global fatal-error suppression** — no `ErrorUtils`/`setGlobalHandler` remains in app code), `lib/startup-diagnostics.test.ts`, `test/build8-entry.test.tsx`, `test/diagnostic-startup.test.tsx`, `test/build9-router.test.tsx`; `classifyUrl`/`classifyKey` (display-only) removed from `lib/config-validation.ts`.

**Retained from diagnosis (production-safe):**
- `metro.config.js` (single-React pin), `jest.config.js` React mapping, `eslint.config.mjs` ignore entry, `test/metro-single-react.test.ts` — the fix confirmed on device by Build 9.
- `lib/config-validation.ts` (+ trimmed test) — import-free, polyfill-free Supabase/API config validation (regex HTTP(S) check, since RN's built-in `URL.protocol` throws without the polyfill); lets `lib/startup-config.ts`'s gate run without loading supabase-js. `lib/supabase.ts` re-exports `getSupabaseConfigError` from it.
- Build 6 production behavior unchanged: `lib/startup-config.ts` gate, `ConfigurationRequiredScreen`, null-safe `lib/supabase.ts`/`lib/api.ts`/`store/auth-store.ts`.

**New startup integration tests (real `renderRouter('./app')` over the restored 35-file tree):**
- `test/startup-placeholder-config.test.tsx` — feeds `eas.json`'s actual `preview` env placeholders through the real validation functions: renders "Development configuration required" + `EXPO_PUBLIC_SUPABASE_URL is still a REPLACE_WITH_* placeholder value.`, does not throw, never shows the placeholder value, `createClient` never called.
- `test/startup-valid-config.test.tsx` — valid-config gate + signed-out Supabase stub: real AppRoot (react-query, realtime hooks, protected route, auth store) → `(tabs)` layout redirect → `/login`, "Sign in with your mobile number" rendered. **Control:** same test with a scratch Jest config lacking the single-React mapping fails with `Objects are not valid as a React child (…)`.

**Verification (from `apps/mobile`):** `npx tsc --noEmit` PASS; `npx eslint .` PASS; `npx jest` → `Test Suites: 13 passed, 13 total`, `Tests: 70 passed, 70 total`; `npx expo-doctor` 17/18 (only RN 0.76.5 vs 0.76.9); `npx expo export --platform android --source-maps --clear` → `expo-router/entry.js (1254 modules)` (Build 6: 1257 − 4 React 19 files + `config-validation.ts`), `.hbc` 2.42 MB (Build 7 shipped bundle: 2.43 MB).

**Production bundle inspection:** sourcemap (1249 sources) — exactly one `node_modules/react/` location (`react@18.3.1`), 0 `react@19` paths, 0 `react-dom`; all 35 `app/` route files bundled; real app deps present (supabase-js, react-query, socket.io-client, react-native-svg, react-native-maps, react-native-razorpay, AsyncStorage, zustand, `packages/api-client/dist/*`); 0 diagnostic files. Bytecode: `19.2.4` 0, React 19 internals 0, `18.3.1` 1, React 18 internals 1; contains `Development configuration required` and `Sign in with your mobile number`; 0 for `SHARERIDE ROUTER TEST`, `SHARERIDE NATIVE TEST`, `DIAGNOSTIC MODE`, `ShareRide Diagnostic`.

**Expected Build 10 device result with the preview placeholders:** "ShareRide / Development configuration required / … / EXPO_PUBLIC_SUPABASE_URL is still a REPLACE_WITH_* placeholder value." Dependencies, pnpm config, `.npmrc`, `eas.json`, `app.config.ts`, plugins, New Architecture, Hermes: unchanged.

# BUILD 10 — REAL SHARERIDE APP (cloud result)

**EAS Build ID:** `d28e8628-ae26-4cf6-8b27-0ae666e039ef`
**Status:** FINISHED
**Profile:** preview | **Distribution:** internal | **Build type:** APK
**Package:** `in.shareride.app` | **Version:** `0.1.0` | **VersionCode:** `1`
**Command:** `pnpm dlx eas-cli@latest build --platform android --profile preview --clear-cache --non-interactive` (from `apps/mobile`)
**Artifact:** `https://expo.dev/artifacts/eas/X3Prj2X75upWd-9ZSVndTxviTsMX_4fJ4XwAy0qAXz4.apk` (83,389,892 bytes)
**Logs:** `https://expo.dev/accounts/arjunkorla/projects/shareride/builds/d28e8628-ae26-4cf6-8b27-0ae666e039ef`

Pre-build: `app/` 35 files, `"main": "expo-router/entry"`, `metro.config.js` present; no code changes since the validated Build 10 preparation.

From the downloaded cloud log: `pnpm install` `Packages: +1440`, `Done in 15.2s`; `eas-build-post-install` `Tasks: 3 successful, 3 total`; EAS expo-doctor phase 16/17 (only RN 0.76.5 vs 0.76.9 — the log's only `error:` line is that non-blocking `RUN_EXPO_DOCTOR` phase); Metro `Android Bundled … expo-router/entry.js (1254 modules)` (EAS step and Gradle `createBundleReleaseJsAndAssets` — identical to the validated local export); `:app:generateAutolinkingPackageList`, `:expo:generateExpoModulesPackageListTask`, `:expo:compileReleaseJavaWithJavac`, `:app:compileReleaseJavaWithJavac`, `:app:assembleRelease`; `BUILD SUCCESSFUL` / `in 7m 3s`; `628 actionable tasks: 628 executed`. Zero `FAILED`, zero `expo.core`.

**Shipped APK bundle** (`assets/index.android.bundle`, Hermes bytecode `c6 1f bc 03`, 2,421,364 bytes):
- expo-router active: `_sitemap` 1, `+not-found` 2 (expo-router built-ins).
- Real routes: login (`Sign in with your mobile number`, `Forgot password?`), `post-ride` (`What would you like to do?`), `payment` (`Secured by Razorpay`), `sos` (`Emergency SOS`), `profile/wallet` (`AVAILABLE BALANCE`), `chat/[id]` (`No messages yet. Say hello!`), `rate-review` (`Thank you!`) — all present; app deps present (`supabase-js`, `No QueryClient set`, `RNSVGPath`, `AIRMap`, `RazorpayCheckout`, `RNCAsyncStorage`, api-client `/admin/admin-users`).
- ConfigurationRequiredScreen: `Development configuration required`, `Supabase and/or API configuration has not been provided for this build.`, `EXPO_PUBLIC_SUPABASE_URL is still a REPLACE_WITH_* placeholder value.` present; `REPLACE_WITH_SUPABASE_PROJECT_URL` present (the inlined placeholder env value the gate evaluates — not displayed; the screen shows only the reason text).
- Single React: `18.3.1` 1, React 18 internals 1; `19.2.4` **0**, React 19 internals **0**.
- Diagnostics absent: `SHARERIDE ROUTER TEST`, `SHARERIDE NATIVE TEST`, `DIAGNOSTIC MODE`, `ShareRide Diagnostic`, `Runtime Error`, `Build 7 Diagnostic` all 0.

**Physical-device verification: PENDING.** Expected (= device PASS): "ShareRide / Development configuration required / Supabase and/or API configuration has not been provided for this build. / … / EXPO_PUBLIC_SUPABASE_URL is still a REPLACE_WITH_* placeholder value." Login screen with placeholder config, blank white screen, or crash = FAIL. No code changes, no Supabase configuration, no Build 11.

**Physical device test, Build 10 (user-reported): PASS** — the phone showed "ShareRide / Development configuration required / Supabase and/or API configuration has not been provided for this build. / Details: EXPO_PUBLIC_SUPABASE_URL is still a REPLACE_WITH_* placeholder value." Installation, Android startup, Hermes, RN rendering, Expo Router, full 35-route tree startup, single-React fix and configuration gate all PASS on the physical device. **Blank-white-screen regression: RESOLVED.** Per the controlled Build 8 → 9 → 10 device tests, the duplicate React runtime (expo-router resolving the repo root's React 19 while React Native used 18.3.1) is the confirmed cause of the Build 5–7 white screen.

Next milestone (Build 11 — first functional development APK): configuration audit in progress; no config/code changes made. Audit findings of note: backend is NestJS (`apps/api`), not FastAPI; `app.config.ts` has no `android.config.googleMaps.apiKey` and the Build 10 APK manifest has no `com.google.android.geo.API_KEY` entry, while `components/MapView.tsx` (used by `app/ride/[id].tsx`, `app/ride-tracking.tsx`) mounts a Google-provider `react-native-maps` view — expected to fail natively on Android without a key (not device-verified).

# Build 11 — Infrastructure Setup Phase 1 (steps 1–4 prep; no values supplied yet)

No application code changed. No credentials created or stored. No tunnel, no EAS changes, no build.

**Changes:**
- `.gitignore` — added `!.env.example` after `.env*`. Before, `.env*` also ignored every template (the root `.env.example` had never been committed). `git check-ignore` confirms `apps/api/.env`, `.env`, `packages/database/.env`, `apps/mobile/.env`, `.env.local`, `.env.production` are all still ignored; only `*.env.example` is allowed.
- `apps/api/.env.example` — new; names + `<placeholder>` values only. Required: `DATABASE_URL`, `DIRECT_DATABASE_URL`, `SUPABASE_URL`, `REDIS_URL`; defaults `API_PORT=4000`, `NODE_ENV`; optional `GOOGLE_MAPS_API_KEY`, `RAZORPAY_KEY_ID`/`_SECRET`/`_WEBHOOK_SECRET`, `SENTRY_DSN`. States that the service-role key and JWT secret are not used.

**Findings:**
- Baseline migration vs Supabase: only `CREATE EXTENSION IF NOT EXISTS "postgis"` (no schema), unqualified `geometry(Point, 4326)` (4 columns), 4 `USING GIST` indexes; no `uuid-ossp`/`pgcrypto` defaults, roles, grants, triggers or functions. Compatible **provided PostGIS is not pre-enabled from the Supabase dashboard** (which installs extensions into the `extensions` schema): Prisma's `?schema=public` sets `search_path=public`, so `geometry` would not resolve and the migration's `IF NOT EXISTS` would no-op. Letting the migration create it installs PostGIS into `public`. Not yet run against a real Supabase database.
- Prisma: `url` (runtime) → `DATABASE_URL` = Supabase transaction pooler :6543 + `pgbouncer=true`; `directUrl` (migrate) → `DIRECT_DATABASE_URL` = session pooler :5432 (IPv4) or direct host (IPv6-only). `PrismaService.onModuleInit` calls `$connect()`, so the API does not boot without a reachable database.
- Migrations reuse the single secrets file via Node 22's `--env-file` (verified with a scratch file of fake values: `prisma validate` passes with it, fails P1012 without): from `packages/database`, `node --env-file=../../apps/api/.env node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma`.
- Redis: ioredis 5.11.1 — `Redis.js` sets `tls: true` for `rediss://`, `StandaloneConnector` then uses `tls.connect` (SNI from host); parse check: `redis://` → no TLS, `rediss://` → TLS + password. Compatible with hosted TLS Redis; no change needed.
- `/health/ready` probes only the database (`SELECT 1`) and Redis (`PING`); Supabase JWKS reachability is a separate check.
- API startup: `pnpm turbo run build --filter=@shareride/api^...` (builds api-client, config, database, types, validation) then `pnpm --filter @shareride/api dev`.
- Installed `@supabase/supabase-js` 2.112.3 (mobile).

# Supabase PostGIS compatibility — implementation (approved; no database touched)

User reviewed Supabase's PostGIS guidance (dedicated `extensions` schema, `extensions.geometry`) and rejected the earlier "install PostGIS into `public`" plan. Implemented explicit qualification instead. **No connection to Supabase or any database; no `migrate deploy`; no seed run; no EAS/Redis/tunnel; Build 11 not started.**

**Changes:**
- `packages/database/prisma/schema.prisma` — exactly 5 lines: `extensions = [postgis(schema: "extensions")]`; the 4 `Unsupported("geometry(Point, 4326)")` → `Unsupported("extensions.geometry(Point, 4326)")` (`ride_requests`/`ride_offers` origin/destination). No `multiSchema`. `prisma format` was run but its output NOT kept: it realigns whitespace in ~10 unrelated models because the committed schema was already format-unclean (`prisma format --check` on the `HEAD` schema also reports "unformatted") — left for a separate whitespace-only change.
- `packages/database/prisma/migrations/20260101000000_init/migration.sql` — regenerated (not hand-edited) with the Phase 13 offline command `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`. Diff vs committed: exactly 5 lines — line 2 `CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";`, lines 135–136/157–158 `extensions.geometry(Point, 4326) NOT NULL`. GIST index lines unchanged; no unrelated changes. Re-check: a fresh `migrate diff` equals the committed file byte-for-byte.
- Raw SQL qualified (functions `ST_DWithin|ST_SetSRID|ST_MakePoint|ST_X|ST_Y` → `extensions.*`; `::geography`/`::geometry` → `::extensions.*`; `INSERT INTO`/`FROM ride_requests|ride_offers` → `public.*`). Query parameters, clauses and matching logic unchanged. Lines touched: `matching.service.ts` 20 (20 fn calls, 16 casts, 4 tables), `ride-requests.service.ts` 8 (8/4/2), `ride-offers.service.ts` 8 (8/4/2), `seed.ts` 6 (8/0/2).
- `infrastructure/docker/postgres/init/01-extensions.sql` — `CREATE SCHEMA IF NOT EXISTS extensions;` + `CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;` (no longer in `public`). `uuid-ossp` and `pgcrypto` deliberately left unchanged in `public`: nothing in the codebase uses either (Prisma generates ids client-side; no `uuid_generate_*`/`gen_random_uuid`/`crypt`/`digest`/`pgp_*` anywhere). Existing Docker volumes not touched (init only runs on an empty volume; Docker not installed on this PC).
- `apps/api/src/common/postgis-contract.spec.ts` — new (104 tests): (1) drives `RideRequestsService.create/list`, `RideOffersService.create/list`, `MatchingService.findForRideRequest/findForRideOffer` with fake Prisma clients, capturing the actual tagged-template SQL sent to `$queryRaw`/`$executeRaw` (8 raw calls) and asserting it is fully qualified plus contains the expected `extensions.ST_DWithin(`/`extensions.ST_SetSRID(extensions.ST_MakePoint(`/`::extensions.geometry`/`public.ride_*` tokens; (2) comment-stripped scan of every non-spec `.ts` in `apps/api/src` plus `seed.ts` for unqualified PostGIS calls/casts/types and unqualified raw ride-table names (catches future new raw SQL); (3) schema.prisma, baseline migration and Docker init all declare PostGIS in `extensions`; plus a self-test of the checker. **Mutation-checked:** reverting one `extensions.ST_DWithin(` → `ST_DWithin(` in `matching.service.ts`, and one `::extensions.geometry` → `::geometry` in `ride-requests.service.ts`, each fails 2 tests (runtime-SQL test + code-rule test); files restored.

**Repo-wide search** (`ST_DWithin`, `ST_SetSRID`, `ST_MakePoint`, `ST_X(`, `ST_Y(`, `::geometry`, `::geography`, `geometry(Point`): remaining unqualified hits are comments/docs only (`matching-score.util.ts`, `matching.service.ts` header, `ride-requests.service.ts` header, `seed.ts` header, `schema.prisma` index comments, `docs/*.md`). No executable SQL left unqualified.

**Verification:** `prisma validate` PASS; `prisma generate` PASS (note: before it ran, the generated client was absent from `node_modules`, which made `apps/api` typecheck fail with `'@shareride/database' has no exported member 'Prisma'` — environment state, fixed by the normal generate step); `packages/database` `pnpm build` + `tsc --noEmit` PASS (tsconfig includes `prisma/`, so `seed.ts` is typechecked); `packages/database` has no test suite. `apps/api`: `npx tsc --noEmit` exit 0; `npx eslint "{src,test}/**/*.ts"` exit 0; `npx jest` 26/26 suites, **298/298**; `npx jest --config ./test/jest-e2e.json` 4/4 suites, **16/16**; `npx nest build` exit 0. Credential scan of all touched files: none.

**DB URL strategy unchanged:** `DATABASE_URL` = Supabase transaction pooler :6543, `pgbouncer=true&schema=public`; `DIRECT_DATABASE_URL` = session pooler :5432, `schema=public`.

**Before the first real migration:** in Supabase SQL editor, `select extname, extnamespace::regnamespace from pg_extension where extname = 'postgis';` must return no row or `extensions` (stop if `public`). After `migrate deploy`: `set search_path = public;` then `select extensions.ST_DWithin(extensions.ST_SetSRID(extensions.ST_MakePoint(78.39,17.44),4326)::extensions.geography, extensions.ST_SetSRID(extensions.ST_MakePoint(78.35,17.44),4326)::extensions.geography, 6000);` → `true`.

# Supabase pre-deploy checks (2026-09-25; first live DB connection; read-only)

User created `apps/api/.env` locally (DATABASE_URL, DIRECT_DATABASE_URL, SUPABASE_URL set; REDIS_URL not set). Credentials were not printed or copied anywhere. **No `migrate deploy`, no writes, no seed, Build 11 not started.**

- **Datasource:** `schema.prisma` → `url = env("DATABASE_URL")`, `directUrl = env("DIRECT_DATABASE_URL")`, `extensions = [postgis(schema: "extensions")]`. Parsed URL shape (password masked): DATABASE_URL = `aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public`; DIRECT_DATABASE_URL = same host `:5432/postgres?schema=public`. Matches the strategy above.
- **PostGIS pre-check** (read-only SELECTs via `@prisma/client` `$queryRawUnsafe` on DIRECT_DATABASE_URL, temp script, deleted after): `pg_extension where extname='postgis'` → **no row** (not installed, so not in `public`); `pg_available_extensions` → postgis 3.3.7 available, not installed; schemas `public` and `extensions` both exist; `public` has 0 tables; `public._prisma_migrations` does not exist. → **PASS**. The baseline's `CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions"` will install it in the expected place.
- **`prisma migrate status`** (from `packages/database`, env loaded from `apps/api/.env`):
  ```
  Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-0-ap-south-1.pooler.supabase.com:5432"
  1 migration found in prisma/migrations
  Following migration have not yet been applied:
  20260101000000_init
  ```
  Exit code 1 = Prisma's code for "pending migrations", not a connection/auth failure. Connection over DIRECT_DATABASE_URL: OK.

**Next (awaiting user go-ahead):** `prisma migrate deploy`, then the post-deploy `extensions.ST_DWithin` check above.

# Supabase first migration — result (2026-09-25; user-approved)

From `packages/database`: `node --env-file=../../apps/api/.env node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma` → `Applying migration 20260101000000_init` … `All migrations have been successfully applied.` exit 0. Then `migrate status` (same form) → `Database schema is up to date!` exit 0.

Read-only verification (Prisma `$queryRawUnsafe` on DIRECT_DATABASE_URL, temp script deleted):
- `pg_extension` → `postgis 3.3.7`, schema **`extensions`**.
- Spatial columns **4/4**: `ride_requests`/`ride_offers` × `originCoordinates`/`destinationCoordinates` = `extensions.geometry(Point,4326)` NOT NULL.
- GIST indexes **4/4**: `ride_{requests,offers}_{origin,destination}Coordinates_idx` `USING gist`.
- Smoke test inside a transaction with `SET LOCAL search_path = public` (confirmed `show search_path` = `public`): `extensions.ST_DWithin(... ::extensions.geography ..., 6000)` → **true**. Same session: `to_regtype('geometry')` → null, i.e. unqualified `geometry` does NOT resolve, so the query passed only because it is fully qualified.
- `_prisma_migrations`: `20260101000000_init` finished, not rolled back, applied_steps_count 1, logs null.
- `public` base tables: 30 = 29 app tables (= 29 Prisma models) + `_prisma_migrations`. `users`, `drivers`, `passengers`, `ride_requests`, `ride_offers` present. (No `driver_profiles`/`passenger_profiles` in this schema: Driver/Passenger map to `drivers`/`passengers`.)
- Drift: `prisma migrate diff --from-url <DIRECT> --to-schema-datamodel prisma/schema.prisma --exit-code` → `No difference detected.` exit 0.

Not done: seed, Redis, API start, tunnel, EAS, Build 11.

**User-approved correction:** tables are `drivers`/`passengers` (not `driver_profiles`/`passenger_profiles`). `20260101000000_init` is now IMMUTABLE; any schema change needs a NEW migration.

# Redis + NestJS API readiness — partial (2026-09-25; blocked on REDIS_URL)

- Env (values never printed): DATABASE_URL SET, DIRECT_DATABASE_URL SET, SUPABASE_URL SET, API_PORT=4000, NODE_ENV=development. **REDIS_URL holds a 21-char `<…>` placeholder, not a URL**, so it's effectively NOT SET. Optional GOOGLE_MAPS/RAZORPAY_*/SENTRY_DSN unset; `env-validation.ts` marks all of them `@IsOptional`.
- Redis use in code: `RedisService` = `new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 2 })`. Commands used: `PING` (health), `GET` and `SET … EX` (token revocation, auth.service.ts:102/106). No pub/sub, Lua, or blocking commands, so Upstash over `rediss://` works with no code change.
- JWKS: `GET $SUPABASE_URL/auth/v1/.well-known/jwks.json` → HTTP 200, 1 key `kty=EC alg=ES256 crv=P-256 use=sig` with kid. Verifier allows `['RS256','ES256']`, so it's compatible.
- `pnpm turbo run build --filter=@shareride/api^...` → 4/4 tasks successful, exit 0.
- Not run yet (Redis PING must pass first): NestJS start, /health*, 401 check.
- Phone auth: hosted-project fix needs "Test Phone Numbers and OTPs" and "Test OTPs Valid Until" set **together** (Management API: `sms_test_otp` + `sms_test_otp_valid_until` ISO 8601, `PATCH /v1/projects/{ref}/config/auth`). Still BLOCKED on user action in the dashboard.

---

# Claude Changes (Phase 13 cycle — historical, preserved for reference)

# Claude Changes

Protocol setup (this cycle):
- Rewrote root `AGENTS.md` — it was stale, still describing the legacy
  Figma Make Vite prototype (`src/`), not the actual ShareRide monorepo.
  Now the real engineering contract: product invariants, verified
  commands per package, coding rules (including the method-level
  `@UsePipes` landmine), and the agent collaboration protocol.
- Created this file.
- `CLAUDE.md` unchanged — it's already just `@AGENTS.md`, so it picks up
  the rewrite automatically.

Phase 13 itself (already complete, full detail in
`docs/migration-plan.md`'s Phase 13 entry — summarized here for Codex):
- New `apps/api/test/*.e2e-spec.ts` + `test/jest-e2e.json` — real
  `@nestjs/testing` + `supertest` integration tests (16), two harnesses:
  `build-test-app.ts` (real `AppModule`, `Prisma`/`Redis` mocked — for
  health/webhook/401-boundary) and `build-scoped-test-app.ts` (single
  feature module, identity injected via middleware — for authenticated
  Controller→Validation→Service flows, since Nest's testing API cannot
  override an `APP_GUARD`-registered global guard).
- Found and fixed a real bug: method-level `@UsePipes(new
  ZodValidationPipe(schema))` was validating `@CurrentUser()` against the
  body's schema too, breaking 11 endpoints on every real request. Fixed
  by moving each pipe to its `@Body()` parameter.
- New mobile test infra (`jest-expo`, `@testing-library/react-native`,
  `react-test-renderer` — versions matched to this app's exact Expo
  52/React 18.3.1/RN 0.76.5 pins) — 29 tests: chat/notification realtime
  sync (dedup, unread, reorder), every Razorpay checkout outcome (native
  module mocked, never a real call), auth-store flows, API error states.
- Prisma baseline migration
  (`packages/database/prisma/migrations/20260101000000_init/`), generated
  via `prisma migrate diff --from-empty --to-schema-datamodel` (no live DB
  needed). Added missing GiST indexes on `RideRequest`/`RideOffer`
  geometry columns (found while validating the baseline — the matching
  engine's `ST_DWithin` queries had no spatial index anywhere in the
  schema).
- Structured JSON logging + redaction, request-id correlation, global
  exception filter (safe `{statusCode,code,message,requestId}` shape),
  `/health/live` vs `/health/ready` (Postgres + Redis), Prometheus metrics
  wired to real call sites (socket gauge, webhook counter, matching-
  duration timer), optional Sentry, startup env validation.
- CI now runs the new integration suite; chat message history capped at
  500 (the one genuinely unbounded list found in the pagination review).
- `pnpm audit`: 94→90 advisories after two safe in-range fixes (`next`
  patch bump closing 2 critical RCEs, `sharp` version pin closing 2 high
  CVEs). Remaining critical/high findings are dev/build-tooling-only or
  blocked on a NestJS major-version bump — reported, not fixed.
- `docs/e2e-test-plan.md` — full journey, stage by stage, marking what's
  automated today vs. what needs live infrastructure.

# Verification

All commands below were actually run in this session (this cycle re-ran
the full sweep to confirm nothing regressed since Phase 13's own report):

```
apps/api:     tsc --noEmit           → clean
apps/api:     eslint                 → clean
apps/api:     jest                   → 132/132 PASS
apps/api:     jest --config test/jest-e2e.json → 16/16 PASS
apps/api:     nest build             → clean

packages/database: prisma validate  → "schema is valid"
packages/database: prisma generate  → clean
packages/database: tsc --noEmit     → clean

apps/mobile:  tsc --noEmit           → clean
apps/mobile:  eslint .               → clean
apps/mobile:  jest                   → 29/29 PASS
apps/mobile:  expo export --platform ios --platform android → PASS (1257/1254 modules)

apps/admin:   tsc --noEmit           → clean
apps/admin:   eslint .               → clean
apps/admin:   next build             → clean (Next.js 15.5.25)
```

`pnpm turbo run lint typecheck test build` (whole monorepo, one
invocation) showed one failure — `@shareride/admin#typecheck` (TS6053,
missing `.next/types/**/*.ts`) — confirmed to be a task-ordering artifact
(typecheck ran concurrently with, and before, admin's own build in that
combined invocation; turbo.json's `typecheck` only depends on `^build`,
not the same package's own `build`). Re-running `tsc --noEmit` in
`apps/admin` directly, after a build has completed, is clean — see
`AGENTS.md`'s Commands section for this exact caveat, documented so it
doesn't get mistaken for a regression by a future review.

# Codex Review

Independent remediation review, 2026-09-22. **Changes requested.** Both
original BLOCKERs are resolved, but the claim that all HIGH findings are
fixed is not supported by the current implementation. This section replaces
the initial review for the current cycle; C01-C24 retain their original IDs.
Claude's sections outside this review are preserved, including claims this
review disputes. No implementation files were edited.

Read AGENTS.md, this handoff, migration-plan, current Git status/diff, and
relevant source/tests. Git metadata is now available. Schema, migrations,
CI and app.json have no remediation diff; the initial static baseline
comparison remains historical evidence, not a fresh live-database check.

### Disposition

| Original finding | Current disposition |
| --- | --- |
| C01 receipt length | Closed: receipt uses the 36-character trip UUID. |
| C02 fabricated SOS assurances | Closed for the original issue; separate timer defect R01 below. |
| C03 suspended HTTP accounts | Closed: database account status enforced. |
| C04 admin grant escalation | Closed: grants limited to caller's permissions. |
| C05 cross-account cache | HIGH remains; reproduced below. |
| C06 socket session lifetime | Partial; HIGH dependency-failure regression below. |
| C07 report-note RBAC | Closed: report.assign permission enforced. |
| C08 cancelled-suggestion chat | Closed: eligibility excludes auto-cancelled suggestions. |
| C09 callback payment authority | HIGH remains. |
| C10 webhook deduplication | Partial; HIGH lost-event paths remain. |
| C11 payment transitions | Partial; HIGH capture reconciliation gap remains. |
| C12 order concurrency | Partial; HIGH interrupted/uncertain attempt recovery remains. |
| C13 refund retries/reconciliation | Partial; HIGH remains. |
| C14 matching concurrency/lifecycle | Partial; HIGH cancellation/expiry gap remains. |
| C15 spatial index alignment | MEDIUM remains; deferred, not resolved. |
| C16 trip completion counters | Closed: conditional transition gates increments. |
| C17 inactive vehicle reuse | Sequential case fixed; MEDIUM concurrent case remains. |
| C18 notification failure propagation | Closed: post-commit best-effort handling. |
| C19 logging privacy | MEDIUM remains, including raw error-path query strings. |
| C20 HTTP status metrics | Original wrong-status issue closed; LOW duplicate-observation R02 below. |
| C21 native module import crash | Closed on inspection and mocked tests; native acceptance outstanding. |
| C22 native Google Maps configuration | MEDIUM remains; deferred, not resolved. |
| C23 security/persistence coverage | Improved; MEDIUM gaps remain. |
| C24 mobile test termination | Closed: 36 tests passed and process exited naturally. |

### Findings requiring remediation

#### C05 - HIGH - Cache clearing does not isolate mounted observers

- **Location:** `apps/mobile/lib/useClearQueryCacheOnIdentityChange.ts`,
  `apps/mobile/app/_layout.tsx` (shared QueryClient/provider).
- **Evidence:** identity changes clear the cache in a post-render effect;
  existing observers and identity-independent query keys remain mounted.
  A read-only probe using the actual hook, React renderer and TanStack Query
  seeded A's private data, changed the identity to B, and kept B's fetch
  pending. B rendered A's data, including after the clearing effect:
  `B: private contact from A`.
- **Failure:** switching accounts can display the preceding account's
  private cached content. Testing only that clear() was called misses this.
- **Fix:** isolate query clients/keys and mounted protected UI by session,
  cancel old work, and gate rendering during identity transitions. Test the
  rendered content and in-flight responses across A -> B and A -> null -> B.

#### C06 - HIGH - Socket revalidation can cause an unhandled rejection

- **Location:** `apps/api/src/realtime/realtime.gateway.ts:54`,
  `revalidateConnections` at line 103.
- **Evidence:** the interval discards the sweep promise with `void` and no
  catch. Redis revocation and database status lookups inside Promise.all
  can reject. A corrected in-memory probe returned
  `Socket sweep rejects: synthetic Redis failure disconnected: false`.
- **Failure:** a dependency outage with connected sockets rejects the
  background task without disconnecting the affected socket. Node's default
  unhandled-rejection behavior can terminate the API process; see
  [Node CLI documentation](https://nodejs.org/download/release/v22.18.0/docs/api/cli.html#--unhandled-rejectionsmode).
  No production process was deliberately crashed.
- **Fix:** handle errors at the timer and per-socket boundaries, enforce an
  explicit fail-closed policy, and test rejected/hanging dependency calls
  and actual expiry. The successful sweep's 60-second window is acknowledged;
  it does not make failed sweeps safe.

#### C09 - HIGH - Checkout callback still authoritatively marks payment PAID

- **Location:** `apps/api/src/payments/payments.service.ts:212`, `:240`.
- **Evidence:** verifyPayment still writes PAID after callback-signature
  verification without a captured webhook. A source-level service probe
  with the signature verifier mocked true produced
  `Callback without webhook: PAID`.
- **Failure:** callback verification establishes PAID before authoritative
  server webhook confirmation, contrary to AGENTS.md's explicit invariant.
  Replay guards improve terminal-state safety but do not fix this boundary.
- **Fix:** keep callback verification non-authoritative; only a verified,
  reconciled provider webhook may confirm payment. Adjust tests that expect
  the callback alone to mark PAID.

#### C10/C11 - HIGH - Legitimate capture events can be permanently consumed

- **Location:** `apps/api/src/payments/payments.service.ts:288-347`.
- **Evidence:** payment is read before the transaction. The transaction
  inserts the dedup event, then conditionally updates the exact old status.
  A zero-row update still commits the event. A deterministic stateful probe
  moved PENDING -> AUTHORIZED between read and capture update and produced:
  `Capture after concurrent authorization: AUTHORIZED event recorded: true`;
  redelivery remained AUTHORIZED. Unknown-payment events also commit their
  dedup record without any subsequent replay path. FAILED excludes capture.
- **Failure:** concurrent authorization/capture strands a paid customer;
  early delivery before order attachment is permanently ignored. An earlier
  failure also prevents later authoritative success from being reconciled.
  Provider events must not be assumed ordered; see
  [Razorpay webhook best practices](https://d6xcmfyh68wv8.cloudfront.net/docs/webhooks/best-practices/).
- **Fix:** evaluate state inside the transaction with locking or retry a lost
  conditional update against current state. Distinguish genuinely obsolete
  events from unresolved ones; retain/reprocess unmatched events. Reconcile
  captured facts against the correct provider attempt without regressing
  refund states. Add competing event and out-of-order replay tests.

#### C12 - HIGH - Order claims have no recovery and retries erase references

- **Location:** `apps/api/src/payments/payments.service.ts:100-197`.
- **Evidence:** PENDING/no-order claims reject later creates indefinitely.
  No lease/reconciliation path exists for process death after the claim.
  The catch marks uncertain attempts FAILED; retry clears providerOrderId
  and providerPaymentId before creating another order.
- **Failure:** a crash strands checkout. A provider success followed by a
  timeout/local attachment failure leaves an orphan order; a delayed capture
  from an earlier attempt cannot be associated after its reference is erased.
  Simultaneous normal requests are improved, but crash safety is not solved.
- **Fix:** persist recoverable provider-attempt identity and reconcile unknown
  outcomes before issuing another order. Preserve previous order/payment
  associations and test interruption at each provider/local-write boundary.

#### C13 - HIGH - Refund claims, provider outcomes and retries still diverge

- **Location:** `apps/api/src/payments/payments.service.ts:326-343`, `:403-434`.
- **Evidence:** payment claim and refund upsert are separate writes; upsert
  is outside the try block. An injected upsert failure left REFUND_PENDING
  without a provider call. The catch also treats provider timeout and a
  local write failure after provider success as definite refund failure,
  restoring PAID. Refund webhooks match paymentId/status, not the expected
  refund-attempt ID; affected refund-row count is not checked.
- **Failure:** a transient local failure strands the refund. An uncertain
  successful provider refund is labelled failed and made retryable. A late
  event for an earlier attempt can resolve the current attempt incorrectly.
- **Fix:** atomically persist claim and refund intent, preserve attempt
  identities, distinguish unknown from failed outcomes, and reconcile before
  retry. Match webhook effects to the correct attempt and atomically verify
  both payment/refund updates. Test timeouts, process interruption, local
  post-provider failure and delayed events from earlier attempts.

#### C14 - HIGH - Acceptance does not enforce offer lifecycle

- **Location:** `apps/api/src/matching/matching.service.ts:283` (accept),
  `apps/api/src/rides/ride-offers.service.ts` and
  `apps/api/src/rides/ride-requests.service.ts` (cancel).
- **Evidence:** accept conditionally claims match and ACTIVE request but
  never checks offer status or either parent's expiry. Offer cancellation
  changes only the offer; outstanding REQUESTED matches remain acceptable.
  Cancellation also uses read-then-unconditional-update rather than the
  acceptance transition's concurrency protocol.
- **Failure:** a driver can accept an outstanding match after cancelling its
  offer, creating a trip for an unavailable ride. Expired ACTIVE records
  remain acceptable; a racing request cancellation can overwrite confirmation.
- **Fix:** enforce parent availability/expiry and serialize acceptance with
  cancellation using a consistent transaction/locking or conditional-write
  protocol. Test cancelled offers, expired parents and accept/cancel races
  against real database transactions. The competing-accept and decline
  improvements do not close these lifecycle cases.

#### C17 - MEDIUM - Vehicle deactivation still races offer creation

- **Location:** `apps/api/src/rides/ride-offers.service.ts` (create),
  `apps/api/src/vehicles/vehicles.service.ts` (deactivate).
- **Evidence:** create reads isActive before a separate INSERT; deactivate
  counts active offers before a separate vehicle update. Neither operation
  shares a transaction/lock with the other.
- **Failure:** create reads active; deactivate sees no offers and disables
  the vehicle; create then inserts an ACTIVE offer for the disabled vehicle.
- **Fix:** serialize these operations on the vehicle and check their
  preconditions inside the transaction. Add an interleaving regression test.

#### C19 - MEDIUM - Error logging still leaks unfiltered URLs and exception data

- **Location:** `apps/api/src/common/http/global-exception.filter.ts:42-53`,
  structured logger and Sentry initialization.
- **Evidence:** the new access middleware strips queries, but the exception
  filter still logs request.originalUrl and raw exception message/stack and
  sends the original exception to Sentry. Key-based object redaction cannot
  remove sensitive values embedded in these strings.
- **Failure:** an error response for a URL containing a token/private query
  value records it in logs; database errors can expose embedded user input.
  This is a privacy issue, not merely a cosmetic free-text limitation.
- **Fix:** strip queries on every logging path, use safe error metadata and
  apply equivalent sanitization to exception/Sentry reporting. Test the
  actual global-filter path with sensitive query and exception text.

#### R01 - MEDIUM - Switching SOS actions leaves the earlier dial timer alive

- **Location:** `apps/mobile/app/sos.tsx:69-89`, action Pressables.
- **Evidence:** startCall overwrites countdownTimer.current without clearing
  the previous interval; other actions stay enabled. Old callbacks clear
  the new timer and call dial even when countdown is null. Dial is a side
  effect inside a state updater and its rejected promise is discarded.
- **Failure:** select Police then Ambulance before the countdown completes:
  the old interval can launch the wrong dialer repeatedly and survive
  cancellation/unmount, which clear only the latest timer reference.
- **Fix:** cancel the preceding timer on every selection, run dialing outside
  state updaters, invalidate stale callbacks, and handle Linking failures.
  Test rapid switching, cancellation and unmount. This is source analysis;
  no physical emergency call was made.

#### C15 - MEDIUM - Spatial indexes still do not match geography predicates

- **Location:** `packages/database/prisma/schema.prisma`, baseline migration,
  spatial SQL in `apps/api/src/matching/matching.service.ts`.
- **Evidence:** GiST indexes cover geometry columns; proximity predicates
  cast those columns to geography. No matching geography expression index
  or index-compatible geometry prefilter was added.
- **Failure:** production proximity searches may scan growing ride tables.
  No live query-plan/performance result is claimed.
- **Fix:** align indexes and predicates through a new reviewed migration as
  appropriate, then verify representative EXPLAIN ANALYZE plans on PostGIS.
  Live verification being unavailable does not close the finding.

#### C22 - MEDIUM - Forced Google native map provider remains unconfigured

- **Location:** `apps/mobile/app.json`, `apps/mobile/components/MapView.tsx`.
- **Evidence:** Google is selected on both platforms; no checked-in build
  configuration provisions either platform's provider key/setup.
- **Failure:** a JS export can pass while the native map cannot render.
- **Fix:** wire secure build-time native configuration appropriate to pinned
  Expo SDK 52/maps versions and verify Android/iOS builds. Do not commit
  credentials. This remains a release dependency even if owned by operations.
  See [Expo deployment requirements](https://docs.expo.dev/versions/latest/sdk/map-view/).

#### C23 - MEDIUM - Green tests do not verify the disputed boundaries

- **Location:** API auth/gateway/payment/matching tests, scoped HTTP harness,
  `.github/workflows/ci.yml`, mobile identity-cache tests.
- **Evidence:** new AuthService/gateway/controller tests are useful, but do
  not establish signed-token/JWKS integration, a complete guard permission
  matrix or real Socket.IO room isolation. Prisma transaction mocks call the
  callback directly; they do not rollback or reproduce database locking.
  Cache tests check clear calls rather than protected rendered content.
- **Failure:** all suites pass with the reproducible HIGH defects above.
  Tests named for rollback do not prove persisted rollback or redelivery.
- **Fix:** add focused failing regressions, local signed-token/JWKS and socket
  integration, and disposable PostGIS migration/concurrency checks. Real
  Supabase credentials are not required for a local JWKS fixture. Record
  native/provider acceptance separately; revise overstated coverage claims.

#### R02 - LOW - Health requests produce duplicate access observations

- **Location:** `apps/api/src/app.module.ts` middleware registration,
  `apps/api/src/common/http/http-observability.middleware.ts`, health HTTP tests.
- **Evidence:** this review's integration run printed two http.request records
  for each /health/live and /health/ready request, with identical request IDs
  and statuses (including 503). Each logging callback also increments metrics.
  Exact duplicate registration cause has not been isolated.
- **Failure:** health traffic is overcounted and produces duplicate logs.
- **Fix:** isolate the duplicate invocation/registration and assert exactly one
  access observation and metric increment per real HTTP request. Correct final
  status codes are now observed, closing the original C20 failure.

### Confirmations and verification limits

- **Method-level Zod issue:** current search finds 12 ZodValidationPipe
  bindings, all on @Body parameters, and zero UsePipes occurrences in API
  source. The original placement defect is eliminated in affected endpoints.
  This does not imply all 12 endpoints have full authenticated HTTP coverage.
- Server-side amount calculation, payer/participant ownership checks, callback
  HMAC and raw-body webhook signature verification remain present. Signature
  integrity does not establish correct payment-state reconciliation.
- JWT algorithms/issuer/audience checks and server-derived socket user rooms
  remain present. No real Supabase session or live socket deployment tested.
- Initial baseline/schema comparison found 702 matching lines with PostGIS
  creation and uniqueness/foreign-key constraints, including Payment.tripId.
  No migration deployment or live PostgreSQL/PostGIS/Redis test was performed
  in either review. No destructive database command was used.
- Health tests use mocks. Environment validation, CI, native maps/Razorpay
  linking and network protection of metrics were inspected, not deployment
  certified. No native Android/iOS build, provider request or device test was
  performed. No fresh dependency-advisory count is asserted.

### Independent verification record

Commands run in this remediation review (output excerpts):

```text
Repository root:
  git status --short                 [reviewed modified/untracked files]
  git diff                          [reviewed remediation changes]
  rg 'UsePipes|new ZodValidationPipe' apps/api/src
                                    [12 parameter bindings; no UsePipes]

apps/api:
  npx tsc --noEmit                   [no output]
  npx eslint "{src,test}/**/*.ts"     [no output; command sequence exit 0]
  npx jest --runInBand               [exit 0]
    Test Suites: 25 passed, 25 total
    Tests:       194 passed, 194 total
    Snapshots:   0 total
    Time:        16.695 s
  npx jest --config ./test/jest-e2e.json --runInBand [exit 0]
    Test Suites: 4 passed, 4 total
    Tests:       16 passed, 16 total
    Time:        12.831 s

apps/mobile:
  npx tsc --noEmit                   [no output]
  npx eslint .                      [no output; command sequence exit 0]
  npx jest --runInBand               [exit 0; natural termination]
    Test Suites: 6 passed, 6 total
    Tests:       36 passed, 36 total
    Time:        3.111 s
```

API integration emitted Jest's one-second open-handle warning but subsequently
exited 0. Mobile did not reproduce its former hang. API test output confirms
correct final 400/401/403 statuses and supplies R02's duplicate health logs.
Typecheck/lint were invoked sequentially in each package; neither printed an
error. Builds were not rerun for this documentation-only review.

Additional read-only `node` probes transpiled current TypeScript in memory.
Payment probes used stateful doubles and a mocked signature verifier, not
real database isolation or Razorpay. They exercised callback authority,
a stale capture snapshot/redelivery, and refund-upsert failure. React used
real query observers with a pending fetch. The first combined probe's socket
segment had a harness module-interop error; that segment was discarded and
rerun with corrected interop, yielding the C06 result above. No probe edited
implementation files or contacted a payment provider.

## Phase 14 Gate Recommendation

`READY_FOR_CLAUDE_REMEDIATION`

Remaining HIGH and MEDIUM issues prevent approval. The deferred items remain
open production-readiness dependencies; several are correctness/privacy
issues, not just infrastructure configuration. Phase 14 was not implemented.

# Claude Fix Evaluation

Every finding below was independently verified by reading the actual code
before any fix — not taken on Codex's word. All BLOCKER and HIGH findings
were accepted and fixed. Of the 9 MEDIUM/LOW findings, 6 were fixed
(C24 initially deferred, then fixed once its own slow diagnostic run
completed — see below), 3 remain accepted-but-deferred with reasoning
(none are correctness/security bugs — one needs a live PostGIS instance to
verify, one is a judgment call about redaction scope already partially
addressed, one is infrastructure configuration rather than code).

### BLOCKER

**C01 — ACCEPT, FIXED.** Confirmed: `trip_` (5 chars) + a UUID (36 chars)
is 41, one over Razorpay's documented 40-char receipt limit. Fixed by
dropping the prefix — the trip id alone is already globally unique.
Added a regression test using a real-format UUID (the existing test's
`trip-1` fixture was short enough to mask this). `payments.service.ts`,
`payments.service.spec.ts`.

**C02 — ACCEPT, FIXED.** Confirmed by reading `sos.tsx`: the screen
claimed live location tracking/sharing with zero capability behind either
claim. Fixed two ways: emergency calls are now genuinely real
(`Linking.openURL('tel:...')` — a core React Native capability, no new
native dependency, no new permission), and "Share Live Location" is now
honestly disabled ("Not available yet") rather than faking a success
state — this product has no GPS capture or emergency-contact delivery
path at all, and fabricating a working share flow without either would
just be a different false assurance. `apps/mobile/app/sos.tsx`.

### HIGH

**C03 — ACCEPT, FIXED.** Confirmed: `AuthService.getOrCreateUser`/
`syncUserFromClaims` never selected or checked `accountStatus` — a
SUSPENDED/BLOCKED user's still-valid Supabase JWT kept authenticating
indefinitely. Fixed: `syncUserFromClaims` now throws `Unauthorized` for
any non-ACTIVE account, checked on every authenticated HTTP request (this
method runs on every request via `SupabaseStrategy.validate`). Added
`AuthService`'s first-ever test file (10 tests) — this service had zero
coverage before. `auth.service.ts`, `auth.service.spec.ts` (new).

**C04 — ACCEPT, FIXED.** Confirmed: `admin.user.manage` (granted to plain
ADMIN) gated `POST /admin/admin-users` with no check that the caller could
actually grant the requested role — an ADMIN could create a SUPER_ADMIN
account and use it to bypass their own denied `admin.role.manage`/
`admin.permission.manage`. Fixed with a general grant-ceiling rule: an
admin may only grant/reactivate a role whose permissions are already a
subset of their own — not a special-cased SUPER_ADMIN check, so it holds
for any future role too. Applied to both `create()` and `reactivate()`
(reactivating restores existing permissions, same escalation shape).
7 new tests (this controller had zero coverage before).
`admin-users.controller.ts`, `admin-users.controller.spec.ts` (new).

**C05 — ACCEPT, FIXED.** Confirmed: the mobile `QueryClient` is a
module-level singleton with no per-user scoping and no clear-on-logout —
account B signing in after A logs out (same running app instance) would
see A's cached conversations/notifications/contacts until each query
happened to refetch. Fixed: a new `useClearQueryCacheOnIdentityChange`
hook (extracted as its own tested module, not inline in `_layout.tsx`)
calls `queryClient.clear()` whenever the authenticated user id changes —
covers logout, a direct account switch, and correctly does NOT clear on a
token refresh (same user id) or between two "logged out" renders. 6 new
tests. `apps/mobile/lib/useClearQueryCacheOnIdentityChange.ts` (new),
wired into `app/_layout.tsx`.

**C06 — ACCEPT, FIXED.** Confirmed: `RealtimeGateway` only checked token
revocation/account status/expiry at `handleConnection` — an already-open
socket kept receiving private events indefinitely after logout or token
expiry. Fixed with a periodic revalidation sweep (`onModuleInit` schedules
a 60s interval, cleaned up in `onModuleDestroy`) that re-checks every
connected socket's token revocation, account status, and JWT `exp` claim,
disconnecting any that fail — a bounded-worst-case-exposure sweep, not a
push-based invalidation channel (proportionate to this gateway's size, not
a pub/sub redesign). Also added the account-status check at connect time
itself (closing the same gap C03 closed for HTTP). 11 new tests — this
gateway had zero coverage before, unit or integration.
`realtime.gateway.ts`, `realtime.gateway.spec.ts` (new).

**C09 — ACCEPT, FIXED.** Confirmed: `verifyPayment` transitioned to PAID
unconditionally once the HMAC checked out, with no guard against a
payment that had since moved to REFUND_PENDING/REFUNDED — a replayed,
still-valid checkout callback could flip a refunded payment back to PAID.
Fixed: `verifyPayment` now only acts when status is PENDING/AUTHORIZED;
any other status returns the current record unchanged instead of
re-verifying. `payments.service.ts`, `payments.service.spec.ts`.

**C10 — ACCEPT, FIXED.** Confirmed: the webhook event-log insert and its
domain effect were two separate statements, not atomic — a crash between
them left the event permanently marked "seen" with its effect never
applied, silently swallowing a genuine provider redelivery forever. Fixed
by wrapping the event-log insert and its matching effect in one
`$transaction` (interactive callback form). `payments.service.ts`,
`payments.service.spec.ts`.

**C11 — ACCEPT, FIXED.** Confirmed: `payment.captured`'s guard was
`status !== 'PAID'`, which allowed it to fire from REFUND_PENDING/
REFUNDED/FAILED too — a late or replayed captured event could resurrect a
refunded payment. Also confirmed the TOCTOU: every transition read status
once, then wrote unconditionally by id, with no compare-and-swap. Fixed:
every transition (`captured`/`failed`/`authorized`/both refund events) now
uses `updateMany` conditioned on the exact status read, checked via
`count === 1` before applying the paired refund-row update. New tests
cover both the "can't resurrect from REFUNDED/FAILED" and general
transition-safety cases. `payments.service.ts`, `payments.service.spec.ts`.

**C12 — ACCEPT, FIXED.** Confirmed: `createOrder` read the row, called
Razorpay, then wrote — with no claim step, two concurrent calls (or two
retries of a FAILED payment) could both call Razorpay and create two
separate provider orders, with only the last database write's order id
surviving locally (the other silently orphaned). Fixed with a genuine
claim-before-provider-call pattern (`claimPaymentForOrder`): the row is
atomically claimed (via a conditional `create`/`updateMany`) BEFORE
Razorpay is ever called; a concurrent second caller gets a 409 instead of
placing a second order; a Razorpay-call failure releases the claim back to
FAILED so a client retry can claim it again. 3 new concurrency tests.
`payments.service.ts`, `payments.service.spec.ts`.

**C13 — ACCEPT, FIXED.** Confirmed: `adminRefund` called Razorpay's
refund API BEFORE any local claim or record existed — a crash right after
a real refund was issued left it completely unrecorded locally, and
`PaymentRefund.paymentId`'s unique constraint meant a retry after a first
failed attempt could never succeed (`create()` would P2002 against the
existing FAILED row). Fixed: the payment is claimed (PAID→REFUND_PENDING,
conditioned on the status just read) BEFORE calling Razorpay, and the
refund row is `upsert`-ed rather than always `create()`-d, so a retry
reuses the existing row. A provider-call failure releases both claims back
to PAID/FAILED. 5 new tests including a genuine failed-then-retried
scenario. `payments.service.ts`, `payments.service.spec.ts`.

**C14 — ACCEPT, FIXED.** Confirmed the exact race: a passenger can hold
more than one REQUESTED match at once (nothing stops requesting several
drivers), so two drivers' `accept()` calls can race — the second, reading
a stale REQUESTED snapshot, could unconditionally resurrect its own
already-auto-cancelled match and create a second Trip for the same
request. Also confirmed `accept()` never checked the parent RideRequest's
own current status. Fixed: `request()`/`accept()`/`decline()` all
condition their Match transition on the exact status just read
(`updateMany` + count check, throwing inside the transaction on a miss —
which rolls back the whole transaction, including any
agreement/trip/auto-cancels already applied); `accept()` additionally
claims the parent RideRequest (ACTIVE→CONFIRMED, same conditional
pattern). 9 new tests, including the exact "resurrect an auto-cancelled
match" scenario and "ride request no longer active" scenario.
`matching.service.ts`, `matching.service.spec.ts`.

### MEDIUM/LOW — fixed

**C07 — ACCEPT, FIXED.** `report.read` (held by READ_ONLY_ADMIN) gated
`POST /admin/reports/:id/notes`, a write. Changed to `report.assign`
(matches every other report-handling write action; READ_ONLY_ADMIN
doesn't have it). `reports.controller.ts`.

**C08 — ACCEPT, FIXED.** `matchStatus: { not: 'SUGGESTED' }` let a
never-requested, auto-cancelled candidate (CANCELLED reachable directly
from SUGGESTED via `MatchingService.accept()`'s auto-cancel of every
pending candidate, not only ones that were actually REQUESTED) start a
chat. Since a Match row doesn't record which status it transitioned FROM,
there's no way to distinguish "requested then cancelled" from "never
requested, auto-cancelled" from the current row alone — fixed with the
safe, conservative rule: eligibility is now exactly
`{in: ['REQUESTED','CONFIRMED','DECLINED']}`, excluding CANCELLED/EXPIRED
entirely (a small, accepted UX narrowing: a legitimately-requested-then-
auto-cancelled pair can no longer chat either, in exchange for closing the
real hole). `chat.service.ts`, `chat.service.spec.ts`.

**C16 — ACCEPT, FIXED.** Same class of bug as C14: `TripsService.complete`
and admin's `cancelTrip` both read-then-wrote unconditionally — two
participants tapping "mark complete" near-simultaneously (same
pre-transaction terminal-status snapshot) could both fully apply their own
transaction, double-counting `totalTrips` and logging two
`trip_completed` events; `cancelTrip` had no terminal-status check at all
and could overwrite an already-COMPLETED trip back to CANCELLED. Fixed
both with the same conditional-`updateMany` pattern as C14. New tests for
both. `trips.service.ts`, `trips.service.spec.ts`,
`admin/rides/rides.controller.ts` (no existing test file for this
controller — see C23 below, not newly added here given its broader,
pre-existing zero-coverage state).

**C17 — ACCEPT, FIXED.** `RideOffersService.create` checked vehicle
existence/ownership but never `isActive` — a driver could still create a
new ACTIVE offer with a vehicle they'd deactivated. Fixed with an explicit
check. This controller/service had zero test coverage at all before — new
`ride-offers.service.spec.ts` (3 tests) covers the guard clauses
specifically (not the full raw-SQL insert path below them, a scope
decision, see C23). `ride-offers.service.ts`,
`ride-offers.service.spec.ts` (new).

**C18 — ACCEPT, FIXED.** Confirmed: `ChatService.sendMessage` and all
three of `MatchingService`'s notification calls ran `await
notifications.create(...)` directly after an already-committed domain
write (and, for chat, after the realtime event had already been emitted)
— a notification-write failure turned an already-successful send/accept/
request/decline into a client-visible error, exactly contradicting each
site's own "best-effort" comments. Fixed by isolating every one of these
four call sites in a try/catch (a new `notifyBestEffort` helper in
`MatchingService`, an inline try/catch in `ChatService`) that logs the
failure via `StructuredLogger` instead of rethrowing. New regression tests
confirm the outer operation still succeeds when the notification write
throws. `chat.service.ts`, `matching.service.ts`, both spec files.

**C20 — ACCEPT, FIXED.** Confirmed live: ran the actual webhook e2e tests
and read the emitted JSON log lines — `http.request` logged `statusCode:
200` for requests `GlobalExceptionFilter` itself answered with 403/400,
exactly matching Codex's evidence. Root cause: `LoggingInterceptor`/
`MetricsInterceptor` read `response.statusCode` inside an interceptor's
`tap({error})` callback, which fires before the exception filter has run
(Express's `response.statusCode` is still its 200 default at that point);
separately, a guard-rejected request (401/403) never reaches any
`APP_INTERCEPTOR` at all, since guards run first in Nest's pipeline —
guard rejections were structurally invisible to both the request log and
the HTTP metrics. Fixed by replacing both interceptors with one
`HttpObservabilityMiddleware` that hooks `res.on('finish')` (fires once,
after the response is truly sent, from ANY layer — guard, filter, or
handler) instead of reading `response.statusCode` synchronously. Verified
by re-running the exact webhook e2e scenario and reading the log
output again — now correctly shows 403/400. 6 new tests.
`common/http/http-observability.middleware.ts` (new, replaces
`logging.interceptor.ts` and `metrics.interceptor.ts`, both deleted),
`app.module.ts`.

**C21 — ACCEPT, FIXED.** Confirmed by reading the installed SDK and React
Native's own `NativeEventEmitter.js`: `react-native-razorpay` constructs a
`NativeEventEmitter` at module-LOAD time, and RN 0.76.5's constructor
throws `` `new NativeEventEmitter()` requires a non-null argument. `` on
iOS when the native module isn't linked — a throw that happened before
`openRazorpayCheckout`'s own try/catch even existed, under the previous
top-level `import`. Fixed by making the `require()` lazy, inside the try
block. Also widened `isNativeModuleMissing`'s detection regex, which
didn't actually match that exact message (it was written against what
`.open()` itself rejects with, not this module-load-time error) — verified
by reading the literal thrown string from RN's own source, not guessed.
New test simulates a throwing `require()` via `jest.isolateModules` +
`jest.doMock`. `apps/mobile/lib/razorpay.ts`, `razorpay.test.ts`.

**C24 — ACCEPT, FIXED.** Initially deferred as LOW pending a slow
`--detectOpenHandles` run — that run finished and gave an unambiguous
answer: every test `QueryClient` (`useChatRealtimeSync.test.tsx`,
`useNotificationsRealtimeSync.test.tsx`,
`useClearQueryCacheOnIdentityChange.test.ts`) was built with default
options, and TanStack Query schedules a garbage-collection `setTimeout`
per query the moment one is created (`Query.scheduleGc`, confirmed from
the stack trace) — with no test ever clearing/unmounting the client, those
GC timers stayed pending and kept the Jest process alive. Fixed by
constructing every test `QueryClient` with `defaultOptions: { queries: {
gcTime: 0 } }`, so garbage collection happens immediately instead of on a
deferred timer. Verified: reran the full mobile suite — the "Jest did not
exit" / "worker process failed to exit gracefully" warning is gone, same
36/36 passing.

### MEDIUM — accepted, deferred (not correctness/security bugs)

**C15 — ACCEPT finding, DEFER fix.** Verified the mismatch is real: the
four new GiST indexes are on the bare `geometry` columns, but
`MatchingService`'s `ST_DWithin` predicates cast to `::geography` first —
different indexed expression, so PostGIS likely can't use these indexes to
accelerate the actual query as data grows. This is a performance
concern, not a correctness bug (`ST_DWithin` still computes the right
answer regardless of index usage) — and Codex's own finding says so too
("a static finding, not a measured query plan"). The correct fix (an
expression index on `(column::geography)`, Prisma's schema DSL can't
express this — it would need a hand-written follow-up migration) can't be
verified against a real query plan in this environment (no live
PostgreSQL/PostGIS anywhere here — see Known Limitations). Writing and
committing unverifiable raw SQL for a performance-only concern isn't
appropriate; recorded here as the first thing to fix once a real
PostGIS instance is available, with the exact fix shape: `CREATE INDEX
... USING GIST ((originCoordinates::geography))` (and the equivalent for
the other three columns), via a new migration — leaving the baseline
migration itself untouched, per `AGENTS.md`'s migration rule.

**C19 — ACCEPT finding, PARTIALLY FIXED.** The "raw URLs including query
strings" half is fixed as a side effect of the C20 rewrite —
`HttpObservabilityMiddleware` now logs `req.originalUrl.split('?')[0]`
(path only), not the full URL with query string. The remaining half —
`redact()` matches on object KEYS, so a sensitive value embedded in
free-text (an exception `.message`, or a URL path segment) isn't caught —
is a real, narrower gap than Codex's framing suggests: `redact()` was
never documented or tested as a general secret-scrubber for arbitrary
free text, only for structured fields (confirmed by reading
`redact.spec.ts`'s actual test cases, all object-shaped). Closing it
properly needs content-pattern scrubbing of free text, which is
inherently harder to get right (false negatives from an incomplete
pattern list, false positives mangling legitimate error messages) and
risks a false sense of security if done hastily. Deferred rather than
rushed; the server-side log is not client-visible either way (the actual
security boundary `GlobalExceptionFilter` enforces), so the residual risk
is log/telemetry-access-scoped, not a client-facing leak.

**C22 — ACCEPT finding, DEFER (infrastructure, not code).** Confirmed:
`app.json` configures no Google Maps API key for either platform, and
`MapView.tsx` forces the Google provider on both. This is a deployment/
environment-configuration item (a real API key needs to be provisioned
and wired through `app.json`/EAS build secrets), not something to fix by
writing code in this pass — flagged clearly for whoever configures the
first real native build.

### C23 — test coverage claims

Codex's finding is accurate as of when it was written: `AuthService`,
`RealtimeGateway`, `AdminUsersController`, and `RideOffersService` all had
zero tests, and the scoped e2e harness legitimately bypasses global
guards by design. This cycle's fixes materially change that picture:

- `AuthService`: 0 → 10 tests (new file)
- `RealtimeGateway`: 0 → 11 tests (new file)
- `AdminUsersController`: 0 → 7 tests (new file)
- `RideOffersService`: 0 → 3 tests (new file, guard clauses only — see C17)
- `HttpObservabilityMiddleware`: 0 → 6 tests (new file)
- `PaymentsService`: 28 → 42 tests (concurrency/idempotency scenarios)
- `MatchingService`: 3 → 9 tests (concurrency scenarios)
- `ChatService`/`TripsService`: incremental additions for C08/C16/C18

Still genuinely open, not resolved by this cycle: no test exercises a
real, signed Supabase JWT/JWKS flow (unit tests mock `SupabaseStrategy`'s
dependencies, never a real token) or a RolesGuard/PermissionsGuard matrix
directly; no test drives a real `socket.io-client` against a real bound
`Socket.IO` server (RealtimeGateway's new tests call its methods directly
with fake Socket/Server objects, not a live connection); no live
PostgreSQL/PostGIS migration/concurrency test exists (everything above is
verified against stateful in-memory fakes, not a real database — genuinely
required before fully trusting the concurrency fixes under real
transaction isolation semantics); `apps/admin` has no test infrastructure
at all (unchanged from Phase 13's own documented, deliberate deferral).
CI still runs no migration/PostGIS or native-build job. These require
either live infrastructure this environment doesn't have, or a
disproportionate new-infrastructure investment (a real Socket.IO test
harness) beyond this remediation cycle's scope — not fixed here, listed
honestly rather than claimed closed.

# Required Fixes

Everything BLOCKER/HIGH is fixed (see evaluation above) — none outstanding.
Remaining, all MEDIUM/LOW and all deliberately deferred with reasoning:

1. **C15** — align the GiST indexes with the actual `::geography`-cast
   query predicate via a new migration, once a live PostgreSQL/PostGIS
   instance exists to verify the resulting query plan against.
2. **C19 (remainder)** — decide whether free-text exception-message
   content scrubbing is worth the false-positive/negative risk, or
   whether the current "server-side logs only, never client-visible" is
   an acceptable boundary for this product's threat model.
3. **C22** — provision and wire a real Google Maps API key when the first
   real native (EAS) build happens.
4. **C23 (remainder)** — real-JWT/JWKS auth tests, a live Socket.IO test
   harness, and live PostgreSQL/PostGIS concurrency tests all need
   infrastructure this environment doesn't have (see Known Limitations).

# Final Verification

All commands below were actually run in this session, after every fix
above, not before:

```
apps/api:     tsc --noEmit                        → clean
apps/api:     eslint "{src,test}/**/*.ts"          → clean
apps/api:     jest                                 → 194/194 PASS (was 132)
apps/api:     jest --config test/jest-e2e.json     → 16/16 PASS
apps/api:     nest build                           → clean

apps/mobile:  tsc --noEmit                         → clean
apps/mobile:  eslint .                             → clean
apps/mobile:  jest                                 → 36/36 PASS (was 29) —
              and, post-C24-fix, WITHOUT the "Jest did not exit" /
              "worker process failed to exit gracefully" warning that
              appeared in every mobile jest run through Phase 13 and
              earlier in this cycle.

apps/admin:   not re-touched this cycle — no changes made to apps/admin;
              Phase 13's report already covers its clean tsc/eslint/build.
packages/database: not re-touched this cycle — schema/migration unchanged
              by any C01-C24 fix (C15's fix, once done, will touch it).
```

Also independently confirmed live, not just asserted: re-ran the exact
webhook e2e scenario Codex used as evidence for C20 and read the actual
emitted JSON log lines — `statusCode` now correctly reads 403/400 instead
of 200, for the same requests, matching `GlobalExceptionFilter`'s own
logged outcome.

Net new/changed test counts this cycle: **+62 API tests** (194 vs. 132),
**+7 mobile tests** (36 vs. 29), 4 new API test files, 1 new mobile test
file, 2 old API interceptor files deleted (superseded by
`HttpObservabilityMiddleware`).

# Known Limitations

Real, standing limitations of this environment — not yet resolved by any
phase, not fabricated as tested:

- No live PostgreSQL/PostGIS instance. The migration baseline has never
  been applied to a real database (`prisma migrate deploy` unexercised);
  the matching engine's `ST_DWithin` queries and the new GiST indexes have
  never actually run against real geometry data.
- No live Redis instance. `/health/ready`'s Redis check, and
  `AuthService.isTokenRevoked`'s real revocation-list behavior, are
  covered by mocks only.
- No real Supabase project. JWT/JWKS verification is covered by unit
  tests against a fake `SupabaseStrategy` dependency chain, never a real
  signed token from a real Supabase Auth instance.
- No Razorpay test-mode account. Webhook signature verification is tested
  with a real HMAC computed locally against a fake secret — never a
  webhook actually delivered by Razorpay's servers.
- No EAS/dev-client build. `react-native-razorpay`'s actual native runtime
  has never executed — `lib/razorpay.ts` is tested with the native module
  entirely mocked, by design (this product's own constraint: never make a
  real Razorpay call from a test).
- No physical Android or iOS device — `expo export` produces a bundle;
  nothing has run it on-device.
- No FCM/APNs/Expo Push configured — push notifications don't exist in
  this product yet (in-app realtime only, via Socket.IO).
- `RealtimeGateway`'s actual Socket.IO connection/auth/room-join logic has
  no test at all (unit or integration) — client-side realtime hooks are
  tested against a fake socket object, but nothing drives a real
  `socket.io-client` against a real bound server in this repo's test
  suite.
- `apps/admin` has zero automated test coverage of any kind (deliberate
  Phase 13 deferral — no existing Next.js test infra, and the RBAC
  enforcement that matters is already covered server-side).

---

# Codex audit request (paste this to Codex)

The prompt below is what to send to Codex in VS Code for the **current**
review cycle (Phase 14A, Android APK config only). The Phase 13 request
this replaces is preserved in git history, not below, per this file's own
"current cycle only" policy.

> You are acting as an independent senior reviewer for the ShareRide
> repository, per the protocol in `AGENTS.md` and `docs/agent-handoff.md`.
> Read both files first, in full, before anything else — in particular
> read `# Phase 14A Changes` in this file for exactly what changed and
> why.
>
> **Scope this review narrowly.** This is Phase 14A only: Expo/EAS
> configuration for a first installable Android Preview APK. Do **not**
> re-run or re-expand this into the full 30-part production-readiness
> audit that already exists (see the audit output referenced in this
> cycle's conversation, or re-derive it yourself from `# Known
> Limitations` below plus your own prior findings in `# Codex Review` and
> `# Claude Fix Evaluation` — all still open, not this task's concern).
> Do not re-review payments, matching, chat, admin, database, or push
> notifications — none of those files changed this cycle.
>
> Review only:
>
> - `apps/mobile/app.config.ts` (new, replaces `app.json`) — is the
>   conditional `usesCleartextTraffic` wiring via `SHARERIDE_ALLOW_CLEARTEXT`
>   actually safe? Confirm it defaults to `false`/unset for any build that
>   doesn't explicitly set that env var (i.e., a production build is never
>   accidentally permissive). Confirm the established `in.shareride.app`
>   package/bundle identifiers were not changed.
> - `apps/mobile/eas.json` (new) — are the `development`/`preview`/
>   `production` profiles sane? Is anything in a profile's `env` block a
>   real secret rather than a placeholder or a `EXPO_PUBLIC_`-safe public
>   value? (It should not be — `RAZORPAY_KEY_SECRET`,
>   `SUPABASE_SERVICE_ROLE_KEY`, etc. must never appear here.)
> - `apps/mobile/package.json` — the three new dependencies
>   (`expo-build-properties`, `expo-constants`, `expo-linking`) and their
>   pinned versions against the installed `expo@~52.0.0`.
> - Environment-variable exposure: confirm nothing server-only
>   (`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
>   `SUPABASE_SERVICE_ROLE_KEY`, `FCM_PRIVATE_KEY`, database credentials)
>   can reach an Android build through any of the files above or through
>   `apps/mobile/lib/**`.
> - Native dependencies: `react-native-razorpay` (`apps/mobile/lib/razorpay.ts`)
>   — does it still behave safely (no startup crash, graceful `'unavailable'`
>   outcome) in a real native build context, not just under Jest's mock?
>   `react-native-maps` — any config gap beyond the already-documented
>   missing Google Maps API key (not this cycle's problem, just confirm
>   nothing else is broken).
> - Permissions: confirm no permission was added beyond what
>   `expo-build-properties`/autolinking implies, and that this matches the
>   actual product (no location/notification permission — none of the app
>   code uses either).
> - Monorepo/EAS compatibility: does anything about the pnpm workspace
>   structure (`pnpm-workspace.yaml`, `pnpm-lock.yaml` at repo root,
>   `workspace:*` dependencies) look likely to break EAS Build's install
>   step? (No live EAS build has run yet — this environment has no logged-
>   in Expo account — so this is a static-inspection judgment call, not
>   something you can verify by actually building.)
>
> For every finding, use the severity scale from `AGENTS.md`
> (BLOCKER/HIGH/MEDIUM/LOW/INFO) and write it into `docs/agent-handoff.md`
> under `# Codex Review`, with: severity, file, the relevant code
> location, the problem, why it matters, and a recommended correction. If
> a section is genuinely solid, say `No blocking findings.` for it. Only
> report issues you actually verified by reading the code, not
> suspicions.
