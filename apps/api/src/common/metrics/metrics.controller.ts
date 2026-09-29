import { Controller, Get, Header } from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import { Public } from '../../auth/decorators/public.decorator'
import { MetricsService } from './metrics.service'

// @Public() because a Prometheus scraper has no ShareRide user session to
// present — this is standard for metrics endpoints, but it means the
// deployment is responsible for not exposing this route on the public
// internet (firewall/network-policy it to the Prometheus scraper only,
// same as most production Prometheus integrations); nothing at the
// application layer restricts who can call it.
@ApiExcludeController()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Public()
  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async get(): Promise<string> {
    return this.metrics.toPrometheusText()
  }
}
