import { supabase } from '../../lib/supabase'
import { mapGuest, type Guest } from '../../types/domain'

export async function fetchGuests(): Promise<Guest[]> {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) {
    console.error('fetchGuests failed:', error)
    throw new Error(error.message)
  }
  return (data ?? []).map(mapGuest)
}
