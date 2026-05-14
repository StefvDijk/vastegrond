import { CourseList } from '../features/menu/CourseList'
import { useEvents } from '../features/events/hooks'
import { formatDateShort } from '../lib/format'

export function Menu() {
  const { data: events } = useEvents()

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h1 className="text-2xl font-semibold tracking-tight">Menu</h1>
        <p className="mt-1 text-sm text-text-muted">
          Eén gedeeld menu voor alle avonden
          {events && events.length > 0
            ? ` (${events.map((e) => formatDateShort(e.eventDate)).join(' · ')})`
            : ''}
          . Allergenen en aantal personen verschillen per avond — die staan bij
          de gasten.
        </p>
      </section>

      <section className="card p-5">
        <header className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Gangen</h2>
        </header>
        <CourseList />
      </section>
    </div>
  )
}
