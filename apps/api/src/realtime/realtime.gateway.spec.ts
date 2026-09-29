import { RealtimeGateway } from './realtime.gateway'
import type { AuthService } from '../auth/auth.service'
import type { ConfigService } from '@nestjs/config'
import type { StructuredLogger } from '../common/logger/structured-logger.service'
import type { MetricsService } from '../common/metrics/metrics.service'

// No live Socket.IO server here — Socket/Server are hand-built fakes, same
// pattern as every other *.service.spec.ts in this repo. This is the
// first test for this gateway (closing part of docs/agent-handoff.md's
// C23 finding: it previously had zero coverage of any kind) and directly
// exercises the connect-time account-status check and the periodic
// revalidation sweep added for C06 (a socket must not outlive a revoked
// token, an expired token, or a since-suspended account).
describe('RealtimeGateway', () => {
  const USER_ID = 'user-1'
  const TOKEN = 'token-abc'

  function makeConfig(supabaseUrl: string | undefined = 'https://project.supabase.co'): ConfigService {
    return { get: jest.fn().mockReturnValue(supabaseUrl) } as unknown as ConfigService
  }

  function makeAuth(overrides: { revoked?: boolean; active?: boolean } = {}): AuthService {
    return {
      isTokenRevoked: jest.fn().mockResolvedValue(overrides.revoked ?? false),
      isAccountActive: jest.fn().mockResolvedValue(overrides.active ?? true),
    } as unknown as AuthService
  }

  function makeLogger(): StructuredLogger {
    return { setContext: jest.fn(), logEvent: jest.fn() } as unknown as StructuredLogger
  }

  function makeMetrics(): MetricsService {
    return { socketConnectionsActive: { inc: jest.fn(), dec: jest.fn() } } as unknown as MetricsService
  }

  function makeSocket(overrides: { authToken?: string; headerToken?: string } = {}) {
    return {
      handshake: {
        auth: overrides.authToken !== undefined ? { token: overrides.authToken } : {},
        headers: overrides.headerToken ? { authorization: `Bearer ${overrides.headerToken}` } : {},
      },
      data: {} as Record<string, unknown>,
      join: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
    }
  }

  function makeGatewayWithVerifier(auth: AuthService, verify: jest.Mock) {
    const gateway = new RealtimeGateway(makeConfig(), auth, makeLogger(), makeMetrics())
    // `verifier`/`server` are populated by onModuleInit/Nest's WebSocketServer
    // decorator at runtime — injected directly here, same as every other
    // hand-built-fake dependency in this codebase.
    ;(gateway as unknown as { verifier: { verify: jest.Mock } }).verifier = { verify }
    return gateway
  }

  describe('handleConnection', () => {
    it('rejects a connection with no token at all', async () => {
      const auth = makeAuth()
      const gateway = makeGatewayWithVerifier(auth, jest.fn())
      const client = makeSocket()

      await gateway.handleConnection(client as never)

      expect(client.disconnect).toHaveBeenCalledWith(true)
      expect(client.join).not.toHaveBeenCalled()
    })

    it('rejects a connection using a revoked token', async () => {
      const auth = makeAuth({ revoked: true })
      const verify = jest.fn().mockResolvedValue({ sub: USER_ID })
      const gateway = makeGatewayWithVerifier(auth, verify)
      const client = makeSocket({ authToken: TOKEN })

      await gateway.handleConnection(client as never)

      expect(client.disconnect).toHaveBeenCalledWith(true)
      expect(verify).not.toHaveBeenCalled()
    })

    it('rejects a connection for a suspended/blocked account, even with a valid token', async () => {
      const auth = makeAuth({ active: false })
      const verify = jest.fn().mockResolvedValue({ sub: USER_ID })
      const gateway = makeGatewayWithVerifier(auth, verify)
      const client = makeSocket({ authToken: TOKEN })

      await gateway.handleConnection(client as never)

      expect(client.disconnect).toHaveBeenCalledWith(true)
      expect(client.join).not.toHaveBeenCalled()
    })

    it('accepts a valid token for an active account, joins the per-user room, and increments the gauge', async () => {
      const auth = makeAuth()
      const verify = jest.fn().mockResolvedValue({ sub: USER_ID })
      const metrics = makeMetrics()
      const gateway = new RealtimeGateway(makeConfig(), auth, makeLogger(), metrics)
      ;(gateway as unknown as { verifier: { verify: jest.Mock } }).verifier = { verify }
      const client = makeSocket({ authToken: TOKEN })

      await gateway.handleConnection(client as never)

      expect(client.disconnect).not.toHaveBeenCalled()
      expect(client.join).toHaveBeenCalledWith(`user:${USER_ID}`)
      expect(metrics.socketConnectionsActive.inc).toHaveBeenCalled()
      expect(client.data.userId).toBe(USER_ID)
      expect(client.data.token).toBe(TOKEN)
    })

    it('reads the token from the Authorization header when handshake.auth carries none', async () => {
      const auth = makeAuth()
      const verify = jest.fn().mockResolvedValue({ sub: USER_ID })
      const gateway = makeGatewayWithVerifier(auth, verify)
      const client = makeSocket({ headerToken: TOKEN })

      await gateway.handleConnection(client as never)

      expect(verify).toHaveBeenCalledWith(TOKEN)
      expect(client.disconnect).not.toHaveBeenCalled()
    })
  })

  describe('handleDisconnect', () => {
    it('decrements the gauge only when the socket had authenticated', () => {
      const metrics = makeMetrics()
      const gateway = new RealtimeGateway(makeConfig(), makeAuth(), makeLogger(), metrics)
      gateway.handleDisconnect({ data: { userId: USER_ID } } as never)
      expect(metrics.socketConnectionsActive.dec).toHaveBeenCalledTimes(1)
    })

    it('does nothing for a socket that never authenticated', () => {
      const metrics = makeMetrics()
      const gateway = new RealtimeGateway(makeConfig(), makeAuth(), makeLogger(), metrics)
      gateway.handleDisconnect({ data: {} } as never)
      expect(metrics.socketConnectionsActive.dec).not.toHaveBeenCalled()
    })
  })

  describe('revalidateConnections (periodic session sweep)', () => {
    function makeConnectedClient(userId: string, token: string) {
      return { data: { userId, token }, disconnect: jest.fn() }
    }

    async function runRevalidation(gateway: RealtimeGateway, sockets: ReturnType<typeof makeConnectedClient>[]) {
      const server = { fetchSockets: jest.fn().mockResolvedValue(sockets) }
      ;(gateway as unknown as { server: unknown }).server = server
      await (gateway as unknown as { revalidateConnections: () => Promise<void> }).revalidateConnections()
    }

    it('disconnects a socket whose token has since been revoked', async () => {
      const auth = makeAuth({ revoked: true })
      const gateway = new RealtimeGateway(makeConfig(), auth, makeLogger(), makeMetrics())
      const client = makeConnectedClient(USER_ID, TOKEN)

      await runRevalidation(gateway, [client])

      expect(client.disconnect).toHaveBeenCalledWith(true)
    })

    it('disconnects a socket whose account has since been suspended', async () => {
      const auth = makeAuth({ active: false })
      const gateway = new RealtimeGateway(makeConfig(), auth, makeLogger(), makeMetrics())
      const client = makeConnectedClient(USER_ID, TOKEN)

      await runRevalidation(gateway, [client])

      expect(client.disconnect).toHaveBeenCalledWith(true)
    })

    it('leaves a still-valid, still-active socket connected', async () => {
      const auth = makeAuth()
      const gateway = new RealtimeGateway(makeConfig(), auth, makeLogger(), makeMetrics())
      const client = makeConnectedClient(USER_ID, TOKEN)

      await runRevalidation(gateway, [client])

      expect(client.disconnect).not.toHaveBeenCalled()
    })
  })

  describe('emitToUser', () => {
    it('emits only to the target user\'s own room', () => {
      const emit = jest.fn()
      const to = jest.fn().mockReturnValue({ emit })
      const gateway = new RealtimeGateway(makeConfig(), makeAuth(), makeLogger(), makeMetrics())
      ;(gateway as unknown as { server: unknown }).server = { to }

      gateway.emitToUser(USER_ID, 'notification:new', { id: 'n1' })

      expect(to).toHaveBeenCalledWith(`user:${USER_ID}`)
      expect(emit).toHaveBeenCalledWith('notification:new', { id: 'n1' })
    })
  })
})
