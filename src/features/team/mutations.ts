import { supabase } from '../../lib/supabase'
import { mapTeamMember, type TeamMember } from '../../types/domain'

export type TeamMemberInput = {
  email: string
  displayName: string | null
}

export async function createTeamMember(
  input: TeamMemberInput,
): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      email: input.email.toLowerCase(),
      display_name: input.displayName,
    })
    .select('*')
    .single()
  if (error || !data) {
    console.error('createTeamMember failed:', error)
    throw new Error(error?.message ?? 'Toevoegen mislukt')
  }
  return mapTeamMember(data)
}

export async function updateTeamMember(
  input: TeamMemberInput & { id: string },
): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .update({
      email: input.email.toLowerCase(),
      display_name: input.displayName,
    })
    .eq('id', input.id)
    .select('*')
    .single()
  if (error || !data) {
    console.error('updateTeamMember failed:', error)
    throw new Error(error?.message ?? 'Bewerken mislukt')
  }
  return mapTeamMember(data)
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase.from('team_members').delete().eq('id', id)
  if (error) {
    console.error('deleteTeamMember failed:', error)
    throw new Error(error.message)
  }
}
