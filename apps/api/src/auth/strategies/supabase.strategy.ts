import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import type { Request } from 'express'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { passportJwtSecret } from 'jwks-rsa'
import { AuthService } from '../auth.service'

// Verifies Supabase Auth access tokens against the project's public JWKS
// (Supabase's current, non-legacy signing setup — no shared secret stored
// in this app). See https://supabase.com/docs/guides/auth/jwts.
interface SupabaseJwtPayload {
  sub: string
  email?: string
  phone?: string
  user_metadata?: { full_name?: string }
  exp: number
}

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private readonly authService: AuthService) {
    const supabaseUrl = config.get<string>('SUPABASE_URL')
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is required to verify Supabase-issued access tokens')
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256', 'ES256'],
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      }),
      passReqToCallback: true,
    })
  }

  async validate(req: Request, payload: SupabaseJwtPayload) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req)
    if (token && (await this.authService.isTokenRevoked(token))) {
      throw new UnauthorizedException('Session has been signed out')
    }

    return this.authService.syncUserFromClaims({
      id: payload.sub,
      email: payload.email,
      phone: payload.phone,
      fullName: payload.user_metadata?.full_name,
    })
  }
}
