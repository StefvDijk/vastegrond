import { useMemo, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Ingredient } from '../../types/domain'
import { useIngredients } from '../ingredients/hooks'
import { formatEuro, formatNumber } from '../../lib/format'
import {
  useDishIngredients,
  useRemoveDishIngredient,
  useUpsertDishIngredient,
} from './hooks'

type DishIngredientsEditorProps = {
  dishId: string
  portions: number
}

export function DishIngredientsEditor({
  dishId,
  portions,
}: DishIngredientsEditorProps) {
  const { data: ingredients, isLoading: ingredientsLoading } = useIngredients()
  const {
    data: links,
    isLoading: linksLoading,
  } = useDishIngredients(dishId)

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

  // Bij toevoegen: alleen ingrediënten die nog niet gekoppeld zijn — anders
  // wordt het in feite een wijziging via dezelfde rij.
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
    return <p className="text-sm text-text-muted">Ingrediënten laden…</p>
  }

  return (
    <div className="space-y-3">
      {links && links.length > 0 ? (
        <ul className="divide-y divide-border rounded-ios border border-border bg-surface">
          {links.map((link) => {
            const ing = ingredientsById.get(link.ingredientId)
            if (!ing) return null
            const lineCents = link.amount * ing.pricePerUnitCents
            return (
              <DishIngredientRow
                key={link.ingredientId}
                dishId={dishId}
                ingredient={ing}
                amount={link.amount}
                lineCents={lineCents}
                portions={portions}
                onUpdate={(next) =>
                  upsert.mutateAsync({
                    dishId,
                    ingredientId: ing.id,
                    amount: next,
                  })
                }
                onRemove={() =>
                  remove.mutateAsync({
                    dishId,
                    ingredientId: ing.id,
                  })
                }
              />
            )
          })}
        </ul>
      ) : (
        <p className="rounded-ios bg-surface-2 p-3 text-sm text-text-muted">
          Nog geen ingrediënten gekoppeld.
        </p>
      )}

      <form onSubmit={onAdd} className="flex flex-wrap items-end gap-2 pt-1">
        <label className="flex-1 min-w-[180px]">
          <span className="block text-xs font-medium text-text-muted">
            Ingrediënt
          </span>
          <select
            value={ingredientId}
            onChange={(e) => setIngredientId(e.target.value)}
            className="mt-1 w-full rounded-ios border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          >
            <option value="">— kies —</option>
            {availableForAdd.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.unit} · {formatEuro(i.pricePerUnitCents / 100)})
              </option>
            ))}
          </select>
        </label>
        <label className="w-32">
          <span className="block text-xs font-medium text-text-muted">
            Hoeveelheid
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="mt-1 w-full rounded-ios border border-border bg-surface px-3 py-2 text-sm tabular-nums outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </label>
        <button
          type="submit"
          disabled={upsert.isPending || availableForAdd.length === 0}
          className="inline-flex items-center gap-1 rounded-ios bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="size-4" aria-hidden /> Voeg toe
        </button>
      </form>

      {availableForAdd.length === 0 && (ingredients?.length ?? 0) > 0 ? (
        <p className="text-xs text-text-subtle">
          Alle ingrediënten zijn al gekoppeld — bewerk een rij om de
          hoeveelheid aan te passen.
        </p>
      ) : null}
      {(ingredients?.length ?? 0) === 0 ? (
        <p className="text-xs text-text-subtle">
          Voeg eerst ingrediënten toe in de Ingrediënten-tab.
        </p>
      ) : null}

      <hr className="border-border" />

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Stat
          label="Recept-kosten"
          value={formatEuro(
            (links ?? []).reduce((sum, l) => {
              const ing = ingredientsById.get(l.ingredientId)
              return ing ? sum + l.amount * ing.pricePerUnitCents : sum
            }, 0) / 100,
          )}
        />
        <Stat
          label={`Per portie (${formatNumber(portions)})`}
          value={
            portions > 0
              ? formatEuro(
                  (links ?? []).reduce((sum, l) => {
                    const ing = ingredientsById.get(l.ingredientId)
                    return ing
                      ? sum + l.amount * ing.pricePerUnitCents
                      : sum
                  }, 0) /
                    100 /
                    portions,
                )
              : '—'
          }
          emphasis
        />
      </div>
    </div>
  )
}

function DishIngredientRow({
  ingredient,
  amount,
  lineCents,
  portions,
  onUpdate,
  onRemove,
}: {
  dishId: string
  ingredient: Ingredient
  amount: number
  lineCents: number
  portions: number
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
    <li className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
      <div className="flex-1 min-w-[140px]">
        <p className="font-medium">{ingredient.name}</p>
        <p className="text-xs text-text-subtle">
          {formatEuro(ingredient.pricePerUnitCents / 100)} / {ingredient.unit}
        </p>
      </div>
      <div className="flex items-center gap-1">
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
          className="w-20 rounded-ios border border-border bg-bg px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        <span className="text-xs text-text-muted">{ingredient.unit}</span>
      </div>
      <div className="w-24 text-right tabular-nums">
        {formatEuro(lineCents / 100)}
      </div>
      <div className="w-24 text-right tabular-nums text-text-muted">
        {portions > 0 ? formatEuro(lineCents / 100 / portions) : '—'}
        <span className="ml-1 text-xs text-text-subtle">/p</span>
      </div>
      <button
        type="button"
        aria-label="Verwijderen"
        onClick={() => void onRemove()}
        className="rounded-ios p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </li>
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
            ? 'mt-0.5 text-lg font-semibold tabular-nums'
            : 'mt-0.5 tabular-nums'
        }
      >
        {value}
      </dd>
    </div>
  )
}
