import { ApiRequestError, createHttpClient } from '@shareride/api-client'

// The mobile app's actual error-handling surface (lib/api.ts just wires
// createHttpClient up to Supabase's access token) — what happens for each
// class of API failure a real request can hit: 401/403/404/500, and the
// device being offline. No network call, real or mocked-network — global
// fetch is a plain jest mock returning a canned Response for each case.
describe('api-client HTTP error states', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  function mockFetchResponse(status: number, body: unknown) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: 'error',
      json: async () => body,
    } as Response)
  }

  it('throws ApiRequestError with the server-provided shape on 401', async () => {
    mockFetchResponse(401, { statusCode: 401, code: 'UNAUTHORIZED', message: 'Unauthorized', requestId: 'req-1' })
    const client = createHttpClient({ baseUrl: 'https://api.test' })

    await expect(client.get('/payments')).rejects.toMatchObject({
      error: { statusCode: 401, code: 'UNAUTHORIZED', requestId: 'req-1' },
    })
  })

  it('throws ApiRequestError on 403 with the forbidden code', async () => {
    mockFetchResponse(403, { statusCode: 403, code: 'FORBIDDEN', message: 'You do not have permission to perform this action' })
    const client = createHttpClient({ baseUrl: 'https://api.test' })

    await expect(client.get('/admin/reports')).rejects.toBeInstanceOf(ApiRequestError)
  })

  it('throws ApiRequestError on 404 for a resource that does not exist', async () => {
    mockFetchResponse(404, { statusCode: 404, code: 'NOT_FOUND', message: 'Trip not found' })
    const client = createHttpClient({ baseUrl: 'https://api.test' })

    await expect(client.get('/trips/missing')).rejects.toMatchObject({ error: { statusCode: 404 } })
  })

  it('throws ApiRequestError on 500 with the safe generic message, never a stack trace', async () => {
    mockFetchResponse(500, { statusCode: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong' })
    const client = createHttpClient({ baseUrl: 'https://api.test' })

    await expect(client.get('/trips')).rejects.toMatchObject({ error: { statusCode: 500, message: 'Something went wrong' } })
  })

  it('falls back to a generic error when the server returns a non-JSON error body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON')
      },
    } as unknown as Response)
    const client = createHttpClient({ baseUrl: 'https://api.test' })

    await expect(client.get('/trips')).rejects.toMatchObject({ error: { statusCode: 502, code: 'UNKNOWN_ERROR' } })
  })

  it('rejects with the underlying network error when the device is offline (fetch itself throws)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'))
    const client = createHttpClient({ baseUrl: 'https://api.test' })

    await expect(client.get('/trips')).rejects.toThrow('Network request failed')
  })

  it('attaches the Supabase bearer token when getAuthToken resolves one', async () => {
    mockFetchResponse(200, { ok: true })
    const client = createHttpClient({ baseUrl: 'https://api.test', getAuthToken: async () => 'token-abc' })

    await client.get('/payments')

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/payments',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token-abc' }) }),
    )
  })

  it('omits the Authorization header when there is no session (signed out)', async () => {
    mockFetchResponse(200, { ok: true })
    const client = createHttpClient({ baseUrl: 'https://api.test', getAuthToken: async () => undefined })

    await client.get('/health')

    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(init.headers).not.toHaveProperty('Authorization')
  })
})
