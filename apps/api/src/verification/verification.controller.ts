import { Controller, Get, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../auth/types/authenticated-user'
import { VerificationService } from './verification.service'

@ApiTags('verification')
@ApiBearerAuth()
@Controller('verification')
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Get('me')
  getOwn(@CurrentUser() user: AuthenticatedUser) {
    return this.verification.getOwn(user.id)
  }

  @Post('driver/submit')
  submitDriverVerification(@CurrentUser() user: AuthenticatedUser) {
    return this.verification.submitDriverVerification(user.id)
  }
}
