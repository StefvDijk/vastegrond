import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Ingredient } from '../types/domain'
import { formatEuro } from '../lib/format'
import { useDeleteIngredient, useIngredients } from '../features/ingredients/hooks'
import { IngredientForm } from '../features/ingredients/IngredientForm'
import {
  Button,
  Card,
  Counter,
  ScreenHeader,
  Search,
  Sheet,
} from '../components/ui'

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
      setEditing(null)
    } catch {
      /* fk error wordt in hook getoast */
    }
  }

  const total = data?.length ?? 0

  return (
    <div className="vg-page flex flex-col gap-s-9">
      <ScreenHeader
        eyebrow="Bibliotheek"
        title="Ingrediënten"
        description="Gedeelde bibliotheek. Eenheid en prijs bepalen de foodcost van een gerecht."
        actions={
          <Button variant="accent" onClick={() => setAdding(true)}>
            <Plus size={16} aria-hidden /> Ingrediënt
          </Button>
        }
      />

      <div className="flex items-center gap-s-4 flex-wrap">
        <div className="flex-1 max-w-[420px]">
          <Search
            placeholder="Zoek op naam of leverancier…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Counter>
          {filtered.length} van {total}
        </Counter>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <p className="p-s-7 t-body-m t-soft">Ingrediënten laden…</p>
        ) : isError ? (
          <p className="p-s-7 t-body-m text-negative">
            Kon ingrediënten niet laden — {error instanceof Error ? error.message : 'fout'}
          </p>
        ) : filtered.length === 0 ? (
          <p className="p-s-7 t-body-m t-soft">
            {data && data.length > 0
              ? 'Geen resultaten voor deze zoekopdracht.'
              : 'Nog geen ingrediënten. Voeg er één toe om te beginnen.'}
          </p>
        ) : (
          <table className="vg-table">
            <thead>
              <tr>
                <th>Ingrediënt</th>
                <th>Eenheid</th>
                <th className="vg-table__right">Prijs</th>
                <th>Inkoop</th>
                <th>Leverancier</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr
                  key={i.id}
                  onClick={() => {
                    setEditing(i)
                    setAdding(false)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="vg-table__title">{i.name}</td>
                  <td className="vg-table__muted tabular">{i.unit}</td>
                  <td className="vg-table__right tabular">
                    {formatEuro(i.pricePerUnitCents / 100)}
                  </td>
                  <td className="vg-table__muted">{i.purchaseUnit ?? '—'}</td>
                  <td className="vg-table__muted">{i.supplier ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* New ingredient sheet */}
      <Sheet
        open={adding}
        onClose={() => setAdding(false)}
        eyebrow="Nieuw"
        title="Ingrediënt toevoegen"
        footer={
          <>
            <span />
            <div className="flex gap-s-3">
              <Button variant="ghost" onClick={() => setAdding(false)}>
                Annuleren
              </Button>
              <Button
                type="submit"
                form="ingredient-form"
                variant="accent"
              >
                Opslaan
              </Button>
            </div>
          </>
        }
      >
        <IngredientForm
          onCancel={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      </Sheet>

      {/* Edit ingredient sheet */}
      <Sheet
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        eyebrow="Bewerken"
        title={editing?.name ?? ''}
      >
        {editing ? (
          <IngredientForm
            ingredient={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => setEditing(null)}
            onDelete={() => void handleDelete(editing)}
          />
        ) : null}
      </Sheet>
    </div>
  )
}
