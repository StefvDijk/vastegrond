import { api } from '../../lib/api'
import { mapInspiration, type Inspiration } from '../../types/domain'
import { deleteInspirationImage } from './storage'

export type InspirationInput = {
  title: string
  note: string
  url: string | null
  imagePath: string | null
  tags: string[]
  dishId: string | null
  courseId: string | null
}

export async function createInspiration(input: InspirationInput): Promise<Inspiration> {
  const data = await api.post<Record<string, unknown>>('/inspirations', input)
  return mapInspiration(data)
}

export async function updateInspiration(input: InspirationInput & { id: string }): Promise<Inspiration> {
  const { id, ...body } = input
  const data = await api.patch<Record<string, unknown>>(`/inspirations/${id}`, body)
  return mapInspiration(data)
}

export async function deleteInspiration(args: { id: string; imagePath: string | null }): Promise<void> {
  await api.delete(`/inspirations/${args.id}`)
  if (args.imagePath) await deleteInspirationImage(args.imagePath)
}
