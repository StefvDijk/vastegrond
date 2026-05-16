import { useMemo } from 'react'
import { CalendarRange } from 'lucide-react'
import { useEvents } from '../features/events/hooks'
import { useDishes, useAllDishIngredients } from '../features/dishes/hooks'
import { useIngredients } from '../features/ingredients/hooks'
import { useCourses } from '../features/menu/hooks'
import { costPerPortionCents } from '../features/dishes/foodcost'
import { formatEuro } from '../lib/format'
import { EmptyState } from '../components/EmptyState'
import { Skeleton, SkeletonCard } from '../components/Skeleton'
import { vogelfreiCutCents } from '../lib/finance'
import { EVENT_CAPACITY } from '../lib/constants'
import { cn } from '../lib/cn'

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

const MS_PER_DAY = 24 * 60 * 60 * 1000

function daysUntil(dateIso: string): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const target = new Date(dateIso).setHours(0, 0, 0, 0)
  return Math.round((target - today) / MS_PER_DAY)
}

function relativeLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} dagen geleden`
  if (days === 0) return 'vandaag'
  if (days === 1) return 'morgen'
  return `over ${days} dagen`
}

type EventSummary = {
  id: string
  weekday: string
  shortDate: string
  longTitle: string
  guests: number
  capacity: number
  ticketCents: number
  locationCostCents: number
  revenueCents: number
  vogelfreiCents: number
  marginCents: number
  dishCount: number
  progress: number
  status: 'positive' | 'warning' | 'accent'
  badgeLabel: string | null
}

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

  const isLoading = eventsQ.isLoading || coursesQ.isLoading || dishesQ.isLoading

  // Foodcost per gast — indicatieve som van costPerPortion over alle dishes.
  // TODO: share-gerechten (gang 3: 6 mensen delen 1 schaal) zijn nog niet correct gemodelleerd.
  // Vereist `serves_per_unit` o.i.d. op dishes; tot dan tonen we dit cijfer als 'indicatie'.
  const foodcostPerGuestCents = useMemo(() => {
    const dishes = dishesQ.data ?? []
    const ingredients = ingredientsQ.data ?? []
    const links = linksQ.data ?? {}
    return dishes.reduce((sum, dish) => {
      return sum + costPerPortionCents(links[dish.id] ?? [], ingredients, dish.portions)
    }, 0)
  }, [dishesQ.data, ingredientsQ.data, linksQ.data])

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

  const summaries: EventSummary[] = useMemo(() => {
    const dishesCount = (dishesQ.data ?? []).length
    return sortedEvents.map((event) => {
      const date = new Date(event.eventDate)
      const revenue = event.guestCount * event.ticketPriceCents
      const vogelfrei = vogelfreiCutCents(revenue)
      const capacity = EVENT_CAPACITY
      const progress = Math.min(event.guestCount / capacity, 1)
      const status: EventSummary['status'] =
        progress >= 1 ? 'positive' : progress >= 0.85 ? 'warning' : 'accent'
      const badge =
        progress >= 1
          ? 'Vol'
          : capacity - event.guestCount > 0
            ? `${capacity - event.guestCount} plek`
            : null
      return {
        id: event.id,
        weekday: WEEKDAYS[date.getDay()],
        shortDate: `${date.getDate()} ${MONTHS[date.getMonth()]}`,
        longTitle: `${date.getDate()} ${MONTHS[date.getMonth()]}`,
        guests: event.guestCount,
        capacity,
        ticketCents: event.ticketPriceCents,
        locationCostCents: event.locationCostCents,
        revenueCents: revenue,
        vogelfreiCents: vogelfrei,
        marginCents:
          revenue -
          vogelfrei -
          event.locationCostCents -
          foodcostPerGuestCents * event.guestCount,
        dishCount: dishesCount,
        progress,
        status,
        badgeLabel: badge,
      }
    })
  }, [sortedEvents, foodcostPerGuestCents, dishesQ.data])

  if (isLoading) {
    return (
      <div className="vg-page">
        <Skeleton className="h-10 w-1/3 mb-s-7" />
        <div className="flex flex-col gap-s-5 md:grid md:grid-cols-3 md:gap-s-6 mb-s-9">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-2 gap-s-4 md:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (sortedEvents.length === 0) {
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

  const [firstEvent, ...laterEvents] = summaries
  const totalRevenueCents = summaries.reduce((sum, e) => sum + e.revenueCents, 0)
  const totalGuests = summaries.reduce((sum, e) => sum + e.guests, 0)
  const totalVogelfrei = vogelfreiCutCents(totalRevenueCents)
  const totalFoodcostCents = summaries.reduce(
    (sum, e) => sum + foodcostPerGuestCents * e.guests,
    0,
  )
  const totalMargeCents = summaries.reduce((sum, e) => sum + e.marginCents, 0)
  const margePercent =
    totalRevenueCents > 0 ? Math.round((totalMargeCents / totalRevenueCents) * 100) : 0
  const daysToFirst = firstEvent ? daysUntil(sortedEvents[0]!.eventDate) : 0

  return (
    <div className="vg-page flex flex-col gap-s-9">
      {/* Header — desktop h-bar / mobile large title */}
      <header className="flex flex-col gap-s-2 md:flex-row md:items-end md:justify-between md:gap-s-6">
        <div>
          <span className="t-caption t-faded">Vaste Grond × Vogelfrei · zomer 2026</span>
          <h1 className="t-display-m mt-s-2 md:t-display-m">Overview</h1>
        </div>
        <div className="hidden md:flex md:items-center md:gap-s-3">
          <span className="t-body-s t-faded">
            Eerstvolgend · {relativeLabel(daysToFirst).toLowerCase()}
          </span>
        </div>
      </header>

      {/* Hero event-card (mobile alleen) */}
      {firstEvent ? (
        <section className="md:hidden">
          <HeroEventCard event={firstEvent} relative={relativeLabel(daysToFirst)} />
        </section>
      ) : null}

      {/* Mobile secundaire avonden */}
      {laterEvents.length > 0 ? (
        <section className="flex flex-col gap-s-4 md:hidden">
          {laterEvents.map((event) => (
            <SecondaryEventCard key={event.id} event={event} />
          ))}
        </section>
      ) : null}

      {/* Desktop: 3 gelijkwaardige avonden naast elkaar */}
      <section className="hidden md:grid md:grid-cols-3 md:gap-s-6">
        {summaries.map((event) => (
          <DesktopEventCard key={event.id} event={event} />
        ))}
      </section>

      {/* Summary cells */}
      <section>
        <h2 className="t-caption t-faded mb-s-4 md:hidden">Totaal over de serie</h2>
        <div className="grid grid-cols-2 gap-s-4 md:grid-cols-4 md:gap-s-6">
          <SumCell
            label="Totaal omzet"
            value={formatEuro(totalRevenueCents / 100)}
            sub={`${totalGuests} tickets × ${formatEuro(
              (summaries[0]?.ticketCents ?? 0) / 100,
            )}`}
          />
          <SumCell
            label="Vogelfrei share"
            value={`−${formatEuro(totalVogelfrei / 100)}`}
            sub="40% van omzet"
            tone="negative"
          />
          <SumCell
            label="Foodcost (indicatie)"
            value={formatEuro(totalFoodcostCents / 100)}
            sub={`~${formatEuro(foodcostPerGuestCents / 100)} per gast`}
          />
          <SumCell
            label="Verwachte marge"
            value={formatEuro(totalMargeCents / 100)}
            sub={`${margePercent}% op omzet`}
            tone="positive"
          />
        </div>
      </section>

      {/* Menu voortgang */}
      {menuProgress.length > 0 ? (
        <section>
          <div className="vg-card vg-card--bordered">
            <span className="t-caption t-faded">Menu voortgang</span>
            <p className="t-body-s t-soft mt-s-2">
              Gerechten met ingrediënten gekoppeld vs. totaal per gang.
            </p>
            <div className="mt-s-6 flex flex-col gap-s-4">
              {menuProgress.map((p) => (
                <CourseProgress
                  key={p.id}
                  label={p.name}
                  ready={p.ready}
                  total={Math.max(p.total, 1)}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <footer className="flex items-center justify-between t-mono-s t-faded pt-s-4 border-t border-line">
        <span>Vogelfrei-deal · 40% afdracht op ticket-omzet</span>
        <span className="hidden md:inline">v2026.1</span>
      </footer>
    </div>
  )
}

function HeroEventCard({
  event,
  relative,
}: {
  event: EventSummary
  relative: string
}) {
  return (
    <div
      className="rounded-l p-s-7 text-paper"
      style={{ background: 'var(--ink)' }}
    >
      <div className="t-mono-s uppercase" style={{ color: 'rgba(244,241,235,0.55)' }}>
        Eerstvolgend · {relative}
      </div>
      <div
        className="mt-s-3"
        style={{
          fontSize: 32,
          lineHeight: 1.08,
          letterSpacing: '-0.028em',
          fontWeight: 600,
        }}
      >
        {event.weekday}
        <br />
        {event.shortDate}
      </div>
      <div className="mt-s-6 grid grid-cols-2 gap-s-5">
        <div>
          <div
            className="t-mono-s uppercase"
            style={{ color: 'rgba(244,241,235,0.55)' }}
          >
            Gasten
          </div>
          <div
            className="mt-s-2 tabular-nums"
            style={{ fontSize: 30, lineHeight: 1, letterSpacing: '-0.025em', fontWeight: 600 }}
          >
            {event.guests}
            <span
              className="font-mono ml-s-2 tabular-nums"
              style={{
                fontSize: 13,
                color: 'rgba(244,241,235,0.55)',
                fontWeight: 400,
              }}
            >
              /{event.capacity}
            </span>
          </div>
        </div>
        <div>
          <div
            className="t-mono-s uppercase"
            style={{ color: 'rgba(244,241,235,0.55)' }}
          >
            Marge
          </div>
          <div
            className="font-mono mt-s-2 tabular-nums"
            style={{ fontSize: 22, lineHeight: 1 }}
          >
            {formatEuro(event.marginCents / 100)}
          </div>
        </div>
      </div>
    </div>
  )
}

function SecondaryEventCard({ event }: { event: EventSummary }) {
  return (
    <div className="vg-card vg-card--bordered">
      <div className="t-caption t-faded">{event.weekday}</div>
      <div
        className="mt-s-2"
        style={{ fontSize: 24, lineHeight: 1.15, letterSpacing: '-0.022em', fontWeight: 600 }}
      >
        {event.longTitle}
      </div>
      <div className="mt-s-4 flex items-baseline justify-between">
        <div className="t-mono-m t-soft tabular-nums">
          {event.guests}
          <span className="t-ghost"> / {event.capacity} gasten</span>
        </div>
        {event.badgeLabel ? (
          <span className={cn('vg-badge', badgeClass(event.status))}>
            {event.status === 'positive' ? <span className="vg-badge__dot" /> : null}
            {event.badgeLabel}
          </span>
        ) : null}
      </div>
      <ProgressBar value={event.progress} tone={event.status} className="mt-s-4" />
    </div>
  )
}

function DesktopEventCard({ event }: { event: EventSummary }) {
  return (
    <div className="vg-card vg-card--bordered">
      <div className="t-caption t-faded">{event.weekday}</div>
      <div
        className="mt-s-2"
        style={{ fontSize: 28, lineHeight: 1.1, letterSpacing: '-0.024em', fontWeight: 600 }}
      >
        {event.longTitle}
      </div>
      <div className="mt-s-5 grid grid-cols-2 gap-s-5">
        <div>
          <div className="t-caption t-faded">Gasten</div>
          <div
            className="mt-s-2 tabular-nums"
            style={{ fontSize: 24, lineHeight: 1, letterSpacing: '-0.022em', fontWeight: 600 }}
          >
            {event.guests}
            <span className="t-ghost text-body-s ml-s-1" style={{ fontWeight: 400 }}>
              /{event.capacity}
            </span>
          </div>
        </div>
        <div>
          <div className="t-caption t-faded">Omzet</div>
          <div className="font-mono mt-s-2 tabular-nums" style={{ fontSize: 22, lineHeight: 1 }}>
            {formatEuro(event.revenueCents / 100)}
          </div>
        </div>
      </div>
      <ProgressBar value={event.progress} tone={event.status} className="mt-s-6" />
      <div className="mt-s-3 flex items-center justify-between t-mono-s t-faded">
        <span>
          {event.dishCount} {event.dishCount === 1 ? 'gerecht' : 'gerechten'}
        </span>
        <span>marge {formatEuro(event.marginCents / 100)}</span>
      </div>
    </div>
  )
}

function ProgressBar({
  value,
  tone,
  className,
}: {
  value: number
  tone: EventSummary['status']
  className?: string
}) {
  const color =
    tone === 'positive'
      ? 'var(--positive)'
      : tone === 'warning'
        ? 'var(--warning)'
        : 'var(--accent)'
  return (
    <div
      className={cn('h-[3px] rounded-pill overflow-hidden', className)}
      style={{ background: 'var(--paper-deep)' }}
      aria-hidden
    >
      <div
        className="h-full rounded-pill transition-all duration-base ease-out"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }}
      />
    </div>
  )
}

function badgeClass(status: EventSummary['status']): string {
  if (status === 'positive') return 'vg-badge--positive'
  if (status === 'warning') return 'vg-badge--warning'
  return 'vg-badge--accent'
}

function SumCell({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub?: string
  tone?: 'positive' | 'negative'
}) {
  const valueColor =
    tone === 'positive'
      ? 'var(--positive)'
      : tone === 'negative'
        ? 'var(--negative)'
        : 'var(--ink)'
  return (
    <div className="vg-card vg-card--bordered">
      <div className="t-caption t-faded">{label}</div>
      <div
        className="font-mono mt-s-2 tabular-nums"
        style={{
          fontSize: 22,
          lineHeight: 1,
          letterSpacing: '-0.012em',
          color: valueColor,
        }}
      >
        {value}
      </div>
      {sub ? <div className="mt-s-2 t-mono-s t-faded">{sub}</div> : null}
    </div>
  )
}

function CourseProgress({
  label,
  ready,
  total,
}: {
  label: string
  ready: number
  total: number
}) {
  const ratio = total === 0 ? 0 : ready / total
  return (
    <div className="flex flex-col gap-s-2">
      <div className="flex items-baseline justify-between">
        <span className="t-body-m">{label}</span>
        <span className="t-mono-s t-faded tabular-nums">
          {ready}/{total}
        </span>
      </div>
      <div
        className="h-[3px] rounded-pill overflow-hidden"
        style={{ background: 'var(--paper-deep)' }}
        aria-hidden
      >
        <div
          className="h-full rounded-pill transition-all duration-base ease-out"
          style={{
            width: `${ratio * 100}%`,
            background: ratio === 1 ? 'var(--positive)' : 'var(--accent)',
          }}
        />
      </div>
    </div>
  )
}
