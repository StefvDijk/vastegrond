import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import type { Dish } from '../types/domain'
import { useCourses } from '../features/menu/hooks'
import {
  useAllDishIngredients,
  useDishes,
} from '../features/dishes/hooks'
import { useIngredients } from '../features/ingredients/hooks'
import { DishCard } from '../features/dishes/DishCard'
import { DishForm } from '../features/dishes/DishForm'
import { formatEuro } from '../lib/format'
import { recipeCostCents } from '../features/dishes/foodcost'

export function Dishes() {
  const coursesQ = useCourses()
  const dishesQ = useDishes()
  const ingredientsQ = useIngredients()
  const linksQ = useAllDishIngredients()
  const [adding, setAdding] = useState<string | null>(null)

  const dishesByCourse = useMemo(() => {
    const grouped = new Map<string, Dish[]>()
    for (const dish of dishesQ.data ?? []) {
      const list = grouped.get(dish.courseId) ?? []
      list.push(dish)
      grouped.set(dish.courseId, list)
    }
    return grouped
  }, [dishesQ.data])

  const ingredients = ingredientsQ.data ?? []
  const linksByDish = linksQ.data ?? {}

  const totalRecipeCents = useMemo(() => {
    if (!dishesQ.data) return 0
    return dishesQ.data.reduce((sum, dish) => {
      const links = linksByDish[dish.id] ?? []
      return sum + recipeCostCents(links, ingredients)
    }, 0)
  }, [dishesQ.data, linksByDish, ingredients])

  const totalPerPortionCents = useMemo(() => {
    if (!dishesQ.data) return 0
    return dishesQ.data.reduce((sum, dish) => {
      const links = linksByDish[dish.id] ?? []
      const recipe = recipeCostCents(links, ingredients)
      return sum + (dish.portions > 0 ? recipe / dish.portions : 0)
    }, 0)
  }, [dishesQ.data, linksByDish, ingredients])

  if (coursesQ.isLoading || dishesQ.isLoading) {
    return <p className="text-sm text-text-muted">Gerechten laden…</p>
  }

  const courses = coursesQ.data ?? []

  if (courses.length === 0) {
    return (
      <div className="card p-5">
        <h1 className="text-2xl font-semibold tracking-tight">Gerechten</h1>
        <p className="mt-2 text-sm text-text-muted">
          Voeg eerst gangen toe in de Menu-tab.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h1 className="text-2xl font-semibold tracking-tight">Gerechten</h1>
        <p className="mt-1 text-sm text-text-muted">
          Eén menu voor alle avonden. Foodcost wordt live berekend op basis van
          de ingrediënten-bibliotheek.
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <Stat
            label="Gerechten"
            value={String(dishesQ.data?.length ?? 0)}
          />
          <Stat
            label="Recept-totaal"
            value={formatEuro(totalRecipeCents / 100)}
          />
          <Stat
            label="Menu per persoon"
            value={formatEuro(totalPerPortionCents / 100)}
            emphasis
          />
        </dl>
      </section>

      {courses.map((course) => {
        const dishes = dishesByCourse.get(course.id) ?? []
        return (
          <section key={course.id} className="card p-5">
            <header className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">
                <span className="mr-2 text-text-subtle tabular-nums">
                  {course.position + 1}.
                </span>
                {course.name}
                <span className="ml-2 text-sm font-normal text-text-muted">
                  ({dishes.length}{' '}
                  {dishes.length === 1 ? 'gerecht' : 'gerechten'})
                </span>
              </h2>
              <button
                type="button"
                onClick={() =>
                  setAdding((current) =>
                    current === course.id ? null : course.id,
                  )
                }
                className="inline-flex items-center gap-1 rounded-ios border border-border bg-surface px-2.5 py-1.5 text-sm font-medium text-text-muted hover:bg-surface-2 hover:text-text"
              >
                <Plus className="size-4" aria-hidden /> Gerecht
              </button>
            </header>

            {adding === course.id ? (
              <div className="mt-4 rounded-ios border border-border bg-surface p-4">
                <DishForm
                  course={course}
                  onCancel={() => setAdding(null)}
                  onSaved={() => setAdding(null)}
                />
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {dishes.length === 0 ? (
                <p className="rounded-ios bg-surface-2 p-3 text-sm text-text-muted">
                  Nog geen gerechten voor deze gang.
                </p>
              ) : (
                dishes.map((dish) => (
                  <DishCard
                    key={dish.id}
                    course={course}
                    dish={dish}
                    links={linksByDish[dish.id] ?? []}
                    ingredients={ingredients}
                  />
                ))
              )}
            </div>
          </section>
        )
      })}
    </div>
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
            ? 'mt-0.5 text-xl font-semibold tabular-nums'
            : 'mt-0.5 text-xl font-semibold tabular-nums'
        }
      >
        {value}
      </dd>
    </div>
  )
}

