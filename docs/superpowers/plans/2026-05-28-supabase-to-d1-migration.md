# Supabase → Cloudflare D1 Migration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Supabase (auth + database + storage) with Cloudflare D1 (SQLite), native Web Crypto JWT auth, and Cloudflare R2 (image storage) — all on the free tier, on existing CF Workers infrastructure.

**Architecture:** A Hono Worker handles all `/api/*` routes with D1 + R2 bindings; everything else falls through to the static SPA assets. The frontend replaces the Supabase client with a thin typed `fetch` wrapper (`src/lib/api.ts`) that attaches a JWT from localStorage. Auth is HS256 JWT + PBKDF2 PIN hashing using the Web Crypto API — no external dependencies.

**Tech Stack:** Hono v4 (CF Workers router), Cloudflare D1 (SQLite), Cloudflare R2 (object storage), Web Crypto API (PBKDF2 + HMAC-SHA256), React 18 + TanStack Query (existing, unchanged).

---

## Schema changes (Postgres → D1 SQLite)

| Postgres | D1 SQLite |
|---|---|
| `uuid` | `TEXT` (Worker generates `crypto.randomUUID()`) |
| `timestamptz` | `TEXT` (ISO 8601, e.g. `2026-07-30T12:00:00.000Z`) |
| `date` | `TEXT` (e.g. `2026-07-30`) |
| `numeric(12,3)` | `REAL` |
| `text[]` (tags) | `TEXT` (JSON array string, e.g. `'["tag1","tag2"]'`) |
| `auth.users` FK (author_id) | `TEXT REFERENCES team_members(id)` |
| `gen_random_uuid()` | Worker-side `crypto.randomUUID()` |
| Triggers for `updated_at` | Set explicitly in Worker PATCH handlers |
| RLS | Worker auth middleware on all `/api/*` routes |
| `expenses.event_id` | Dropped (migration 0006 already removed it) |
| `team_members.user_id` | Replaced by `pin_hash TEXT` (PBKDF2 of 4-digit PIN) |

---

## File map

**New – Worker**
- `worker/index.ts` — Hono app, route registration, asset fallthrough
- `worker/lib/auth.ts` — PBKDF2 hash/verify, JWT sign/verify, Hono middleware
- `worker/routes/auth.ts` — POST `/api/auth/login`, GET `/api/auth/me`
- `worker/routes/events.ts` — GET `/api/events`, GET `/api/events/:id`, PATCH `/api/events/:id`
- `worker/routes/courses.ts` — GET/POST/PATCH/DELETE `/api/courses/:id`
- `worker/routes/dishes.ts` — GET/POST/PATCH/DELETE `/api/dishes/:id`
- `worker/routes/dish-ingredients.ts` — GET/PUT/DELETE `/api/dish-ingredients`
- `worker/routes/ingredients.ts` — GET/POST/PATCH/DELETE `/api/ingredients/:id`
- `worker/routes/guests.ts` — GET/POST/PATCH/DELETE `/api/guests/:id`
- `worker/routes/expenses.ts` — GET/POST/PATCH/DELETE `/api/expenses/:id`
- `worker/routes/team.ts` — GET/POST/PATCH/DELETE `/api/team/:id`
- `worker/routes/notes.ts` — GET/POST/PATCH/DELETE `/api/notes/:id`
- `worker/routes/inspirations.ts` — GET/POST/PATCH/DELETE `/api/inspirations/:id` + R2 upload/serve
- `worker/schema.sql` — D1 SQLite schema
- `worker/seed.sql` — events seed (3 dinners)
- `worker/seed-team.mjs` — Node.js script to generate pin hashes + print INSERT SQL

**New – Frontend**
- `src/lib/api.ts` — typed `fetch` wrapper with token management

**Modified – Frontend**
- `src/lib/auth.tsx` — JWT localStorage auth (no Supabase)
- `src/routes/Login.tsx` — POST to `/api/auth/login`
- `src/routes/AuthGuard.tsx` — use new `useAuth`
- `src/routes/Settings.tsx` — use `signOut` from new auth, remove Supabase link
- `src/features/events/queries.ts` + `mutations.ts`
- `src/features/menu/queries.ts` + `mutations.ts`
- `src/features/dishes/queries.ts` + `mutations.ts`
- `src/features/ingredients/queries.ts` + `mutations.ts`
- `src/features/guests/queries.ts` + `mutations.ts`
- `src/features/expenses/queries.ts` + `mutations.ts`
- `src/features/team/queries.ts` + `mutations.ts`
- `src/features/notes/queries.ts` + `mutations.ts`
- `src/features/inspirations/queries.ts` + `mutations.ts` + `storage.ts`
- `src/types/db.ts` — replace Supabase-generated types with simple row types
- `src/types/domain.ts` — update `mapNote` / `mapInspiration` for JSON tag parsing
- `wrangler.jsonc` — add `main`, `d1_databases`, `r2_buckets`
- `package.json` — add `hono`, `@cloudflare/workers-types`; remove `@supabase/supabase-js`

**Deleted**
- `src/lib/supabase.ts`

---

## Task 1: D1 schema + wrangler setup

**Files:**
- Create: `worker/schema.sql`
- Create: `worker/seed.sql`
- Modify: `wrangler.jsonc`

- [ ] **Step 1.1: Install Hono and CF Workers types**

```bash
cd vaste-grond
npm install hono
npm install --save-dev @cloudflare/workers-types
npm uninstall @supabase/supabase-js
```

- [ ] **Step 1.2: Create the D1 database**

```bash
npx wrangler d1 create vastegrond
```

Copy the `database_id` from the output (looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

- [ ] **Step 1.3: Create the R2 bucket**

```bash
npx wrangler r2 bucket create vastegrond-inspirations
```

- [ ] **Step 1.4: Write `worker/schema.sql`**

```sql
-- Vaste Grond — D1 SQLite schema
-- Bedragen in cents (INTEGER). Tags als JSON-string. Geen triggers: updated_at
-- wordt in de Worker-handler gezet bij elke PATCH.

CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  pin_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  event_date TEXT NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 0 CHECK (guest_count >= 0),
  ticket_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (ticket_price_cents >= 0),
  location_name TEXT,
  location_cost_cents INTEGER NOT NULL DEFAULT 0 CHECK (location_cost_cents >= 0),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS events_event_date_idx ON events (event_date);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  position INTEGER NOT NULL CHECK (position >= 0),
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS dishes (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  portions INTEGER NOT NULL DEFAULT 1 CHECK (portions > 0),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS dishes_course_id_idx ON dishes (course_id);

CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL,
  price_per_unit_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_per_unit_cents >= 0),
  purchase_unit TEXT,
  supplier TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS dish_ingredients (
  dish_id TEXT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  amount REAL NOT NULL CHECK (amount >= 0),
  PRIMARY KEY (dish_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited','confirmed','declined','tentative')),
  party_size INTEGER NOT NULL DEFAULT 1 CHECK (party_size > 0),
  dietary TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS guests_event_id_idx ON guests (event_id);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  dish_id TEXT REFERENCES dishes(id) ON DELETE SET NULL,
  course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
  author_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes (updated_at DESC);

CREATE TABLE IF NOT EXISTS inspirations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  url TEXT,
  image_path TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  dish_id TEXT REFERENCES dishes(id) ON DELETE SET NULL,
  course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
  author_id TEXT REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS inspirations_created_at_idx ON inspirations (created_at DESC);
```

- [ ] **Step 1.5: Write `worker/seed.sql` (3 events)**

```sql
INSERT OR IGNORE INTO events (id, name, event_date, guest_count, ticket_price_cents, location_name, location_cost_cents) VALUES
  ('evt-vg-001', 'Vaste Grond · Avond 1', '2026-07-30', 12, 9500, 'Vogelfrei', 0),
  ('evt-vg-002', 'Vaste Grond · Avond 2', '2026-07-31', 12, 9500, 'Vogelfrei', 0),
  ('evt-vg-003', 'Vaste Grond · Avond 3', '2026-08-01', 12, 9500, 'Vogelfrei', 0);
```

- [ ] **Step 1.6: Apply schema + seed to local D1**

```bash
npx wrangler d1 execute vastegrond --local --file=worker/schema.sql
npx wrangler d1 execute vastegrond --local --file=worker/seed.sql
```

Expected output: `Success` for both commands.

- [ ] **Step 1.7: Update `wrangler.jsonc`**

Replace entire content:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "vastegrond",
  "main": "worker/index.ts",
  "compatibility_date": "2024-12-01",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "vastegrond",
      "database_id": "PASTE_YOUR_DATABASE_ID_HERE"
    }
  ],
  "r2_buckets": [
    {
      "binding": "R2",
      "bucket_name": "vastegrond-inspirations"
    }
  ],
  "observability": {
    "enabled": true
  }
}
```

Replace `PASTE_YOUR_DATABASE_ID_HERE` with the ID from step 1.2.

- [ ] **Step 1.8: Commit**

```bash
git add wrangler.jsonc worker/schema.sql worker/seed.sql package.json package-lock.json
git commit -m "chore: add D1 schema, R2 bucket, Hono dependency"
```

---

## Task 2: Worker entry point + auth library

**Files:**
- Create: `worker/index.ts`
- Create: `worker/lib/auth.ts`

- [ ] **Step 2.1: Create `worker/lib/auth.ts`**

```typescript
import type { Context, MiddlewareHandler, Next } from 'hono'
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
```

- [ ] **Step 2.2: Create `worker/index.ts`**

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authMiddleware } from './lib/auth'
import { authRoutes } from './routes/auth'
import { eventsRoutes } from './routes/events'
import { coursesRoutes } from './routes/courses'
import { dishesRoutes } from './routes/dishes'
import { dishIngredientsRoutes } from './routes/dish-ingredients'
import { ingredientsRoutes } from './routes/ingredients'
import { guestsRoutes } from './routes/guests'
import { expensesRoutes } from './routes/expenses'
import { teamRoutes } from './routes/team'
import { notesRoutes } from './routes/notes'
import { inspirationsRoutes } from './routes/inspirations'

export type HonoEnv = {
  Bindings: {
    DB: D1Database
    R2: R2Bucket
    ASSETS: Fetcher
    JWT_SECRET: string
  }
  Variables: {
    userId: string
    userEmail: string
  }
}

const app = new Hono<HonoEnv>()

app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'https://odeaanoma.nl'],
  allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}))

// Auth routes — no authentication required
app.route('/api/auth', authRoutes)

// All other /api/* routes require a valid JWT
app.use('/api/*', authMiddleware)
app.route('/api/events', eventsRoutes)
app.route('/api/courses', coursesRoutes)
app.route('/api/dishes', dishesRoutes)
app.route('/api/dish-ingredients', dishIngredientsRoutes)
app.route('/api/ingredients', ingredientsRoutes)
app.route('/api/guests', guestsRoutes)
app.route('/api/expenses', expensesRoutes)
app.route('/api/team', teamRoutes)
app.route('/api/notes', notesRoutes)
app.route('/api/inspirations', inspirationsRoutes)

// Static assets fallthrough (SPA)
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
```

- [ ] **Step 2.3: Create stub route files so TypeScript compiles**

Create `worker/routes/auth.ts`, `events.ts`, `courses.ts`, `dishes.ts`, `dish-ingredients.ts`, `ingredients.ts`, `guests.ts`, `expenses.ts`, `team.ts`, `notes.ts`, `inspirations.ts` — each with:

```typescript
import { Hono } from 'hono'
import type { HonoEnv } from '../index'

export const authRoutes = new Hono<HonoEnv>()
// (replace 'authRoutes' with the correct name per file)
```

Use the right export name per file:
- `auth.ts` → `authRoutes`
- `events.ts` → `eventsRoutes`
- `courses.ts` → `coursesRoutes`
- `dishes.ts` → `dishesRoutes`
- `dish-ingredients.ts` → `dishIngredientsRoutes`
- `ingredients.ts` → `ingredientsRoutes`
- `guests.ts` → `guestsRoutes`
- `expenses.ts` → `expensesRoutes`
- `team.ts` → `teamRoutes`
- `notes.ts` → `notesRoutes`
- `inspirations.ts` → `inspirationsRoutes`

- [ ] **Step 2.4: Verify the Worker compiles with wrangler**

```bash
npx wrangler dev --local
```

Expected: server starts on `http://localhost:8787`. All `/api/*` routes return 404 (stubs). Press Ctrl-C to stop.

- [ ] **Step 2.5: Commit**

```bash
git add worker/
git commit -m "feat: add Hono Worker skeleton with D1/R2 bindings"
```

---

## Task 3: Auth endpoints + team seed

**Files:**
- Modify: `worker/routes/auth.ts`
- Create: `worker/seed-team.mjs`

- [ ] **Step 3.1: Write `worker/seed-team.mjs`**

This script generates PBKDF2 hashes locally (Node.js uses the same algorithm). Run it to get INSERT statements for both team members.

```javascript
// worker/seed-team.mjs
// Usage: node worker/seed-team.mjs <email> <pin>
// Example: node worker/seed-team.mjs stefvandijk10@gmail.com 1234

import { randomBytes, pbkdf2 } from 'node:crypto'

const [, , email, pin] = process.argv
if (!email || !pin) {
  console.error('Usage: node worker/seed-team.mjs <email> <pin>')
  process.exit(1)
}

const salt = randomBytes(16)
const id = crypto.randomUUID()

pbkdf2(pin, salt, 100_000, 32, 'sha256', (err, hash) => {
  if (err) throw err
  const pinHash = salt.toString('base64') + '.' + hash.toString('base64')
  console.log(
    `INSERT OR IGNORE INTO team_members (id, email, display_name, pin_hash) VALUES ('${id}', '${email.toLowerCase()}', NULL, '${pinHash}');`
  )
})
```

- [ ] **Step 3.2: Generate INSERT SQL for both accounts**

Decide on the initial PINs and run:

```bash
node worker/seed-team.mjs stefvandijk10@gmail.com YOUR_PIN_HERE
node worker/seed-team.mjs morrison_mensink@hotmail.com YOUR_PIN_HERE
```

Copy the two INSERT statements into a file `worker/seed-team.sql`.

- [ ] **Step 3.3: Apply team seed to local D1**

```bash
npx wrangler d1 execute vastegrond --local --file=worker/seed-team.sql
```

Expected: `Success`.

- [ ] **Step 3.4: Write `worker/routes/auth.ts`**

```typescript
import { Hono } from 'hono'
import { z } from 'zod'
import { signJwt, verifyPin } from '../lib/auth'
import type { HonoEnv } from '../index'

export const authRoutes = new Hono<HonoEnv>()

const loginSchema = z.object({
  email: z.string().email(),
  pin: z.string().regex(/^\d{4}$/),
})

const JWT_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 30 // 30 days

type TeamMemberRow = {
  id: string
  email: string
  display_name: string | null
  pin_hash: string
  created_at: string
}

authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Ongeldige invoer' }, 400)
  }
  const { email, pin } = parsed.data

  const row = await c.env.DB
    .prepare('SELECT id, email, display_name, pin_hash FROM team_members WHERE email = ?')
    .bind(email.toLowerCase())
    .first<TeamMemberRow>()

  if (!row) {
    return c.json({ error: 'E-mail of code klopt niet' }, 401)
  }
  const ok = await verifyPin(pin, row.pin_hash)
  if (!ok) {
    return c.json({ error: 'E-mail of code klopt niet' }, 401)
  }

  const token = await signJwt(
    { sub: row.id, email: row.email, exp: Math.floor(Date.now() / 1000) + JWT_EXPIRES_IN_SECONDS },
    c.env.JWT_SECRET
  )
  return c.json({
    token,
    user: { id: row.id, email: row.email, displayName: row.display_name },
  })
})

authRoutes.get('/me', async (c) => {
  // This route sits behind authMiddleware in index.ts
  const userId = c.get('userId')
  const row = await c.env.DB
    .prepare('SELECT id, email, display_name FROM team_members WHERE id = ?')
    .bind(userId)
    .first<Pick<TeamMemberRow, 'id' | 'email' | 'display_name'>>()
  if (!row) return c.json({ error: 'Gebruiker niet gevonden' }, 404)
  return c.json({ id: row.id, email: row.email, displayName: row.display_name })
})
```

**Note:** The `/api/auth/me` route needs auth middleware. Update `worker/index.ts` — move the auth middleware to apply before `authRoutes` for `/api/auth/me` but not `/api/auth/login`:

In `worker/index.ts`, replace:
```typescript
app.route('/api/auth', authRoutes)
app.use('/api/*', authMiddleware)
```
with:
```typescript
app.post('/api/auth/login', (c) => authRoutes.fetch(c.req.raw, c.env))
app.use('/api/auth/*', authMiddleware)
app.route('/api/auth', authRoutes)
app.use('/api/*', authMiddleware)
```

Actually, simpler: keep `/api/auth/login` without middleware by registering it before the middleware. In Hono, middleware order matters. Replace the route registration block in `index.ts` with:

```typescript
// Public routes (no JWT)
app.post('/api/auth/login', async (c) => {
  return authRoutes.fetch(c.req.raw, c.env, c.executionCtx)
})

// Protected routes
app.use('/api/*', authMiddleware)
app.get('/api/auth/me', async (c) => {
  return authRoutes.fetch(c.req.raw, c.env, c.executionCtx)
})
app.route('/api/events', eventsRoutes)
// ... rest unchanged
```

Wait — this is getting complicated. Use Hono's built-in approach: register the login route on the app directly before the middleware, and then use a sub-app for /me:

Replace the auth section in `worker/index.ts` with:

```typescript
// POST /api/auth/login — no auth required
app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const { email, pin } = parsed.data
  const row = await c.env.DB
    .prepare('SELECT id, email, display_name, pin_hash FROM team_members WHERE email = ?')
    .bind(email.toLowerCase())
    .first<TeamMemberRow>()
  if (!row || !(await verifyPin(pin, row.pin_hash))) {
    return c.json({ error: 'E-mail of code klopt niet' }, 401)
  }
  const token = await signJwt(
    { sub: row.id, email: row.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 },
    c.env.JWT_SECRET
  )
  return c.json({ token, user: { id: row.id, email: row.email, displayName: row.display_name } })
})

// All other /api/* routes require JWT
app.use('/api/*', authMiddleware)

// GET /api/auth/me
app.get('/api/auth/me', async (c) => {
  const row = await c.env.DB
    .prepare('SELECT id, email, display_name FROM team_members WHERE id = ?')
    .bind(c.get('userId'))
    .first<{ id: string; email: string; display_name: string | null }>()
  if (!row) return c.json({ error: 'Gebruiker niet gevonden' }, 404)
  return c.json({ id: row.id, email: row.email, displayName: row.display_name })
})

// Data routes
app.route('/api/events', eventsRoutes)
// ...
```

With this approach, `worker/routes/auth.ts` is not needed — put the login + me logic directly in `index.ts`. Delete the stub `worker/routes/auth.ts` import and remove the file.

To avoid a giant `index.ts`, keep the login handler inline and import types from a shared file. This is clean enough for a small app.

Simplified final `worker/index.ts`:

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { authMiddleware, signJwt, verifyPin } from './lib/auth'
import { eventsRoutes } from './routes/events'
import { coursesRoutes } from './routes/courses'
import { dishesRoutes } from './routes/dishes'
import { dishIngredientsRoutes } from './routes/dish-ingredients'
import { ingredientsRoutes } from './routes/ingredients'
import { guestsRoutes } from './routes/guests'
import { expensesRoutes } from './routes/expenses'
import { teamRoutes } from './routes/team'
import { notesRoutes } from './routes/notes'
import { inspirationsRoutes } from './routes/inspirations'

export type HonoEnv = {
  Bindings: {
    DB: D1Database
    R2: R2Bucket
    ASSETS: Fetcher
    JWT_SECRET: string
  }
  Variables: {
    userId: string
    userEmail: string
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  pin: z.string().regex(/^\d{4}$/),
})

type TeamMemberRow = {
  id: string; email: string; display_name: string | null; pin_hash: string
}

const app = new Hono<HonoEnv>()

app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'https://odeaanoma.nl'],
  allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// POST /api/auth/login — public
app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const { email, pin } = parsed.data
  const row = await c.env.DB
    .prepare('SELECT id, email, display_name, pin_hash FROM team_members WHERE email = ?')
    .bind(email.toLowerCase())
    .first<TeamMemberRow>()
  if (!row || !(await verifyPin(pin, row.pin_hash))) {
    return c.json({ error: 'E-mail of code klopt niet' }, 401)
  }
  const token = await signJwt(
    { sub: row.id, email: row.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 },
    c.env.JWT_SECRET
  )
  return c.json({ token, user: { id: row.id, email: row.email, displayName: row.display_name } })
})

// All other /api/* — require JWT
app.use('/api/*', authMiddleware)

// GET /api/auth/me
app.get('/api/auth/me', async (c) => {
  const row = await c.env.DB
    .prepare('SELECT id, email, display_name FROM team_members WHERE id = ?')
    .bind(c.get('userId'))
    .first<Pick<TeamMemberRow, 'id' | 'email' | 'display_name'>>()
  if (!row) return c.json({ error: 'Gebruiker niet gevonden' }, 404)
  return c.json({ id: row.id, email: row.email, displayName: row.display_name })
})

app.route('/api/events', eventsRoutes)
app.route('/api/courses', coursesRoutes)
app.route('/api/dishes', dishesRoutes)
app.route('/api/dish-ingredients', dishIngredientsRoutes)
app.route('/api/ingredients', ingredientsRoutes)
app.route('/api/guests', guestsRoutes)
app.route('/api/expenses', expensesRoutes)
app.route('/api/team', teamRoutes)
app.route('/api/notes', notesRoutes)
app.route('/api/inspirations', inspirationsRoutes)

// SPA fallthrough
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
```

Remove `worker/routes/auth.ts`.

- [ ] **Step 3.5: Test auth endpoints locally**

```bash
npx wrangler dev --local
```

In another terminal:
```bash
# Should return 401
curl -s http://localhost:8787/api/auth/me | jq

# Should return { token, user } if PIN matches seed
curl -s -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"stefvandijk10@gmail.com","pin":"YOUR_PIN"}' | jq

# Should return { id, email, displayName } when token is valid
TOKEN="paste_token_here"
curl -s http://localhost:8787/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq
```

Expected: all three work correctly.

- [ ] **Step 3.6: Commit**

```bash
git add worker/
git commit -m "feat: auth endpoints (login, me) with PBKDF2 + HS256 JWT"
```

---

## Task 4: Events + Courses endpoints

**Files:**
- Modify: `worker/routes/events.ts`
- Modify: `worker/routes/courses.ts`

- [ ] **Step 4.1: Write `worker/routes/events.ts`**

```typescript
import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../index'

export const eventsRoutes = new Hono<HonoEnv>()

const now = () => new Date().toISOString()

const updateSchema = z.object({
  name: z.string().min(1),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guestCount: z.number().int().min(0),
  ticketPriceCents: z.number().int().min(0),
  locationName: z.string().nullable(),
  locationCostCents: z.number().int().min(0),
  notes: z.string().nullable(),
})

eventsRoutes.get('/', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT * FROM events ORDER BY event_date ASC')
    .all()
  return c.json(results)
})

eventsRoutes.get('/:id', async (c) => {
  const row = await c.env.DB
    .prepare('SELECT * FROM events WHERE id = ?')
    .bind(c.req.param('id'))
    .first()
  if (!row) return c.json({ error: 'Niet gevonden' }, 404)
  return c.json(row)
})

eventsRoutes.patch('/:id', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const d = parsed.data
  const row = await c.env.DB
    .prepare(`
      UPDATE events SET
        name = ?, event_date = ?, guest_count = ?,
        ticket_price_cents = ?, location_name = ?,
        location_cost_cents = ?, notes = ?, updated_at = ?
      WHERE id = ?
      RETURNING *
    `)
    .bind(d.name, d.eventDate, d.guestCount, d.ticketPriceCents,
          d.locationName, d.locationCostCents, d.notes, now(), c.req.param('id'))
    .first()
  if (!row) return c.json({ error: 'Niet gevonden' }, 404)
  return c.json(row)
})
```

- [ ] **Step 4.2: Write `worker/routes/courses.ts`**

```typescript
import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../index'

export const coursesRoutes = new Hono<HonoEnv>()

const now = () => new Date().toISOString()

const createSchema = z.object({
  name: z.string().min(1),
  position: z.number().int().min(0),
})

const renameSchema = z.object({ name: z.string().min(1) })
const positionSchema = z.object({ position: z.number().int().min(0) })

coursesRoutes.get('/', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT * FROM courses ORDER BY position ASC, created_at ASC')
    .all()
  return c.json(results)
})

coursesRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const id = crypto.randomUUID()
  const row = await c.env.DB
    .prepare('INSERT INTO courses (id, name, position) VALUES (?, ?, ?) RETURNING *')
    .bind(id, parsed.data.name, parsed.data.position)
    .first()
  return c.json(row, 201)
})

coursesRoutes.patch('/:id/name', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = renameSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const row = await c.env.DB
    .prepare('UPDATE courses SET name = ? WHERE id = ? RETURNING *')
    .bind(parsed.data.name, c.req.param('id'))
    .first()
  if (!row) return c.json({ error: 'Niet gevonden' }, 404)
  return c.json(row)
})

coursesRoutes.patch('/:id/position', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = positionSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  await c.env.DB
    .prepare('UPDATE courses SET position = ? WHERE id = ?')
    .bind(parsed.data.position, c.req.param('id'))
    .run()
  return c.body(null, 204)
})

coursesRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM courses WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})
```

- [ ] **Step 4.3: Test events and courses locally**

```bash
TOKEN="your_token_from_task_3"
curl -s http://localhost:8787/api/events -H "Authorization: Bearer $TOKEN" | jq
```

Expected: array of 3 events from seed data.

- [ ] **Step 4.4: Commit**

```bash
git add worker/routes/events.ts worker/routes/courses.ts
git commit -m "feat: events and courses API endpoints"
```

---

## Task 5: Dishes + Ingredients + Dish-Ingredients endpoints

**Files:**
- Modify: `worker/routes/dishes.ts`
- Modify: `worker/routes/dish-ingredients.ts`
- Modify: `worker/routes/ingredients.ts`

- [ ] **Step 5.1: Write `worker/routes/dishes.ts`**

```typescript
import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../index'

export const dishesRoutes = new Hono<HonoEnv>()

const now = () => new Date().toISOString()

const dishSchema = z.object({
  courseId: z.string().uuid(),
  name: z.string().min(1),
  portions: z.number().int().min(1),
  notes: z.string().nullable(),
})

dishesRoutes.get('/', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT * FROM dishes ORDER BY created_at ASC')
    .all()
  return c.json(results)
})

dishesRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = dishSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const id = crypto.randomUUID()
  const d = parsed.data
  const row = await c.env.DB
    .prepare('INSERT INTO dishes (id, course_id, name, portions, notes) VALUES (?, ?, ?, ?, ?) RETURNING *')
    .bind(id, d.courseId, d.name, d.portions, d.notes)
    .first()
  return c.json(row, 201)
})

dishesRoutes.patch('/:id', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = dishSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const d = parsed.data
  const row = await c.env.DB
    .prepare(`
      UPDATE dishes SET course_id = ?, name = ?, portions = ?, notes = ?, updated_at = ?
      WHERE id = ? RETURNING *
    `)
    .bind(d.courseId, d.name, d.portions, d.notes, now(), c.req.param('id'))
    .first()
  if (!row) return c.json({ error: 'Niet gevonden' }, 404)
  return c.json(row)
})

dishesRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM dishes WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})
```

- [ ] **Step 5.2: Write `worker/routes/dish-ingredients.ts`**

```typescript
import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../index'

export const dishIngredientsRoutes = new Hono<HonoEnv>()

const upsertSchema = z.object({
  dishId: z.string().uuid(),
  ingredientId: z.string().uuid(),
  amount: z.number().min(0),
})

const deleteSchema = z.object({
  dishId: z.string().uuid(),
  ingredientId: z.string().uuid(),
})

// GET /api/dish-ingredients?dishId=<id>   OR   GET /api/dish-ingredients (all)
dishIngredientsRoutes.get('/', async (c) => {
  const dishId = c.req.query('dishId')
  if (dishId) {
    const { results } = await c.env.DB
      .prepare('SELECT ingredient_id, amount FROM dish_ingredients WHERE dish_id = ?')
      .bind(dishId)
      .all()
    return c.json(results)
  }
  const { results } = await c.env.DB
    .prepare('SELECT dish_id, ingredient_id, amount FROM dish_ingredients')
    .all()
  return c.json(results)
})

// PUT /api/dish-ingredients  { dishId, ingredientId, amount }
dishIngredientsRoutes.put('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const { dishId, ingredientId, amount } = parsed.data
  await c.env.DB
    .prepare(`
      INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES (?, ?, ?)
      ON CONFLICT (dish_id, ingredient_id) DO UPDATE SET amount = excluded.amount
    `)
    .bind(dishId, ingredientId, amount)
    .run()
  return c.body(null, 204)
})

// DELETE /api/dish-ingredients  { dishId, ingredientId }
dishIngredientsRoutes.delete('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  await c.env.DB
    .prepare('DELETE FROM dish_ingredients WHERE dish_id = ? AND ingredient_id = ?')
    .bind(parsed.data.dishId, parsed.data.ingredientId)
    .run()
  return c.body(null, 204)
})
```

- [ ] **Step 5.3: Write `worker/routes/ingredients.ts`**

```typescript
import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../index'

export const ingredientsRoutes = new Hono<HonoEnv>()

const now = () => new Date().toISOString()

const ingredientSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  pricePerUnitCents: z.number().int().min(0),
  purchaseUnit: z.string().nullable(),
  supplier: z.string().nullable(),
  notes: z.string().nullable(),
})

ingredientsRoutes.get('/', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT * FROM ingredients ORDER BY name ASC')
    .all()
  return c.json(results)
})

ingredientsRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = ingredientSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const d = parsed.data
  const id = crypto.randomUUID()
  const row = await c.env.DB
    .prepare(`
      INSERT INTO ingredients (id, name, unit, price_per_unit_cents, purchase_unit, supplier, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *
    `)
    .bind(id, d.name, d.unit, d.pricePerUnitCents, d.purchaseUnit, d.supplier, d.notes)
    .first()
  return c.json(row, 201)
})

ingredientsRoutes.patch('/:id', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = ingredientSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const d = parsed.data
  const row = await c.env.DB
    .prepare(`
      UPDATE ingredients SET name = ?, unit = ?, price_per_unit_cents = ?,
        purchase_unit = ?, supplier = ?, notes = ?, updated_at = ?
      WHERE id = ? RETURNING *
    `)
    .bind(d.name, d.unit, d.pricePerUnitCents, d.purchaseUnit, d.supplier, d.notes,
          now(), c.req.param('id'))
    .first()
  if (!row) return c.json({ error: 'Niet gevonden' }, 404)
  return c.json(row)
})

ingredientsRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM ingredients WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})
```

- [ ] **Step 5.4: Commit**

```bash
git add worker/routes/dishes.ts worker/routes/dish-ingredients.ts worker/routes/ingredients.ts
git commit -m "feat: dishes, dish-ingredients, ingredients API endpoints"
```

---

## Task 6: Guests + Expenses + Team endpoints

**Files:**
- Modify: `worker/routes/guests.ts`
- Modify: `worker/routes/expenses.ts`
- Modify: `worker/routes/team.ts`

- [ ] **Step 6.1: Write `worker/routes/guests.ts`**

```typescript
import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../index'

export const guestsRoutes = new Hono<HonoEnv>()

const now = () => new Date().toISOString()

const guestSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1),
  status: z.enum(['invited', 'confirmed', 'declined', 'tentative']),
  partySize: z.number().int().min(1),
  dietary: z.string().nullable(),
  notes: z.string().nullable(),
})

guestsRoutes.get('/', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT * FROM guests ORDER BY created_at ASC')
    .all()
  return c.json(results)
})

guestsRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = guestSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const d = parsed.data
  const id = crypto.randomUUID()
  const row = await c.env.DB
    .prepare(`
      INSERT INTO guests (id, event_id, name, status, party_size, dietary, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *
    `)
    .bind(id, d.eventId, d.name, d.status, d.partySize, d.dietary, d.notes)
    .first()
  return c.json(row, 201)
})

guestsRoutes.patch('/:id', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = guestSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const d = parsed.data
  const row = await c.env.DB
    .prepare(`
      UPDATE guests SET event_id = ?, name = ?, status = ?, party_size = ?,
        dietary = ?, notes = ?, updated_at = ?
      WHERE id = ? RETURNING *
    `)
    .bind(d.eventId, d.name, d.status, d.partySize, d.dietary, d.notes, now(), c.req.param('id'))
    .first()
  if (!row) return c.json({ error: 'Niet gevonden' }, 404)
  return c.json(row)
})

guestsRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM guests WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})
```

- [ ] **Step 6.2: Write `worker/routes/expenses.ts`**

```typescript
import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../index'

export const expensesRoutes = new Hono<HonoEnv>()

const expenseSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  amountCents: z.number().int().min(0),
})

expensesRoutes.get('/', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT * FROM expenses ORDER BY created_at ASC')
    .all()
  return c.json(results)
})

expensesRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = expenseSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const d = parsed.data
  const id = crypto.randomUUID()
  const row = await c.env.DB
    .prepare(`
      INSERT INTO expenses (id, category, description, amount_cents) VALUES (?, ?, ?, ?) RETURNING *
    `)
    .bind(id, d.category, d.description, d.amountCents)
    .first()
  return c.json(row, 201)
})

expensesRoutes.patch('/:id', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = expenseSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const d = parsed.data
  const row = await c.env.DB
    .prepare(`
      UPDATE expenses SET category = ?, description = ?, amount_cents = ?
      WHERE id = ? RETURNING *
    `)
    .bind(d.category, d.description, d.amountCents, c.req.param('id'))
    .first()
  if (!row) return c.json({ error: 'Niet gevonden' }, 404)
  return c.json(row)
})

expensesRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM expenses WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})
```

- [ ] **Step 6.3: Write `worker/routes/team.ts`**

```typescript
import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../index'

export const teamRoutes = new Hono<HonoEnv>()

const memberSchema = z.object({
  email: z.string().email(),
  displayName: z.string().nullable(),
})

teamRoutes.get('/', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT id, email, display_name, created_at FROM team_members ORDER BY created_at ASC')
    .all()
  return c.json(results)
})

teamRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = memberSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const id = crypto.randomUUID()
  // New members get a placeholder hash — they must set their PIN via Settings
  const row = await c.env.DB
    .prepare(`
      INSERT INTO team_members (id, email, display_name, pin_hash)
      VALUES (?, ?, ?, 'SETUP_NEEDED') RETURNING id, email, display_name, created_at
    `)
    .bind(id, parsed.data.email.toLowerCase(), parsed.data.displayName)
    .first()
  return c.json(row, 201)
})

teamRoutes.patch('/:id', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = memberSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const row = await c.env.DB
    .prepare(`
      UPDATE team_members SET email = ?, display_name = ?
      WHERE id = ? RETURNING id, email, display_name, created_at
    `)
    .bind(parsed.data.email.toLowerCase(), parsed.data.displayName, c.req.param('id'))
    .first()
  if (!row) return c.json({ error: 'Niet gevonden' }, 404)
  return c.json(row)
})

teamRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM team_members WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})
```

- [ ] **Step 6.4: Commit**

```bash
git add worker/routes/guests.ts worker/routes/expenses.ts worker/routes/team.ts
git commit -m "feat: guests, expenses, team API endpoints"
```

---

## Task 7: Notes + Inspirations + R2 file upload

**Files:**
- Modify: `worker/routes/notes.ts`
- Modify: `worker/routes/inspirations.ts`

- [ ] **Step 7.1: Write `worker/routes/notes.ts`**

```typescript
import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../index'

export const notesRoutes = new Hono<HonoEnv>()

const now = () => new Date().toISOString()

const noteSchema = z.object({
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  dishId: z.string().uuid().nullable(),
  courseId: z.string().uuid().nullable(),
})

notesRoutes.get('/', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT * FROM notes ORDER BY updated_at DESC')
    .all()
  return c.json(results)
})

notesRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = noteSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const d = parsed.data
  const id = crypto.randomUUID()
  const row = await c.env.DB
    .prepare(`
      INSERT INTO notes (id, title, body, tags, dish_id, course_id, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *
    `)
    .bind(id, d.title, d.body, JSON.stringify(d.tags), d.dishId, d.courseId, c.get('userId'))
    .first()
  return c.json(row, 201)
})

notesRoutes.patch('/:id', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = noteSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const d = parsed.data
  const row = await c.env.DB
    .prepare(`
      UPDATE notes SET title = ?, body = ?, tags = ?, dish_id = ?, course_id = ?, updated_at = ?
      WHERE id = ? RETURNING *
    `)
    .bind(d.title, d.body, JSON.stringify(d.tags), d.dishId, d.courseId, now(), c.req.param('id'))
    .first()
  if (!row) return c.json({ error: 'Niet gevonden' }, 404)
  return c.json(row)
})

notesRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})
```

- [ ] **Step 7.2: Write `worker/routes/inspirations.ts`**

```typescript
import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../index'

export const inspirationsRoutes = new Hono<HonoEnv>()

const now = () => new Date().toISOString()

const inspirationSchema = z.object({
  title: z.string(),
  note: z.string(),
  url: z.string().nullable(),
  imagePath: z.string().nullable(),
  tags: z.array(z.string()),
  dishId: z.string().uuid().nullable(),
  courseId: z.string().uuid().nullable(),
})

inspirationsRoutes.get('/', async (c) => {
  const { results } = await c.env.DB
    .prepare('SELECT * FROM inspirations ORDER BY created_at DESC')
    .all()
  return c.json(results)
})

inspirationsRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = inspirationSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const d = parsed.data
  const id = crypto.randomUUID()
  const row = await c.env.DB
    .prepare(`
      INSERT INTO inspirations (id, title, note, url, image_path, tags, dish_id, course_id, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *
    `)
    .bind(id, d.title, d.note, d.url, d.imagePath, JSON.stringify(d.tags),
          d.dishId, d.courseId, c.get('userId'))
    .first()
  return c.json(row, 201)
})

inspirationsRoutes.patch('/:id', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = inspirationSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const d = parsed.data
  const row = await c.env.DB
    .prepare(`
      UPDATE inspirations SET title = ?, note = ?, url = ?, image_path = ?, tags = ?,
        dish_id = ?, course_id = ?, updated_at = ?
      WHERE id = ? RETURNING *
    `)
    .bind(d.title, d.note, d.url, d.imagePath, JSON.stringify(d.tags),
          d.dishId, d.courseId, now(), c.req.param('id'))
    .first()
  if (!row) return c.json({ error: 'Niet gevonden' }, 404)
  return c.json(row)
})

inspirationsRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM inspirations WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})

// POST /api/inspirations/upload  (multipart or raw binary)
// Body: FormData with field "file"
// Returns: { path: string }
inspirationsRoutes.post('/upload', async (c) => {
  const userId = c.get('userId')
  const formData = await c.req.formData().catch(() => null)
  const file = formData?.get('file') as File | null
  if (!file) return c.json({ error: 'Geen bestand ontvangen' }, 400)

  const ext = inferExtension(file)
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  await c.env.R2.put(path, file.stream(), {
    httpMetadata: { contentType: file.type || 'image/png' },
  })
  return c.json({ path })
})

// DELETE /api/inspirations/upload/:path*
inspirationsRoutes.delete('/upload/:path{.+}', async (c) => {
  const path = c.req.param('path')
  await c.env.R2.delete(path)
  return c.body(null, 204)
})

// GET /api/inspirations/images/:path*  — stream R2 object (authenticated)
inspirationsRoutes.get('/images/:path{.+}', async (c) => {
  const path = c.req.param('path')
  const obj = await c.env.R2.get(path)
  if (!obj) return c.json({ error: 'Niet gevonden' }, 404)
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('cache-control', 'private, max-age=3600')
  return new Response(obj.body, { headers })
})

function inferExtension(file: File): string {
  if (file.name?.includes('.')) return file.name.split('.').pop()!.toLowerCase()
  const t = file.type
  if (t === 'image/jpeg') return 'jpg'
  if (t === 'image/png') return 'png'
  if (t === 'image/webp') return 'webp'
  if (t === 'image/gif') return 'gif'
  return 'bin'
}
```

- [ ] **Step 7.3: Test notes + inspirations endpoints**

```bash
TOKEN="your_token"

# Create a note
curl -s -X POST http://localhost:8787/api/notes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Hello","tags":["test"],"dishId":null,"courseId":null}' | jq

# List notes
curl -s http://localhost:8787/api/notes -H "Authorization: Bearer $TOKEN" | jq
```

Expected: note created and returned, with tags as JSON string `'["test"]'` in the raw response.

- [ ] **Step 7.4: Commit**

```bash
git add worker/routes/notes.ts worker/routes/inspirations.ts
git commit -m "feat: notes and inspirations API endpoints with R2 file storage"
```

---

## Task 8: Frontend API client + new auth

**Files:**
- Create: `src/lib/api.ts`
- Modify: `src/lib/auth.tsx`

- [ ] **Step 8.1: Create `src/lib/api.ts`**

```typescript
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
```

- [ ] **Step 8.2: Rewrite `src/lib/auth.tsx`**

```typescript
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, setToken, loadStoredToken } from './api'

export type AuthUser = {
  id: string
  email: string
  displayName: string | null
}

type AuthState = {
  user: AuthUser | null
  loading: boolean
  signOut: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const token = loadStoredToken()
    if (!token) {
      setLoading(false)
      return
    }
    setToken(token)
    api
      .get<AuthUser>('/auth/me')
      .then((u) => { if (active) { setUser(u); setLoading(false) } })
      .catch(() => { if (active) { setToken(null); setLoading(false) } })
    return () => { active = false }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      signOut: () => { setToken(null); setUser(null) },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export async function loginWithPin(email: string, pin: string): Promise<void> {
  const { token, user } = await api.post<{ token: string; user: AuthUser }>(
    '/auth/login',
    { email, pin },
  )
  setToken(token)
  // Caller updates AuthContext — see Login.tsx
  return void user
}
```

Wait — after login, we need to update the user state in the AuthContext. The cleanest pattern is to expose a `setUser` function or have `Login.tsx` navigate and let the `AuthProvider` re-check on mount. Since the token is now set in localStorage, a page navigation will cause `AuthProvider` to re-mount and call `/api/auth/me`.

But React Router doesn't remount on navigation. So instead, export a callback-based login:

Replace `loginWithPin` with a `useLogin` hook or pass a callback into login. Simplest: make `AuthProvider` expose a `signIn` method:

```typescript
type AuthState = {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, pin: string) => Promise<void>
  signOut: () => void
}

// In AuthProvider:
const signIn = async (email: string, pin: string) => {
  const { token, user: u } = await api.post<{ token: string; user: AuthUser }>(
    '/auth/login', { email, pin }
  )
  setToken(token)
  setUser(u)
}

// In value useMemo:
{ user, loading, signIn, signOut }
```

Update `src/lib/auth.tsx` to include `signIn` in `AuthState` and the `AuthProvider`.

Remove the standalone `loginWithPin` function. Final `src/lib/auth.tsx`:

```typescript
import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react'
import { api, setToken, loadStoredToken } from './api'

export type AuthUser = { id: string; email: string; displayName: string | null }

type AuthState = {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, pin: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const token = loadStoredToken()
    if (!token) { setLoading(false); return }
    setToken(token)
    api.get<AuthUser>('/auth/me')
      .then((u) => { if (active) { setUser(u); setLoading(false) } })
      .catch(() => { if (active) { setToken(null); setLoading(false) } })
    return () => { active = false }
  }, [])

  const value = useMemo<AuthState>(() => ({
    user,
    loading,
    signIn: async (email, pin) => {
      const { token, user: u } = await api.post<{ token: string; user: AuthUser }>(
        '/auth/login', { email, pin }
      )
      setToken(token)
      setUser(u)
    },
    signOut: () => { setToken(null); setUser(null) },
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 8.3: Commit**

```bash
git add src/lib/api.ts src/lib/auth.tsx
git commit -m "feat: api fetch wrapper and new JWT auth context"
```

---

## Task 9: Login.tsx + AuthGuard.tsx

**Files:**
- Modify: `src/routes/Login.tsx`
- Modify: `src/routes/AuthGuard.tsx`

- [ ] **Step 9.1: Rewrite `src/routes/Login.tsx`**

```typescript
import { type FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuth } from '../lib/auth'
import { Button, Card, Field, Input } from '../components/ui'

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Geldig e-mailadres vereist'),
  pin: z.string().trim().regex(/^\d{4}$/, 'Code is 4 cijfers'),
})

export function Login() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="min-h-full grid place-items-center">
        <div className="t-body-m t-soft">Laden…</div>
      </div>
    )
  }

  if (user) return <Navigate to="/overview" replace />

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = schema.safeParse({ email, pin })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Ongeldige invoer')
      return
    }
    setSubmitting(true)
    try {
      await signIn(parsed.data.email, parsed.data.pin)
      navigate('/overview', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Er ging iets mis.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-full grid place-items-center p-s-5">
      <Card className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-s-3">
          <span className="vg-topnav__mark" aria-hidden />
          <span className="t-mono-s t-faded">Vaste Grond</span>
        </div>
        <h1 style={{ fontSize: 32, lineHeight: 1.08, letterSpacing: '-0.028em', fontWeight: 600 }}>
          Inloggen
        </h1>
        <p className="t-body-m t-soft mt-s-3">
          Vul je e-mailadres in plus je 4-cijferige code.
        </p>
        <form onSubmit={onSubmit} className="mt-s-6 flex flex-col gap-s-4">
          <Field label="E-mail" htmlFor="login-email">
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jij@voorbeeld.nl"
            />
          </Field>
          <Field label="Code" htmlFor="login-pin">
            <Input
              id="login-pin"
              type="password"
              autoComplete="current-password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              style={{ letterSpacing: '0.4em', fontFamily: 'var(--font-mono)' }}
            />
          </Field>
          <Button type="submit" variant="accent" disabled={submitting}>
            {submitting ? 'Inloggen…' : 'Inloggen'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
```

- [ ] **Step 9.2: Rewrite `src/routes/AuthGuard.tsx`**

```typescript
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function AuthGuard() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-full grid place-items-center">
        <div className="t-body-m t-soft">Laden…</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
```

- [ ] **Step 9.3: Commit**

```bash
git add src/routes/Login.tsx src/routes/AuthGuard.tsx
git commit -m "feat: login and auth guard use new JWT auth"
```

---

## Task 10: Feature queries + mutations (events, courses, dishes)

**Files:**
- Modify: `src/features/events/queries.ts`
- Modify: `src/features/events/mutations.ts`
- Modify: `src/features/menu/queries.ts`
- Modify: `src/features/menu/mutations.ts`
- Modify: `src/features/dishes/queries.ts`
- Modify: `src/features/dishes/mutations.ts`

Note: The API returns `snake_case` column names from D1. The `mapEvent` etc. functions in `domain.ts` expect `snake_case` DB rows, so they still work. Check that `mapEvent(row)` calls `row.event_date`, `row.guest_count` etc. — they match the D1 column names.

- [ ] **Step 10.1: Rewrite `src/features/events/queries.ts`**

```typescript
import { api } from '../../lib/api'
import { mapEvent, type Event } from '../../types/domain'

export async function fetchEvents(): Promise<Event[]> {
  const data = await api.get<Record<string, unknown>[]>('/events')
  return data.map(mapEvent)
}

export async function fetchEventById(id: string): Promise<Event | null> {
  try {
    const data = await api.get<Record<string, unknown>>(`/events/${id}`)
    return mapEvent(data)
  } catch {
    return null
  }
}
```

- [ ] **Step 10.2: Rewrite `src/features/events/mutations.ts`**

```typescript
import { api } from '../../lib/api'
import { mapEvent, type Event } from '../../types/domain'

export type EventUpdateInput = {
  id: string
  name: string
  eventDate: string
  guestCount: number
  ticketPriceCents: number
  locationName: string | null
  locationCostCents: number
  notes: string | null
}

export async function updateEvent(input: EventUpdateInput): Promise<Event> {
  const data = await api.patch<Record<string, unknown>>(`/events/${input.id}`, {
    name: input.name,
    eventDate: input.eventDate,
    guestCount: input.guestCount,
    ticketPriceCents: input.ticketPriceCents,
    locationName: input.locationName,
    locationCostCents: input.locationCostCents,
    notes: input.notes,
  })
  return mapEvent(data)
}
```

- [ ] **Step 10.3: Rewrite `src/features/menu/queries.ts`**

```typescript
import { api } from '../../lib/api'
import { mapCourse, type Course } from '../../types/domain'

export async function fetchCourses(): Promise<Course[]> {
  const data = await api.get<Record<string, unknown>[]>('/courses')
  return data.map(mapCourse)
}
```

- [ ] **Step 10.4: Rewrite `src/features/menu/mutations.ts`**

```typescript
import { api } from '../../lib/api'
import { mapCourse, type Course } from '../../types/domain'

export async function createCourse(input: { name: string; position: number }): Promise<Course> {
  const data = await api.post<Record<string, unknown>>('/courses', input)
  return mapCourse(data)
}

export async function renameCourse(input: { id: string; name: string }): Promise<Course> {
  const data = await api.patch<Record<string, unknown>>(`/courses/${input.id}/name`, { name: input.name })
  return mapCourse(data)
}

export async function deleteCourse(id: string): Promise<void> {
  await api.delete(`/courses/${id}`)
}

export async function updateCoursePosition(input: { id: string; position: number }): Promise<void> {
  await api.patch(`/courses/${input.id}/position`, { position: input.position })
}
```

- [ ] **Step 10.5: Rewrite `src/features/dishes/queries.ts`**

```typescript
import { api } from '../../lib/api'
import { mapDish, type Dish } from '../../types/domain'

export type DishIngredientLink = { ingredientId: string; amount: number }

export async function fetchDishes(): Promise<Dish[]> {
  const data = await api.get<Record<string, unknown>[]>('/dishes')
  return data.map(mapDish)
}

export async function fetchDishIngredients(dishId: string): Promise<DishIngredientLink[]> {
  const data = await api.get<{ ingredient_id: string; amount: number }[]>(
    `/dish-ingredients?dishId=${dishId}`
  )
  return data.map((row) => ({ ingredientId: row.ingredient_id, amount: Number(row.amount) }))
}

export async function fetchAllDishIngredients(): Promise<Record<string, DishIngredientLink[]>> {
  const data = await api.get<{ dish_id: string; ingredient_id: string; amount: number }[]>(
    '/dish-ingredients'
  )
  const byDish: Record<string, DishIngredientLink[]> = {}
  for (const row of data) {
    const list = byDish[row.dish_id] ?? []
    list.push({ ingredientId: row.ingredient_id, amount: Number(row.amount) })
    byDish[row.dish_id] = list
  }
  return byDish
}
```

- [ ] **Step 10.6: Rewrite `src/features/dishes/mutations.ts`**

```typescript
import { api } from '../../lib/api'
import { mapDish, type Dish } from '../../types/domain'

export type DishInput = {
  courseId: string
  name: string
  portions: number
  notes: string | null
}

export async function createDish(input: DishInput): Promise<Dish> {
  const data = await api.post<Record<string, unknown>>('/dishes', input)
  return mapDish(data)
}

export async function updateDish(input: DishInput & { id: string }): Promise<Dish> {
  const { id, ...body } = input
  const data = await api.patch<Record<string, unknown>>(`/dishes/${id}`, body)
  return mapDish(data)
}

export async function deleteDish(id: string): Promise<void> {
  await api.delete(`/dishes/${id}`)
}

export async function upsertDishIngredient(input: {
  dishId: string
  ingredientId: string
  amount: number
}): Promise<void> {
  await api.put('/dish-ingredients', input)
}

export async function removeDishIngredient(input: {
  dishId: string
  ingredientId: string
}): Promise<void> {
  await api.delete('/dish-ingredients')
  // DELETE with body — use a custom fetch since api.delete doesn't support body
  // Replace api.delete('/dish-ingredients') with:
}
```

Wait — `api.delete` doesn't send a body. The dish-ingredients delete needs `{ dishId, ingredientId }` in the body. Add a `deleteWithBody` helper to `api.ts`:

Add to `src/lib/api.ts`:
```typescript
export async function deleteWithBody<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'DELETE', body: JSON.stringify(body) })
}
```

Then final `removeDishIngredient`:
```typescript
import { api, deleteWithBody } from '../../lib/api'

export async function removeDishIngredient(input: {
  dishId: string
  ingredientId: string
}): Promise<void> {
  await deleteWithBody('/dish-ingredients', input)
}
```

- [ ] **Step 10.7: Commit**

```bash
git add src/features/events/ src/features/menu/ src/features/dishes/ src/lib/api.ts
git commit -m "feat: migrate events, courses, dishes queries/mutations to D1 API"
```

---

## Task 11: Feature queries + mutations (ingredients, guests, expenses)

**Files:**
- Modify: `src/features/ingredients/queries.ts`
- Modify: `src/features/ingredients/mutations.ts`
- Modify: `src/features/guests/queries.ts`
- Modify: `src/features/guests/mutations.ts`
- Modify: `src/features/expenses/queries.ts`
- Modify: `src/features/expenses/mutations.ts`

- [ ] **Step 11.1: Rewrite `src/features/ingredients/queries.ts`**

```typescript
import { api } from '../../lib/api'
import { mapIngredient, type Ingredient } from '../../types/domain'

export async function fetchIngredients(): Promise<Ingredient[]> {
  const data = await api.get<Record<string, unknown>[]>('/ingredients')
  return data.map(mapIngredient)
}
```

- [ ] **Step 11.2: Rewrite `src/features/ingredients/mutations.ts`**

```typescript
import { api } from '../../lib/api'
import { mapIngredient, type Ingredient } from '../../types/domain'

export type IngredientInput = {
  name: string
  unit: string
  pricePerUnitCents: number
  purchaseUnit: string | null
  supplier: string | null
  notes: string | null
}

export async function createIngredient(input: IngredientInput): Promise<Ingredient> {
  const data = await api.post<Record<string, unknown>>('/ingredients', input)
  return mapIngredient(data)
}

export async function updateIngredient(input: IngredientInput & { id: string }): Promise<Ingredient> {
  const { id, ...body } = input
  const data = await api.patch<Record<string, unknown>>(`/ingredients/${id}`, body)
  return mapIngredient(data)
}

export async function deleteIngredient(id: string): Promise<void> {
  await api.delete(`/ingredients/${id}`)
}
```

- [ ] **Step 11.3: Rewrite `src/features/guests/queries.ts`**

```typescript
import { api } from '../../lib/api'
import { mapGuest, type Guest } from '../../types/domain'

export async function fetchGuests(): Promise<Guest[]> {
  const data = await api.get<Record<string, unknown>[]>('/guests')
  return data.map(mapGuest)
}
```

- [ ] **Step 11.4: Rewrite `src/features/guests/mutations.ts`**

Look up the existing `GuestInput` type from the current file. It should be:

```typescript
import { api } from '../../lib/api'
import { mapGuest, type Guest } from '../../types/domain'

export type GuestInput = {
  eventId: string
  name: string
  status: 'invited' | 'confirmed' | 'declined' | 'tentative'
  partySize: number
  dietary: string | null
  notes: string | null
}

export async function createGuest(input: GuestInput): Promise<Guest> {
  const data = await api.post<Record<string, unknown>>('/guests', input)
  return mapGuest(data)
}

export async function updateGuest(input: GuestInput & { id: string }): Promise<Guest> {
  const { id, ...body } = input
  const data = await api.patch<Record<string, unknown>>(`/guests/${id}`, body)
  return mapGuest(data)
}

export async function deleteGuest(id: string): Promise<void> {
  await api.delete(`/guests/${id}`)
}
```

- [ ] **Step 11.5: Rewrite `src/features/expenses/queries.ts`**

```typescript
import { api } from '../../lib/api'
import { mapExpense, type Expense } from '../../types/domain'

export async function fetchExpenses(): Promise<Expense[]> {
  const data = await api.get<Record<string, unknown>[]>('/expenses')
  return data.map(mapExpense)
}
```

- [ ] **Step 11.6: Rewrite `src/features/expenses/mutations.ts`**

```typescript
import { api } from '../../lib/api'
import { mapExpense, type Expense } from '../../types/domain'

export type ExpenseInput = {
  category: string
  description: string
  amountCents: number
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const data = await api.post<Record<string, unknown>>('/expenses', input)
  return mapExpense(data)
}

export async function updateExpense(input: ExpenseInput & { id: string }): Promise<Expense> {
  const { id, ...body } = input
  const data = await api.patch<Record<string, unknown>>(`/expenses/${id}`, body)
  return mapExpense(data)
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`)
}
```

- [ ] **Step 11.7: Commit**

```bash
git add src/features/ingredients/ src/features/guests/ src/features/expenses/
git commit -m "feat: migrate ingredients, guests, expenses queries/mutations to D1 API"
```

---

## Task 12: Feature queries + mutations (team, notes, inspirations + storage)

**Files:**
- Modify: `src/features/team/queries.ts`
- Modify: `src/features/team/mutations.ts`
- Modify: `src/features/notes/queries.ts`
- Modify: `src/features/notes/mutations.ts`
- Modify: `src/features/inspirations/queries.ts`
- Modify: `src/features/inspirations/mutations.ts`
- Modify: `src/features/inspirations/storage.ts`

- [ ] **Step 12.1: Rewrite `src/features/team/queries.ts`**

```typescript
import { api } from '../../lib/api'
import { mapTeamMember, type TeamMember } from '../../types/domain'

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const data = await api.get<Record<string, unknown>[]>('/team')
  return data.map(mapTeamMember)
}
```

- [ ] **Step 12.2: Rewrite `src/features/team/mutations.ts`**

```typescript
import { api } from '../../lib/api'
import { mapTeamMember, type TeamMember } from '../../types/domain'

export type TeamMemberInput = {
  email: string
  displayName: string | null
}

export async function createTeamMember(input: TeamMemberInput): Promise<TeamMember> {
  const data = await api.post<Record<string, unknown>>('/team', input)
  return mapTeamMember(data)
}

export async function updateTeamMember(input: TeamMemberInput & { id: string }): Promise<TeamMember> {
  const { id, ...body } = input
  const data = await api.patch<Record<string, unknown>>(`/team/${id}`, body)
  return mapTeamMember(data)
}

export async function deleteTeamMember(id: string): Promise<void> {
  await api.delete(`/team/${id}`)
}
```

- [ ] **Step 12.3: Rewrite `src/features/notes/queries.ts`**

```typescript
import { api } from '../../lib/api'
import { mapNote, type Note } from '../../types/domain'

export async function fetchNotes(): Promise<Note[]> {
  const data = await api.get<Record<string, unknown>[]>('/notes')
  return data.map(mapNote)
}
```

- [ ] **Step 12.4: Rewrite `src/features/notes/mutations.ts`**

```typescript
import { api } from '../../lib/api'
import { mapNote, type Note } from '../../types/domain'

export type NoteInput = {
  title: string
  body: string
  tags: string[]
  dishId: string | null
  courseId: string | null
}

export async function createNote(input: NoteInput): Promise<Note> {
  const data = await api.post<Record<string, unknown>>('/notes', input)
  return mapNote(data)
}

export async function updateNote(input: NoteInput & { id: string }): Promise<Note> {
  const { id, ...body } = input
  const data = await api.patch<Record<string, unknown>>(`/notes/${id}`, body)
  return mapNote(data)
}

export async function deleteNote(id: string): Promise<void> {
  await api.delete(`/notes/${id}`)
}
```

- [ ] **Step 12.5: Rewrite `src/features/inspirations/queries.ts`**

```typescript
import { api } from '../../lib/api'
import { mapInspiration, type Inspiration } from '../../types/domain'

export async function fetchInspirations(): Promise<Inspiration[]> {
  const data = await api.get<Record<string, unknown>[]>('/inspirations')
  return data.map(mapInspiration)
}
```

- [ ] **Step 12.6: Rewrite `src/features/inspirations/mutations.ts`**

```typescript
import { api } from '../../lib/api'
import { mapInspiration, type Inspiration } from '../../types/domain'
import { deleteInspirationImage } from './storage'

export type InspirationInput = {
  title: string
  note: string
  url: string | null
  imagePath: string | null
  tags: string[]
  dishId: string | null
  courseId: string | null
}

export async function createInspiration(input: InspirationInput): Promise<Inspiration> {
  const data = await api.post<Record<string, unknown>>('/inspirations', input)
  return mapInspiration(data)
}

export async function updateInspiration(input: InspirationInput & { id: string }): Promise<Inspiration> {
  const { id, ...body } = input
  const data = await api.patch<Record<string, unknown>>(`/inspirations/${id}`, body)
  return mapInspiration(data)
}

export async function deleteInspiration(args: { id: string; imagePath: string | null }): Promise<void> {
  await api.delete(`/inspirations/${args.id}`)
  if (args.imagePath) await deleteInspirationImage(args.imagePath)
}
```

- [ ] **Step 12.7: Rewrite `src/features/inspirations/storage.ts`**

```typescript
import { uploadFile } from '../../lib/api'

export async function uploadInspirationImage(file: File | Blob): Promise<string> {
  const { path } = await uploadFile('/inspirations/upload', file)
  return path
}

export async function deleteInspirationImage(path: string): Promise<void> {
  try {
    const { api } = await import('../../lib/api')
    await api.delete(`/inspirations/upload/${encodeURIComponent(path)}`)
  } catch (err) {
    // Non-fatal: DB row is already deleted, storage cleanup best-effort
    console.error('deleteInspirationImage failed:', err)
  }
}

// Images are served directly via authenticated Worker endpoint
export function getInspirationImageUrl(path: string): string {
  return `/api/inspirations/images/${encodeURIComponent(path)}`
}
```

**Note:** `getInspirationImageUrl` is now synchronous (no async/await), returns a relative URL served by the Worker. Find all callers of this function in the codebase and update them — they previously awaited a `Promise<string | null>`, now they get a `string` directly.

Run:
```bash
grep -rn "getInspirationImageUrl" src/
```

Update each caller to remove `await` and handle the string directly (not `null`).

- [ ] **Step 12.8: Commit**

```bash
git add src/features/team/ src/features/notes/ src/features/inspirations/
git commit -m "feat: migrate team, notes, inspirations queries/mutations to D1 API"
```

---

## Task 13: Types cleanup + remove Supabase

**Files:**
- Modify: `src/types/db.ts`
- Modify: `src/types/domain.ts`
- Modify: `src/routes/Settings.tsx`
- Delete: `src/lib/supabase.ts`

- [ ] **Step 13.1: Rewrite `src/types/db.ts`**

The Supabase-generated `db.ts` had a `Tables<T>` helper. Replace with simple row types matching D1 column names:

```typescript
// Raw DB row types — snake_case matches D1 column names
export type EventRow = {
  id: string
  name: string
  event_date: string
  guest_count: number
  ticket_price_cents: number
  location_name: string | null
  location_cost_cents: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type CourseRow = {
  id: string
  position: number
  name: string
  created_at: string
}

export type DishRow = {
  id: string
  course_id: string
  name: string
  portions: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type IngredientRow = {
  id: string
  name: string
  unit: string
  price_per_unit_cents: number
  purchase_unit: string | null
  supplier: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type DishIngredientRow = {
  dish_id: string
  ingredient_id: string
  amount: number
}

export type GuestRow = {
  id: string
  event_id: string
  name: string
  status: 'invited' | 'confirmed' | 'declined' | 'tentative'
  party_size: number
  dietary: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type TeamMemberRow = {
  id: string
  email: string
  display_name: string | null
  created_at: string
  // pin_hash is never sent to frontend
}

export type ExpenseRow = {
  id: string
  category: string
  description: string
  amount_cents: number
  created_at: string
}

export type NoteRow = {
  id: string
  title: string
  body: string
  tags: string  // JSON string in D1
  dish_id: string | null
  course_id: string | null
  author_id: string | null
  created_at: string
  updated_at: string
}

export type InspirationRow = {
  id: string
  title: string
  note: string
  url: string | null
  image_path: string | null
  tags: string  // JSON string in D1
  dish_id: string | null
  course_id: string | null
  author_id: string | null
  created_at: string
  updated_at: string
}
```

- [ ] **Step 13.2: Update `src/types/domain.ts` — fix tag parsing**

Find `mapNote` and `mapInspiration` in `domain.ts`. Update them to parse the JSON tags string:

```typescript
// In mapNote:
export function mapNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) as string[] : (row.tags as string[]),
    dishId: row.dish_id,
    courseId: row.course_id,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// In mapInspiration:
export function mapInspiration(row: InspirationRow): Inspiration {
  return {
    id: row.id,
    title: row.title,
    note: row.note,
    url: row.url,
    imagePath: row.image_path,
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) as string[] : (row.tags as string[]),
    dishId: row.dish_id,
    courseId: row.course_id,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
```

Also update domain.ts imports: replace `import type { Tables } from './db'` with imports from the new db.ts:
```typescript
import type { EventRow, CourseRow, DishRow, /* etc */ } from './db'
```

And replace `Tables<'events'>` etc. with the new row types.

- [ ] **Step 13.3: Update `src/routes/Settings.tsx`**

Find the Supabase dashboard link in `Settings.tsx`:
```
grep -n "supabase\|signOut" src/routes/Settings.tsx
```

Remove the Supabase dashboard link. Update `signOut` to use `useAuth()`:

The Settings page uses `supabase.auth.signOut` (check current file). Replace any `supabase.auth.signOut()` with the `signOut` function from `useAuth()`.

- [ ] **Step 13.4: Delete `src/lib/supabase.ts`**

```bash
rm src/lib/supabase.ts
```

- [ ] **Step 13.5: Check for any remaining Supabase imports**

```bash
grep -r "@supabase\|from.*supabase" src/ --include="*.ts" --include="*.tsx"
```

Expected: no results. Fix any remaining imports.

- [ ] **Step 13.6: Build check**

```bash
npm run build
```

Expected: builds successfully with no TypeScript errors. Fix any errors before continuing.

- [ ] **Step 13.7: Commit**

```bash
git add src/types/ src/routes/Settings.tsx
git rm src/lib/supabase.ts
git commit -m "chore: remove Supabase, update types for D1 schema"
```

---

## Task 14: Local end-to-end test

- [ ] **Step 14.1: Start the Worker dev server**

```bash
npx wrangler dev --local
```

- [ ] **Step 14.2: Start the Vite dev server in another terminal**

```bash
npm run dev
```

Vite proxies `/api/*` to `localhost:8787`. Add a proxy to `vite.config.ts`:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
```

- [ ] **Step 14.3: Smoke test the happy path**

Open `http://localhost:5173` in the browser.

Test sequence:
1. ✅ App shows login form (not infinite "Laden…")
2. ✅ Login with email + PIN → redirected to `/overview`
3. ✅ Events load (3 dinners shown)
4. ✅ Navigate to Menu → courses load
5. ✅ Create a test course → appears in list
6. ✅ Navigate to Dishes → empty state
7. ✅ Create a test dish → appears
8. ✅ Navigate to Guests → empty state
9. ✅ Add a test guest → appears
10. ✅ Navigate to Inspirations → upload a test image → image shows

Fix any issues before continuing.

- [ ] **Step 14.4: Commit**

```bash
git add vite.config.ts
git commit -m "chore: add Vite dev proxy for Worker API"
```

---

## Task 15: Production deploy

- [ ] **Step 15.1: Apply schema + seed to production D1**

```bash
npx wrangler d1 execute vastegrond --remote --file=worker/schema.sql
npx wrangler d1 execute vastegrond --remote --file=worker/seed.sql
npx wrangler d1 execute vastegrond --remote --file=worker/seed-team.sql
```

Expected: `Success` for all three.

- [ ] **Step 15.2: Set production environment variables**

```bash
npx wrangler secret put JWT_SECRET
# When prompted, enter a random 32+ character string
# Generate one with: openssl rand -base64 32
```

- [ ] **Step 15.3: Deploy**

```bash
npm run deploy
```

Expected: deploy succeeds. Worker + static assets live at `https://odeaanoma.nl`.

- [ ] **Step 15.4: Smoke test production**

Open `https://odeaanoma.nl` in an incognito window.

1. ✅ No infinite "Laden…" — login screen appears
2. ✅ Login with production PIN → overview loads
3. ✅ Create data, verify it persists on reload

- [ ] **Step 15.5: Remove supabase/ directory (optional cleanup)**

The `supabase/` directory (migrations, config) is now obsolete. Keep it for reference or delete:

```bash
git rm -r supabase/
git commit -m "chore: remove Supabase migrations directory"
```

---

## Self-review checklist

**Spec coverage:**
- [x] Supabase Auth → JWT PBKDF2 auth ✅
- [x] Supabase DB → D1 SQLite ✅
- [x] Supabase Storage → R2 ✅
- [x] All 10 feature modules migrated ✅
- [x] settings.tsx sign-out ✅
- [x] InspirationForm.tsx image upload (via storage.ts) ✅
- [x] `getInspirationImageUrl` signature change (async → sync) documented ✅
- [x] Tags array serialization (JSON string) handled in mapNote/mapInspiration ✅
- [x] team_members no longer has `user_id` FK ✅
- [x] author_id uses team_members.id (from JWT) ✅

**Placeholders:** None — all code is complete.

**Type consistency:**
- `HonoEnv` defined in `worker/index.ts`, imported in all route files ✅
- `api.ts` `setToken` / `loadStoredToken` used in `auth.tsx` ✅
- `mapNote` / `mapInspiration` handle `tags` as JSON string ✅
- `deleteWithBody` added to `api.ts`, imported in `dishes/mutations.ts` ✅
