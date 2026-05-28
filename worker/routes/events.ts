import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../lib/types'

export const eventsRoutes = new Hono<HonoEnv>()

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
          d.locationName, d.locationCostCents, d.notes,
          new Date().toISOString(), c.req.param('id'))
    .first()
  if (!row) return c.json({ error: 'Niet gevonden' }, 404)
  return c.json(row)
})
