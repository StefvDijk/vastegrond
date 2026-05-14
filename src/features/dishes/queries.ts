import { supabase } from '../../lib/supabase'
import { mapDish, type Dish } from '../../types/domain'

export type DishIngredientLink = {
  ingredientId: string
  amount: number
}

export async function fetchDishes(): Promise<Dish[]> {
  const { data, error } = await supabase
    .from('dishes')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) {
    console.error('fetchDishes failed:', error)
    throw new Error(error.message)
  }
  return (data ?? []).map(mapDish)
}

export async function fetchDishIngredients(
  dishId: string,
): Promise<DishIngredientLink[]> {
  const { data, error } = await supabase
    .from('dish_ingredients')
    .select('ingredient_id, amount')
    .eq('dish_id', dishId)
  if (error) {
    console.error('fetchDishIngredients failed:', error)
    throw new Error(error.message)
  }
  return (data ?? []).map((row) => ({
    ingredientId: row.ingredient_id,
    amount: Number(row.amount),
  }))
}

export async function fetchAllDishIngredients(): Promise<
  Record<string, DishIngredientLink[]>
> {
  const { data, error } = await supabase
    .from('dish_ingredients')
    .select('dish_id, ingredient_id, amount')
  if (error) {
    console.error('fetchAllDishIngredients failed:', error)
    throw new Error(error.message)
  }
  const byDish: Record<string, DishIngredientLink[]> = {}
  for (const row of data ?? []) {
    const list = byDish[row.dish_id] ?? []
    list.push({ ingredientId: row.ingredient_id, amount: Number(row.amount) })
    byDish[row.dish_id] = list
  }
  return byDish
}
