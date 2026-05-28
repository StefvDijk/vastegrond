import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../lib/types'

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
  const row = await c.env.DB
    .prepare(`
      INSERT INTO team_members (id, email, display_name, pin_hash)
      VALUES (?, ?, ?, 'SETUP_NEEDED') RETURNING id, email, display_name, created_at
    `)
    .bind(crypto.randomUUID(), parsed.data.email.toLowerCase(), parsed.data.displayName)
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
