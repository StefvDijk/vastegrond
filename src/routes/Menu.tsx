import { CourseList } from '../features/menu/CourseList'
import { useEvents } from '../features/events/hooks'
import { Card, ScreenHeader } from '../components/ui'
import { formatDateShort } from '../lib/format'

export function Menu() {
  const { data: events } = useEvents()
  const dates = (events ?? [])
    .map((e) => formatDateShort(e.eventDate))
    .join(' · ')

  return (
    <div className="vg-page flex flex-col gap-s-9">
      <ScreenHeader
        eyebrow="Gangen"
        title="Menu"
        description={
          dates
            ? `Eén gedeeld menu voor alle avonden (${dates}). Allergenen en aantal personen verschillen per avond — die staan bij Gasten.`
            : 'Eén gedeeld menu voor alle avonden. Allergenen en aantal personen verschillen per avond.'
        }
      />
      <Card>
        <CourseList />
      </Card>
    </div>
  )
}
