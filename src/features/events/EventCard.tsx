import { useState } from 'react'
import { Pencil } from 'lucide-react'
import type { Event } from '../../types/domain'
import { formatDateLong, formatEuro } from '../../lib/format'
import { EventForm } from './EventForm'

type EventCardProps = {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const [editing, setEditing] = useState(false)

  // Voorlopige inkomsten-preview: gasten × ticket. Foodcost en overige uitgaven
  // worden in latere fases bijgeteld voor de echte Vogelfrei-afrekening.
  const grossRevenueCents = event.guestCount * event.ticketPriceCents

  return (
    <article className="card p-5">
      {editing ? (
        <>
          <header className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              {event.name} bewerken
            </h2>
          </header>
          <EventForm
            event={event}
            onCancel={() => setEditing(false)}
            onSaved={() => setEditing(false)}
          />
        </>
      ) : (
        <>
          <header className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {event.name}
              </h2>
              <p className="text-sm text-text-muted">
                {formatDateLong(event.eventDate)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Bewerken"
              className="rounded-ios p-2 text-text-muted hover:bg-surface-2 hover:text-text"
            >
              <Pencil className="size-4" aria-hidden />
            </button>
          </header>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Stat label="Gasten" value={String(event.guestCount)} />
            <Stat label="Ticket" value={formatEuro(event.ticketPriceCents / 100)} />
            <Stat label="Locatie" value={event.locationName ?? '—'} />
            <Stat
              label="Locatie­kosten"
              value={formatEuro(event.locationCostCents / 100)}
            />
            <Stat
              label="Bruto-inkomsten"
              value={formatEuro(grossRevenueCents / 100)}
              emphasis
            />
          </dl>

          {event.notes ? (
            <p className="mt-4 whitespace-pre-line rounded-ios bg-surface-2 p-3 text-sm text-text-muted">
              {event.notes}
            </p>
          ) : null}
        </>
      )}
    </article>
  )
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-text-subtle">
        {label}
      </dt>
      <dd
        className={
          emphasis
            ? 'mt-0.5 font-semibold tabular-nums text-text'
            : 'mt-0.5 tabular-nums text-text'
        }
      >
        {value}
      </dd>
    </div>
  )
}
