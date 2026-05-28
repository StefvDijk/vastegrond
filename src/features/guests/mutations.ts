import { api } from '../../lib/api'
import { mapGuest, type Guest } from '../../types/domain'

export type GuestInput = {
  eventId: string
  name: string
  status: 'invited' | 'confirmed' | 'declined' | 'tentative'
  partySize: number
  dietary: string | null
  notes: string | null
}

export async function createGuest(input: GuestInput): Promise<Guest> {
  const data = await api.post<Record<string, unknown>>('/guests', input)
  return mapGuest(data)
}

export async function updateGuest(input: GuestInput & { id: string }): Promise<Guest> {
  const { id, ...body } = input
  const data = await api.patch<Record<string, unknown>>(`/guests/${id}`, body)
  return mapGuest(data)
}

export async function deleteGuest(id: string): Promise<void> {
  await api.delete(`/guests/${id}`)
}
