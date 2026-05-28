import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../lib/types'

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
  const row = await c.env.DB
    .prepare('INSERT INTO expenses (id, category, description, amount_cents) VALUES (?, ?, ?, ?) RETURNING *')
    .bind(crypto.randomUUID(), d.category, d.description, d.amountCents)
    .first()
  return c.json(row, 201)
})

expensesRoutes.patch('/:id', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = expenseSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const d = parsed.data
  const row = await c.env.DB
    .prepare('UPDATE expenses SET category = ?, description = ?, amount_cents = ? WHERE id = ? RETURNING *')
    .bind(d.category, d.description, d.amountCents, c.req.param('id'))
    .first()
  if (!row) return c.json({ error: 'Niet gevonden' }, 404)
  return c.json(row)
})

expensesRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM expenses WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})
