import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchAllDishIngredients,
  fetchDishIngredients,
  fetchDishes,
} from './queries'
import {
  createDish,
  deleteDish,
  removeDishIngredient,
  updateDish,
  upsertDishIngredient,
} from './mutations'

export const dishesKeys = {
  all: ['dishes'] as const,
  ingredients: ['dishes', 'ingredients'] as const,
  ingredientsForDish: (id: string) =>
    ['dishes', 'ingredients', id] as const,
}

export function useDishes() {
  return useQuery({ queryKey: dishesKeys.all, queryFn: fetchDishes })
}

export function useAllDishIngredients() {
  return useQuery({
    queryKey: dishesKeys.ingredients,
    queryFn: fetchAllDishIngredients,
  })
}

export function useDishIngredients(dishId: string | undefined) {
  return useQuery({
    queryKey: dishId
      ? dishesKeys.ingredientsForDish(dishId)
      : ['dishes', 'ingredients', 'none'],
    queryFn: () => fetchDishIngredients(dishId as string),
    enabled: Boolean(dishId),
  })
}

function useInvalidateDishes() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: dishesKeys.all })
}

function useInvalidateIngredientsAll() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: dishesKeys.ingredients })
}

export function useCreateDish() {
  const invalidate = useInvalidateDishes()
  return useMutation({
    mutationFn: createDish,
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateDish() {
  const invalidate = useInvalidateDishes()
  return useMutation({
    mutationFn: updateDish,
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteDish() {
  const invalidate = useInvalidateDishes()
  const invalidateIngredients = useInvalidateIngredientsAll()
  return useMutation({
    mutationFn: deleteDish,
    onSuccess: () => {
      invalidate()
      invalidateIngredients()
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpsertDishIngredient() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: upsertDishIngredient,
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: dishesKeys.ingredients })
      client.invalidateQueries({
        queryKey: dishesKeys.ingredientsForDish(variables.dishId),
      })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useRemoveDishIngredient() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: removeDishIngredient,
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: dishesKeys.ingredients })
      client.invalidateQueries({
        queryKey: dishesKeys.ingredientsForDish(variables.dishId),
      })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
