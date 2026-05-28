import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchInspirations } from './queries'
import {
  createInspiration,
  deleteInspiration,
  updateInspiration,
} from './mutations'
import { getInspirationImageUrl } from './storage'

export const inspirationsKeys = {
  all: ['inspirations'] as const,
  image: (path: string) => ['inspirations', 'image', path] as const,
}

export function useInspirations() {
  return useQuery({ queryKey: inspirationsKeys.all, queryFn: fetchInspirations })
}

export function useInspirationImageUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: path ? inspirationsKeys.image(path) : ['inspirations', 'image', 'none'],
    queryFn: () => getInspirationImageUrl(path as string),
    enabled: Boolean(path),
  })
}

function useInvalidate() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: inspirationsKeys.all })
}

export function useCreateInspiration() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: createInspiration,
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateInspiration() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: updateInspiration,
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteInspiration() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: deleteInspiration,
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  })
}
