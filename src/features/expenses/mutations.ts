import { api } from '../../lib/api'
import { mapExpense, type Expense } from '../../types/domain'

export type ExpenseInput = {
  category: string
  description: string
  amountCents: number
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const data = await api.post<Record<string, unknown>>('/expenses', input)
  return mapExpense(data)
}

export async function updateExpense(input: ExpenseInput & { id: string }): Promise<Expense> {
  const { id, ...body } = input
  const data = await api.patch<Record<string, unknown>>(`/expenses/${id}`, body)
  return mapExpense(data)
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`)
}
