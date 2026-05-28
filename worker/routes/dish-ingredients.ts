import { Hono } from 'hono'
import { z } from 'zod'
import type { HonoEnv } from '../lib/types'

export const dishIngredientsRoutes = new Hono<HonoEnv>()

const upsertSchema = z.object({
  dishId: z.string().uuid(),
  ingredientId: z.string().uuid(),
  amount: z.number().min(0),
})

const deleteSchema = z.object({
  dishId: z.string().uuid(),
  ingredientId: z.string().uuid(),
})

// GET /api/dish-ingredients?dishId=<id>  OR  GET /api/dish-ingredients (all)
dishIngredientsRoutes.get('/', async (c) => {
  const dishId = c.req.query('dishId')
  if (dishId) {
    const { results } = await c.env.DB
      .prepare('SELECT ingredient_id, amount FROM dish_ingredients WHERE dish_id = ?')
      .bind(dishId)
      .all()
    return c.json(results)
  }
  const { results } = await c.env.DB
    .prepare('SELECT dish_id, ingredient_id, amount FROM dish_ingredients')
    .all()
  return c.json(results)
})

// PUT /api/dish-ingredients — upsert
dishIngredientsRoutes.put('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  const { dishId, ingredientId, amount } = parsed.data
  await c.env.DB
    .prepare(`
      INSERT INTO dish_ingredients (dish_id, ingredient_id, amount) VALUES (?, ?, ?)
      ON CONFLICT (dish_id, ingredient_id) DO UPDATE SET amount = excluded.amount
    `)
    .bind(dishId, ingredientId, amount)
    .run()
  return c.body(null, 204)
})

// DELETE /api/dish-ingredients — with body {dishId, ingredientId}
dishIngredientsRoutes.delete('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Ongeldige invoer' }, 400)
  await c.env.DB
    .prepare('DELETE FROM dish_ingredients WHERE dish_id = ? AND ingredient_id = ?')
    .bind(parsed.data.dishId, parsed.data.ingredientId)
    .run()
  return c.body(null, 204)
})
