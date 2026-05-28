import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../lib/types'

export const guestsRoutes = new Hono<HonoEnv>()

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
  const row = await c.env.DB
    .prepare(`
      INSERT INTO guests (id, event_id, name, status, party_size, dietary, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *
    `)
    .bind(crypto.randomUUID(), d.eventId, d.name, d.status, d.partySize, d.dietary, d.notes)
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
    .bind(d.eventId, d.name, d.status, d.partySize, d.dietary, d.notes,
          new Date().toISOString(), c.req.param('id'))
    .first()
  if (!row) return c.json({ error: 'Niet gevonden' }, 404)
  return c.json(row)
})

guestsRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM guests WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})
