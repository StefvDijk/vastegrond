import { useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2, ArrowUp, ArrowDown, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useEvents } from '../features/events/hooks'
import {
  useCourses,
  useCreateCourse,
  useDeleteCourse,
  useRenameCourse,
  useUpdateCoursePosition,
} from '../features/menu/hooks'
import { useDishes, useAllDishIngredients } from '../features/dishes/hooks'
import { useIngredients } from '../features/ingredients/hooks'
import { costPerPortionCents } from '../features/dishes/foodcost'
import { formatDateShort, formatEuro } from '../lib/format'
import { Button, Input } from '../components/ui'
import { Skeleton } from '../components/Skeleton'
import { cn } from '../lib/cn'
import type { Course, Dish } from '../types/domain'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

export function Menu() {
  const eventsQ = useEvents()
  const coursesQ = useCourses()
  const dishesQ = useDishes()
  const ingredientsQ = useIngredients()
  const linksQ = useAllDishIngredients()
  const createCourse = useCreateCourse()

  const [draft, setDraft] = useState('')
  const [editMode, setEditMode] = useState(false)

  const courses = coursesQ.data ?? []
  const dishesByCourse = useMemo(() => {
    const map = new Map<string, Dish[]>()
    for (const dish of dishesQ.data ?? []) {
      const list = map.get(dish.courseId) ?? []
      list.push(dish)
      map.set(dish.courseId, list)
    }
    return map
  }, [dishesQ.data])

  const dates = (eventsQ.data ?? [])
    .map((e) => formatDateShort(e.eventDate))
    .join(' · ')

  async function onSubmitCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) return
    if (trimmed.length > 120) {
      toast.error('Naam mag maximaal 120 tekens zijn')
      return
    }
    const nextPosition =
      courses.reduce((max, c) => Math.max(max, c.position), -1) + 1
    await createCourse.mutateAsync({ name: trimmed, position: nextPosition })
    setDraft('')
  }

  const isLoading = coursesQ.isLoading || dishesQ.isLoading

  if (isLoading) {
    return (
      <div className="vg-page">
        <Skeleton className="h-10 w-32 mb-s-7" />
        <div className="flex flex-col gap-s-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="vg-page flex flex-col gap-s-7">
      {/* Header */}
      <header className="flex flex-col gap-s-2 md:flex-row md:items-end md:justify-between md:gap-s-6">
        <div>
          <span className="t-caption t-faded">Eén menu, drie avonden</span>
          <h1 className="t-display-m mt-s-2">Menu</h1>
          <p className="t-body-s t-soft mt-s-3" style={{ maxWidth: '52ch' }}>
            {dates
              ? `Gedeeld menu voor ${dates}. Allergenen en gasten verschillen per avond — zie Gasten.`
              : 'Gedeeld menu voor alle avonden.'}
          </p>
        </div>
        <div className="flex items-center gap-s-2">
          <button
            type="button"
            className={cn('vg-seg__item', editMode && 'vg-seg__item--on')}
            onClick={() => setEditMode((v) => !v)}
            aria-pressed={editMode}
          >
            {editMode ? 'Klaar' : 'Bewerken'}
          </button>
        </div>
      </header>

      {/* Courses + dishes per course */}
      {courses.length === 0 ? (
        <div className="vg-card vg-card--bordered">
          <p className="t-body-m t-soft">Nog geen gangen. Voeg de eerste hieronder toe.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {courses.map((course, index) => (
            <CourseSection
              key={course.id}
              course={course}
              index={index}
              total={courses.length}
              previous={courses[index - 1]}
              next={courses[index + 1]}
              dishes={dishesByCourse.get(course.id) ?? []}
              ingredients={ingredientsQ.data ?? []}
              linksByDish={linksQ.data ?? {}}
              editMode={editMode}
            />
          ))}
        </div>
      )}

      {/* Add course form */}
      <form
        onSubmit={onSubmitCourse}
        className="flex flex-col gap-s-3 sm:flex-row sm:items-end pt-s-4 border-t border-line"
      >
        <div className="flex-1">
          <label className="t-caption t-faded block mb-s-2">Nieuwe gang</label>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Voorgerecht, Hoofd, ..."
          />
        </div>
        <Button
          type="submit"
          variant="accent"
          disabled={createCourse.isPending || !draft.trim()}
        >
          <Plus size={16} aria-hidden /> Voeg toe
        </Button>
      </form>
    </div>
  )
}

function CourseSection({
  course,
  index,
  total,
  previous,
  next,
  dishes,
  ingredients,
  linksByDish,
  editMode,
}: {
  course: Course
  index: number
  total: number
  previous?: Course
  next?: Course
  dishes: Dish[]
  ingredients: ReturnType<typeof useIngredients>['data'] extends infer T
    ? T extends undefined | null
      ? never
      : T
    : never
  linksByDish: Record<string, ReturnType<typeof useAllDishIngredients>['data'] extends infer T
    ? T extends Record<string, infer V>
      ? V
      : never
    : never>
  editMode: boolean
}) {
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(course.name)
  const rename = useRenameCourse()
  const remove = useDeleteCourse()
  const moveMutation = useUpdateCoursePosition()

  async function commitRename() {
    const trimmed = name.trim()
    if (!trimmed || trimmed === course.name) {
      setName(course.name)
      setRenaming(false)
      return
    }
    await rename.mutateAsync({ id: course.id, name: trimmed })
    setRenaming(false)
  }

  async function move(target: Course | undefined) {
    if (!target) return
    await Promise.all([
      moveMutation.mutateAsync({ id: course.id, position: target.position }),
      moveMutation.mutateAsync({ id: target.id, position: course.position }),
    ])
  }

  async function handleDelete() {
    const ok = window.confirm(`"${course.name}" verwijderen?`)
    if (!ok) return
    await remove.mutateAsync(course.id)
  }

  const dishCount = dishes.length

  return (
    <section className="flex flex-col">
      {/* Section header — Romeins cijfer + serif gang-naam + meta */}
      <header
        className={cn(
          'flex items-baseline gap-s-4 pt-s-6 pb-s-3',
          index > 0 && 'border-t border-line mt-s-4',
        )}
      >
        <span
          className="font-mono t-faded tabular-nums shrink-0"
          style={{ fontSize: 11, letterSpacing: '0.06em' }}
        >
          {ROMAN[index] ?? String(index + 1)}
        </span>
        <div className="flex-1 min-w-0">
          {renaming ? (
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => void commitRename()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void commitRename()
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  setName(course.name)
                  setRenaming(false)
                }
              }}
              className="vg-input vg-input--inline w-full"
              style={{ fontSize: 22, letterSpacing: '-0.022em', fontWeight: 600 }}
            />
          ) : (
            <h2
              style={{ fontSize: 22, lineHeight: 1.2, letterSpacing: '-0.022em', fontWeight: 600 }}
            >
              {course.name}
            </h2>
          )}
        </div>
        <span className="t-mono-s t-faded shrink-0">
          {dishCount} {dishCount === 1 ? 'gerecht' : 'gerechten'}
        </span>
        {editMode ? (
          <div className="flex items-center gap-s-1 shrink-0">
            {renaming ? (
              <>
                <IconBtn
                  label="Opslaan"
                  icon={<Check size={16} aria-hidden />}
                  onClick={() => void commitRename()}
                />
                <IconBtn
                  label="Annuleren"
                  icon={<X size={16} aria-hidden />}
                  onClick={() => {
                    setName(course.name)
                    setRenaming(false)
                  }}
                />
              </>
            ) : (
              <>
                <IconBtn
                  label="Omhoog"
                  icon={<ArrowUp size={16} aria-hidden />}
                  disabled={index === 0}
                  onClick={() => void move(previous)}
                />
                <IconBtn
                  label="Omlaag"
                  icon={<ArrowDown size={16} aria-hidden />}
                  disabled={index === total - 1}
                  onClick={() => void move(next)}
                />
                <IconBtn
                  label="Hernoemen"
                  icon={<Pencil size={16} aria-hidden />}
                  onClick={() => setRenaming(true)}
                />
                <IconBtn
                  label="Verwijderen"
                  variant="danger"
                  icon={<Trash2 size={16} aria-hidden />}
                  onClick={handleDelete}
                />
              </>
            )}
          </div>
        ) : null}
      </header>

      {/* Dishes */}
      {dishes.length === 0 ? (
        <div className="pl-s-7 pb-s-3 t-body-s t-ghost">
          Nog geen gerechten. Voeg ze toe via Recepten.
        </div>
      ) : (
        <div className="vg-list">
          {dishes.map((dish) => {
            const links = linksByDish[dish.id] ?? []
            const perPortion = costPerPortionCents(links, ingredients, dish.portions)
            return (
              <div key={dish.id} className="vg-list__row">
                <div className="vg-list__content">
                  <div className="vg-list__title">{dish.name}</div>
                  {dish.notes ? (
                    <div className="vg-list__subtitle">{dish.notes}</div>
                  ) : null}
                </div>
                <div className="vg-list__value">
                  {perPortion > 0 ? formatEuro(perPortion / 100) : '—'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function IconBtn({
  label,
  onClick,
  disabled,
  icon,
  variant,
}: {
  label: string
  onClick: () => void | Promise<void>
  disabled?: boolean
  icon: React.ReactNode
  variant?: 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'vg-sheet__close',
        variant === 'danger' && 'hover:text-negative',
      )}
    >
      {icon}
    </button>
  )
}
