import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { createVehicleSchema, updateVehicleSchema, type CreateVehicleInput, type UpdateVehicleInput } from '@shareride/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../auth/types/authenticated-user'
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe'
import { VehiclesService } from './vehicles.service'

// Every route is the calling driver's own vehicles only. Admin
// verification review lives in admin/vehicles (Phase 10) — photo/document
// upload stays unimplemented, no object storage configured here.
@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Post()
  create(@Body(new ZodValidationPipe(createVehicleSchema)) body: CreateVehicleInput, @CurrentUser() user: AuthenticatedUser) {
    return this.vehicles.create(user.id, body)
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.vehicles.list(user.id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateVehicleSchema)) body: UpdateVehicleInput, @CurrentUser() user: AuthenticatedUser) {
    return this.vehicles.update(id, user.id, body)
  }

  @Post(':id/deactivate')
  deactivate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.vehicles.deactivate(id, user.id)
  }
}
