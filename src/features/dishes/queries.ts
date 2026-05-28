import { api } from '../../lib/api'
import { mapDish, type Dish, type DishRow } from '../../types/domain'

export type DishIngredientLink = { ingredientId: string; amount: number }

export async function fetchDishes(): Promise<Dish[]> {
  const data = await api.get<DishRow[]>('/dishes')
  return data.map(mapDish)
}

export async function fetchDishIngredients(dishId: string): Promise<DishIngredientLink[]> {
  const data = await api.get<{ ingredient_id: string; amount: number }[]>(
    `/dish-ingredients?dishId=${dishId}`
  )
  return data.map((row) => ({ ingredientId: row.ingredient_id, amount: Number(row.amount) }))
}

export async function fetchAllDishIngredients(): Promise<Record<string, DishIngredientLink[]>> {
  const data = await api.get<{ dish_id: string; ingredient_id: string; amount: number }[]>(
    '/dish-ingredients'
  )
  const byDish: Record<string, DishIngredientLink[]> = {}
  for (const row of data) {
    const list = byDish[row.dish_id] ?? []
    list.push({ ingredientId: row.ingredient_id, amount: Number(row.amount) })
    byDish[row.dish_id] = list
  }
  return byDish
}
