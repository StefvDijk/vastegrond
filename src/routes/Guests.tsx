import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import type { Event, Guest, GuestStatus } from '../types/domain'
import { useEvents } from '../features/events/hooks'
import { useDeleteGuest, useGuests } from '../features/guests/hooks'
import { GuestForm } from '../features/guests/GuestForm'
import { formatDateLong } from '../lib/format'
import { Button, Badge, Card, ScreenHeader, Segmented } from '../components/ui'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'

const STATUS_LABEL: Record<GuestStatus, string> = {
  invited: 'Genodigd',
  confirmed: 'Bevestigd',
  tentative: 'Voorlopig',
  declined: 'Afgemeld',
}

const STATUS_VARIANT: Record<GuestStatus, 'neutral' | 'positive' | 'warning' | 'negative'> = {
  invited: 'neutral',
  confirmed: 'positive',
  tentative: 'warning',
  declined: 'negative',
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
    const out = { invited: 0, confirmed: 0, tentative: 0, declined: 0, confirmedSeats: 0 }
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
    return (
      <div className="vg-page">
        <Skeleton className="h-10 w-48 mb-s-7" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!selectedEvent) {
    return (
      <div className="vg-page">
        <ScreenHeader title="Gasten" description="Maak eerst een event aan in Overzicht." />
      </div>
    )
  }

  const capacity = selectedEvent.guestCount
  const capacityLeft = capacity - stats.confirmedSeats

  return (
    <div className="vg-page flex flex-col gap-s-9">
      <ScreenHeader
        eyebrow="RSVP"
        title="Gasten"
        description="Per avond. Dieet en allergenen worden meegenomen voor de keuken."
        actions={
          <Button
            variant="accent"
            onClick={() => {
              setAdding(true)
              setEditing(null)
            }}
          >
            <Plus size={16} aria-hidden /> Nieuwe gast
          </Button>
        }
      />

      <div className="flex items-center gap-s-4 flex-wrap">
        <Segmented
          value={selectedEvent.id}
          options={events.map((e) => ({ value: e.id, label: formatDateLong(e.eventDate) }))}
          onChange={(id) => {
            setSelectedId(id)
            setAdding(false)
            setEditing(null)
          }}
        />
      </div>

      <Card className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-line">
          <Stat label="Bevestigd" value={String(stats.confirmed)} tone="positive" />
          <Stat label="Voorlopig" value={String(stats.tentative)} tone="warning" />
          <Stat label="Genodigd" value={String(stats.invited)} />
          <Stat label="Afgemeld" value={String(stats.declined)} tone="negative" />
          <Stat
            label={`Stoelen ${stats.confirmedSeats}/${capacity}`}
            value={capacityLeft >= 0 ? `${capacityLeft} vrij` : `${-capacityLeft} over`}
            tone={capacityLeft >= 0 ? undefined : 'negative'}
          />
        </div>
      </Card>

      {adding ? (
        <Card>
          <h2 className="t-heading-l mb-s-5">
            Nieuwe gast — {formatDateLong(selectedEvent.eventDate)}
          </h2>
          <GuestForm
            eventId={selectedEvent.id}
            onCancel={() => setAdding(false)}
            onSaved={() => setAdding(false)}
          />
        </Card>
      ) : null}

      {editing ? (
        <Card>
          <h2 className="t-heading-l mb-s-5">{editing.name} bewerken</h2>
          <GuestForm
            eventId={selectedEvent.id}
            guest={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => setEditing(null)}
          />
        </Card>
      ) : null}

      <Card className="p-0 overflow-hidden">
        {guestsForEvent.length === 0 ? (
          <div className="p-s-7">
            <EmptyState
              icon={Users}
              title="Nog geen gasten voor deze avond"
              description="Klik op 'Nieuwe gast' bovenaan om de eerste toe te voegen."
            />
          </div>
        ) : (
          <table className="vg-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>Status</th>
                <th className="vg-table__right">Personen</th>
                <th>Dieet</th>
                <th>Notities</th>
                <th className="vg-table__right" style={{ width: 100 }} />
              </tr>
            </thead>
            <tbody>
              {guestsForEvent.map((g) => (
                <tr key={g.id}>
                  <td className="vg-table__title">{g.name}</td>
                  <td>
                    <Badge variant={STATUS_VARIANT[g.status]}>{STATUS_LABEL[g.status]}</Badge>
                  </td>
                  <td className="vg-table__right tabular">{g.partySize}</td>
                  <td className="vg-table__muted">{g.dietary ?? '—'}</td>
                  <td className="vg-table__muted">{g.notes ?? '—'}</td>
                  <td className="vg-table__right">
                    <div className="inline-flex items-center gap-s-1">
                      <button
                        type="button"
                        aria-label="Bewerken"
                        className="vg-sheet__close"
                        onClick={() => {
                          setEditing(g)
                          setAdding(false)
                        }}
                      >
                        <Pencil size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label="Verwijderen"
                        className="vg-sheet__close hover:text-negative"
                        onClick={() => void handleDelete(g)}
                      >
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'positive' | 'warning' | 'negative'
}) {
  return (
    <div className="p-s-6">
      <span className="t-caption t-faded">{label}</span>
      <div
        className="t-heading-l tabular mt-s-2"
        style={{
          color:
            tone === 'positive'
              ? 'var(--positive)'
              : tone === 'warning'
                ? 'var(--warning)'
                : tone === 'negative'
                  ? 'var(--negative)'
                  : undefined,
        }}
      >
        {value}
      </div>
    </div>
  )
}
