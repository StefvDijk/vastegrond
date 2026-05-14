import { supabase } from '../../lib/supabase'
import { mapCourse, type Course } from '../../types/domain'

export async function fetchCoursesByEvent(eventId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from('event_courses')
    .select('*')
    .eq('event_id', eventId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('fetchCoursesByEvent failed:', error)
    throw new Error(error.message)
  }

  return (data ?? []).map(mapCourse)
}
