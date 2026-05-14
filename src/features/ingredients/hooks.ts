import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchIngredients } from './queries'
import {
  createIngredient,
  deleteIngredient,
  updateIngredient,
} from './mutations'

export const ingredientsKeys = {
  all: ['ingredients'] as const,
}

export function useIngredients() {
  return useQuery({
    queryKey: ingredientsKeys.all,
    queryFn: fetchIngredients,
  })
}

function useInvalidate() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: ingredientsKeys.all })
}

export function useCreateIngredient() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: createIngredient,
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateIngredient() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: updateIngredient,
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteIngredient() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: deleteIngredient,
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  })
}
