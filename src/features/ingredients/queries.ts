import { supabase } from '../../lib/supabase'
import { mapIngredient, type Ingredient } from '../../types/domain'

export async function fetchIngredients(): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('fetchIngredients failed:', error)
    throw new Error(error.message)
  }
  return (data ?? []).map(mapIngredient)
}
