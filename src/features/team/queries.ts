import { api } from '../../lib/api'
import { mapTeamMember, type TeamMember } from '../../types/domain'

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const data = await api.get<Record<string, unknown>[]>('/team')
  return data.map(mapTeamMember)
}
