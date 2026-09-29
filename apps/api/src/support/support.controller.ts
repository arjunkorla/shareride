import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { createSupportTicketSchema, type CreateSupportTicketInput } from '@shareride/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../auth/types/authenticated-user'
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe'
import { SupportService } from './support.service'

@ApiTags('support')
@ApiBearerAuth()
@Controller('support/tickets')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post()
  create(@Body(new ZodValidationPipe(createSupportTicketSchema)) body: CreateSupportTicketInput, @CurrentUser() user: AuthenticatedUser) {
    return this.support.create(user.id, body)
  }

  @Get()
  listOwn(@CurrentUser() user: AuthenticatedUser) {
    return this.support.listOwn(user.id)
  }

  @Get(':id')
  getOwn(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.support.getOwn(id, user.id)
  }
}
