// Thin fetch wrapper for the JSON API. Cookies (session) are sent automatically
// since the frontend is served same-origin (and proxied in dev).

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      // non-JSON error body — keep default message
    }
    const err = new Error(message) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  return res.json() as Promise<T>
}

export interface Merchant {
  id: string
  shopifyDomain: string
  installedAt: string
  uninstalledAt: string | null
  planTier: string
  riskModelState: string
}

export interface ErrorLogEntry {
  id: string
  level: string
  source: string
  message: string
  createdAt: string
  shopId: string | null
  shop: { id: string; shopifyDomain: string } | null
}

export const api = {
  me: () => request<{ authed: boolean }>('/api/me'),
  login: (password: string) =>
    request<{ ok: true }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  logout: () => request<{ ok: true }>('/api/logout', { method: 'POST' }),
  merchants: () => request<Merchant[]>('/api/merchants'),
  errors: (params: { level?: string; source?: string; shopId?: string }) => {
    const qs = new URLSearchParams()
    if (params.level) qs.set('level', params.level)
    if (params.source) qs.set('source', params.source)
    if (params.shopId) qs.set('shopId', params.shopId)
    const query = qs.toString()
    return request<ErrorLogEntry[]>(`/api/errors${query ? `?${query}` : ''}`)
  },
}
