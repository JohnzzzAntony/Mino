'use client'

// Lightweight typed fetcher for the frontend.
// All calls go through relative `/api/*` paths (no absolute URLs per platform rule).

export class ApiError extends Error {
  status: number
  body?: unknown
  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

export async function api<T = any>(
  path: string,
  init?: RequestInit & { params?: Record<string, string | number | undefined | null> }
): Promise<T> {
  const { params, ...rest } = init ?? {}
  let url = path
  if (params) {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v != null) sp.set(k, String(v))
    }
    const qs = sp.toString()
    if (qs) url += (path.includes('?') ? '&' : '?') + qs
  }
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(rest.headers ?? {}) },
    ...rest,
  })
  const text = await res.text()
  const data = text ? safeJson(text) : null
  if (!res.ok) {
    throw new ApiError(
      (data && (data as any).error) || res.statusText || 'Request failed',
      res.status,
      data
    )
  }
  return data as T
}

function safeJson(t: string): any {
  try {
    return JSON.parse(t)
  } catch {
    return t
  }
}
