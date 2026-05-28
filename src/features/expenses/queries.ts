import { api } from '../../lib/api'
import { mapExpense, type Expense, type ExpenseRow } from '../../types/domain'

export async function fetchExpenses(): Promise<Expense[]> {
  const data = await api.get<ExpenseRow[]>('/expenses')
  return data.map(mapExpense)
}
