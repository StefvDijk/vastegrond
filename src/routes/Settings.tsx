import { useState } from 'react'
import { Mail, Pencil, Plus, Trash2, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import type { TeamMember } from '../types/domain'
import { useAuth } from '../lib/auth'
import { formatDateShort } from '../lib/format'
import { useDeleteTeamMember, useTeamMembers } from '../features/team/hooks'
import { TeamMemberForm } from '../features/team/TeamMemberForm'
import { Button, Card, CardSeparator, ScreenHeader } from '../components/ui'

export function Settings() {
  const { user } = useAuth()
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

  return (
    <div className="vg-page flex flex-col gap-s-9">
      <ScreenHeader
        eyebrow="Wie & waar"
        title="Team"
        description="Toegang tot de app. Sign-ups zijn uit — invites lopen via het Supabase-dashboard."
        actions={
          <Button
            variant="accent"
            onClick={() => {
              setAdding(true)
              setEditing(null)
            }}
          >
            <Plus size={16} aria-hidden /> Teamlid
          </Button>
        }
      />

      {adding ? (
        <Card>
          <h2 className="t-heading-l mb-s-5">Nieuw teamlid</h2>
          <TeamMemberForm onCancel={() => setAdding(false)} onSaved={() => setAdding(false)} />
        </Card>
      ) : null}
      {editing ? (
        <Card>
          <h2 className="t-heading-l mb-s-5">{editing.email}</h2>
          <TeamMemberForm
            member={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => setEditing(null)}
          />
        </Card>
      ) : null}

      {/* Team grid */}
      <section>
        <div className="grid gap-s-5 md:grid-cols-2">
          {teamQ.isLoading ? (
            <p className="t-body-m t-soft">Team laden…</p>
          ) : teamQ.isError ? (
            <p className="t-body-m text-negative">
              {teamQ.error instanceof Error ? teamQ.error.message : 'Fout'}
            </p>
          ) : (teamQ.data?.length ?? 0) === 0 ? (
            <Card>
              <p className="t-body-m t-soft">Nog geen teamleden toegevoegd.</p>
            </Card>
          ) : (
            (teamQ.data ?? []).map((m) => (
              <Card key={m.id}>
                <div className="flex items-start justify-between gap-s-3">
                  <div>
                    <h3 className="t-heading-m">{m.displayName ?? m.email}</h3>
                    <span className="t-body-s t-soft mt-s-1 block">
                      Toegevoegd {formatDateShort(m.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-s-1">
                    <button
                      type="button"
                      aria-label="Bewerken"
                      className="vg-sheet__close"
                      onClick={() => {
                        setEditing(m)
                        setAdding(false)
                      }}
                    >
                      <Pencil size={16} aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="Verwijderen"
                      className="vg-sheet__close hover:text-negative"
                      onClick={() => void handleDelete(m)}
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                </div>
                <CardSeparator />
                <div className="flex flex-col gap-s-2 t-body-s text-ink-soft">
                  <span className="flex items-center gap-s-2">
                    <Mail size={16} aria-hidden /> {m.email}
                  </span>
                  <span className="flex items-center gap-s-2">
                    <UserRound size={16} aria-hidden />
                    {m.userId ? 'Gekoppeld' : 'Nog niet ingelogd'}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Eigen account */}
      <Card>
        <h2 className="t-heading-l">Eigen account</h2>
        <CardSeparator />
        <div className="grid gap-s-5 md:grid-cols-2">
          <div>
            <span className="t-caption t-faded">E-mail</span>
            <div className="mt-s-2 t-body-m text-ink">{user?.email ?? '—'}</div>
          </div>
          <div>
            <span className="t-caption t-faded">Gebruikers-ID</span>
            <div className="mt-s-2 t-body-s t-faded font-mono break-all">
              {user?.id ?? '—'}
            </div>
          </div>
        </div>
      </Card>

      {/* Uitleg invites */}
      <Card>
        <h2 className="t-heading-l">Iemand toegang geven</h2>
        <ol className="mt-s-5 flex flex-col gap-s-3 list-decimal pl-s-5 t-body-m t-soft">
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
            Klik <strong className="text-ink">Add user → Send invitation</strong>, vul het
            e-mailadres in.
          </li>
          <li>Voeg datzelfde e-mailadres hier toe als teamlid voor zichtbaarheid.</li>
        </ol>
      </Card>
    </div>
  )
}
