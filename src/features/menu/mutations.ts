import { supabase } from '../../lib/supabase'
import { mapCourse, type Course } from '../../types/domain'

export async function createCourse(input: {
  name: string
  position: number
}): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .insert({ name: input.name, position: input.position })
    .select('*')
    .single()

  if (error || !data) {
    console.error('createCourse failed:', error)
    throw new Error(error?.message ?? 'Toevoegen mislukt')
  }
  return mapCourse(data)
}

export async function renameCourse(input: {
  id: string
  name: string
}): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .update({ name: input.name })
    .eq('id', input.id)
    .select('*')
    .single()

  if (error || !data) {
    console.error('renameCourse failed:', error)
    throw new Error(error?.message ?? 'Hernoemen mislukt')
  }
  return mapCourse(data)
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) {
    console.error('deleteCourse failed:', error)
    throw new Error(error.message)
  }
}

export async function updateCoursePosition(input: {
  id: string
  position: number
}): Promise<void> {
  const { error } = await supabase
    .from('courses')
    .update({ position: input.position })
    .eq('id', input.id)
  if (error) {
    console.error('updateCoursePosition failed:', error)
    throw new Error(error.message)
  }
}
