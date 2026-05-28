import { api } from '../../lib/api'
import { mapNote, type Note } from '../../types/domain'

export async function fetchNotes(): Promise<Note[]> {
  const data = await api.get<Record<string, unknown>[]>('/notes')
  return data.map(mapNote)
}
