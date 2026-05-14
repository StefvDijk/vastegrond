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
import { formatDateLong, formatEuro } from '../lib/format'
import { Button, Card, ScreenHeader } from '../components/ui'
import { Skeleton } from '../components/Skeleton'
import { VOGELFREI_SHARE, vogelfreiCutCents } from '../lib/finance'

export function Finance() {
  const eventsQ = useEvents()
  const ingredientsQ = useIngredients()
  const dishesQ = useDishes()
  const linksQ = useAllDishIngredients()
  const expensesQ = useExpenses()
  const delExpense = useDeleteExpense()

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

  const events = eventsQ.data ?? []
  const expenses = expensesQ.data ?? []

  // Vogelfrei-afrekening:
  //   bruto-omzet (gasten × ticket)
  //   − 40% afdracht aan Vogelfrei
  //   − foodcost-totaal
  //   − locatie_kosten (extra per-event kosten naast de afdracht)
  //   − overige_kosten
  const totalRevenueCents = events.reduce(
    (sum, e) => sum + e.guestCount * e.ticketPriceCents,
    0,
  )
  const totalLocationCents = events.reduce((sum, e) => sum + e.locationCostCents, 0)
  const totalGuests = events.reduce((sum, e) => sum + e.guestCount, 0)
  const vogelfreiAfdrachtCents = vogelfreiCutCents(totalRevenueCents)

  const foodcostCents = useMemo(() => {
    const lines = aggregateShopping({
      ingredients: ingredientsQ.data ?? [],
      dishes: dishesQ.data ?? [],
      linksByDish: linksQ.data ?? {},
      totalGuests,
    })
    return lines.reduce((sum, l) => sum + l.totalCostCents, 0)
  }, [ingredientsQ.data, dishesQ.data, linksQ.data, totalGuests])

  const totalExpensesCents = expenses.reduce((sum, e) => sum + e.amountCents, 0)
  const netCents =
    totalRevenueCents -
    vogelfreiAfdrachtCents -
    foodcostCents -
    totalLocationCents -
    totalExpensesCents
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

  return (
    <div className="vg-page flex flex-col gap-s-9">
      <ScreenHeader
        eyebrow="Vogelfrei-afrekening"
        title="Geld"
        description="Bruto-omzet − 40% Vogelfrei-afdracht − foodcost − locatie − overige. Eén totaal over de pop-up-serie."
      />

      {/* Vogelfrei voorwaarden */}
      <Card>
        <div className="flex items-baseline justify-between gap-s-4 flex-wrap">
          <div>
            <span className="t-caption t-faded">Vogelfrei-deal</span>
            <h2 className="t-heading-l mt-s-1">40% van de ticket-omzet</h2>
            <p className="t-body-s t-soft mt-s-2" style={{ maxWidth: '56ch' }}>
              Afdracht aan Vogelfrei is een vast aandeel van de bruto ticket-omzet. Locatie-extras
              (depot, schoonmaak) staan los hieronder als locatiekosten per avond.
            </p>
          </div>
          <div className="text-right">
            <span className="t-caption t-faded">Afdracht serie</span>
            <div className="t-display-m tabular mt-s-2 text-ink">
              {formatEuro(vogelfreiAfdrachtCents / 100)}
            </div>
          </div>
        </div>
      </Card>

      {/* Main table */}
      <Card className="p-0 overflow-hidden">
        <table className="vg-table">
          <thead>
            <tr>
              <th>Avond</th>
              <th className="vg-table__right">Gasten</th>
              <th className="vg-table__right">Prijs</th>
              <th className="vg-table__right">Omzet</th>
              <th className="vg-table__right">Afdracht 40%</th>
              <th className="vg-table__right">Locatie</th>
              <th className="vg-table__right">Resterend</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => {
              const revenue = e.guestCount * e.ticketPriceCents
              const afdracht = vogelfreiCutCents(revenue)
              const rest = revenue - afdracht - e.locationCostCents
              return (
                <tr key={e.id}>
                  <td>
                    <div className="font-medium text-ink">{e.name}</div>
                    <div className="t-body-s t-faded mt-s-1">
                      {formatDateLong(e.eventDate)}
                    </div>
                  </td>
                  <td className="vg-table__right tabular">{e.guestCount}</td>
                  <td className="vg-table__right tabular">
                    {formatEuro(e.ticketPriceCents / 100)}
                  </td>
                  <td className="vg-table__right tabular vg-table__title">
                    {formatEuro(revenue / 100)}
                  </td>
                  <td className="vg-table__right tabular vg-table__muted">
                    − {formatEuro(afdracht / 100)}
                  </td>
                  <td className="vg-table__right tabular vg-table__muted">
                    − {formatEuro(e.locationCostCents / 100)}
                  </td>
                  <td className="vg-table__right tabular vg-table__title">
                    {formatEuro(rest / 100)}
                  </td>
                </tr>
              )
            })}
            <tr className="vg-table__total">
              <td>Totaal</td>
              <td className="vg-table__right tabular">{totalGuests}</td>
              <td />
              <td className="vg-table__right tabular">
                {formatEuro(totalRevenueCents / 100)}
              </td>
              <td className="vg-table__right tabular">
                − {formatEuro(vogelfreiAfdrachtCents / 100)}
              </td>
              <td className="vg-table__right tabular">
                − {formatEuro(totalLocationCents / 100)}
              </td>
              <td className="vg-table__right tabular">
                {formatEuro(
                  (totalRevenueCents - vogelfreiAfdrachtCents - totalLocationCents) / 100,
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-s-5 md:grid-cols-3">
        <SummaryCard
          label="Per couvert"
          value={formatEuro(perGuestCents / 100)}
          sublines={[
            ['Bruto-omzet', formatEuro(totalRevenueCents / Math.max(totalGuests, 1) / 100)],
            ['Vogelfrei 40%', `− ${formatEuro(vogelfreiAfdrachtCents / Math.max(totalGuests, 1) / 100)}`],
            ['Foodcost', `− ${formatEuro(foodcostCents / Math.max(totalGuests, 1) / 100)}`],
          ]}
          tone={perGuestCents >= 0 ? 'positive' : 'negative'}
        />
        <SummaryCard
          label="Verhoudingen"
          value={`${marginPct.toFixed(1)}%`}
          sublines={[
            ['Vogelfrei-ratio', `${(VOGELFREI_SHARE * 100).toFixed(0)}%`],
            ['Foodcost-ratio', `${((foodcostCents / Math.max(totalRevenueCents, 1)) * 100).toFixed(1)}%`],
            ['Overige', formatEuro(totalExpensesCents / 100)],
          ]}
        />
        <SummaryCard
          label="Netto-resultaat"
          value={formatSignedEuro(netCents)}
          sublines={[
            ['Vogelfrei-afdracht', `− ${formatEuro(vogelfreiAfdrachtCents / 100)}`],
            ['Foodcost-totaal', `− ${formatEuro(foodcostCents / 100)}`],
            ['Locatie + overige', `− ${formatEuro((totalLocationCents + totalExpensesCents) / 100)}`],
          ]}
          tone={netCents >= 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* Overige uitgaven */}
      <section className="flex flex-col gap-s-4">
        <header className="flex items-end justify-between gap-s-4">
          <div>
            <span className="t-caption t-faded">Buiten foodcost en locatie</span>
            <h2 className="t-heading-l mt-s-1">Overige uitgaven</h2>
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

        <Card className="p-0 overflow-hidden">
          {expenses.length === 0 ? (
            <p className="p-s-7 t-body-m t-soft">Nog geen overige uitgaven.</p>
          ) : (
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
                    <td className="vg-table__right tabular">
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
                  <td className="vg-table__right tabular">
                    {formatEuro(totalExpensesCents / 100)}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          )}
        </Card>
      </section>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  sublines,
  tone,
}: {
  label: string
  value: string
  sublines: Array<[string, string]>
  tone?: 'positive' | 'negative'
}) {
  return (
    <Card>
      <span className="t-caption t-faded">{label}</span>
      <div
        className="t-display-l tabular mt-s-3"
        style={{
          color:
            tone === 'positive'
              ? 'var(--positive)'
              : tone === 'negative'
                ? 'var(--negative)'
                : undefined,
        }}
      >
        {value}
      </div>
      <div className="vg-card__sep" />
      <div className="flex flex-col gap-s-2 t-body-s">
        {sublines.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between">
            <span className="t-soft">{k}</span>
            <span className="tabular text-ink">{v}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function formatSignedEuro(cents: number): string {
  const sign = cents < 0 ? '−' : ''
  return `${sign}${formatEuro(Math.abs(cents) / 100)}`
}
