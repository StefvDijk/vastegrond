import { api } from '../../lib/api'
import { mapDish, type Dish } from '../../types/domain'

export type DishInput = {
  courseId: string
  name: string
  portions: number
  notes: string | null
}

export async function createDish(input: DishInput): Promise<Dish> {
  const data = await api.post<Record<string, unknown>>('/dishes', input)
  return mapDish(data)
}

export async function updateDish(input: DishInput & { id: string }): Promise<Dish> {
  const { id, ...body } = input
  const data = await api.patch<Record<string, unknown>>(`/dishes/${id}`, body)
  return mapDish(data)
}

export async function deleteDish(id: string): Promise<void> {
  await api.delete(`/dishes/${id}`)
}

export async function upsertDishIngredient(input: {
  dishId: string
  ingredientId: string
  amount: number
}): Promise<void> {
  await api.put('/dish-ingredients', input)
}

export async function removeDishIngredient(input: {
  dishId: string
  ingredientId: string
}): Promise<void> {
  await api.deleteWithBody('/dish-ingredients', input)
}
