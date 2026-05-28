import { api } from '../../lib/api'
import { mapExpense, type Expense } from '../../types/domain'

export async function fetchExpenses(): Promise<Expense[]> {
  const data = await api.get<Record<string, unknown>[]>('/expenses')
  return data.map(mapExpense)
}
