import { api } from '../../lib/api'
import { mapCourse, type Course, type CourseRow } from '../../types/domain'

export async function fetchCourses(): Promise<Course[]> {
  const data = await api.get<CourseRow[]>('/courses')
  return data.map(mapCourse)
}
