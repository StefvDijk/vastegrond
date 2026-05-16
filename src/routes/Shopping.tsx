import { useMemo, useState } from 'react'
import { ShoppingBasket } from 'lucide-react'
import { useEvents } from '../features/events/hooks'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'
import { useIngredients } from '../features/ingredients/hooks'
import { useAllDishIngredients, useDishes } from '../features/dishes/hooks'
import {
  aggregateShopping,
  groupBySupplier,
  type ShoppingLine,
} from '../features/shopping/aggregate'
import { formatEuro, formatNumber } from '../lib/format'
import { cn } from '../lib/cn'
import { IosNavBar } from '../components/ui'

type Filter = 'all' | 'open' | 'done'

export function Shopping() {
  const eventsQ = useEvents()
  const ingredientsQ = useIngredients()
  const dishesQ = useDishes()
  const linksQ = useAllDishIngredients()

  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState<Filter>('all')

  const totalGuests = useMemo(
    () => (eventsQ.data ?? []).reduce((sum, e) => sum + e.guestCount, 0),
    [eventsQ.data],
  )

  const lines = useMemo(
    () =>
      aggregateShopping({
        ingredients: ingredientsQ.data ?? [],
        dishes: dishesQ.data ?? [],
        linksByDish: linksQ.data ?? {},
        totalGuests,
      }),
    [ingredientsQ.data, dishesQ.data, linksQ.data, totalGuests],
  )

  const groups = useMemo(() => groupBySupplier(lines), [lines])
  const grandTotalCents = lines.reduce((sum, l) => sum + l.totalCostCents, 0)
  const doneCount = lines.filter((l) => checked[l.ingredient.id]).length
  const doneCostCents = lines.reduce(
    (sum, l) => (checked[l.ingredient.id] ? sum + l.totalCostCents : sum),
    0,
  )
  const progress = lines.length === 0 ? 0 : doneCount / lines.length

  const loading =
    eventsQ.isLoading || ingredientsQ.isLoading || dishesQ.isLoading || linksQ.isLoading

  if (loading) {
    return (
      <div className="vg-page">
        <Skeleton className="h-10 w-48 mb-s-7" />
        <Skeleton className="h-32 w-full mb-s-5" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function filterLines(supplierLines: ShoppingLine[]): ShoppingLine[] {
    if (filter === 'all') return supplierLines
    if (filter === 'open') return supplierLines.filter((l) => !checked[l.ingredient.id])
    return supplierLines.filter((l) => checked[l.ingredient.id])
  }

  const eyebrow = `Inkoop · ${lines.length} ${lines.length === 1 ? 'post' : 'posten'} · ${groups.length} ${groups.length === 1 ? 'leverancier' : 'leveranciers'}`

  return (
    <>
      <IosNavBar title="Boodschappen" eyebrow={eyebrow} />
      <div className="vg-page flex flex-col gap-s-6 md:gap-s-7">
        {/* Desktop-only header */}
        <header className="hidden md:flex md:flex-col md:gap-s-3 md:flex-row md:items-end md:justify-between md:gap-s-6">
          <div>
            <span className="t-caption t-faded">{eyebrow}</span>
            <h1 className="t-display-m mt-s-2">Boodschappen</h1>
          </div>
        </header>

        {/* Filter chips */}
        <div className="flex items-center gap-s-2 overflow-x-auto -mx-s-4 px-s-4 md:mx-0 md:px-0">
          <Chip on={filter === 'all'} onClick={() => setFilter('all')}>Alles</Chip>
          <Chip on={filter === 'open'} onClick={() => setFilter('open')}>Open</Chip>
          <Chip on={filter === 'done'} onClick={() => setFilter('done')}>Afgevinkt</Chip>
        </div>

      {/* Voortgangs-summary */}
      <section className="flex items-baseline justify-between gap-s-4">
        <div>
          <div className="font-mono tabular-nums" style={{ fontSize: 28, lineHeight: 1, letterSpacing: '-0.012em' }}>
            {doneCount}
            <span className="t-ghost"> / {lines.length}</span>
          </div>
          <div className="t-mono-s t-faded mt-s-2">
            {formatEuro(doneCostCents / 100)} van {formatEuro(grandTotalCents / 100)}
          </div>
        </div>
        <div className="t-mono-s t-faded">{Math.round(progress * 100)}%</div>
      </section>
      <div
        className="h-[3px] rounded-pill overflow-hidden"
        style={{ background: 'var(--paper-deep)', marginTop: 'calc(-1 * var(--s-3))' }}
        aria-hidden
      >
        <div
          className="h-full rounded-pill transition-all duration-base ease-out"
          style={{
            width: `${progress * 100}%`,
            background: 'var(--accent)',
          }}
        />
      </div>

      {lines.length === 0 ? (
        <EmptyState
          icon={ShoppingBasket}
          title="Nog niets te kopen"
          description="Voeg ingrediënten toe aan gerechten in de Recepten-tab — dan rolt de lijst hier automatisch uit."
        />
      ) : (
        <div className="flex flex-col">
          {groups.map((group) => {
            const visibleLines = filterLines(group.lines)
            if (visibleLines.length === 0) return null
            return (
              <SupplierGroup
                key={group.supplier ?? '__none__'}
                supplier={group.supplier}
                subtotalCents={group.subtotalCents}
                lineCount={group.lines.length}
                lines={visibleLines}
                checked={checked}
                onToggle={toggle}
              />
            )
          })}
        </div>
      )}
      </div>
    </>
  )
}

function SupplierGroup({
  supplier,
  subtotalCents,
  lineCount,
  lines,
  checked,
  onToggle,
}: {
  supplier: string | null
  subtotalCents: number
  lineCount: number
  lines: ShoppingLine[]
  checked: Record<string, boolean>
  onToggle: (id: string) => void
}) {
  return (
    <section className="mt-s-6 first:mt-s-2">
      <header className="flex items-baseline justify-between px-s-1 pb-s-3">
        <h2 style={{ fontSize: 18, letterSpacing: '-0.018em', fontWeight: 600 }}>
          {supplier ?? 'Geen leverancier'}
        </h2>
        <div className="flex items-baseline gap-s-3">
          <span className="t-mono-s t-faded">
            {lineCount} {lineCount === 1 ? 'post' : 'posten'}
          </span>
          <span className="t-mono-m tabular-nums" style={{ color: 'var(--ink-soft)' }}>
            {formatEuro(subtotalCents / 100)}
          </span>
        </div>
      </header>
      <div className="vg-list">
        {lines.map((line) => {
          const id = line.ingredient.id
          const done = Boolean(checked[id])
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              className={cn(
                'vg-list__row vg-list__row--hover w-full text-left',
                done && 'vg-list__row--done',
              )}
            >
              <label className="vg-check" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => onToggle(id)}
                  aria-label={`${line.ingredient.name} afvinken`}
                />
                <span className="vg-check__box" aria-hidden />
              </label>
              <div className="vg-list__content">
                <div className="vg-list__title">{line.ingredient.name}</div>
              </div>
              <div className="t-mono-s t-faded tabular-nums shrink-0 text-right" style={{ width: 80 }}>
                {formatNumber(line.totalAmount)} {line.ingredient.unit}
              </div>
              <div className="vg-list__value shrink-0 text-right" style={{ minWidth: 70 }}>
                {formatEuro(line.totalCostCents / 100)}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('vg-chip', on && 'vg-chip--on')}
      aria-pressed={on}
    >
      {children}
    </button>
  )
}
