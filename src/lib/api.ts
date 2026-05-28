let _token: string | null = null

export function setToken(token: string | null): void {
  _token = token
  try {
    if (token) localStorage.setItem('vg-token', token)
    else localStorage.removeItem('vg-token')
  } catch {}
}

export function loadStoredToken(): string | null {
  try { return localStorage.getItem('vg-token') } catch { return null }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (_token) headers['Authorization'] = `Bearer ${_token}`

  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> ?? {}) },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    try {
      const json = JSON.parse(text) as { error?: string }
      throw new Error(json.error ?? `HTTP ${res.status}`)
    } catch {
      throw new Error(text || `HTTP ${res.status}`)
    }
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
  deleteWithBody: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'DELETE', body: JSON.stringify(body) }),
}

export async function uploadFile(path: string, file: File | Blob): Promise<{ path: string }> {
  const form = new FormData()
  form.append('file', file)
  const headers: Record<string, string> = {}
  if (_token) headers['Authorization'] = `Bearer ${_token}`
  const res = await fetch(`/api${path}`, { method: 'POST', headers, body: form })
  if (!res.ok) throw new Error(`Upload mislukt: HTTP ${res.status}`)
  return res.json() as Promise<{ path: string }>
}
