import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../lib/types'

export const dishesRoutes = new Hono<HonoEnv>()

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
  const d = parsed.data
  const row = await c.env.DB
    .prepare('INSERT INTO dishes (id, course_id, name, portions, notes) VALUES (?, ?, ?, ?, ?) RETURNING *')
    .bind(crypto.randomUUID(), d.courseId, d.name, d.portions, d.notes)
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
    .bind(d.courseId, d.name, d.portions, d.notes, new Date().toISOString(), c.req.param('id'))
    .first()
  if (!row) return c.json({ error: 'Niet gevonden' }, 404)
  return c.json(row)
})

dishesRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM dishes WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})
