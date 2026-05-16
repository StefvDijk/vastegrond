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
import { Button, Card, IosNavBar, IosStatCard, IosStatGrid } from '../components/ui'
import { Skeleton } from '../components/Skeleton'
import { cn } from '../lib/cn'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

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
      <>
        <IosNavBar title="Recepten" eyebrow="Foodcost-bibliotheek" />
        <div className="vg-page">
          <header className="hidden md:block">
            <span className="t-caption t-faded">Recepten</span>
            <h1 className="t-display-m mt-s-2">Recepten</h1>
          </header>
          <div className="vg-empty">
            <p className="vg-empty__title">Voeg eerst gangen toe</p>
            <p className="vg-empty__desc">Ga naar de Menu-tab om gangen aan te maken.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <IosNavBar
        title="Recepten"
        eyebrow="Foodcost-bibliotheek"
        description="Eén menu voor alle avonden. Foodcost wordt live berekend uit de ingrediënten-bibliotheek."
      />
      <div className="vg-page flex flex-col gap-s-6 md:gap-s-7">
        {/* Desktop-only header (mobile uses IosNavBar) */}
        <header className="hidden md:flex md:flex-col md:gap-s-3 md:flex-row md:items-end md:justify-between md:gap-s-6">
          <div>
            <span className="t-caption t-faded">Foodcost-bibliotheek</span>
            <h1 className="t-display-m mt-s-2">Recepten</h1>
            <p className="t-body-s t-soft mt-s-3" style={{ maxWidth: '52ch' }}>
              Eén menu voor alle avonden. Foodcost wordt live berekend uit de ingrediënten-bibliotheek.
            </p>
          </div>
        </header>

        {/* Stat cells */}
        <IosStatGrid className="md:grid-cols-3">
          <IosStatCard label="Gerechten" value={String(totalDishes)} />
          <IosStatCard label="Recept-totaal" value={formatEuro(totalRecipeCents / 100)} />
          <IosStatCard
            label="Menu per gast"
            value={formatEuro(totalPerPortionCents / 100)}
            tone="accent"
          />
        </IosStatGrid>

      {/* Per course sections */}
      {courses.map((course, index) => {
        const dishes = dishesByCourse.get(course.id) ?? []
        return (
          <section key={course.id} className="flex flex-col gap-s-3">
            <header
              className={cn(
                'flex items-baseline gap-s-4 pt-s-4',
                index > 0 && 'border-t border-line',
              )}
            >
              <span
                className="font-mono t-faded tabular-nums shrink-0"
                style={{ fontSize: 11, letterSpacing: '0.06em' }}
              >
                {ROMAN[index] ?? String(index + 1)}
              </span>
              <h2
                className="flex-1 min-w-0"
                style={{ fontSize: 22, lineHeight: 1.2, letterSpacing: '-0.022em', fontWeight: 600 }}
              >
                {course.name}
              </h2>
              <span className="t-mono-s t-faded shrink-0">
                {dishes.length} {dishes.length === 1 ? 'gerecht' : 'gerechten'}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setAdding((current) => (current === course.id ? null : course.id))
                }
              >
                <Plus size={14} aria-hidden /> Gerecht
              </Button>
            </header>

            {adding === course.id ? (
              <Card>
                <h3 className="t-title-m mb-s-4">Nieuw gerecht in {course.name}</h3>
                <DishForm
                  course={course}
                  onCancel={() => setAdding(null)}
                  onSaved={() => setAdding(null)}
                />
              </Card>
            ) : null}

            {dishes.length === 0 ? (
              <p className="t-body-s t-ghost pl-s-7">Nog geen gerechten.</p>
            ) : (
              <div className="flex flex-col gap-s-3">
                {dishes.map((dish) => (
                  <DishCard
                    key={dish.id}
                    course={course}
                    dish={dish}
                    links={linksByDish[dish.id] ?? []}
                    ingredients={ingredients}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
      </div>
    </>
  )
}

