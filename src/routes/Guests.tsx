import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import type { Event, Guest, GuestStatus } from '../types/domain'
import { useEvents } from '../features/events/hooks'
import { useDeleteGuest, useGuests } from '../features/guests/hooks'
import { GuestForm } from '../features/guests/GuestForm'
import { formatDateShort } from '../lib/format'
import { Button, Card, Segmented, IosNavBar, IosNavAction } from '../components/ui'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'
import { EVENT_CAPACITY } from '../lib/constants'
import { cn } from '../lib/cn'

const STATUS_LABEL: Record<GuestStatus, string> = {
  invited: 'Genodigd',
  confirmed: 'Bevestigd',
  tentative: 'Voorlopig',
  declined: 'Afgemeld',
}

const STATUS_VARIANT: Record<GuestStatus, string> = {
  invited: 'vg-badge--neutral',
  confirmed: 'vg-badge--positive',
  tentative: 'vg-badge--warning',
  declined: 'vg-badge--negative',
}

const WEEKDAYS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
const MONTHS = [
  'januari',
  'februari',
  'maart',
  'april',
  'mei',
  'juni',
  'juli',
  'augustus',
  'september',
  'oktober',
  'november',
  'december',
]

function eventLongLabel(dateIso: string): string {
  const d = new Date(dateIso)
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function Guests() {
  const eventsQ = useEvents()
  const guestsQ = useGuests()
  const del = useDeleteGuest()

  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Guest | null>(null)

  const events = useMemo(() => {
    const list = eventsQ.data ?? []
    return [...list].sort((a, b) => a.eventDate.localeCompare(b.eventDate))
  }, [eventsQ.data])

  useEffect(() => {
    if (!selectedId && events.length > 0) {
      setSelectedId(events[0]?.id)
    }
  }, [events, selectedId])

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
      <>
        <IosNavBar title="Gasten" eyebrow="RSVP" />
        <div className="vg-page">
          <header className="hidden md:block">
            <span className="t-caption t-faded">RSVP</span>
            <h1 className="t-display-m mt-s-2">Gasten</h1>
          </header>
          <div className="vg-empty">
            <p className="vg-empty__title">Geen avonden</p>
            <p className="vg-empty__desc">Maak eerst een event aan in Overview.</p>
          </div>
        </div>
      </>
    )
  }

  const capacityLeft = EVENT_CAPACITY - stats.confirmedSeats

  return (
    <>
      <IosNavBar
        title="Gasten"
        eyebrow="RSVP per avond"
        trailing={
          <IosNavAction
            primary
            onClick={() => {
              setAdding(true)
              setEditing(null)
            }}
            aria-label="Gast toevoegen"
          >
            <Plus size={20} aria-hidden />
          </IosNavAction>
        }
      />
      <div className="vg-page flex flex-col gap-s-6 md:gap-s-7">
        {/* Desktop header */}
        <header className="hidden md:flex md:flex-col md:gap-s-3 md:flex-row md:items-end md:justify-between md:gap-s-6">
          <div>
            <span className="t-caption t-faded">RSVP per avond</span>
            <h1 className="t-display-m mt-s-2">Gasten</h1>
          </div>
          <Button
            variant="accent"
            onClick={() => {
              setAdding(true)
              setEditing(null)
            }}
          >
            <Plus size={16} aria-hidden /> Nieuwe gast
          </Button>
        </header>

      {/* Segmented per avond */}
      <Segmented
        value={selectedEvent.id}
        options={events.map((e, i) => ({
          value: e.id,
          label: `Avond ${i + 1}`,
        }))}
        onChange={(id) => {
          setSelectedId(id)
          setAdding(false)
          setEditing(null)
        }}
      />

      {/* Event subheader: serif datum + ratio */}
      <div className="flex items-baseline justify-between gap-s-4">
        <h2 style={{ fontSize: 20, letterSpacing: '-0.020em', fontWeight: 600 }}>
          {eventLongLabel(selectedEvent.eventDate)}
        </h2>
        <div className="t-mono-m tabular-nums t-faded">
          {stats.confirmedSeats}
          <span className="t-ghost"> / {EVENT_CAPACITY}</span>
        </div>
      </div>

      {/* Status-stats row */}
      <div className="grid grid-cols-4 gap-s-3 md:grid-cols-5">
        <StatusStat label="Bevestigd" value={stats.confirmed} tone="positive" />
        <StatusStat label="Voorlopig" value={stats.tentative} tone="warning" />
        <StatusStat label="Genodigd" value={stats.invited} />
        <StatusStat label="Afgemeld" value={stats.declined} tone="negative" />
        <StatusStat
          label={capacityLeft >= 0 ? 'Vrij' : 'Overboekt'}
          value={Math.abs(capacityLeft)}
          tone={capacityLeft >= 0 ? undefined : 'negative'}
          className="col-span-2 md:col-span-1"
        />
      </div>

      {adding ? (
        <Card>
          <h2 className="t-title-l mb-s-5">
            Nieuwe gast — {eventLongLabel(selectedEvent.eventDate)}
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
          <h2 className="t-title-l mb-s-5">{editing.name} bewerken</h2>
          <GuestForm
            eventId={selectedEvent.id}
            guest={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => setEditing(null)}
          />
        </Card>
      ) : null}

      {/* Guest list */}
      {guestsForEvent.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nog geen gasten voor deze avond"
          description={`Klik op 'Nieuwe gast' om de eerste toe te voegen voor ${formatDateShort(
            selectedEvent.eventDate,
          )}.`}
        />
      ) : (
        <div className="vg-list">
          {guestsForEvent.map((g) => (
            <div key={g.id} className="vg-list__row">
              <GuestAvatar name={g.name} />
              <div className="vg-list__content min-w-0">
                <div className="flex items-baseline gap-s-3 flex-wrap">
                  <span className="vg-list__title">{g.name}</span>
                  <span
                    className={cn('vg-badge', STATUS_VARIANT[g.status])}
                    style={{ height: 18, padding: '0 6px', fontSize: 10 }}
                  >
                    {g.status === 'confirmed' ? (
                      <span className="vg-badge__dot" aria-hidden />
                    ) : null}
                    {STATUS_LABEL[g.status]}
                  </span>
                </div>
                {(g.dietary || g.notes) ? (
                  <div className="vg-list__subtitle">
                    {[g.dietary, g.notes].filter(Boolean).join(' · ')}
                  </div>
                ) : null}
              </div>
              <div className="t-mono-s t-faded tabular-nums shrink-0">
                {g.partySize} {g.partySize === 1 ? 'pers.' : 'pers.'}
              </div>
              <div className="inline-flex items-center gap-s-1 shrink-0">
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
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  )
}

function GuestAvatar({ name }: { name: string }) {
  return (
    <span
      className="shrink-0 inline-flex items-center justify-center rounded-pill"
      style={{
        width: 32,
        height: 32,
        fontSize: 12,
        fontWeight: 600,
        background: 'var(--paper-deep)',
        color: 'var(--ink-soft)',
        letterSpacing: '0.02em',
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

function StatusStat({
  label,
  value,
  tone,
  className,
}: {
  label: string
  value: number
  tone?: 'positive' | 'warning' | 'negative'
  className?: string
}) {
  const color =
    tone === 'positive'
      ? 'var(--positive)'
      : tone === 'warning'
        ? 'var(--warning)'
        : tone === 'negative'
          ? 'var(--negative)'
          : 'var(--ink)'
  return (
    <div className={cn('vg-card vg-card--bordered', className)} style={{ padding: 'var(--s-5)' }}>
      <div className="t-caption t-faded">{label}</div>
      <div
        className="font-mono mt-s-2 tabular-nums"
        style={{ fontSize: 22, lineHeight: 1, color, letterSpacing: '-0.012em' }}
      >
        {value}
      </div>
    </div>
  )
}
