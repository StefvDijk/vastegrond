import { api } from '../../lib/api'
import { mapIngredient, type Ingredient, type IngredientRow } from '../../types/domain'

export type IngredientInput = {
  name: string
  unit: string
  pricePerUnitCents: number
  purchaseUnit: string | null
  supplier: string | null
  notes: string | null
}

export async function createIngredient(input: IngredientInput): Promise<Ingredient> {
  const data = await api.post<IngredientRow>('/ingredients', input)
  return mapIngredient(data)
}

export async function updateIngredient(input: IngredientInput & { id: string }): Promise<Ingredient> {
  const { id, ...body } = input
  const data = await api.patch<IngredientRow>(`/ingredients/${id}`, body)
  return mapIngredient(data)
}

export async function deleteIngredient(id: string): Promise<void> {
  await api.delete(`/ingredients/${id}`)
}
