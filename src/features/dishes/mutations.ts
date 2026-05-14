import { supabase } from '../../lib/supabase'
import { mapDish, type Dish } from '../../types/domain'

export type DishInput = {
  courseId: string
  name: string
  portions: number
  notes: string | null
}

export async function createDish(input: DishInput): Promise<Dish> {
  const { data, error } = await supabase
    .from('dishes')
    .insert({
      course_id: input.courseId,
      name: input.name,
      portions: input.portions,
      notes: input.notes,
    })
    .select('*')
    .single()
  if (error || !data) {
    console.error('createDish failed:', error)
    throw new Error(error?.message ?? 'Toevoegen mislukt')
  }
  return mapDish(data)
}

export async function updateDish(
  input: DishInput & { id: string },
): Promise<Dish> {
  const { data, error } = await supabase
    .from('dishes')
    .update({
      course_id: input.courseId,
      name: input.name,
      portions: input.portions,
      notes: input.notes,
    })
    .eq('id', input.id)
    .select('*')
    .single()
  if (error || !data) {
    console.error('updateDish failed:', error)
    throw new Error(error?.message ?? 'Bewerken mislukt')
  }
  return mapDish(data)
}

export async function deleteDish(id: string): Promise<void> {
  const { error } = await supabase.from('dishes').delete().eq('id', id)
  if (error) {
    console.error('deleteDish failed:', error)
    throw new Error(error.message)
  }
}

export async function upsertDishIngredient(input: {
  dishId: string
  ingredientId: string
  amount: number
}): Promise<void> {
  const { error } = await supabase
    .from('dish_ingredients')
    .upsert(
      {
        dish_id: input.dishId,
        ingredient_id: input.ingredientId,
        amount: input.amount,
      },
      { onConflict: 'dish_id,ingredient_id' },
    )
  if (error) {
    console.error('upsertDishIngredient failed:', error)
    throw new Error(error.message)
  }
}

export async function removeDishIngredient(input: {
  dishId: string
  ingredientId: string
}): Promise<void> {
  const { error } = await supabase
    .from('dish_ingredients')
    .delete()
    .eq('dish_id', input.dishId)
    .eq('ingredient_id', input.ingredientId)
  if (error) {
    console.error('removeDishIngredient failed:', error)
    throw new Error(error.message)
  }
}
