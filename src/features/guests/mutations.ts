import { supabase } from '../../lib/supabase'
import {
  mapGuest,
  type Guest,
  type GuestStatus,
} from '../../types/domain'

export type GuestInput = {
  eventId: string
  name: string
  status: GuestStatus
  partySize: number
  dietary: string | null
  notes: string | null
}

export async function createGuest(input: GuestInput): Promise<Guest> {
  const { data, error } = await supabase
    .from('guests')
    .insert({
      event_id: input.eventId,
      name: input.name,
      status: input.status,
      party_size: input.partySize,
      dietary: input.dietary,
      notes: input.notes,
    })
    .select('*')
    .single()
  if (error || !data) {
    console.error('createGuest failed:', error)
    throw new Error(error?.message ?? 'Toevoegen mislukt')
  }
  return mapGuest(data)
}

export async function updateGuest(
  input: GuestInput & { id: string },
): Promise<Guest> {
  const { data, error } = await supabase
    .from('guests')
    .update({
      event_id: input.eventId,
      name: input.name,
      status: input.status,
      party_size: input.partySize,
      dietary: input.dietary,
      notes: input.notes,
    })
    .eq('id', input.id)
    .select('*')
    .single()
  if (error || !data) {
    console.error('updateGuest failed:', error)
    throw new Error(error?.message ?? 'Bewerken mislukt')
  }
  return mapGuest(data)
}

export async function deleteGuest(id: string): Promise<void> {
  const { error } = await supabase.from('guests').delete().eq('id', id)
  if (error) {
    console.error('deleteGuest failed:', error)
    throw new Error(error.message)
  }
}
