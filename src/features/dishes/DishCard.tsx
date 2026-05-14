import { useState } from 'react'
import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Course, Dish, Ingredient } from '../../types/domain'
import { formatEuro, formatNumber } from '../../lib/format'
import { cn } from '../../lib/cn'
import { useDeleteDish } from './hooks'
import { DishForm } from './DishForm'
import { DishIngredientsEditor } from './DishIngredientsEditor'
import { costPerPortionCents, recipeCostCents } from './foodcost'
import type { DishIngredientLink } from './queries'

type DishCardProps = {
  course: Course
  dish: Dish
  links: DishIngredientLink[]
  ingredients: Ingredient[]
}

export function DishCard({ course, dish, links, ingredients }: DishCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const del = useDeleteDish()

  const recipeCents = recipeCostCents(links, ingredients)
  const perPortionCents = costPerPortionCents(links, ingredients, dish.portions)

  async function handleDelete() {
    if (!window.confirm(`Gerecht "${dish.name}" verwijderen?`)) return
    try {
      await del.mutateAsync(dish.id)
      toast.success('Verwijderd')
    } catch {
      /* toast in hook */
    }
  }

  return (
    <article className="rounded-ios border border-border bg-surface">
      <header className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Inklappen' : 'Uitklappen'}
          className="grid size-7 shrink-0 place-items-center rounded-ios text-text-muted hover:bg-surface-2 hover:text-text"
        >
          {expanded ? (
            <ChevronDown className="size-4" aria-hidden />
          ) : (
            <ChevronRight className="size-4" aria-hidden />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="truncate font-medium">{dish.name}</h3>
          <p className="text-xs text-text-subtle">
            {formatNumber(dish.portions)} porties · recept{' '}
            {formatEuro(recipeCents / 100)} · per portie{' '}
            <span className="font-medium text-text">
              {formatEuro(perPortionCents / 100)}
            </span>
          </p>
        </div>
        <button
          type="button"
          aria-label="Bewerken"
          onClick={() => {
            setEditing((v) => !v)
            setExpanded(true)
          }}
          className={cn(
            'rounded-ios p-1.5 text-text-muted hover:bg-surface-2 hover:text-text',
            editing && 'bg-surface-2 text-text',
          )}
        >
          <Pencil className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Verwijderen"
          onClick={handleDelete}
          className="rounded-ios p-1.5 text-text-muted hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </header>

      {expanded ? (
        <div className="border-t border-border bg-surface-2/50 p-4 space-y-4">
          {editing ? (
            <div className="rounded-ios bg-surface p-4">
              <h4 className="mb-3 text-sm font-semibold tracking-tight">
                Gerecht bewerken
              </h4>
              <DishForm
                course={course}
                dish={dish}
                onCancel={() => setEditing(false)}
                onSaved={() => setEditing(false)}
              />
            </div>
          ) : null}

          {dish.notes ? (
            <p className="whitespace-pre-line rounded-ios bg-surface p-3 text-sm text-text-muted">
              {dish.notes}
            </p>
          ) : null}

          <div className="rounded-ios bg-surface p-4">
            <h4 className="mb-3 text-sm font-semibold tracking-tight">
              Ingrediënten
            </h4>
            <DishIngredientsEditor dishId={dish.id} portions={dish.portions} />
          </div>
        </div>
      ) : null}
    </article>
  )
}
