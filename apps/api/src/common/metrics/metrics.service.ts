import { Injectable } from '@nestjs/common'
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client'

// prom-client, not the newer @prometheus-io/client — that package is
// still pre-1.0 (0.16.x) and not yet API-stable; prom-client carries a
// "deprecated in favor of" notice but remains the mature, widely-deployed
// choice, which matters more here than being on the nominal successor.
// Worth revisiting once @prometheus-io/client reaches 1.0.
//
// A private Registry (not the global default one) so tests can construct
// a fresh MetricsService per test without state leaking between them.
// Deliberately no user-id/tripId/paymentId labels anywhere — Prometheus
// labels are supposed to be low-cardinality, and an id-per-user label set
// would grow unboundedly and leak identifiers into a metrics endpoint
// that isn't authenticated the way the rest of this API is.
@Injectable()
export class MetricsService {
  readonly registry = new Registry()

  readonly httpRequestsTotal = new Counter({
    name: 'shareride_http_requests_total',
    help: 'Total HTTP requests handled',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.registry],
  })

  readonly httpRequestDurationSeconds = new Histogram({
    name: 'shareride_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [this.registry],
  })

  readonly socketConnectionsActive = new Gauge({
    name: 'shareride_socket_connections_active',
    help: 'Currently connected authenticated Socket.IO clients',
    registers: [this.registry],
  })

  readonly paymentWebhookEventsTotal = new Counter({
    name: 'shareride_payment_webhook_events_total',
    help: 'Razorpay webhook events processed, by type and outcome',
    labelNames: ['event_type', 'outcome'],
    registers: [this.registry],
  })

  readonly matchingRunDurationSeconds = new Histogram({
    name: 'shareride_matching_run_duration_seconds',
    help: 'Time to score+persist candidates for one RideRequest/RideOffer matching run',
    labelNames: ['for'],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    registers: [this.registry],
  })

  constructor() {
    // process_cpu_seconds_total, nodejs_heap_size_*, event loop lag, etc.
    // — the standard baseline every Prometheus Node integration exposes.
    collectDefaultMetrics({ register: this.registry })
  }

  recordHttpRequest(method: string, route: string, statusCode: number, durationMs: number): void {
    const labels = { method, route, status_code: String(statusCode) }
    this.httpRequestsTotal.inc(labels)
    this.httpRequestDurationSeconds.observe(labels, durationMs / 1000)
  }

  async toPrometheusText(): Promise<string> {
    return this.registry.metrics()
  }
}
