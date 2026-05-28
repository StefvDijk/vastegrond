import { api } from '../../lib/api'
import { mapEvent, type Event } from '../../types/domain'

export async function fetchEvents(): Promise<Event[]> {
  const data = await api.get<Record<string, unknown>[]>('/events')
  return data.map(mapEvent)
}

export async function fetchEventById(id: string): Promise<Event | null> {
  try {
    const data = await api.get<Record<string, unknown>>(`/events/${id}`)
    return mapEvent(data)
  } catch {
    return null
  }
}
