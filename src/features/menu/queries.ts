import { supabase } from '../../lib/supabase'
import { mapCourse, type Course } from '../../types/domain'

export async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('fetchCourses failed:', error)
    throw new Error(error.message)
  }

  return (data ?? []).map(mapCourse)
}
