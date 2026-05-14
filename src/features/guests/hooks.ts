import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchGuests } from './queries'
import { createGuest, deleteGuest, updateGuest } from './mutations'

export const guestsKeys = {
  all: ['guests'] as const,
}

export function useGuests() {
  return useQuery({ queryKey: guestsKeys.all, queryFn: fetchGuests })
}

function useInvalidate() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: guestsKeys.all })
}

export function useCreateGuest() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: createGuest,
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateGuest() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: updateGuest,
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteGuest() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: deleteGuest,
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  })
}
