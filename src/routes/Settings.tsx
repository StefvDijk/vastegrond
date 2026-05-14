import { useState } from 'react'
import { LogOut, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TeamMember } from '../types/domain'
import { useAuth } from '../lib/auth'
import { formatDateShort } from '../lib/format'
import {
  useDeleteTeamMember,
  useTeamMembers,
} from '../features/team/hooks'
import { TeamMemberForm } from '../features/team/TeamMemberForm'

export function Settings() {
  const { user, signOut } = useAuth()
  const teamQ = useTeamMembers()
  const del = useDeleteTeamMember()

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<TeamMember | null>(null)

  async function handleDelete(member: TeamMember) {
    if (!window.confirm(`"${member.email}" uit team verwijderen?`)) return
    try {
      await del.mutateAsync(member.id)
      toast.success('Verwijderd')
    } catch {
      /* toast in hook */
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Uitgelogd')
    } catch (error) {
      console.error('Sign out failed:', error)
      toast.error('Uitloggen mislukt')
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h1 className="text-2xl font-semibold tracking-tight">Instellingen</h1>
        <p className="mt-1 text-sm text-text-muted">
          Account & team. Echte invites lopen via het Supabase-dashboard — hier
          beheer je de zichtbare team-allowlist.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold tracking-tight">Account</h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-text-subtle">
              E-mail
            </dt>
            <dd className="mt-0.5 font-medium tabular-nums">
              {user?.email ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-text-subtle">
              Gebruikers-ID
            </dt>
            <dd className="mt-0.5 truncate font-mono text-xs text-text-muted">
              {user?.id ?? '—'}
            </dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-4 inline-flex items-center gap-1 rounded-ios border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-surface-2 hover:text-text"
        >
          <LogOut className="size-4" aria-hidden /> Uitloggen
        </button>
      </section>

      <section className="card p-5">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Team</h2>
            <p className="mt-1 text-sm text-text-muted">
              Wie heeft toegang tot deze app. Sign-ups zijn uit; gebruikers
              komen binnen via invites in het Supabase-dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAdding(true)
              setEditing(null)
            }}
            className="inline-flex items-center gap-1 rounded-ios bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden /> Nieuw teamlid
          </button>
        </header>

        {adding ? (
          <div className="mt-4 rounded-ios border border-border bg-surface p-4">
            <TeamMemberForm
              onCancel={() => setAdding(false)}
              onSaved={() => setAdding(false)}
            />
          </div>
        ) : null}

        {editing ? (
          <div className="mt-4 rounded-ios border border-border bg-surface p-4">
            <TeamMemberForm
              member={editing}
              onCancel={() => setEditing(null)}
              onSaved={() => setEditing(null)}
            />
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-ios border border-border">
          {teamQ.isLoading ? (
            <p className="p-4 text-sm text-text-muted">Team laden…</p>
          ) : teamQ.isError ? (
            <p className="p-4 text-sm text-danger">
              {teamQ.error instanceof Error ? teamQ.error.message : 'Fout'}
            </p>
          ) : (teamQ.data?.length ?? 0) === 0 ? (
            <p className="p-4 text-sm text-text-muted">
              Nog geen teamleden toegevoegd. Begin met jezelf.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-text-subtle">
                <tr>
                  <th className="px-3 py-2">E-mail</th>
                  <th className="px-3 py-2">Weergavenaam</th>
                  <th className="px-3 py-2">Toegevoegd</th>
                  <th className="px-3 py-2 text-right">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(teamQ.data ?? []).map((m) => (
                  <tr key={m.id} className="hover:bg-surface-2/40">
                    <td className="px-3 py-2 font-medium">{m.email}</td>
                    <td className="px-3 py-2 text-text-muted">
                      {m.displayName ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-text-muted tabular-nums">
                      {formatDateShort(m.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Bewerken"
                          onClick={() => {
                            setEditing(m)
                            setAdding(false)
                          }}
                          className="rounded-ios p-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label="Verwijderen"
                          onClick={() => void handleDelete(m)}
                          className="rounded-ios p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold tracking-tight">Iemand toegang geven</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-text-muted">
          <li>
            Open{' '}
            <a
              href="https://supabase.com/dashboard/project/kodzjrvgzpnjspwfdeos/auth/users"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline hover:no-underline"
            >
              Supabase → Authentication → Users
            </a>
            .
          </li>
          <li>
            Klik <strong>Add user → Send invitation</strong>, vul het e-mailadres in.
          </li>
          <li>
            Voeg datzelfde e-mailadres hier toe als teamlid voor zichtbaarheid.
          </li>
        </ol>
      </section>
    </div>
  )
}
