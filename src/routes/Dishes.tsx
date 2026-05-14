import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import type { Dish } from '../types/domain'
import { useCourses } from '../features/menu/hooks'
import { useAllDishIngredients, useDishes } from '../features/dishes/hooks'
import { useIngredients } from '../features/ingredients/hooks'
import { DishCard } from '../features/dishes/DishCard'
import { DishForm } from '../features/dishes/DishForm'
import { formatEuro } from '../lib/format'
import { recipeCostCents } from '../features/dishes/foodcost'
import { Button, Card, ScreenHeader } from '../components/ui'
import { Skeleton } from '../components/Skeleton'

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
    return (
      <div className="vg-page">
        <Skeleton className="h-12 w-1/3 mb-s-9" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const courses = coursesQ.data ?? []
  const totalDishes = dishesQ.data?.length ?? 0

  if (courses.length === 0) {
    return (
      <div className="vg-page">
        <ScreenHeader title="Recepten" description="Voeg eerst gangen toe in de Menu-tab." />
      </div>
    )
  }

  return (
    <div className="vg-page flex flex-col gap-s-9">
      <ScreenHeader
        eyebrow="Recepten"
        title="Recepten"
        description="Eén menu voor alle avonden. Foodcost wordt live berekend op basis van de ingrediënten-bibliotheek."
      />

      <Card>
        <div className="grid gap-s-7 md:grid-cols-3">
          <Stat label="Gerechten" value={String(totalDishes)} />
          <Stat label="Recept-totaal" value={formatEuro(totalRecipeCents / 100)} />
          <Stat
            label="Menu per persoon"
            value={formatEuro(totalPerPortionCents / 100)}
            accent
          />
        </div>
      </Card>

      {courses.map((course) => {
        const dishes = dishesByCourse.get(course.id) ?? []
        return (
          <section key={course.id} className="flex flex-col gap-s-4">
            <header className="flex items-end justify-between gap-s-4">
              <div>
                <span className="t-caption t-faded">Gang {course.position + 1}</span>
                <h2 className="t-heading-l mt-s-1">
                  {course.name}{' '}
                  <span className="t-body-m t-faded font-normal ml-s-2">
                    ({dishes.length} {dishes.length === 1 ? 'gerecht' : 'gerechten'})
                  </span>
                </h2>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setAdding((current) => (current === course.id ? null : course.id))
                }
              >
                <Plus size={16} aria-hidden /> Gerecht
              </Button>
            </header>

            {adding === course.id ? (
              <Card>
                <h3 className="t-heading-m mb-s-4">Nieuw gerecht in {course.name}</h3>
                <DishForm
                  course={course}
                  onCancel={() => setAdding(null)}
                  onSaved={() => setAdding(null)}
                />
              </Card>
            ) : null}

            <div className="flex flex-col gap-s-3">
              {dishes.length === 0 ? (
                <p className="vg-empty">Nog geen gerechten voor deze gang.</p>
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <span className="t-caption t-faded">{label}</span>
      <div className={accent ? 't-display-m tabular text-accent mt-s-2' : 't-display-m tabular mt-s-2'}>
        {value}
      </div>
    </div>
  )
}

