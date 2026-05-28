import { api } from '../../lib/api'
import { mapInspiration, type Inspiration } from '../../types/domain'

export async function fetchInspirations(): Promise<Inspiration[]> {
  const data = await api.get<Record<string, unknown>[]>('/inspirations')
  return data.map(mapInspiration)
}
