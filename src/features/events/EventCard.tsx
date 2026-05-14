import { useState } from 'react'
import { Pencil } from 'lucide-react'
import type { Event } from '../../types/domain'
import { formatDateLong, formatEuro } from '../../lib/format'
import { Card, CardSeparator } from '../../components/ui'
import { EventForm } from './EventForm'

type EventCardProps = {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const [editing, setEditing] = useState(false)
  const grossRevenueCents = event.guestCount * event.ticketPriceCents

  if (editing) {
    return (
      <Card>
        <h2 className="t-heading-l">{event.name} bewerken</h2>
        <div className="mt-s-5">
          <EventForm
            event={event}
            onCancel={() => setEditing(false)}
            onSaved={() => setEditing(false)}
          />
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-s-3">
        <div className="flex flex-col gap-s-1">
          <span className="t-caption t-faded">{formatDateLong(event.eventDate)}</span>
          <h2 className="t-heading-l">{event.name}</h2>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Bewerken"
          className="vg-sheet__close"
        >
          <Pencil size={16} aria-hidden />
        </button>
      </div>

      <div className="mt-s-5 flex items-baseline gap-s-3">
        <span className="t-display-m tabular">{event.guestCount}</span>
        <span className="t-body-m t-soft">
          gasten · {formatEuro(event.ticketPriceCents / 100)} p.p.
        </span>
      </div>

      <CardSeparator />

      <div className="flex flex-col gap-s-3 t-body-s">
        <Row label="Locatie" value={event.locationName ?? '—'} />
        <Row label="Locatiekosten" value={formatEuro(event.locationCostCents / 100)} muted />
        <Row label="Bruto-omzet" value={formatEuro(grossRevenueCents / 100)} emphasis />
      </div>

      {event.notes ? (
        <p className="mt-s-4 whitespace-pre-line t-body-s t-soft">{event.notes}</p>
      ) : null}
    </Card>
  )
}

function Row({
  label,
  value,
  emphasis,
  muted,
}: {
  label: string
  value: string
  emphasis?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-s-3">
      <span className="t-soft">{label}</span>
      <span
        className={
          emphasis
            ? 'tabular text-ink font-medium'
            : muted
              ? 'tabular t-faded'
              : 'tabular text-ink'
        }
      >
        {value}
      </span>
    </div>
  )
}
