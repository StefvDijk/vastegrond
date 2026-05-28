import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../lib/types'

export const ingredientsRoutes = new Hono<HonoEnv>()

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
  const row = await c.env.DB
    .prepare(`
      INSERT INTO ingredients (id, name, unit, price_per_unit_cents, purchase_unit, supplier, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *
    `)
    .bind(crypto.randomUUID(), d.name, d.unit, d.pricePerUnitCents, d.purchaseUnit, d.supplier, d.notes)
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
          new Date().toISOString(), c.req.param('id'))
    .first()
  if (!row) return c.json({ error: 'Niet gevonden' }, 404)
  return c.json(row)
})

ingredientsRoutes.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM ingredients WHERE id = ?').bind(c.req.param('id')).run()
  return c.body(null, 204)
})
