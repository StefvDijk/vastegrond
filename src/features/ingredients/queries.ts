import { api } from '../../lib/api'
import { mapIngredient, type Ingredient } from '../../types/domain'

export async function fetchIngredients(): Promise<Ingredient[]> {
  const data = await api.get<Record<string, unknown>[]>('/ingredients')
  return data.map(mapIngredient)
}
