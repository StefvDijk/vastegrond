import { supabase } from '../../lib/supabase'
import { mapNote, type Note } from '../../types/domain'

export async function fetchNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('fetchNotes failed:', error)
    throw new Error(error.message)
  }
  return (data ?? []).map(mapNote)
}
