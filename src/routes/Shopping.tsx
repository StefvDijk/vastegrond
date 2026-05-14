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
import { Card, Checkbox, ScreenHeader } from '../components/ui'
import { cn } from '../lib/cn'

export function Shopping() {
  const eventsQ = useEvents()
  const ingredientsQ = useIngredients()
  const dishesQ = useDishes()
  const linksQ = useAllDishIngredients()

  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const totalGuests = useMemo(
    () => (eventsQ.data ?? []).reduce((sum, e) => sum + e.guestCount, 0),
    [eventsQ.data],
  )

  const lines = useMemo(() => {
    return aggregateShopping({
      ingredients: ingredientsQ.data ?? [],
      dishes: dishesQ.data ?? [],
      linksByDish: linksQ.data ?? {},
      totalGuests,
    })
  }, [ingredientsQ.data, dishesQ.data, linksQ.data, totalGuests])

  const groups = useMemo(() => groupBySupplier(lines), [lines])
  const grandTotalCents = lines.reduce((sum, l) => sum + l.totalCostCents, 0)
  const checkedCount = Object.values(checked).filter(Boolean).length

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

  return (
    <div className="vg-page flex flex-col gap-s-9">
      <ScreenHeader
        eyebrow="Aggregatie"
        title="Boodschappen"
        description="Aggregatie over alle gerechten × totaal gasten van de 3 avonden. Vink af terwijl je inkoopt."
      />

      <Card className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-line">
          <Stat label="Regels" value={String(lines.length)} />
          <Stat label="Totaal gasten" value={String(totalGuests)} />
          <Stat label="Afgevinkt" value={`${checkedCount} / ${lines.length}`} />
          <Stat
            label="Inkoop"
            value={formatEuro(grandTotalCents / 100)}
            accent
          />
        </div>
      </Card>

      {lines.length === 0 ? (
        <EmptyState
          icon={ShoppingBasket}
          title="Nog niets te kopen"
          description="Voeg ingrediënten toe aan gerechten in de Recepten-tab — dan rolt de lijst hier automatisch uit."
        />
      ) : (
        <div className="flex flex-col gap-s-5">
          {groups.map((group) => (
            <SupplierCard
              key={group.supplier ?? '__none__'}
              supplier={group.supplier}
              subtotalCents={group.subtotalCents}
              lines={group.lines}
              checked={checked}
              onToggle={(id) =>
                setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SupplierCard({
  supplier,
  subtotalCents,
  lines,
  checked,
  onToggle,
}: {
  supplier: string | null
  subtotalCents: number
  lines: ShoppingLine[]
  checked: Record<string, boolean>
  onToggle: (id: string) => void
}) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-baseline justify-between p-s-7">
        <h2 className="t-heading-l">{supplier ?? 'Geen leverancier'}</h2>
        <span className="t-body-m t-soft tabular">{formatEuro(subtotalCents / 100)}</span>
      </div>
      <ul className="list-none m-0 p-0" style={{ borderTop: '1px solid var(--line)' }}>
        {lines.map((line) => {
          const id = line.ingredient.id
          const done = Boolean(checked[id])
          return (
            <li
              key={id}
              className={cn('vg-list__row', done && 'vg-list__row--done')}
              style={{ gridTemplateColumns: '24px 1fr 140px 120px', cursor: 'pointer' }}
              onClick={() => onToggle(id)}
            >
              <Checkbox checked={done} onChange={() => onToggle(id)} onClick={(e) => e.stopPropagation()} />
              <span className="vg-list__title">{line.ingredient.name}</span>
              <span className="tabular text-ink-soft text-right">
                {formatNumber(line.totalAmount)} {line.ingredient.unit}
              </span>
              <span className="tabular text-ink text-right font-medium">
                {formatEuro(line.totalCostCents / 100)}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-s-6">
      <span className="t-caption t-faded">{label}</span>
      <div className={accent ? 't-heading-l tabular text-accent mt-s-2' : 't-heading-l tabular mt-s-2'}>
        {value}
      </div>
    </div>
  )
}
