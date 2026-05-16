import { useState } from 'react'
import { Mail, Pencil, Plus, Trash2, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import type { TeamMember } from '../types/domain'
import { useAuth } from '../lib/auth'
import { formatDateShort } from '../lib/format'
import { useDeleteTeamMember, useTeamMembers } from '../features/team/hooks'
import { TeamMemberForm } from '../features/team/TeamMemberForm'
import { Button, Card, CardSeparator, IosNavBar, IosNavAction } from '../components/ui'

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
    <>
      <IosNavBar
        title="Team"
        eyebrow="Wie & waar"
        description="Toegang tot de app. Sign-ups zijn uit — invites lopen via het Supabase-dashboard."
        trailing={
          <IosNavAction
            primary
            onClick={() => {
              setAdding(true)
              setEditing(null)
            }}
            aria-label="Teamlid toevoegen"
          >
            <Plus size={20} aria-hidden />
          </IosNavAction>
        }
      />
      <div className="vg-page flex flex-col gap-s-6 md:gap-s-7">
        {/* Desktop header */}
        <header className="hidden md:flex md:flex-col md:gap-s-3 md:flex-row md:items-end md:justify-between md:gap-s-6">
          <div>
            <span className="t-caption t-faded">Wie & waar</span>
            <h1 className="t-display-m mt-s-2">Team</h1>
            <p className="t-body-s t-soft mt-s-3" style={{ maxWidth: '52ch' }}>
              Toegang tot de app. Sign-ups zijn uit — invites lopen via het Supabase-dashboard.
            </p>
          </div>
          <Button
            variant="accent"
            onClick={() => {
              setAdding(true)
              setEditing(null)
            }}
          >
            <Plus size={16} aria-hidden /> Teamlid
          </Button>
        </header>

      {adding ? (
        <Card>
          <h2 className="t-title-l mb-s-5">Nieuw teamlid</h2>
          <TeamMemberForm onCancel={() => setAdding(false)} onSaved={() => setAdding(false)} />
        </Card>
      ) : null}
      {editing ? (
        <Card>
          <h2 className="t-title-l mb-s-5">{editing.email}</h2>
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
            <div className="vg-card vg-card--bordered">
              <p className="t-body-m t-soft">Nog geen teamleden toegevoegd.</p>
            </div>
          ) : (
            (teamQ.data ?? []).map((m) => (
              <div key={m.id} className="vg-card vg-card--bordered">
                <div className="flex items-start justify-between gap-s-3">
                  <div>
                    <h3
                      style={{ fontSize: 18, lineHeight: 1.3, letterSpacing: '-0.018em', fontWeight: 600 }}
                    >
                      {m.displayName ?? m.email}
                    </h3>
                    <span className="t-mono-s t-faded mt-s-1 block">
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
              </div>
            ))
          )}
        </div>
      </section>

      {/* Eigen account */}
      <Card>
        <h2
          style={{ fontSize: 20, lineHeight: 1.25, letterSpacing: '-0.020em', fontWeight: 600 }}
        >
          Eigen account
        </h2>
        <CardSeparator />
        <div className="grid gap-s-5 md:grid-cols-2">
          <div>
            <span className="t-caption t-faded">E-mail</span>
            <div className="mt-s-2 t-body-m text-ink">{user?.email ?? '—'}</div>
          </div>
          <div>
            <span className="t-caption t-faded">Gebruikers-ID</span>
            <div className="mt-s-2 t-mono-s t-faded break-all">{user?.id ?? '—'}</div>
          </div>
        </div>
      </Card>

      {/* Uitleg invites */}
      <Card>
        <h2
          style={{ fontSize: 20, lineHeight: 1.25, letterSpacing: '-0.020em', fontWeight: 600 }}
        >
          Iemand toegang geven
        </h2>
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
    </>
  )
}
