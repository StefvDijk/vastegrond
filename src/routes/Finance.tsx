import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Expense } from '../types/domain'
import { useEvents } from '../features/events/hooks'
import { useIngredients } from '../features/ingredients/hooks'
import {
  useAllDishIngredients,
  useDishes,
} from '../features/dishes/hooks'
import {
  useDeleteExpense,
  useExpenses,
} from '../features/expenses/hooks'
import { ExpenseForm } from '../features/expenses/ExpenseForm'
import { aggregateShopping } from '../features/shopping/aggregate'
import { formatDateLong, formatEuro } from '../lib/format'
import { cn } from '../lib/cn'
import { Skeleton, SkeletonCard } from '../components/Skeleton'

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

  // CLAUDE.md regel 3:
  //   Vogelfrei-afrekening
  //     = (gasten × ticket) − foodcost-totaal − locatie_kosten − overige_kosten
  const totalRevenueCents = events.reduce(
    (sum, e) => sum + e.guestCount * e.ticketPriceCents,
    0,
  )
  const totalLocationCents = events.reduce(
    (sum, e) => sum + e.locationCostCents,
    0,
  )
  const totalGuests = events.reduce((sum, e) => sum + e.guestCount, 0)

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
    totalRevenueCents - foodcostCents - totalLocationCents - totalExpensesCents

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
      <div className="space-y-6">
        <div className="card p-5">
          <Skeleton className="h-7 w-32 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-2/3 ml-4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
        <SkeletonCard lines={3} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h1 className="text-2xl font-semibold tracking-tight">Financieel</h1>
        <p className="mt-1 text-sm text-text-muted">
          Vogelfrei-afrekening: (gasten × ticket) − foodcost − locatie − overige.
          Eén totaal over de hele pop-up-serie.
        </p>

        <dl className="mt-6 space-y-2">
          <Row label="Bruto-inkomsten" value={totalRevenueCents} positive />
          {events.map((e) => (
            <SubRow
              key={e.id}
              label={`${formatDateLong(e.eventDate)} — ${e.guestCount} × ${formatEuro(e.ticketPriceCents / 100)}`}
              value={e.guestCount * e.ticketPriceCents}
            />
          ))}
          <Row label="Foodcost" value={-foodcostCents} negative />
          <Row label="Locatie­kosten" value={-totalLocationCents} negative />
          <Row label="Overige uitgaven" value={-totalExpensesCents} negative />
          <Total label="Netto-resultaat" value={netCents} />
        </dl>
      </section>

      <section className="card p-5">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Overige uitgaven
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Bonnen, drank, decor, servicebureau — alles buiten foodcost &
              locatie.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAdding(true)
              setEditing(null)
            }}
            className="tap inline-flex items-center gap-1 rounded-ios bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden /> Nieuw
          </button>
        </header>

        {adding ? (
          <div className="mt-4 rounded-ios border border-border bg-surface p-4 animate-rise">
            <ExpenseForm
              onCancel={() => setAdding(false)}
              onSaved={() => setAdding(false)}
            />
          </div>
        ) : null}

        {editing ? (
          <div className="mt-4 rounded-ios border border-border bg-surface p-4 animate-rise">
            <ExpenseForm
              expense={editing}
              onCancel={() => setEditing(null)}
              onSaved={() => setEditing(null)}
            />
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-ios border border-border">
          {expenses.length === 0 ? (
            <p className="p-4 text-sm text-text-muted">
              Nog geen overige uitgaven.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-text-subtle">
                <tr>
                  <th className="px-3 py-2">Categorie</th>
                  <th className="px-3 py-2">Omschrijving</th>
                  <th className="px-3 py-2 text-right">Bedrag</th>
                  <th className="px-3 py-2 text-right">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-surface-2/40">
                    <td className="px-3 py-2 font-medium">
                      {expense.category}
                    </td>
                    <td className="px-3 py-2 text-text-muted">
                      {expense.description}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatEuro(expense.amountCents / 100)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Bewerken"
                          onClick={() => {
                            setEditing(expense)
                            setAdding(false)
                          }}
                          className="rounded-ios p-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label="Verwijderen"
                          onClick={() => void handleDeleteExpense(expense)}
                          className="rounded-ios p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-surface-2/40 font-medium">
                  <td className="px-3 py-2" colSpan={2}>
                    Totaal
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatEuro(totalExpensesCents / 100)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}

function Row({
  label,
  value,
  positive,
  negative,
}: {
  label: string
  value: number
  positive?: boolean
  negative?: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-b-0">
      <span className="text-sm font-medium text-text">{label}</span>
      <span
        className={cn(
          'text-base font-semibold tabular-nums',
          positive && 'text-success',
          negative && 'text-text-muted',
        )}
      >
        {formatSignedEuro(value)}
      </span>
    </div>
  )
}

function SubRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between pl-4 text-xs text-text-subtle">
      <span>{label}</span>
      <span className="tabular-nums">{formatEuro(value / 100)}</span>
    </div>
  )
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <div className="mt-2 flex items-center justify-between rounded-ios bg-surface-2 px-3 py-3">
      <span className="text-sm font-semibold uppercase tracking-wide text-text-subtle">
        {label}
      </span>
      <span
        className={cn(
          'text-xl font-semibold tabular-nums',
          value >= 0 ? 'text-success' : 'text-danger',
        )}
      >
        {formatSignedEuro(value)}
      </span>
    </div>
  )
}

function formatSignedEuro(cents: number): string {
  const sign = cents < 0 ? '−' : ''
  return `${sign}${formatEuro(Math.abs(cents) / 100)}`
}
