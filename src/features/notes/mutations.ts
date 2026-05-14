import { supabase } from '../../lib/supabase'
import { mapNote, type Note } from '../../types/domain'

export type NoteInput = {
  title: string
  body: string
  tags: string[]
  dishId: string | null
  courseId: string | null
}

export async function createNote(input: NoteInput): Promise<Note> {
  const { data: userData } = await supabase.auth.getUser()
  const authorId = userData.user?.id ?? null

  const { data, error } = await supabase
    .from('notes')
    .insert({
      title: input.title,
      body: input.body,
      tags: input.tags,
      dish_id: input.dishId,
      course_id: input.courseId,
      author_id: authorId,
    })
    .select('*')
    .single()
  if (error || !data) {
    console.error('createNote failed:', error)
    throw new Error(error?.message ?? 'Toevoegen mislukt')
  }
  return mapNote(data)
}

export async function updateNote(
  input: NoteInput & { id: string },
): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update({
      title: input.title,
      body: input.body,
      tags: input.tags,
      dish_id: input.dishId,
      course_id: input.courseId,
    })
    .eq('id', input.id)
    .select('*')
    .single()
  if (error || !data) {
    console.error('updateNote failed:', error)
    throw new Error(error?.message ?? 'Bewerken mislukt')
  }
  return mapNote(data)
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) {
    console.error('deleteNote failed:', error)
    throw new Error(error.message)
  }
}
