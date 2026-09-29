const path = require('path')

// Same single-React pin as metro.config.js (see its comment): apps/mobile's
// own react@18.3.1, never the repo root's react@19.
const reactDir = path.dirname(require.resolve('react/package.json', { paths: [__dirname] }))

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  // jest-expo/react-native's own default transformIgnorePatterns
  // (`node_modules/(?!react-native|@react-native.../)`) assumes a flat
  // node_modules layout. Under pnpm every package actually lives at
  // node_modules/.pnpm/<pkg>@<version>_<hash>/node_modules/<pkg>/..., so
  // the FIRST "node_modules/" segment (immediately followed by ".pnpm/")
  // already satisfies that pattern's negative lookahead and the file gets
  // wrongly skipped — react-native's own untranspiled Flow source
  // (@react-native/js-polyfills, etc.) then fails to parse. Transforming
  // all of node_modules sidesteps the incompatibility; the cost is a
  // slower first run, cached by Jest afterward.
  transformIgnorePatterns: [],
  // Native module with no jest mock of its own (see lib/razorpay.ts's
  // comment — it only exists via a custom EAS/dev-client build, never in
  // this or any CI environment) — every test that touches lib/razorpay.ts
  // mocks it explicitly with jest.mock(); this stub only exists so any
  // OTHER file that merely imports lib/razorpay.ts transitively doesn't
  // crash trying to resolve the native module at require() time.
  moduleNameMapper: {
    '^react-native-razorpay$': '<rootDir>/test/__mocks__/react-native-razorpay.ts',
    // Exact `react` and `react/*` only — mirrors metro.config.js's resolveRequest.
    '^react$': path.join(reactDir, 'index.js'),
    '^react/(.*)$': path.join(reactDir, '$1'),
  },
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
}
