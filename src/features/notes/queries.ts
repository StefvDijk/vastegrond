import { api } from '../../lib/api'
import { mapNote, type Note, type NoteRow } from '../../types/domain'

export async function fetchNotes(): Promise<Note[]> {
  const data = await api.get<NoteRow[]>('/notes')
  return data.map(mapNote)
}
