import { supabase } from '../../lib/supabase'
import { mapInspiration, type Inspiration } from '../../types/domain'

export async function fetchInspirations(): Promise<Inspiration[]> {
  const { data, error } = await supabase
    .from('inspirations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('fetchInspirations failed:', error)
    throw new Error(error.message)
  }
  return (data ?? []).map(mapInspiration)
}
