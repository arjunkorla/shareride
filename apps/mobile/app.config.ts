import type { ExpoConfig } from 'expo/config'

// Static app.json can't branch on the build profile, and the one place we
// need to (Android cleartext HTTP — see below) must NOT apply to a
// production build. Converted from app.json to app.config.ts for that one
// reason; every other field here is unchanged from the original app.json.

// Preview/development EAS builds set SHARERIDE_ALLOW_CLEARTEXT=true (see
// eas.json) so a physical device can reach a plain-HTTP dev/LAN API
// (Android 9+ blocks cleartext traffic by default). Production must never
// set this — it stays unset/false there, so this only ever loosens
// networking for the internal test builds this task produces, never for a
// store build.
const allowCleartext = process.env.SHARERIDE_ALLOW_CLEARTEXT === 'true'

// Set once by `eas init --account arjunkorla` (Phase 14A), which created
// https://expo.dev/accounts/arjunkorla/projects/shareride. Dynamic config
// (app.config.ts) can't be auto-written by that command, so this is wired
// in by hand — overridable via env var only if the project ever needs to
// move to a different EAS account/project.
const easProjectId = process.env.EAS_PROJECT_ID ?? 'a66fbd0f-ed2b-4bc1-8a2e-6e32b9e17980'

const config: ExpoConfig = {
  name: 'ShareRide',
  slug: 'shareride',
  scheme: 'shareride',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  plugins: [
    'expo-router',
    'expo-asset',
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: allowCleartext,
          // expo-modules-core's Kotlin compile step failed in the actual
          // EAS build log with: "This version (1.5.15) of the Compose
          // Compiler requires Kotlin version 1.9.25 but you appear to be
          // using Kotlin version 1.9.24" — a known Expo SDK 52 +
          // newArchEnabled toolchain mismatch, not a project dependency
          // problem. Pinning the Android Kotlin toolchain version (not
          // any RN/Expo package version, which stay exactly as pinned in
          // AGENTS.md) via the officially documented expo-build-properties
          // option.
          kotlinVersion: '1.9.25',
        },
      },
    ],
  ],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'in.shareride.app',
  },
  android: {
    package: 'in.shareride.app',
    versionCode: 1,
  },
  extra: {
    router: {
      origin: false,
    },
    ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
  },
}

export default config
