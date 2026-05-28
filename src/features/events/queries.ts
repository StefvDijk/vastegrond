import { api } from '../../lib/api'
import { mapEvent, type Event, type EventRow } from '../../types/domain'

export async function fetchEvents(): Promise<Event[]> {
  const data = await api.get<EventRow[]>('/events')
  return data.map(mapEvent)
}

export async function fetchEventById(id: string): Promise<Event | null> {
  try {
    const data = await api.get<EventRow>(`/events/${id}`)
    return mapEvent(data)
  } catch {
    return null
  }
}
