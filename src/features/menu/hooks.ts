import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchCoursesByEvent } from './queries'
import {
  createCourse,
  deleteCourse,
  renameCourse,
  updateCoursePosition,
} from './mutations'

export const menuKeys = {
  coursesByEvent: (eventId: string) => ['menu', 'courses', eventId] as const,
}

export function useCourses(eventId: string | undefined) {
  return useQuery({
    queryKey: eventId ? menuKeys.coursesByEvent(eventId) : ['menu', 'courses', 'none'],
    queryFn: () => fetchCoursesByEvent(eventId as string),
    enabled: Boolean(eventId),
  })
}

function invalidateCourses(client: ReturnType<typeof useQueryClient>, eventId: string) {
  return client.invalidateQueries({ queryKey: menuKeys.coursesByEvent(eventId) })
}

export function useCreateCourse(eventId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => invalidateCourses(client, eventId),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useRenameCourse(eventId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: renameCourse,
    onSuccess: () => invalidateCourses(client, eventId),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteCourse(eventId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => invalidateCourses(client, eventId),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateCoursePosition(eventId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: updateCoursePosition,
    onSuccess: () => invalidateCourses(client, eventId),
    onError: (error: Error) => toast.error(error.message),
  })
}
