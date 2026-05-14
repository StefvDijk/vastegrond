import { supabase } from '../../lib/supabase'
import { mapTeamMember, type TeamMember } from '../../types/domain'

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) {
    console.error('fetchTeamMembers failed:', error)
    throw new Error(error.message)
  }
  return (data ?? []).map(mapTeamMember)
}
