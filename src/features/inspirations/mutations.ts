import { supabase } from '../../lib/supabase'
import { mapInspiration, type Inspiration } from '../../types/domain'
import { deleteInspirationImage } from './storage'

export type InspirationInput = {
  title: string
  note: string
  url: string | null
  imagePath: string | null
  tags: string[]
  dishId: string | null
  courseId: string | null
}

export async function createInspiration(
  input: InspirationInput,
): Promise<Inspiration> {
  const { data: userData } = await supabase.auth.getUser()
  const authorId = userData.user?.id ?? null

  const { data, error } = await supabase
    .from('inspirations')
    .insert({
      title: input.title,
      note: input.note,
      url: input.url,
      image_path: input.imagePath,
      tags: input.tags,
      dish_id: input.dishId,
      course_id: input.courseId,
      author_id: authorId,
    })
    .select('*')
    .single()
  if (error || !data) {
    console.error('createInspiration failed:', error)
    throw new Error(error?.message ?? 'Toevoegen mislukt')
  }
  return mapInspiration(data)
}

export async function updateInspiration(
  input: InspirationInput & { id: string },
): Promise<Inspiration> {
  const { data, error } = await supabase
    .from('inspirations')
    .update({
      title: input.title,
      note: input.note,
      url: input.url,
      image_path: input.imagePath,
      tags: input.tags,
      dish_id: input.dishId,
      course_id: input.courseId,
    })
    .eq('id', input.id)
    .select('*')
    .single()
  if (error || !data) {
    console.error('updateInspiration failed:', error)
    throw new Error(error?.message ?? 'Bewerken mislukt')
  }
  return mapInspiration(data)
}

export async function deleteInspiration(
  args: { id: string; imagePath: string | null },
): Promise<void> {
  // DB-rij eerst weg, dan storage opruimen.
  const { error } = await supabase
    .from('inspirations')
    .delete()
    .eq('id', args.id)
  if (error) {
    console.error('deleteInspiration failed:', error)
    throw new Error(error.message)
  }
  if (args.imagePath) {
    await deleteInspirationImage(args.imagePath)
  }
}
