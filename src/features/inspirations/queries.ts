import { api } from '../../lib/api'
import { mapInspiration, type Inspiration, type InspirationRow } from '../../types/domain'

export async function fetchInspirations(): Promise<Inspiration[]> {
  const data = await api.get<InspirationRow[]>('/inspirations')
  return data.map(mapInspiration)
}
