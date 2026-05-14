import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useEvents } from '../features/events/hooks'
import { useIngredients } from '../features/ingredients/hooks'
import {
  useAllDishIngredients,
  useDishes,
} from '../features/dishes/hooks'
import {
  aggregateShopping,
  groupBySupplier,
  type ShoppingLine,
} from '../features/shopping/aggregate'
import { formatEuro, formatNumber } from '../lib/format'

export function Shopping() {
  const eventsQ = useEvents()
  const ingredientsQ = useIngredients()
  const dishesQ = useDishes()
  const linksQ = useAllDishIngredients()

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

  const loading =
    eventsQ.isLoading ||
    ingredientsQ.isLoading ||
    dishesQ.isLoading ||
    linksQ.isLoading

  if (loading) {
    return <p className="text-sm text-text-muted">Boodschappen berekenen…</p>
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h1 className="text-2xl font-semibold tracking-tight">
          Boodschappenlijst
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Aggregatie over alle gerechten × totaal gasten van de 3 avonden.
          Inkoop-eenheid is een hint — kies zelf het aantal zakken/flessen.
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <Stat label="Totaal gasten" value={String(totalGuests)} />
          <Stat label="Unieke ingrediënten" value={String(lines.length)} />
          <Stat
            label="Totale foodcost"
            value={formatEuro(grandTotalCents / 100)}
            emphasis
          />
        </dl>
      </section>

      {lines.length === 0 ? (
        <section className="card p-5">
          <p className="text-sm text-text-muted">
            Nog niets te kopen — voeg ingrediënten toe aan gerechten in de
            Gerechten-tab.
          </p>
        </section>
      ) : (
        groups.map((group) => (
          <section key={group.supplier ?? '__none__'} className="card p-5">
            <header className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">
                {group.supplier ?? 'Geen leverancier'}
              </h2>
              <p className="text-sm tabular-nums text-text-muted">
                Subtotaal{' '}
                <span className="font-semibold text-text">
                  {formatEuro(group.subtotalCents / 100)}
                </span>
              </p>
            </header>

            <div className="mt-4 overflow-hidden rounded-ios border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-text-subtle">
                  <tr>
                    <th className="w-7 px-2 py-2"></th>
                    <th className="px-3 py-2">Ingrediënt</th>
                    <th className="px-3 py-2 text-right">Hoeveelheid</th>
                    <th className="px-3 py-2">Inkoop-eenheid</th>
                    <th className="px-3 py-2 text-right">Kosten</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {group.lines.map((line) => (
                    <LineRow key={line.ingredient.id} line={line} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  )
}

function LineRow({ line }: { line: ShoppingLine }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr className="hover:bg-surface-2/40">
        <td className="px-2 py-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Inklappen' : 'Uitklappen'}
            className="grid size-6 place-items-center rounded-ios text-text-muted hover:bg-surface-2 hover:text-text"
          >
            {expanded ? (
              <ChevronDown className="size-3.5" aria-hidden />
            ) : (
              <ChevronRight className="size-3.5" aria-hidden />
            )}
          </button>
        </td>
        <td className="px-3 py-2 font-medium">{line.ingredient.name}</td>
        <td className="px-3 py-2 text-right tabular-nums">
          {formatNumber(line.totalAmount)}{' '}
          <span className="text-xs text-text-muted">
            {line.ingredient.unit}
          </span>
        </td>
        <td className="px-3 py-2 text-text-muted">
          {line.ingredient.purchaseUnit ?? '—'}
        </td>
        <td className="px-3 py-2 text-right tabular-nums">
          {formatEuro(line.totalCostCents / 100)}
        </td>
      </tr>
      {expanded ? (
        <tr className="bg-surface-2/40">
          <td></td>
          <td colSpan={4} className="px-3 py-2">
            <p className="mb-2 text-xs uppercase tracking-wide text-text-subtle">
              Komt uit
            </p>
            <ul className="space-y-1 text-xs">
              {line.contributions.map((c) => (
                <li
                  key={c.dish.id}
                  className="flex justify-between gap-3 text-text-muted"
                >
                  <span>{c.dish.name}</span>
                  <span className="tabular-nums">
                    {formatNumber(c.perPortion)} {line.ingredient.unit}/p ·{' '}
                    <span className="font-medium text-text">
                      {formatNumber(c.totalForDish)} {line.ingredient.unit}
                    </span>{' '}
                    totaal
                  </span>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      ) : null}
    </>
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
            ? 'mt-0.5 text-xl font-semibold tabular-nums'
            : 'mt-0.5 text-xl font-semibold tabular-nums'
        }
      >
        {value}
      </dd>
    </div>
  )
}
