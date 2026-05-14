import { supabase } from '../../lib/supabase'
import { mapEvent, type Event } from '../../types/domain'

export async function fetchEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })

  if (error) {
    console.error('fetchEvents failed:', error)
    throw new Error(error.message)
  }

  return (data ?? []).map(mapEvent)
}

export async function fetchEventById(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('fetchEventById failed:', error)
    throw new Error(error.message)
  }

  return data ? mapEvent(data) : null
}
