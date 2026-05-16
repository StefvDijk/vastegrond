import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Ingredient } from '../types/domain'
import { formatEuro } from '../lib/format'
import { useDeleteIngredient, useIngredients } from '../features/ingredients/hooks'
import { IngredientForm } from '../features/ingredients/IngredientForm'
import { Button, Search, Sheet, IosNavBar, IosNavAction } from '../components/ui'

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

  // Group by supplier (sorted, unknown last)
  const groups = useMemo(() => {
    const map = new Map<string, Ingredient[]>()
    for (const ing of filtered) {
      const key = ing.supplier?.trim() || '__none__'
      const list = map.get(key) ?? []
      list.push(ing)
      map.set(key, list)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        if (a === '__none__') return 1
        if (b === '__none__') return -1
        return a.localeCompare(b, 'nl', { sensitivity: 'base' })
      })
      .map(([key, items]) => ({
        supplier: key === '__none__' ? null : key,
        items,
      }))
  }, [filtered])

  const total = data?.length ?? 0

  return (
    <>
      <IosNavBar
        title="Ingrediënten"
        eyebrow="Bibliotheek"
        description="Gedeelde bibliotheek. Eenheid en prijs bepalen de foodcost van een gerecht."
        trailing={
          <IosNavAction primary onClick={() => setAdding(true)} aria-label="Ingrediënt toevoegen">
            <Plus size={20} aria-hidden />
          </IosNavAction>
        }
      />
      <div className="vg-page flex flex-col gap-s-6 md:gap-s-7">
        {/* Desktop header */}
        <header className="hidden md:flex md:flex-col md:gap-s-3 md:flex-row md:items-end md:justify-between md:gap-s-6">
          <div>
            <span className="t-caption t-faded">Bibliotheek</span>
            <h1 className="t-display-m mt-s-2">Ingrediënten</h1>
            <p className="t-body-s t-soft mt-s-3" style={{ maxWidth: '52ch' }}>
              Gedeelde bibliotheek. Eenheid en prijs bepalen de foodcost van een gerecht.
            </p>
          </div>
          <Button variant="accent" onClick={() => setAdding(true)}>
            <Plus size={16} aria-hidden /> Ingrediënt
          </Button>
        </header>

      {/* Search + count */}
      <div className="flex items-center gap-s-4 flex-wrap">
        <div className="flex-1 max-w-[420px]">
          <Search
            placeholder="Zoek op naam of leverancier…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <span className="t-mono-s t-faded tabular-nums">
          {filtered.length} van {total}
        </span>
      </div>

      {isLoading ? (
        <p className="t-body-m t-soft">Ingrediënten laden…</p>
      ) : isError ? (
        <p className="t-body-m text-negative">
          Kon ingrediënten niet laden — {error instanceof Error ? error.message : 'fout'}
        </p>
      ) : filtered.length === 0 ? (
        <div className="vg-card vg-card--bordered">
          <p className="t-body-m t-soft">
            {data && data.length > 0
              ? 'Geen resultaten voor deze zoekopdracht.'
              : 'Nog geen ingrediënten. Voeg er één toe om te beginnen.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {groups.map((group) => (
            <SupplierGroup
              key={group.supplier ?? '__none__'}
              supplier={group.supplier}
              items={group.items}
              onPick={(ing) => {
                setEditing(ing)
                setAdding(false)
              }}
            />
          ))}
        </div>
      )}

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
    </>
  )
}

function SupplierGroup({
  supplier,
  items,
  onPick,
}: {
  supplier: string | null
  items: Ingredient[]
  onPick: (ing: Ingredient) => void
}) {
  return (
    <section className="mt-s-6 first:mt-s-2">
      <header className="flex items-baseline justify-between px-s-1 pb-s-3">
        <h2 style={{ fontSize: 18, letterSpacing: '-0.018em', fontWeight: 600 }}>
          {supplier ?? 'Geen leverancier'}
        </h2>
        <span className="t-mono-s t-faded tabular-nums">
          {items.length} {items.length === 1 ? 'ingrediënt' : 'ingrediënten'}
        </span>
      </header>
      <div className="vg-list">
        {items.map((ing) => (
          <button
            key={ing.id}
            type="button"
            onClick={() => onPick(ing)}
            className="vg-list__row vg-list__row--hover w-full text-left"
          >
            <div className="vg-list__content">
              <div className="vg-list__title">{ing.name}</div>
              {ing.purchaseUnit ? (
                <div className="vg-list__subtitle">Inkoop: {ing.purchaseUnit}</div>
              ) : null}
            </div>
            <div className="t-mono-s t-faded tabular-nums shrink-0 text-right" style={{ width: 80 }}>
              per {ing.unit}
            </div>
            <div className="vg-list__value shrink-0 text-right" style={{ minWidth: 80 }}>
              {formatEuro(ing.pricePerUnitCents / 100)}
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
