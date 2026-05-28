import { api } from '../../lib/api'
import { mapTeamMember, type TeamMember, type TeamMemberRow } from '../../types/domain'

export type TeamMemberInput = {
  email: string
  displayName: string | null
}

export async function createTeamMember(input: TeamMemberInput): Promise<TeamMember> {
  const data = await api.post<TeamMemberRow>('/team', input)
  return mapTeamMember(data)
}

export async function updateTeamMember(input: TeamMemberInput & { id: string }): Promise<TeamMember> {
  const { id, ...body } = input
  const data = await api.patch<TeamMemberRow>(`/team/${id}`, body)
  return mapTeamMember(data)
}

export async function deleteTeamMember(id: string): Promise<void> {
  await api.delete(`/team/${id}`)
}
