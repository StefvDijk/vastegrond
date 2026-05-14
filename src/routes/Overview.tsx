import { useMemo } from 'react'
import { CalendarRange } from 'lucide-react'
import { useEvents } from '../features/events/hooks'
import { useDishes, useAllDishIngredients } from '../features/dishes/hooks'
import { useIngredients } from '../features/ingredients/hooks'
import { useCourses } from '../features/menu/hooks'
import { costPerPortionCents } from '../features/dishes/foodcost'
import { formatEuro } from '../lib/format'
import { Card, CardSeparator, ProgressRow } from '../components/ui'
import { EmptyState } from '../components/EmptyState'
import { Skeleton, SkeletonCard } from '../components/Skeleton'
import { vogelfreiCutCents } from '../lib/finance'

const WEEKDAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']

export function Overview() {
  const eventsQ = useEvents()
  const coursesQ = useCourses()
  const dishesQ = useDishes()
  const ingredientsQ = useIngredients()
  const linksQ = useAllDishIngredients()

  const sortedEvents = useMemo(() => {
    const list = eventsQ.data ?? []
    return [...list].sort((a, b) => a.eventDate.localeCompare(b.eventDate))
  }, [eventsQ.data])

  const firstEvent = sortedEvents[0]

  const menuProgress = useMemo(() => {
    const courses = coursesQ.data ?? []
    const dishes = dishesQ.data ?? []
    const links = linksQ.data ?? {}
    return courses.map((course) => {
      const dishesOfCourse = dishes.filter((d) => d.courseId === course.id)
      const ready = dishesOfCourse.filter((d) => (links[d.id]?.length ?? 0) > 0).length
      return {
        id: course.id,
        name: course.name,
        ready,
        total: dishesOfCourse.length,
      }
    })
  }, [coursesQ.data, dishesQ.data, linksQ.data])

  const isLoading = eventsQ.isLoading || coursesQ.isLoading || dishesQ.isLoading

  if (isLoading) {
    return (
      <div className="vg-page">
        <div className="vg-card mb-s-9">
          <Skeleton className="h-32 w-2/3 mb-s-5" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="grid gap-s-5 md:grid-cols-3 mb-s-9">
          <SkeletonCard /> <SkeletonCard /> <SkeletonCard />
        </div>
      </div>
    )
  }

  if (!firstEvent) {
    return (
      <div className="vg-page">
        <EmptyState
          icon={CalendarRange}
          title="Geen avonden gepland"
          description="Voeg in de database events toe om hier de aanloop te zien."
        />
      </div>
    )
  }

  const totalRevenueCents = sortedEvents.reduce(
    (sum, e) => sum + e.guestCount * e.ticketPriceCents,
    0,
  )
  const totalGuests = sortedEvents.reduce((sum, e) => sum + e.guestCount, 0)
  const ingredients = ingredientsQ.data ?? []
  const linksByDish = linksQ.data ?? {}
  const totalFoodcostCents = (dishesQ.data ?? []).reduce((sum, dish) => {
    const links = linksByDish[dish.id] ?? []
    const perPortion = costPerPortionCents(links, ingredients, dish.portions)
    // foodcost-aandeel per dish gemodelleerd op gasten — niet helemaal exact (één dish per gast),
    // maar geeft een goede 'per persoon' indicatie voor de overview.
    return sum + perPortion
  }, 0)

  return (
    <div className="vg-page flex flex-col gap-s-11">
      {/* Drie avonden */}
      <section>
        <h2 className="t-heading-l mb-s-6">Drie avonden</h2>
        <div className="grid gap-s-5 md:grid-cols-3">
          {sortedEvents.map((event) => {
            const date = new Date(event.eventDate)
            const dateLabel = `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`
            const revenue = event.guestCount * event.ticketPriceCents
            const afdracht = vogelfreiCutCents(revenue)
            return (
              <Card key={event.id}>
                <span className="t-caption t-faded">{dateLabel}</span>
                <div className="mt-s-4 flex items-baseline gap-s-3">
                  <span
                    className="tabular text-ink"
                    style={{ fontSize: 64, lineHeight: 1, letterSpacing: '-0.03em', fontWeight: 600 }}
                  >
                    {event.guestCount}
                  </span>
                  <span className="t-body-s t-soft">
                    gasten · {formatEuro(event.ticketPriceCents / 100)} p.p.
                  </span>
                </div>
                <CardSeparator />
                <div className="flex flex-col gap-s-3 t-body-s">
                  <Row label="Omzet" value={formatEuro(revenue / 100)} />
                  <Row
                    label="Vogelfrei 40%"
                    value={`− ${formatEuro(afdracht / 100)}`}
                    muted
                  />
                  <Row
                    label="Locatiekosten"
                    value={`− ${formatEuro(event.locationCostCents / 100)}`}
                    muted
                  />
                  <Row
                    label="Resterend"
                    value={formatEuro((revenue - afdracht - event.locationCostCents) / 100)}
                    emphasis
                  />
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* 3. Menu voortgang */}
      <section>
        <div className="grid gap-s-9 md:grid-cols-2">
          <Card>
            <h2 className="t-heading-l">Menu voortgang</h2>
            <p className="t-body-s t-soft mt-s-2">
              Gerechten met ingrediënten gekoppeld vs. totaal per gang.
            </p>
            <div className="mt-s-6 flex flex-col gap-s-5">
              {menuProgress.length === 0 ? (
                <p className="t-body-m t-faded">Nog geen gangen.</p>
              ) : (
                menuProgress.map((p) => (
                  <ProgressRow key={p.id} label={p.name} value={p.ready} total={Math.max(p.total, 1)} />
                ))
              )}
            </div>
          </Card>

          <Card>
            <h2 className="t-heading-l">Totaal over de serie</h2>
            <CardSeparator />
            <div className="flex flex-col gap-s-4 t-body-m">
              <Row label="Avonden" value={String(sortedEvents.length)} />
              <Row label="Totaal gasten" value={String(totalGuests)} />
              <Row label="Bruto-omzet" value={formatEuro(totalRevenueCents / 100)} />
              <Row
                label="Vogelfrei 40%"
                value={`− ${formatEuro(vogelfreiCutCents(totalRevenueCents) / 100)}`}
                muted
              />
              <Row
                label="Na afdracht"
                value={formatEuro(
                  (totalRevenueCents - vogelfreiCutCents(totalRevenueCents)) / 100,
                )}
                emphasis
              />
              <Row label="Foodcost p.p." value={formatEuro(totalFoodcostCents / 100)} muted />
            </div>
          </Card>
        </div>
      </section>

      {/* 4. Footer meta */}
      <footer
        className="flex items-center justify-between t-caption t-faded pt-s-6"
        style={{ borderTop: '1px solid var(--line)' }}
      >
        <span>Vogelfrei-deal · 40% afdracht op ticket-omzet</span>
        <span>Laatst bijgewerkt nu</span>
      </footer>
    </div>
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
