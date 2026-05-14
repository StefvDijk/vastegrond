import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchTeamMembers } from './queries'
import {
  createTeamMember,
  deleteTeamMember,
  updateTeamMember,
} from './mutations'

export const teamKeys = {
  all: ['team_members'] as const,
}

export function useTeamMembers() {
  return useQuery({ queryKey: teamKeys.all, queryFn: fetchTeamMembers })
}

function useInvalidate() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: teamKeys.all })
}

export function useCreateTeamMember() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: createTeamMember,
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateTeamMember() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: updateTeamMember,
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteTeamMember() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  })
}
