import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchExpenses } from './queries'
import {
  createExpense,
  deleteExpense,
  updateExpense,
} from './mutations'

export const expensesKeys = {
  all: ['expenses'] as const,
}

export function useExpenses() {
  return useQuery({ queryKey: expensesKeys.all, queryFn: fetchExpenses })
}

function useInvalidate() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: expensesKeys.all })
}

export function useCreateExpense() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateExpense() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: updateExpense,
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteExpense() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  })
}
