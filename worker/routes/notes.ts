import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../lib/types'

export const notesRoutes = new Hono<HonoEnv>()

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
  const row = await c.env.DB
    .prepare(`
      INSERT INTO notes (id, title, body, tags, dish_id, course_id, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *
    `)
    .bind(crypto.randomUUID(), d.title, d.body, JSON.stringify(d.tags),
          d.dishId, d.courseId, c.get('userId'))
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
    .bind(d.title, d.body, JSON.stringify(d.tags), d.dishId, d.courseId,
          new Date().toISOString(), c.req.param('id'))
    .first()
  if (!row) return c.json({ error: 'Niet gevonden' }, 404)
  return c.json(row)
})

notesRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})
