import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import jwt from 'jsonwebtoken'
import type { Server, Socket } from 'socket.io'
import { AuthService } from '../auth/auth.service'
import { SupabaseJwtVerifier } from '../auth/supabase-jwt-verifier'
import { StructuredLogger } from '../common/logger/structured-logger.service'
import { MetricsService } from '../common/metrics/metrics.service'

// How often already-connected sockets are re-checked against token
// revocation/expiry and account status. Token verification and the
// revocation/account-status checks only ever run at connect time
// otherwise, so without this sweep a client that keeps its socket open
// (rather than reconnecting) would go on receiving private events
// indefinitely after logout, token expiry, or an admin suspending the
// account — see docs/agent-handoff.md finding C06. A periodic sweep
// (bounded worst-case exposure window) rather than a push-based
// invalidation channel — proportionate to this gateway's size, not a
// pub/sub redesign.
const REVALIDATION_INTERVAL_MS = 60_000

// Realtime push for chat (Phase 9) and match notifications (wired from
// MatchingService) — the WebSocket gateway the phase brief calls for.
// Every client joins a room named after their own user id on connect
// (`user:<id>`); server-side code pushes events with emitToUser rather
// than clients subscribing to specific conversations/topics, which keeps
// the client integration to "connect once" instead of per-screen
// subscribe/unsubscribe bookkeeping.
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/realtime' })
@Injectable()
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
  @WebSocketServer() private server!: Server
  private readonly logger = new Logger(RealtimeGateway.name)
  private verifier: SupabaseJwtVerifier | null = null
  private revalidationTimer: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
    private readonly structuredLogger: StructuredLogger,
    private readonly metrics: MetricsService,
  ) {
    this.structuredLogger.setContext(RealtimeGateway.name)
  }

  onModuleInit() {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL')
    if (supabaseUrl) {
      this.verifier = new SupabaseJwtVerifier(supabaseUrl)
    } else {
      this.logger.warn('SUPABASE_URL not set — realtime gateway will reject all connections')
    }
    this.revalidationTimer = setInterval(() => {
      void this.revalidateConnections()
    }, REVALIDATION_INTERVAL_MS)
    // Never hold the process open just for this sweep (tests, CLI tooling).
    this.revalidationTimer.unref?.()
  }

  onModuleDestroy() {
    if (this.revalidationTimer) clearInterval(this.revalidationTimer)
  }

  async handleConnection(client: Socket) {
    try {
      const token = extractToken(client)
      if (!token || !this.verifier) throw new Error('Missing or unverifiable token')
      if (await this.authService.isTokenRevoked(token)) throw new Error('Session has been signed out')

      const payload = await this.verifier.verify(token)
      if (!(await this.authService.isAccountActive(payload.sub))) throw new Error('Account is not active')

      client.data.userId = payload.sub
      client.data.token = token
      await client.join(userRoom(payload.sub))
      this.metrics.socketConnectionsActive.inc()
      // userId only — never the token itself, and no per-message logging
      // (that would be noisy at scale; this fires once per connection).
      this.structuredLogger.logEvent('socket.connection.accepted', { userId: payload.sub })
    } catch (error) {
      // Reason only, never the token — a bad/expired/replayed JWT should
      // never end up in a log line.
      this.structuredLogger.logEvent('socket.connection.rejected', { reason: (error as Error).message })
      client.disconnect(true)
    }
  }

  handleDisconnect(client: Socket) {
    // Room membership is per-socket and socket.io tears it down
    // automatically — this only needs to keep the gauge and the log honest.
    if (client.data.userId) {
      this.metrics.socketConnectionsActive.dec()
      this.structuredLogger.logEvent('socket.connection.closed', { userId: client.data.userId })
    }
  }

  // Re-checks every currently-connected socket's token revocation and
  // account status (token expiry is enforced by socket.io itself refusing
  // to re-run this — instead we re-derive it from the JWT below, since a
  // long-lived socket never re-presents its token after connect). Runs on
  // REVALIDATION_INTERVAL_MS, not per-message — see that constant's comment.
  private async revalidateConnections(): Promise<void> {
    const sockets = await this.server?.fetchSockets().catch(() => [])
    if (!sockets?.length) return

    await Promise.all(
      sockets.map(async (client) => {
        const token = client.data.token as string | undefined
        const userId = client.data.userId as string | undefined
        if (!token || !userId) return

        const [revoked, active, expired] = await Promise.all([
          this.authService.isTokenRevoked(token),
          this.authService.isAccountActive(userId),
          this.isTokenExpired(token),
        ])
        if (revoked || !active || expired) {
          this.structuredLogger.logEvent('socket.connection.revalidation_failed', {
            userId,
            reason: expired ? 'expired' : revoked ? 'revoked' : 'inactive_account',
          })
          client.disconnect(true)
        }
      }),
    )
  }

  // No signature re-verification needed here — the token was already
  // verified once at connect (SupabaseJwtVerifier.verify), this only reads
  // its already-trusted `exp` claim back out.
  private isTokenExpired(token: string): boolean {
    const decoded = jwt.decode(token)
    if (!decoded || typeof decoded === 'string' || typeof decoded.exp !== 'number') return false
    return Date.now() / 1000 >= decoded.exp
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(userRoom(userId)).emit(event, payload)
  }
}

function userRoom(userId: string): string {
  return `user:${userId}`
}

function extractToken(client: Socket): string | undefined {
  const authToken = client.handshake.auth?.token
  if (typeof authToken === 'string' && authToken.length > 0) return authToken

  const header = client.handshake.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length)

  return undefined
}
