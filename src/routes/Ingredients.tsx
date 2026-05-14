import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Ingredient } from '../types/domain'
import { formatEuro } from '../lib/format'
import {
  useDeleteIngredient,
  useIngredients,
} from '../features/ingredients/hooks'
import { IngredientForm } from '../features/ingredients/IngredientForm'

export function Ingredients() {
  const { data, isLoading, isError, error } = useIngredients()
  const del = useDeleteIngredient()
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [adding, setAdding] = useState(false)

  const filtered = useMemo(() => {
    if (!data) return []
    const q = filter.trim().toLowerCase()
    if (!q) return data
    return data.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.supplier ?? '').toLowerCase().includes(q),
    )
  }, [data, filter])

  async function handleDelete(ingredient: Ingredient) {
    if (!window.confirm(`"${ingredient.name}" verwijderen?`)) return
    try {
      await del.mutateAsync(ingredient.id)
      toast.success('Verwijderd')
    } catch {
      /* foreign-key fout (gebruikt in gerecht) wordt al getoast */
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Ingrediënten
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Gedeelde bibliotheek. Eenheid + prijs bepalen de foodcost van een
              gerecht.
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
            <Plus className="size-4" aria-hidden /> Nieuw ingrediënt
          </button>
        </header>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Zoek op naam of leverancier…"
          className="mt-4 w-full rounded-ios border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </section>

      {adding ? (
        <section className="card p-5 animate-rise">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Nieuw ingrediënt
          </h2>
          <IngredientForm
            onCancel={() => setAdding(false)}
            onSaved={() => setAdding(false)}
          />
        </section>
      ) : null}

      {editing ? (
        <section className="card p-5 animate-rise">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            {editing.name} bewerken
          </h2>
          <IngredientForm
            ingredient={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => setEditing(null)}
          />
        </section>
      ) : null}

      <section className="card p-0 overflow-hidden">
        {isLoading ? (
          <p className="p-5 text-sm text-text-muted">Ingrediënten laden…</p>
        ) : isError ? (
          <p className="p-5 text-sm text-danger">
            Kon ingrediënten niet laden —{' '}
            {error instanceof Error ? error.message : 'fout'}
          </p>
        ) : filtered.length === 0 ? (
          <p className="p-5 text-sm text-text-muted">
            {data && data.length > 0
              ? 'Geen resultaten voor deze zoekopdracht.'
              : 'Nog geen ingrediënten. Voeg er één toe om te beginnen.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-text-subtle">
              <tr>
                <th className="px-4 py-3">Naam</th>
                <th className="px-4 py-3">Eenheid</th>
                <th className="px-4 py-3 text-right">Prijs / eenheid</th>
                <th className="px-4 py-3">Inkoop</th>
                <th className="px-4 py-3">Leverancier</th>
                <th className="px-4 py-3 text-right">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((i) => (
                <tr key={i.id} className="hover:bg-surface-2/60">
                  <td className="px-4 py-2 font-medium">{i.name}</td>
                  <td className="px-4 py-2 tabular-nums">{i.unit}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatEuro(i.pricePerUnitCents / 100)}
                  </td>
                  <td className="px-4 py-2">{i.purchaseUnit ?? '—'}</td>
                  <td className="px-4 py-2">{i.supplier ?? '—'}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Bewerken"
                        onClick={() => {
                          setEditing(i)
                          setAdding(false)
                        }}
                        className="rounded-ios p-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
                      >
                        <Pencil className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label="Verwijderen"
                        onClick={() => void handleDelete(i)}
                        className="rounded-ios p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
