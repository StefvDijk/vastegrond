import { api } from '../../lib/api'
import { mapGuest, type Guest } from '../../types/domain'

export async function fetchGuests(): Promise<Guest[]> {
  const data = await api.get<Record<string, unknown>[]>('/guests')
  return data.map(mapGuest)
}
