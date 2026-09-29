/**
 * @jest-environment node
 */
// Guards metro.config.js's single-React pin. Before it, packages that don't
// declare `react` (expo-router, expo-modules-core, expo-constants,
// @expo/metro-runtime) resolved it by walking up to the repo root's React 19
// (the legacy prototype's dependency) instead of apps/mobile's React 18.3.1.
// Resolution here is delegated through the real config's resolveRequest to a
// stand-in for Metro's resolver that does hierarchical node_modules lookup
// from the given origin — the same lookup Metro performs.
//
// expo/metro-config itself is stubbed: under Jest's resolver it can't load
// @expo/metro-config's internal `metro/src/...` imports (plain Node can).
// Expo's real default config has no resolveRequest of its own in SDK 52, so
// the stub mirrors that; the real integration is verified by the production
// Android export (see docs/agent-handoff.md Build 9).
jest.mock('expo/metro-config', () => ({
  getDefaultConfig: () => ({ resolver: { resolveRequest: null } }),
}))

import path from 'path'

type Resolution = { type: 'sourceFile'; filePath: string }
type Context = { originModulePath: string; resolveRequest: (ctx: Context, name: string, platform: string | null) => Resolution }
type MetroConfig = { resolver: { resolveRequest: (ctx: Context, name: string, platform: string | null) => Resolution } }

// eslint-disable-next-line @typescript-eslint/no-require-imports -- metro.config.js is CommonJS
const config = require('../metro.config') as MetroConfig

const mobileRoot = path.resolve(__dirname, '..')
const mobileReactPkg = require.resolve('react/package.json', { paths: [mobileRoot] })
const mobileReactDir = path.dirname(mobileReactPkg)

function nodeLookup(ctx: Context, name: string): Resolution {
  return { type: 'sourceFile', filePath: require.resolve(name, { paths: [path.dirname(ctx.originModulePath)] }) }
}

function resolveFrom(pkg: string, moduleName: string): string {
  const originModulePath = require.resolve(`${pkg}/package.json`, { paths: [mobileRoot] })
  const context: Context = { originModulePath, resolveRequest: nodeLookup }
  return config.resolver.resolveRequest(context, moduleName, 'android').filePath
}

function versionAt(file: string): string {
  let dir = path.dirname(file)
  while (path.basename(dir) !== 'react') dir = path.dirname(dir)
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- reading the resolved package's own version
  return (require(path.join(dir, 'package.json')) as { version: string }).version
}

describe('metro.config.js single-React pin', () => {
  it('apps/mobile itself uses React 18.3.1', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- reading the resolved package's own version
    expect((require(mobileReactPkg) as { version: string }).version).toBe('18.3.1')
  })

  it.each(['expo-router', 'expo-modules-core', 'expo-constants', '@expo/metro-runtime', 'react-native', 'expo'])(
    '%s resolves react, react/jsx-runtime and react/jsx-dev-runtime to apps/mobile React 18.3.1',
    (pkg) => {
      for (const spec of ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime']) {
        const file = resolveFrom(pkg, spec)
        expect(file.startsWith(mobileReactDir)).toBe(true)
        expect(versionAt(file)).toBe('18.3.1')
      }
    },
  )

  it('leaves non-react specifiers on normal resolution (react-native is not redirected)', () => {
    const origin = require.resolve('expo-router/package.json', { paths: [mobileRoot] })
    const seen: string[] = []
    const context: Context = {
      originModulePath: origin,
      resolveRequest: (ctx, name) => {
        seen.push(ctx.originModulePath)
        return nodeLookup(ctx, name)
      },
    }
    config.resolver.resolveRequest(context, 'react-native', 'android')
    expect(seen).toEqual([origin])
  })
})
