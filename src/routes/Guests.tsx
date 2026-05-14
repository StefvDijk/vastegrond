import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Event, Guest, GuestStatus } from '../types/domain'
import { useEvents } from '../features/events/hooks'
import { useDeleteGuest, useGuests } from '../features/guests/hooks'
import { GuestForm } from '../features/guests/GuestForm'
import { formatDateLong } from '../lib/format'
import { cn } from '../lib/cn'

const STATUS_LABEL: Record<GuestStatus, string> = {
  invited: 'Genodigd',
  confirmed: 'Bevestigd',
  tentative: 'Voorlopig',
  declined: 'Afgemeld',
}

const STATUS_STYLE: Record<GuestStatus, string> = {
  invited: 'bg-surface-2 text-text-muted',
  confirmed: 'bg-success/15 text-success',
  tentative: 'bg-warning/15 text-warning',
  declined: 'bg-danger/15 text-danger',
}

export function Guests() {
  const eventsQ = useEvents()
  const guestsQ = useGuests()
  const del = useDeleteGuest()

  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Guest | null>(null)

  useEffect(() => {
    if (!selectedId && eventsQ.data && eventsQ.data.length > 0) {
      setSelectedId(eventsQ.data[0]?.id)
    }
  }, [eventsQ.data, selectedId])

  const events = eventsQ.data ?? []
  const selectedEvent: Event | undefined = useMemo(
    () => events.find((e) => e.id === selectedId) ?? events[0],
    [events, selectedId],
  )

  const guestsForEvent = useMemo(() => {
    if (!selectedEvent) return []
    return (guestsQ.data ?? []).filter((g) => g.eventId === selectedEvent.id)
  }, [guestsQ.data, selectedEvent])

  const stats = useMemo(() => {
    const out = {
      invited: 0,
      confirmed: 0,
      tentative: 0,
      declined: 0,
      confirmedSeats: 0,
    }
    for (const g of guestsForEvent) {
      out[g.status] += 1
      if (g.status === 'confirmed') out.confirmedSeats += g.partySize
    }
    return out
  }, [guestsForEvent])

  async function handleDelete(guest: Guest) {
    if (!window.confirm(`"${guest.name}" verwijderen?`)) return
    try {
      await del.mutateAsync(guest.id)
      toast.success('Verwijderd')
    } catch {
      /* toast in hook */
    }
  }

  if (eventsQ.isLoading || guestsQ.isLoading) {
    return <p className="text-sm text-text-muted">Gasten laden…</p>
  }

  if (!selectedEvent) {
    return (
      <div className="card p-5">
        <h1 className="text-2xl font-semibold tracking-tight">Gasten</h1>
        <p className="mt-2 text-sm text-text-muted">
          Maak eerst een event aan in Overzicht.
        </p>
      </div>
    )
  }

  const capacity = selectedEvent.guestCount
  const capacityLeft = capacity - stats.confirmedSeats

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gasten</h1>
            <p className="mt-1 text-sm text-text-muted">
              RSVP per avond. Dieet & allergenen worden meegenomen voor de keuken.
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
            <Plus className="size-4" aria-hidden /> Nieuwe gast
          </button>
        </header>

        <div
          className="mt-4 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Kies avond"
        >
          {events.map((event) => {
            const active = event.id === selectedEvent.id
            return (
              <button
                key={event.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setSelectedId(event.id)
                  setAdding(false)
                  setEditing(null)
                }}
                className={cn(
                  'rounded-ios border px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-accent bg-accent text-accent-fg'
                    : 'border-border bg-surface text-text-muted hover:text-text hover:bg-surface-2',
                )}
              >
                {formatDateLong(event.eventDate)}
              </button>
            )
          })}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          <Stat label="Bevestigd" value={String(stats.confirmed)} accent="success" />
          <Stat label="Voorlopig" value={String(stats.tentative)} accent="warning" />
          <Stat label="Genodigd" value={String(stats.invited)} />
          <Stat label="Afgemeld" value={String(stats.declined)} accent="danger" />
          <Stat
            label={`Stoelen (${stats.confirmedSeats}/${capacity})`}
            value={capacityLeft >= 0 ? `${capacityLeft} vrij` : `${-capacityLeft} over`}
            accent={capacityLeft >= 0 ? undefined : 'danger'}
          />
        </dl>
      </section>

      {adding ? (
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Nieuwe gast — {formatDateLong(selectedEvent.eventDate)}
          </h2>
          <GuestForm
            eventId={selectedEvent.id}
            onCancel={() => setAdding(false)}
            onSaved={() => setAdding(false)}
          />
        </section>
      ) : null}

      {editing ? (
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            {editing.name} bewerken
          </h2>
          <GuestForm
            eventId={selectedEvent.id}
            guest={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => setEditing(null)}
          />
        </section>
      ) : null}

      <section className="card p-0 overflow-hidden">
        {guestsForEvent.length === 0 ? (
          <p className="p-5 text-sm text-text-muted">
            Nog geen gasten voor deze avond.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-text-subtle">
              <tr>
                <th className="px-4 py-3">Naam</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Personen</th>
                <th className="px-4 py-3">Dieet</th>
                <th className="px-4 py-3">Notities</th>
                <th className="px-4 py-3 text-right">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {guestsForEvent.map((g) => (
                <tr key={g.id} className="hover:bg-surface-2/40">
                  <td className="px-4 py-2 font-medium">{g.name}</td>
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        'inline-flex rounded-ios px-2 py-0.5 text-xs font-medium',
                        STATUS_STYLE[g.status],
                      )}
                    >
                      {STATUS_LABEL[g.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {g.partySize}
                  </td>
                  <td className="px-4 py-2 text-text-muted">
                    {g.dietary ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-text-muted">
                    {g.notes ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Bewerken"
                        onClick={() => {
                          setEditing(g)
                          setAdding(false)
                        }}
                        className="rounded-ios p-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
                      >
                        <Pencil className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label="Verwijderen"
                        onClick={() => void handleDelete(g)}
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
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'success' | 'warning' | 'danger'
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-text-subtle">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-0.5 text-xl font-semibold tabular-nums',
          accent === 'success' && 'text-success',
          accent === 'warning' && 'text-warning',
          accent === 'danger' && 'text-danger',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
