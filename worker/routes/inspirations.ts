import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../lib/types'

export const inspirationsRoutes = new Hono<HonoEnv>()

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
  const row = await c.env.DB
    .prepare(`
      INSERT INTO inspirations (id, title, note, url, image_path, tags, dish_id, course_id, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *
    `)
    .bind(crypto.randomUUID(), d.title, d.note, d.url, d.imagePath,
          JSON.stringify(d.tags), d.dishId, d.courseId, c.get('userId'))
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
          d.dishId, d.courseId, new Date().toISOString(), c.req.param('id'))
    .first()
  if (!row) return c.json({ error: 'Niet gevonden' }, 404)
  return c.json(row)
})

inspirationsRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM inspirations WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})

// POST /api/inspirations/upload — multipart file upload to R2
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

// DELETE /api/inspirations/upload/:path* — delete from R2
inspirationsRoutes.delete('/upload/:path{.+}', async (c) => {
  const path = c.req.param('path')
  await c.env.R2.delete(path)
  return c.body(null, 204)
})

// GET /api/inspirations/images/:path* — serve R2 object (authenticated)
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
