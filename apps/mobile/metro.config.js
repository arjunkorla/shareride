// Learn more: https://docs.expo.dev/guides/customizing-metro/
const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Single-React pin (Build 9 — see docs/agent-handoff.md "two React copies").
//
// The repo ROOT package.json (legacy Figma prototype, src/) depends on
// react@^19, so shareride/node_modules/react is React 19. Several packages on
// the mobile startup path — expo-router, expo-modules-core, expo-constants,
// @expo/metro-runtime — don't declare `react` themselves, so under pnpm their
// require('react') finds no link in their own virtual-store folder and
// walks up to the repo root, getting React 19 while react-native's renderer
// uses this app's React 18.3.1. React 18 rejects React 19 elements
// ("Objects are not valid as a React child").
//
// Fix, deliberately narrow: ONLY the exact specifier `react` and its
// subpaths (`react/jsx-runtime`, `react/jsx-dev-runtime`, `react/package.json`)
// are resolved as if imported from this app, which yields apps/mobile's own
// react dependency. Everything else — including `react-native`, `react-dom`
// and any `react-*` package — keeps Metro's normal resolution. Resolution is
// still done by Metro's own resolver (context.resolveRequest), only the
// origin changes, so platform extensions/symlinks behave exactly as before.
// jest.config.js mirrors this with an equivalent moduleNameMapper.
const MOBILE_ORIGIN = path.join(__dirname, 'package.json')

function isReactSpecifier(moduleName) {
  return moduleName === 'react' || moduleName.startsWith('react/')
}

const upstreamResolveRequest = config.resolver.resolveRequest

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = upstreamResolveRequest ?? context.resolveRequest
  if (isReactSpecifier(moduleName)) {
    return resolve({ ...context, originModulePath: MOBILE_ORIGIN }, moduleName, platform)
  }
  return resolve(context, moduleName, platform)
}

module.exports = config
