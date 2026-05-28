import { api } from '../../lib/api'
import { mapNote, type Note, type NoteRow } from '../../types/domain'

export type NoteInput = {
  title: string
  body: string
  tags: string[]
  dishId: string | null
  courseId: string | null
}

export async function createNote(input: NoteInput): Promise<Note> {
  const data = await api.post<NoteRow>('/notes', input)
  return mapNote(data)
}

export async function updateNote(input: NoteInput & { id: string }): Promise<Note> {
  const { id, ...body } = input
  const data = await api.patch<NoteRow>(`/notes/${id}`, body)
  return mapNote(data)
}

export async function deleteNote(id: string): Promise<void> {
  await api.delete(`/notes/${id}`)
}
