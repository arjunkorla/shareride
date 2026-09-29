import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { createEmergencyContactSchema, type CreateEmergencyContactInput } from '@shareride/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../auth/types/authenticated-user'
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe'
import { EmergencyContactsService } from './emergency-contacts.service'

@ApiTags('safety')
@ApiBearerAuth()
@Controller('emergency-contacts')
export class EmergencyContactsController {
  constructor(private readonly contacts: EmergencyContactsService) {}

  @Post()
  create(@Body(new ZodValidationPipe(createEmergencyContactSchema)) body: CreateEmergencyContactInput, @CurrentUser() user: AuthenticatedUser) {
    return this.contacts.create(user.id, body)
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.contacts.list(user.id)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.contacts.remove(id, user.id)
  }
}
