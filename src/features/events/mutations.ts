import { api } from '../../lib/api'
import { mapEvent, type Event, type EventRow } from '../../types/domain'

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
  const data = await api.patch<EventRow>(`/events/${input.id}`, {
    name: input.name,
    eventDate: input.eventDate,
    guestCount: input.guestCount,
    ticketPriceCents: input.ticketPriceCents,
    locationName: input.locationName,
    locationCostCents: input.locationCostCents,
    notes: input.notes,
  })
  return mapEvent(data)
}
