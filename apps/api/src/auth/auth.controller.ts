import { Controller, Get, Post, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { ExtractJwt } from 'passport-jwt'
import { AuthService } from './auth.service'
import { CurrentUser } from './decorators/current-user.decorator'
import type { AuthenticatedUser } from './types/authenticated-user'

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Authentication itself (OTP send/verify, email/password, OAuth, refresh)
  // happens client-side against Supabase Auth directly — the mobile and
  // admin apps hold the Supabase session, this API only ever verifies the
  // resulting access token. This endpoint exists to (a) prove that
  // verification works end-to-end and (b) let a client confirm which
  // ShareRide user/roles a token resolves to.
  @Get('me')
  @ApiOkResponse({ description: 'The ShareRide user resolved from the bearer token.' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return user
  }

  // Supabase JWTs are stateless and remain valid until they expire, so
  // "logout" here means: deny this specific access token for its
  // remaining lifetime. Clients must still call supabase.auth.signOut()
  // to clear the local session/refresh token.
  @Post('logout')
  @ApiOkResponse({ description: 'Revokes the current access token for its remaining lifetime.' })
  async logout(@Req() req: Request) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req)
    if (token) {
      const [, payload] = token.split('.')
      const exp = payload ? (JSON.parse(Buffer.from(payload, 'base64').toString('utf8')).exp as number) : undefined
      await this.authService.revokeToken(token, exp ?? Math.floor(Date.now() / 1000) + 3600)
    }
    return { success: true }
  }
}
