import { supabase } from '../../lib/supabase'
import { mapExpense, type Expense } from '../../types/domain'

export async function fetchExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) {
    console.error('fetchExpenses failed:', error)
    throw new Error(error.message)
  }
  return (data ?? []).map(mapExpense)
}
