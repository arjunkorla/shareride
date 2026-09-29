import { MetricsService } from './metrics.service'

describe('MetricsService', () => {
  it('exposes Prometheus text format including the default process metrics', async () => {
    const metrics = new MetricsService()
    const text = await metrics.toPrometheusText()
    expect(text).toContain('# HELP')
    expect(text).toContain('process_cpu_user_seconds_total')
  })

  it('records an HTTP request into both the counter and the duration histogram', async () => {
    const metrics = new MetricsService()
    metrics.recordHttpRequest('GET', '/trips/:id', 200, 42)

    const text = await metrics.toPrometheusText()
    expect(text).toContain('shareride_http_requests_total{method="GET",route="/trips/:id",status_code="200"} 1')
    expect(text).toContain('shareride_http_request_duration_seconds')
  })

  it('does not put a high-cardinality raw id into a metric label (route is the caller\'s responsibility, but the service itself never mutates whatever route string it is given)', async () => {
    const metrics = new MetricsService()
    metrics.recordHttpRequest('GET', '/trips/:id', 200, 10)
    metrics.recordHttpRequest('GET', '/trips/:id', 200, 15)

    const text = await metrics.toPrometheusText()
    // Two requests to the same route pattern aggregate into one series,
    // not two — proof the label is the pattern, not a raw id.
    expect(text).toContain('shareride_http_requests_total{method="GET",route="/trips/:id",status_code="200"} 2')
  })

  it('starts every counter at a clean zero state per instance (no cross-test leakage via a shared default registry)', async () => {
    const first = new MetricsService()
    first.recordHttpRequest('GET', '/health', 200, 5)

    const second = new MetricsService()
    const text = await second.toPrometheusText()

    expect(text).not.toContain('shareride_http_requests_total{method="GET",route="/health"')
  })
})
