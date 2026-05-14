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
    <article
      className="overflow-hidden"
      style={{
        background: 'var(--paper-elevated)',
        borderRadius: 'var(--r-m)',
        border: '1px solid var(--line)',
      }}
    >
      <header className="flex items-center gap-s-3 px-s-5 py-s-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Inklappen' : 'Uitklappen'}
          className="vg-sheet__close"
        >
          {expanded ? (
            <ChevronDown size={16} aria-hidden />
          ) : (
            <ChevronRight size={16} aria-hidden />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-body-m font-medium text-ink">{dish.name}</h3>
          <p className="t-caption t-faded mt-1 normal-case tracking-normal">
            {formatNumber(dish.portions)} porties · recept {formatEuro(recipeCents / 100)} · per
            portie{' '}
            <span className="text-ink font-medium">
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
          className={cn('vg-sheet__close', editing && 'bg-paper-deep text-ink')}
        >
          <Pencil size={16} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Verwijderen"
          onClick={handleDelete}
          className="vg-sheet__close hover:text-negative"
        >
          <Trash2 size={16} aria-hidden />
        </button>
      </header>

      {expanded ? (
        <div
          className="flex flex-col gap-s-5 p-s-5"
          style={{ borderTop: '1px solid var(--line)', background: 'var(--paper)' }}
        >
          {editing ? (
            <div className="vg-card">
              <h4 className="t-heading-m mb-s-4">Gerecht bewerken</h4>
              <DishForm
                course={course}
                dish={dish}
                onCancel={() => setEditing(false)}
                onSaved={() => setEditing(false)}
              />
            </div>
          ) : null}

          {dish.notes ? (
            <p className="whitespace-pre-line rounded-m bg-paper-elevated p-s-4 t-body-s t-soft">
              {dish.notes}
            </p>
          ) : null}

          <div className="vg-card">
            <h4 className="t-heading-m mb-s-4">Ingrediënten</h4>
            <DishIngredientsEditor dishId={dish.id} portions={dish.portions} />
          </div>
        </div>
      ) : null}
    </article>
  )
}
