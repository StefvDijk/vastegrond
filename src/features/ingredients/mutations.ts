import { supabase } from '../../lib/supabase'
import { mapIngredient, type Ingredient } from '../../types/domain'

export type IngredientInput = {
  name: string
  unit: string
  pricePerUnitCents: number
  purchaseUnit: string | null
  supplier: string | null
  notes: string | null
}

export async function createIngredient(input: IngredientInput): Promise<Ingredient> {
  const { data, error } = await supabase
    .from('ingredients')
    .insert({
      name: input.name,
      unit: input.unit,
      price_per_unit_cents: input.pricePerUnitCents,
      purchase_unit: input.purchaseUnit,
      supplier: input.supplier,
      notes: input.notes,
    })
    .select('*')
    .single()
  if (error || !data) {
    console.error('createIngredient failed:', error)
    throw new Error(error?.message ?? 'Toevoegen mislukt')
  }
  return mapIngredient(data)
}

export async function updateIngredient(
  input: IngredientInput & { id: string },
): Promise<Ingredient> {
  const { data, error } = await supabase
    .from('ingredients')
    .update({
      name: input.name,
      unit: input.unit,
      price_per_unit_cents: input.pricePerUnitCents,
      purchase_unit: input.purchaseUnit,
      supplier: input.supplier,
      notes: input.notes,
    })
    .eq('id', input.id)
    .select('*')
    .single()
  if (error || !data) {
    console.error('updateIngredient failed:', error)
    throw new Error(error?.message ?? 'Bewerken mislukt')
  }
  return mapIngredient(data)
}

export async function deleteIngredient(id: string): Promise<void> {
  const { error } = await supabase.from('ingredients').delete().eq('id', id)
  if (error) {
    console.error('deleteIngredient failed:', error)
    throw new Error(error.message)
  }
}
