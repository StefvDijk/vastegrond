import { supabase } from '../../lib/supabase'
import { mapEvent, type Event } from '../../types/domain'

export type EventUpdateInput = {
  id: string
  name: string
  eventDate: string
  guestCount: number
  ticketPriceCents: number
  locationName: string | null
  locationCostCents: number
  notes: string | null
}

export async function updateEvent(input: EventUpdateInput): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update({
      name: input.name,
      event_date: input.eventDate,
      guest_count: input.guestCount,
      ticket_price_cents: input.ticketPriceCents,
      location_name: input.locationName,
      location_cost_cents: input.locationCostCents,
      notes: input.notes,
    })
    .eq('id', input.id)
    .select('*')
    .single()

  if (error || !data) {
    console.error('updateEvent failed:', error)
    throw new Error(error?.message ?? 'Bewerken mislukt')
  }

  return mapEvent(data)
}
