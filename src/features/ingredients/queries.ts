import { api } from '../../lib/api'
import { mapIngredient, type Ingredient, type IngredientRow } from '../../types/domain'

export async function fetchIngredients(): Promise<Ingredient[]> {
  const data = await api.get<IngredientRow[]>('/ingredients')
  return data.map(mapIngredient)
}
