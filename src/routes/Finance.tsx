import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Expense } from '../types/domain'
import { useEvents } from '../features/events/hooks'
import { useIngredients } from '../features/ingredients/hooks'
import { useAllDishIngredients, useDishes } from '../features/dishes/hooks'
import { useDeleteExpense, useExpenses } from '../features/expenses/hooks'
import { ExpenseForm } from '../features/expenses/ExpenseForm'
import { aggregateShopping } from '../features/shopping/aggregate'
import { formatEuro } from '../lib/format'
import { Button, Card } from '../components/ui'
import { Skeleton } from '../components/Skeleton'
import { VOGELFREI_SHARE, vogelfreiCutCents } from '../lib/finance'
import { cn } from '../lib/cn'

type EventSelection = 'all' | string

function formatSignedEuro(cents: number): string {
  const sign = cents < 0 ? '−' : ''
  return `${sign}${formatEuro(Math.abs(cents) / 100)}`
}

export function Finance() {
  const eventsQ = useEvents()
  const ingredientsQ = useIngredients()
  const dishesQ = useDishes()
  const linksQ = useAllDishIngredients()
  const expensesQ = useExpenses()
  const delExpense = useDeleteExpense()

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [selection, setSelection] = useState<EventSelection>('all')

  const allEvents = useMemo(() => {
    const list = eventsQ.data ?? []
    return [...list].sort((a, b) => a.eventDate.localeCompare(b.eventDate))
  }, [eventsQ.data])

  const expenses = expensesQ.data ?? []

  const selectedEvents = useMemo(
    () => (selection === 'all' ? allEvents : allEvents.filter((e) => e.id === selection)),
    [allEvents, selection],
  )

  const totalRevenueCents = selectedEvents.reduce(
    (sum, e) => sum + e.guestCount * e.ticketPriceCents,
    0,
  )
  const totalLocationCents = selectedEvents.reduce(
    (sum, e) => sum + e.locationCostCents,
    0,
  )
  const totalGuests = selectedEvents.reduce((sum, e) => sum + e.guestCount, 0)
  const vogelfreiAfdrachtCents = vogelfreiCutCents(totalRevenueCents)

  // Foodcost: aggregateShopping rekent per guest × ingredient hoeveelheid; selectie via totalGuests.
  const foodcostCents = useMemo(() => {
    const lines = aggregateShopping({
      ingredients: ingredientsQ.data ?? [],
      dishes: dishesQ.data ?? [],
      linksByDish: linksQ.data ?? {},
      totalGuests,
    })
    return lines.reduce((sum, l) => sum + l.totalCostCents, 0)
  }, [ingredientsQ.data, dishesQ.data, linksQ.data, totalGuests])

  // Overige uitgaven: niet event-specifiek in huidig schema; tonen volledige bedrag, alleen bij 'all'.
  const overheadCents = selection === 'all' ? expenses.reduce((s, e) => s + e.amountCents, 0) : 0
  const netCents =
    totalRevenueCents -
    vogelfreiAfdrachtCents -
    foodcostCents -
    totalLocationCents -
    overheadCents
  const marginPct = totalRevenueCents > 0 ? (netCents / totalRevenueCents) * 100 : 0
  const perGuestCents = totalGuests > 0 ? netCents / totalGuests : 0

  async function handleDeleteExpense(expense: Expense) {
    if (!window.confirm(`"${expense.description}" verwijderen?`)) return
    try {
      await delExpense.mutateAsync(expense.id)
      toast.success('Verwijderd')
    } catch {
      /* toast in hook */
    }
  }

  if (
    eventsQ.isLoading ||
    ingredientsQ.isLoading ||
    dishesQ.isLoading ||
    expensesQ.isLoading
  ) {
    return (
      <div className="vg-page">
        <Skeleton className="h-10 w-48 mb-s-7" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Per-event breakdown for desktop table.
  const breakdown = allEvents.map((e, idx) => {
    const revenue = e.guestCount * e.ticketPriceCents
    const afdracht = vogelfreiCutCents(revenue)
    const eventFoodcost = aggregateShopping({
      ingredients: ingredientsQ.data ?? [],
      dishes: dishesQ.data ?? [],
      linksByDish: linksQ.data ?? {},
      totalGuests: e.guestCount,
    }).reduce((sum, l) => sum + l.totalCostCents, 0)
    return {
      id: e.id,
      label: `Avond ${idx + 1}`,
      guestCount: e.guestCount,
      revenueCents: revenue,
      vogelfreiCents: afdracht,
      foodcostCents: eventFoodcost,
      locationCents: e.locationCostCents,
      marginCents: revenue - afdracht - eventFoodcost - e.locationCostCents,
    }
  })

  const totalsRow = breakdown.reduce(
    (acc, row) => ({
      guestCount: acc.guestCount + row.guestCount,
      revenueCents: acc.revenueCents + row.revenueCents,
      vogelfreiCents: acc.vogelfreiCents + row.vogelfreiCents,
      foodcostCents: acc.foodcostCents + row.foodcostCents,
      locationCents: acc.locationCents + row.locationCents,
      marginCents: acc.marginCents + row.marginCents,
    }),
    {
      guestCount: 0,
      revenueCents: 0,
      vogelfreiCents: 0,
      foodcostCents: 0,
      locationCents: 0,
      marginCents: 0,
    },
  )

  return (
    <div className="vg-page flex flex-col gap-s-9">
      {/* Header */}
      <header className="flex flex-col gap-s-3 md:flex-row md:items-end md:justify-between md:gap-s-6">
        <div>
          <span className="t-caption t-faded">Vogelfrei-afrekening · verwacht</span>
          <h1 className="t-display-m mt-s-2">Finance</h1>
        </div>
        <div className="flex items-center gap-s-3 flex-wrap">
          <Segmented
            value={selection}
            options={[
              { value: 'all', label: 'Alle 3' },
              ...allEvents.map((e, i) => ({ value: e.id, label: `Avond ${i + 1}` })),
            ]}
            onChange={setSelection}
          />
        </div>
      </header>

      {/* Hero meter — verwachte marge */}
      <section
        className="vg-card vg-card--bordered flex flex-col gap-s-3"
        style={{ padding: 'var(--s-7)' }}
      >
        <span className="t-caption t-faded">
          Verwachte marge · {selection === 'all' ? 'alle avonden' : selectionLabel(selection, allEvents)}
        </span>
        <div className="flex items-baseline gap-s-3">
          <span
            className="font-mono tabular-nums"
            style={{
              fontSize: 56,
              lineHeight: 1,
              letterSpacing: '-0.022em',
              color: netCents >= 0 ? 'var(--positive)' : 'var(--negative)',
            }}
          >
            {formatSignedEuro(netCents)}
          </span>
          <span className="t-body-s t-faded">{netCents >= 0 ? 'winst' : 'verlies'}</span>
        </div>
        <div className="t-mono-s t-faded">
          {marginPct.toFixed(0)}% op {formatEuro(totalRevenueCents / 100)} omzet · {totalGuests}{' '}
          {totalGuests === 1 ? 'gast' : 'gasten'}
        </div>
      </section>

      {/* Mobile: fin-rows in groepen */}
      <section className="md:hidden flex flex-col gap-s-2">
        <div className="t-caption t-faded px-s-1">Inkomsten</div>
        <div className="vg-list">
          <FinRow
            label="Tickets"
            detail={`${totalGuests} gasten × ${formatEuro((selectedEvents[0]?.ticketPriceCents ?? 0) / 100)}`}
            value={formatEuro(totalRevenueCents / 100)}
          />
        </div>

        <div className="t-caption t-faded px-s-1 mt-s-4">Uitgaven</div>
        <div className="vg-list">
          <FinRow
            label="Vogelfrei afdracht"
            detail={`${(VOGELFREI_SHARE * 100).toFixed(0)}% van omzet`}
            value={`−${formatEuro(vogelfreiAfdrachtCents / 100)}`}
            negative
          />
          <FinRow
            label="Foodcost"
            detail={`${selectedEvents.length} ${selectedEvents.length === 1 ? 'avond' : 'avonden'}`}
            value={`−${formatEuro(foodcostCents / 100)}`}
            negative
          />
          <FinRow
            label="Locatiekosten"
            detail={`${formatEuro(
              (selectedEvents[0]?.locationCostCents ?? 0) / 100,
            )} × ${selectedEvents.length} avond${selectedEvents.length === 1 ? '' : 'en'}`}
            value={`−${formatEuro(totalLocationCents / 100)}`}
            negative
          />
          {overheadCents > 0 ? (
            <FinRow
              label="Overig"
              detail={`${expenses.length} ${expenses.length === 1 ? 'post' : 'posten'}`}
              value={`−${formatEuro(overheadCents / 100)}`}
              negative
            />
          ) : null}
        </div>

        <div className="vg-list mt-s-4">
          <FinRow
            label="Marge"
            value={formatSignedEuro(netCents)}
            total
          />
          <FinRow
            label="Per gast"
            value={formatEuro(perGuestCents / 100)}
            muted
          />
        </div>
      </section>

      {/* Desktop: full breakdown table */}
      <section className="hidden md:block">
        <div className="vg-card vg-card--bordered overflow-hidden" style={{ padding: 0 }}>
          <table className="vg-table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Detail</th>
                <th className="vg-table__right">Per gast</th>
                {breakdown.map((row) => (
                  <th key={row.id} className="vg-table__right">
                    {row.label}
                  </th>
                ))}
                <th className="vg-table__right">Totaal</th>
              </tr>
            </thead>
            <tbody>
              <BreakdownRow
                label="Tickets"
                detail={`${totalsRow.guestCount} gasten × ${formatEuro(
                  (allEvents[0]?.ticketPriceCents ?? 0) / 100,
                )}`}
                perGuest={
                  totalsRow.guestCount > 0
                    ? formatEuro(totalsRow.revenueCents / totalsRow.guestCount / 100)
                    : '—'
                }
                values={breakdown.map((r) => formatEuro(r.revenueCents / 100))}
                total={formatEuro(totalsRow.revenueCents / 100)}
                bold
              />
              <BreakdownRow
                label="Vogelfrei share"
                detail={`${(VOGELFREI_SHARE * 100).toFixed(0)}% (vast)`}
                perGuest={
                  totalsRow.guestCount > 0
                    ? `−${formatEuro(totalsRow.vogelfreiCents / totalsRow.guestCount / 100)}`
                    : '—'
                }
                values={breakdown.map((r) => `−${formatEuro(r.vogelfreiCents / 100)}`)}
                total={`−${formatEuro(totalsRow.vogelfreiCents / 100)}`}
                negative
              />
              <BreakdownRow
                label="Foodcost"
                detail={`${dishesQ.data?.length ?? 0} gerechten`}
                perGuest={
                  totalsRow.guestCount > 0
                    ? `−${formatEuro(totalsRow.foodcostCents / totalsRow.guestCount / 100)}`
                    : '—'
                }
                values={breakdown.map((r) => `−${formatEuro(r.foodcostCents / 100)}`)}
                total={`−${formatEuro(totalsRow.foodcostCents / 100)}`}
                negative
              />
              <BreakdownRow
                label="Locatiekosten"
                detail={`${formatEuro(
                  (allEvents[0]?.locationCostCents ?? 0) / 100,
                )} per avond`}
                perGuest={
                  totalsRow.guestCount > 0
                    ? `−${formatEuro(totalsRow.locationCents / totalsRow.guestCount / 100)}`
                    : '—'
                }
                values={breakdown.map((r) => `−${formatEuro(r.locationCents / 100)}`)}
                total={`−${formatEuro(totalsRow.locationCents / 100)}`}
                negative
              />
              {expenses.length > 0 ? (
                <BreakdownRow
                  label="Overig"
                  detail={expenses.map((e) => e.description).slice(0, 3).join(', ')}
                  perGuest="—"
                  values={breakdown.map(() => '—')}
                  total={`−${formatEuro(
                    expenses.reduce((s, e) => s + e.amountCents, 0) / 100,
                  )}`}
                  negative
                />
              ) : null}
              <tr className="vg-table__total">
                <td>Marge</td>
                <td className="vg-table__muted">Na alle kosten</td>
                <td className="vg-table__right vg-table__num">
                  {totalsRow.guestCount > 0
                    ? formatEuro(totalsRow.marginCents / totalsRow.guestCount / 100)
                    : '—'}
                </td>
                {breakdown.map((r) => (
                  <td key={r.id} className="vg-table__right vg-table__num">
                    {formatEuro(r.marginCents / 100)}
                  </td>
                ))}
                <td className="vg-table__right vg-table__num">
                  {formatEuro(totalsRow.marginCents / 100)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Overige uitgaven beheer */}
      <section className="flex flex-col gap-s-4">
        <header className="flex items-end justify-between gap-s-4">
          <div>
            <span className="t-caption t-faded">Buiten foodcost en locatie</span>
            <h2 className="t-title-l mt-s-1">Overige uitgaven</h2>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setAdding(true)
              setEditing(null)
            }}
          >
            <Plus size={16} aria-hidden /> Nieuwe uitgave
          </Button>
        </header>

        {adding ? (
          <Card>
            <ExpenseForm onCancel={() => setAdding(false)} onSaved={() => setAdding(false)} />
          </Card>
        ) : null}
        {editing ? (
          <Card>
            <ExpenseForm
              expense={editing}
              onCancel={() => setEditing(null)}
              onSaved={() => setEditing(null)}
            />
          </Card>
        ) : null}

        {expenses.length === 0 ? (
          <div className="vg-card vg-card--bordered">
            <p className="t-body-m t-soft">Nog geen overige uitgaven.</p>
          </div>
        ) : (
          <div className="vg-card vg-card--bordered overflow-hidden" style={{ padding: 0 }}>
            <table className="vg-table">
              <thead>
                <tr>
                  <th>Categorie</th>
                  <th>Omschrijving</th>
                  <th className="vg-table__right">Bedrag</th>
                  <th className="vg-table__right" style={{ width: 100 }} />
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="vg-table__title">{expense.category}</td>
                    <td className="vg-table__muted">{expense.description}</td>
                    <td className="vg-table__right vg-table__num">
                      {formatEuro(expense.amountCents / 100)}
                    </td>
                    <td className="vg-table__right">
                      <div className="inline-flex items-center gap-s-1">
                        <button
                          type="button"
                          className="vg-sheet__close"
                          aria-label="Bewerken"
                          onClick={() => {
                            setEditing(expense)
                            setAdding(false)
                          }}
                        >
                          <Pencil size={16} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="vg-sheet__close hover:text-negative"
                          aria-label="Verwijderen"
                          onClick={() => void handleDeleteExpense(expense)}
                        >
                          <Trash2 size={16} aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="vg-table__total">
                  <td colSpan={2}>Totaal</td>
                  <td className="vg-table__right vg-table__num">
                    {formatEuro(
                      expenses.reduce((s, e) => s + e.amountCents, 0) / 100,
                    )}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function selectionLabel(id: string, events: Array<{ id: string }>): string {
  const idx = events.findIndex((e) => e.id === id)
  return idx >= 0 ? `avond ${idx + 1}` : 'avond'
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (next: string) => void
}) {
  return (
    <div className="vg-seg" role="tablist">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={opt.value === value}
          className={cn('vg-seg__item', opt.value === value && 'vg-seg__item--on')}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function FinRow({
  label,
  detail,
  value,
  negative,
  total,
  muted,
}: {
  label: string
  detail?: string
  value: string
  negative?: boolean
  total?: boolean
  muted?: boolean
}) {
  const valueColor = negative
    ? 'var(--negative)'
    : total
      ? 'var(--ink)'
      : muted
        ? 'var(--ink-faded)'
        : 'var(--ink)'
  return (
    <div className="vg-list__row">
      <div className="vg-list__content">
        <div className={cn('vg-list__title', total && 'font-medium')}>{label}</div>
        {detail ? <div className="vg-list__subtitle">{detail}</div> : null}
      </div>
      <div
        className={cn(
          'font-mono tabular-nums',
          total ? 't-mono-l font-medium' : 't-mono-m',
        )}
        style={{ color: valueColor }}
      >
        {value}
      </div>
    </div>
  )
}

function BreakdownRow({
  label,
  detail,
  perGuest,
  values,
  total,
  bold,
  negative,
}: {
  label: string
  detail: string
  perGuest: string
  values: string[]
  total: string
  bold?: boolean
  negative?: boolean
}) {
  const color = negative ? 'var(--negative)' : undefined
  return (
    <tr>
      <td className={cn(bold && 'vg-table__title')} style={{ color }}>
        {label}
      </td>
      <td className="vg-table__muted">{detail}</td>
      <td className="vg-table__right vg-table__num vg-table__muted">{perGuest}</td>
      {values.map((v, i) => (
        <td key={i} className="vg-table__right vg-table__num" style={{ color }}>
          {v}
        </td>
      ))}
      <td
        className={cn('vg-table__right vg-table__num', bold && 'vg-table__title')}
        style={{ color, fontWeight: bold || negative ? 500 : undefined }}
      >
        {total}
      </td>
    </tr>
  )
}
