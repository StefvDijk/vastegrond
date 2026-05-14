import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchNotes } from './queries'
import { createNote, deleteNote, updateNote } from './mutations'

export const notesKeys = {
  all: ['notes'] as const,
}

export function useNotes() {
  return useQuery({ queryKey: notesKeys.all, queryFn: fetchNotes })
}

function useInvalidate() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: notesKeys.all })
}

export function useCreateNote() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: createNote,
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateNote() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: updateNote,
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteNote() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  })
}
