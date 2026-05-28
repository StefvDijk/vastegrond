import { api } from '../../lib/api'
import { mapCourse, type Course, type CourseRow } from '../../types/domain'

export async function createCourse(input: { name: string; position: number }): Promise<Course> {
  const data = await api.post<CourseRow>('/courses', input)
  return mapCourse(data)
}

export async function renameCourse(input: { id: string; name: string }): Promise<Course> {
  const data = await api.patch<CourseRow>(`/courses/${input.id}/name`, { name: input.name })
  return mapCourse(data)
}

export async function deleteCourse(id: string): Promise<void> {
  await api.delete(`/courses/${id}`)
}

export async function updateCoursePosition(input: { id: string; position: number }): Promise<void> {
  await api.patch(`/courses/${input.id}/position`, { position: input.position })
}
