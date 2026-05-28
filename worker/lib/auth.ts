import type { MiddlewareHandler, Next, Context } from 'hono'
import type { HonoEnv } from '../index'

// ── PIN hashing (PBKDF2-HMAC-SHA256) ─────────────────────────────────────────

export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, hash: 'SHA-256', iterations: 100_000 },
    key, 256
  )
  return (
    btoa(String.fromCharCode(...salt)) +
    '.' +
    btoa(String.fromCharCode(...new Uint8Array(bits)))
  )
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const dot = stored.indexOf('.')
  if (dot === -1) return false
  const salt = Uint8Array.from(atob(stored.slice(0, dot)), (c) => c.charCodeAt(0))
  const expected = Uint8Array.from(atob(stored.slice(dot + 1)), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, hash: 'SHA-256', iterations: 100_000 },
    key, 256
  )
  const derived = new Uint8Array(bits)
  if (derived.length !== expected.length) return false
  return derived.every((b, i) => b === expected[i])
}

// ── JWT (HS256) ───────────────────────────────────────────────────────────────

type JwtPayload = { sub: string; email: string; exp: number }

const b64url = (s: string) => s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
const b64urlToB64 = (s: string) =>
  s.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (s.length % 4)) % 4)

export async function signJwt(payload: JwtPayload, secret: string): Promise<string> {
  const header = b64url(btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = b64url(btoa(JSON.stringify(payload)))
  const unsigned = `${header}.${body}`
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsigned))
  return `${unsigned}.${b64url(btoa(String.fromCharCode(...new Uint8Array(sig))))}`
}

export async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [h, b, s] = parts
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  )
  const sig = Uint8Array.from(atob(b64urlToB64(s)), (c) => c.charCodeAt(0))
  const ok = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(`${h}.${b}`))
  if (!ok) return null
  try {
    const payload = JSON.parse(atob(b64urlToB64(b))) as JwtPayload
    if (payload.exp < Date.now() / 1000) return null
    return payload
  } catch {
    return null
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────

export const authMiddleware: MiddlewareHandler<HonoEnv> = async (
  c: Context<HonoEnv>,
  next: Next
) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Niet ingelogd' }, 401)
  }
  const payload = await verifyJwt(authHeader.slice(7), c.env.JWT_SECRET)
  if (!payload) {
    return c.json({ error: 'Ongeldige of verlopen sessie' }, 401)
  }
  c.set('userId', payload.sub)
  c.set('userEmail', payload.email)
  await next()
}
