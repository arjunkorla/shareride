import { Controller, Get, HttpStatus, Res } from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import type { Response } from 'express'
import { Public } from '../auth/decorators/public.decorator'
import { HealthService } from './health.service'

// Liveness ("is the process running at all?") vs readiness ("can this
// instance actually serve traffic?") are deliberately separate: a
// container orchestrator restarts a pod that fails liveness, but should
// only pull a pod OUT of a load balancer's rotation (not restart it) when
// it fails readiness — restarting a healthy process just because Postgres
// blipped would make an outage worse, not better. Responses never include
// connection strings, hostnames, or exception details — just per-
// dependency ok/error.
@ApiExcludeController()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  // Kept for backward compatibility with anything already polling the
  // original flat GET /health from earlier phases.
  @Public()
  @Get()
  check() {
    return { status: 'ok', service: 'shareride-api', timestamp: new Date().toISOString() }
  }

  @Public()
  @Get('live')
  live() {
    return { status: 'ok' }
  }

  // 503 (not 200) when a required dependency is down — a load balancer's
  // health check needs the status CODE to act on, not just a JSON body it
  // may not parse.
  @Public()
  @Get('ready')
  async ready(@Res({ passthrough: true }) res: Response) {
    const result = await this.health.checkReadiness()
    res.status(result.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
    return result
  }
}
