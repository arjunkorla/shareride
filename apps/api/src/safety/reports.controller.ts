import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { createReportSchema, type CreateReportInput } from '@shareride/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../auth/types/authenticated-user'
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe'
import { ReportsService } from './reports.service'

@ApiTags('safety')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  create(@Body(new ZodValidationPipe(createReportSchema)) body: CreateReportInput, @CurrentUser() user: AuthenticatedUser) {
    return this.reports.create(user.id, body)
  }

  @Get()
  listOwn(@CurrentUser() user: AuthenticatedUser) {
    return this.reports.listOwn(user.id)
  }
}
