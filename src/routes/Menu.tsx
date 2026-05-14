import { useEffect, useState } from 'react'
import { useEvents } from '../features/events/hooks'
import { CourseList } from '../features/menu/CourseList'
import { formatDateLong } from '../lib/format'
import { cn } from '../lib/cn'

export function Menu() {
  const { data: events, isLoading, isError, error } = useEvents()
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>()

  useEffect(() => {
    if (!selectedEventId && events && events.length > 0) {
      setSelectedEventId(events[0]?.id)
    }
  }, [events, selectedEventId])

  if (isLoading) {
    return <p className="text-sm text-text-muted">Events laden…</p>
  }

  if (isError) {
    return (
      <p className="text-sm text-danger">
        Kon events niet laden — {error instanceof Error ? error.message : 'fout'}
      </p>
    )
  }

  if (!events || events.length === 0) {
    return (
      <div className="card p-5">
        <h1 className="text-2xl font-semibold tracking-tight">Menu</h1>
        <p className="mt-2 text-sm text-text-muted">
          Maak eerst een event aan in Overzicht.
        </p>
      </div>
    )
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? events[0]

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h1 className="text-2xl font-semibold tracking-tight">Menu</h1>
        <p className="mt-1 text-sm text-text-muted">
          Beheer de gangen per avond. Volgorde via de pijltjes.
        </p>

        <div
          className="mt-4 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Kies avond"
        >
          {events.map((event) => {
            const active = event.id === selectedEvent?.id
            return (
              <button
                key={event.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedEventId(event.id)}
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
      </section>

      {selectedEvent ? (
        <section className="card p-5">
          <header className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Gangen — {selectedEvent.name}
            </h2>
          </header>
          <CourseList eventId={selectedEvent.id} />
        </section>
      ) : null}
    </div>
  )
}
