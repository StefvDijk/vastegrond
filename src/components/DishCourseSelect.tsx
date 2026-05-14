import { useMemo } from 'react'
import { useCourses } from '../features/menu/hooks'
import { useDishes } from '../features/dishes/hooks'
import { Field, Select } from './ui'

type DishCourseSelectProps = {
  dishId: string | null
  courseId: string | null
  onChange: (next: { dishId: string | null; courseId: string | null }) => void
}

// Twee selects: gang en gerecht. Gerecht is gefilterd op gekozen gang.
// Beide zijn optioneel — leeg = geen koppeling.
export function DishCourseSelect({ dishId, courseId, onChange }: DishCourseSelectProps) {
  const coursesQ = useCourses()
  const dishesQ = useDishes()

  const courses = coursesQ.data ?? []
  const dishes = dishesQ.data ?? []

  const visibleDishes = useMemo(() => {
    if (!courseId) return dishes
    return dishes.filter((d) => d.courseId === courseId)
  }, [dishes, courseId])

  return (
    <div className="grid grid-cols-2 gap-s-3">
      <Field label="Gang">
        <Select
          value={courseId ?? ''}
          onChange={(e) => {
            const next = e.target.value || null
            // Reset gerecht als de gang verandert en het huidige gerecht niet meer past.
            const currentDish = dishes.find((d) => d.id === dishId)
            const dishStillFits = currentDish && (!next || currentDish.courseId === next)
            onChange({ courseId: next, dishId: dishStillFits ? dishId : null })
          }}
        >
          <option value="">— geen —</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Gerecht">
        <Select
          value={dishId ?? ''}
          onChange={(e) => {
            const next = e.target.value || null
            const dish = next ? dishes.find((d) => d.id === next) ?? null : null
            onChange({
              dishId: next,
              courseId: dish?.courseId ?? courseId,
            })
          }}
        >
          <option value="">— geen —</option>
          {visibleDishes.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  )
}
