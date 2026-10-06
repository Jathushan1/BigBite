/**
 * Shared fetch wrapper for every backend module. The backend always answers errors as
 * { status, error: CODE, message, errors? }, which becomes an ApiError here.
 */
export class ApiError extends Error {
  status: number
  code?: string
  fieldErrors?: Record<string, string>
  body?: unknown

  constructor(message: string, status: number, code?: string, fieldErrors?: Record<string, string>, body?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
    this.body = body
  }
}

export const guestTokenKey = (orderId: number) => `bigbite.guestToken.${orderId}`

export function authHeaders(orderId?: number): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (orderId) {
    const guestToken = sessionStorage.getItem(guestTokenKey(orderId))
    if (guestToken) headers['X-Guest-Token'] = guestToken
  }
  return headers
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  orderId?: number
  query?: Record<string, string | number | boolean | undefined | null>
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const params = new URLSearchParams()
  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.append(key, String(value))
  })
  const url = params.toString() ? `${path}?${params}` : path

  let res: Response
  try {
    res = await fetch(url, {
      method: options.method ?? 'GET',
      headers: { ...authHeaders(options.orderId), ...options.headers },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError('Cannot reach the BigBite server. Check that the backend is running on port 8080.', 0, 'NETWORK')
  }

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    if ([502, 503, 504].includes(res.status)) {
      throw new ApiError('The BigBite server is not running or unreachable. Start the backend on port 8080.', res.status, 'UNAVAILABLE')
    }
    const body = (data && typeof data === 'object' ? data : {}) as {
      message?: string
      error?: string
      errors?: Record<string, string>
    }
    const message = body.message || `Request failed (${res.status})`
    throw new ApiError(message, res.status, body.error, body.errors, data)
  }

  return (data ?? undefined) as T
}

/** Human message for any thrown value. */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
