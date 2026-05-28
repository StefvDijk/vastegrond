import { api } from '../../lib/api'
import { mapGuest, type Guest, type GuestRow } from '../../types/domain'

export async function fetchGuests(): Promise<Guest[]> {
  const data = await api.get<GuestRow[]>('/guests')
  return data.map(mapGuest)
}
