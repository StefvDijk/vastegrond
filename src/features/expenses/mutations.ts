import { supabase } from '../../lib/supabase'
import { mapExpense, type Expense } from '../../types/domain'

export type ExpenseInput = {
  category: string
  description: string
  amountCents: number
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      category: input.category,
      description: input.description,
      amount_cents: input.amountCents,
    })
    .select('*')
    .single()
  if (error || !data) {
    console.error('createExpense failed:', error)
    throw new Error(error?.message ?? 'Toevoegen mislukt')
  }
  return mapExpense(data)
}

export async function updateExpense(
  input: ExpenseInput & { id: string },
): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .update({
      category: input.category,
      description: input.description,
      amount_cents: input.amountCents,
    })
    .eq('id', input.id)
    .select('*')
    .single()
  if (error || !data) {
    console.error('updateExpense failed:', error)
    throw new Error(error?.message ?? 'Bewerken mislukt')
  }
  return mapExpense(data)
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) {
    console.error('deleteExpense failed:', error)
    throw new Error(error.message)
  }
}
