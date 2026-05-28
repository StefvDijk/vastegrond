/// <reference types="@cloudflare/workers-types" />
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
  id: string
  email: string
  display_name: string | null
  pin_hash: string
}

const app = new Hono<HonoEnv>()

app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'https://odeaanoma.nl'],
  allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// POST /api/auth/login — public, no JWT required
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

// All other /api/* — require valid JWT
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

// SPA fallthrough for everything else
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
