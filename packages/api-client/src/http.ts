export interface ApiClientConfig {
  baseUrl: string
  getAuthToken?: () => string | undefined | Promise<string | undefined>
}

export interface ApiError {
  statusCode: number
  code: string
  message: string
  requestId?: string
}

export class ApiRequestError extends Error {
  constructor(public readonly error: ApiError) {
    super(error.message)
    this.name = 'ApiRequestError'
  }
}

export function createHttpClient(config: ApiClientConfig) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await config.getAuthToken?.()
    const res = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    })

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as ApiError | null
      throw new ApiRequestError(
        body ?? { statusCode: res.status, code: 'UNKNOWN_ERROR', message: res.statusText },
      )
    }

    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  }

  return {
    get: <T>(path: string) => request<T>(path, { method: 'GET' }),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  }
}

export type HttpClient = ReturnType<typeof createHttpClient>
