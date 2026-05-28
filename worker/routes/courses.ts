import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../lib/types'

export const coursesRoutes = new Hono<HonoEnv>()

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
  const row = await c.env.DB
    .prepare('INSERT INTO courses (id, name, position) VALUES (?, ?, ?) RETURNING *')
    .bind(crypto.randomUUID(), parsed.data.name, parsed.data.position)
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
