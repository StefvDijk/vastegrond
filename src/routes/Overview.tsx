import { useEvents } from '../features/events/hooks'
import { EventCard } from '../features/events/EventCard'
import { formatEuro } from '../lib/format'

export function Overview() {
  const { data: events, isLoading, isError, error } = useEvents()

  if (isLoading) {
    return (
      <div className="text-sm text-text-muted">Events laden…</div>
    )
  }

  if (isError) {
    return (
      <div className="card border-danger/40 p-5">
        <h2 className="text-lg font-semibold tracking-tight text-danger">
          Kon events niet laden
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          {error instanceof Error ? error.message : 'Onbekende fout'}
        </p>
      </div>
    )
  }

  if (!events || events.length === 0) {
    return (
      <div className="card p-5">
        <h2 className="text-lg font-semibold tracking-tight">Geen events</h2>
        <p className="mt-2 text-sm text-text-muted">
          Er staan nog geen events in de database.
        </p>
      </div>
    )
  }

  const totalGuests = events.reduce((sum, ev) => sum + ev.guestCount, 0)
  const totalRevenueCents = events.reduce(
    (sum, ev) => sum + ev.guestCount * ev.ticketPriceCents,
    0,
  )

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h1 className="text-2xl font-semibold tracking-tight">Overzicht</h1>
        <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-text-subtle">
              Avonden
            </dt>
            <dd className="mt-0.5 text-xl font-semibold tabular-nums">
              {events.length}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-text-subtle">
              Totaal gasten
            </dt>
            <dd className="mt-0.5 text-xl font-semibold tabular-nums">
              {totalGuests}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-text-subtle">
              Bruto-omzet
            </dt>
            <dd className="mt-0.5 text-xl font-semibold tabular-nums">
              {formatEuro(totalRevenueCents / 100)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </section>
    </div>
  )
}
