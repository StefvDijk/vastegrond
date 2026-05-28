import { api } from '../../lib/api'
import { mapTeamMember, type TeamMember, type TeamMemberRow } from '../../types/domain'

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const data = await api.get<TeamMemberRow[]>('/team')
  return data.map(mapTeamMember)
}
