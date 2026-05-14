import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchCourses } from './queries'
import {
  createCourse,
  deleteCourse,
  renameCourse,
  updateCoursePosition,
} from './mutations'

export const menuKeys = {
  courses: ['menu', 'courses'] as const,
}

export function useCourses() {
  return useQuery({
    queryKey: menuKeys.courses,
    queryFn: fetchCourses,
  })
}

function useInvalidate() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: menuKeys.courses })
}

export function useCreateCourse() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useRenameCourse() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: renameCourse,
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteCourse() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdateCoursePosition() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: updateCoursePosition,
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  })
}
