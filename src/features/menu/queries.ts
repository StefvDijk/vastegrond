import { api } from '../../lib/api'
import { mapCourse, type Course } from '../../types/domain'

export async function fetchCourses(): Promise<Course[]> {
  const data = await api.get<Record<string, unknown>[]>('/courses')
  return data.map(mapCourse)
}
