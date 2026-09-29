import { JwksClient } from 'jwks-rsa'
import jwt, { type JwtPayload } from 'jsonwebtoken'

// The WebSocket gateway (apps/api/src/realtime) can't use SupabaseStrategy
// directly — Nest's passport guards only wrap HTTP request handlers, not
// gateway connection handshakes — so this reimplements the same JWKS
// verification (same issuer/audience/algorithms as
// auth/strategies/supabase.strategy.ts) via jsonwebtoken + jwks-rsa's
// lower-level client instead of the passport-jwt adapter.
export interface SupabaseJwtPayload extends JwtPayload {
  sub: string
  email?: string
  phone?: string
  user_metadata?: { full_name?: string }
}

export class SupabaseJwtVerifier {
  private readonly client: JwksClient
  private readonly issuer: string

  constructor(supabaseUrl: string) {
    this.issuer = `${supabaseUrl}/auth/v1`
    this.client = new JwksClient({
      jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
    })
  }

  async verify(token: string): Promise<SupabaseJwtPayload> {
    const decoded = jwt.decode(token, { complete: true })
    if (!decoded || typeof decoded.payload === 'string' || !decoded.header.kid) {
      throw new Error('Malformed token')
    }
    const key = await this.client.getSigningKey(decoded.header.kid)
    return jwt.verify(token, key.getPublicKey(), {
      algorithms: ['RS256', 'ES256'],
      issuer: this.issuer,
      audience: 'authenticated',
    }) as SupabaseJwtPayload
  }
}
