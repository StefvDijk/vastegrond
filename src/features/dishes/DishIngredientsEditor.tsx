import { useMemo, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Ingredient } from '../../types/domain'
import { useIngredients } from '../ingredients/hooks'
import { formatEuro, formatNumber } from '../../lib/format'
import { Button, Field, Input, Select } from '../../components/ui'
import {
  useDishIngredients,
  useRemoveDishIngredient,
  useUpsertDishIngredient,
} from './hooks'

type DishIngredientsEditorProps = {
  dishId: string
  portions: number
}

export function DishIngredientsEditor({ dishId, portions }: DishIngredientsEditorProps) {
  const { data: ingredients, isLoading: ingredientsLoading } = useIngredients()
  const { data: links, isLoading: linksLoading } = useDishIngredients(dishId)

  const upsert = useUpsertDishIngredient()
  const remove = useRemoveDishIngredient()

  const [ingredientId, setIngredientId] = useState('')
  const [amount, setAmount] = useState('')

  const linkedIds = useMemo(
    () => new Set((links ?? []).map((l) => l.ingredientId)),
    [links],
  )
  const ingredientsById = useMemo(
    () => new Map((ingredients ?? []).map((i) => [i.id, i] as const)),
    [ingredients],
  )

  const availableForAdd = useMemo(
    () => (ingredients ?? []).filter((i) => !linkedIds.has(i.id)),
    [ingredients, linkedIds],
  )

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ingredientId) {
      toast.error('Kies een ingrediënt')
      return
    }
    const parsed = Number(amount.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error('Hoeveelheid moet > 0 zijn')
      return
    }
    try {
      await upsert.mutateAsync({ dishId, ingredientId, amount: parsed })
      setIngredientId('')
      setAmount('')
    } catch {
      /* toast in hook */
    }
  }

  if (ingredientsLoading || linksLoading) {
    return <p className="t-body-m t-soft">Ingrediënten laden…</p>
  }

  const totalCents = (links ?? []).reduce((sum, l) => {
    const ing = ingredientsById.get(l.ingredientId)
    return ing ? sum + l.amount * ing.pricePerUnitCents : sum
  }, 0)

  return (
    <div className="flex flex-col gap-s-4">
      {links && links.length > 0 ? (
        <div
          className="overflow-x-auto"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <table className="vg-table">
            <thead>
              <tr>
                <th>Ingrediënt</th>
                <th style={{ width: 140 }} className="vg-table__right">Hoeveelheid</th>
                <th style={{ width: 120 }} className="vg-table__right">Prijs / eh.</th>
                <th style={{ width: 120 }} className="vg-table__right">Totaal</th>
                <th style={{ width: 60 }} />
              </tr>
            </thead>
            <tbody>
              {links.map((link) => {
                const ing = ingredientsById.get(link.ingredientId)
                if (!ing) return null
                const lineCents = link.amount * ing.pricePerUnitCents
                return (
                  <DishIngredientRow
                    key={link.ingredientId}
                    ingredient={ing}
                    amount={link.amount}
                    lineCents={lineCents}
                    onUpdate={(next) =>
                      upsert.mutateAsync({ dishId, ingredientId: ing.id, amount: next })
                    }
                    onRemove={() => remove.mutateAsync({ dishId, ingredientId: ing.id })}
                  />
                )
              })}
              <tr className="vg-table__total">
                <td>Recept-kosten</td>
                <td colSpan={2} className="vg-table__right t-faded">
                  Per portie ({formatNumber(portions)})
                </td>
                <td className="vg-table__right tabular">
                  {formatEuro(totalCents / 100)}
                  <br />
                  <span className="t-body-s t-faded tabular">
                    {portions > 0 ? formatEuro(totalCents / 100 / portions) : '—'} p.p.
                  </span>
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="vg-empty">Nog geen ingrediënten gekoppeld.</div>
      )}

      <form onSubmit={onAdd} className="flex flex-wrap items-end gap-s-3 pt-s-2">
        <div className="flex-1 min-w-[200px]">
          <Field label="Ingrediënt">
            <Select value={ingredientId} onChange={(e) => setIngredientId(e.target.value)}>
              <option value="">— kies —</option>
              {availableForAdd.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.unit} · {formatEuro(i.pricePerUnitCents / 100)})
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="w-32">
          <Field label="Hoeveelheid">
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="text-right tabular"
            />
          </Field>
        </div>
        <Button
          type="submit"
          variant="accent"
          disabled={upsert.isPending || availableForAdd.length === 0}
        >
          <Plus size={16} aria-hidden /> Toevoegen
        </Button>
      </form>

      {availableForAdd.length === 0 && (ingredients?.length ?? 0) > 0 ? (
        <p className="t-body-s t-faded">
          Alle ingrediënten zijn al gekoppeld — bewerk een rij om de hoeveelheid aan te passen.
        </p>
      ) : null}
      {(ingredients?.length ?? 0) === 0 ? (
        <p className="t-body-s t-faded">
          Voeg eerst ingrediënten toe in de Ingrediënten-tab.
        </p>
      ) : null}
    </div>
  )
}

function DishIngredientRow({
  ingredient,
  amount,
  lineCents,
  onUpdate,
  onRemove,
}: {
  ingredient: Ingredient
  amount: number
  lineCents: number
  onUpdate: (next: number) => Promise<unknown>
  onRemove: () => Promise<unknown>
}) {
  const [draft, setDraft] = useState(String(amount))

  function commit() {
    const parsed = Number(draft.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setDraft(String(amount))
      toast.error('Hoeveelheid moet > 0 zijn')
      return
    }
    if (parsed === amount) return
    void onUpdate(parsed)
  }

  return (
    <tr>
      <td className="vg-table__title">{ingredient.name}</td>
      <td className="vg-table__right tabular">
        <input
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              ;(e.target as HTMLInputElement).blur()
            }
          }}
          className="vg-input vg-input--inline w-20 text-right tabular"
        />
        <span className="ml-1 t-body-s t-faded">{ingredient.unit}</span>
      </td>
      <td className="vg-table__right vg-table__muted tabular">
        {formatEuro(ingredient.pricePerUnitCents / 100)}
      </td>
      <td className="vg-table__right tabular vg-table__title">
        {formatEuro(lineCents / 100)}
      </td>
      <td className="vg-table__right">
        <button
          type="button"
          aria-label="Verwijderen"
          onClick={() => void onRemove()}
          className="vg-sheet__close hover:text-negative"
        >
          <Trash2 size={16} aria-hidden />
        </button>
      </td>
    </tr>
  )
}
