import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Input } from '../../components/ui'
import { useCourses, useCreateCourse } from './hooks'
import { CourseRow } from './CourseRow'

export function CourseList() {
  const { data: courses, isLoading, isError, error } = useCourses()
  const createMutation = useCreateCourse()
  const [draft, setDraft] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) return
    if (trimmed.length > 120) {
      toast.error('Naam mag maximaal 120 tekens zijn')
      return
    }
    const nextPosition =
      (courses?.reduce((max, c) => Math.max(max, c.position), -1) ?? -1) + 1
    await createMutation.mutateAsync({ name: trimmed, position: nextPosition })
    setDraft('')
  }

  if (isLoading) {
    return <p className="t-body-m t-soft">Gangen laden…</p>
  }

  if (isError) {
    return (
      <p className="t-body-m text-negative">
        Kon gangen niet laden — {error instanceof Error ? error.message : 'fout'}
      </p>
    )
  }

  const list = courses ?? []

  return (
    <div className="flex flex-col gap-s-3">
      {list.length === 0 ? (
        <p className="vg-empty">Nog geen gangen. Voeg de eerste hieronder toe.</p>
      ) : (
        <ol className="flex flex-col gap-s-2 list-none p-0 m-0">
          {list.map((course, index) => (
            <CourseRow
              key={course.id}
              course={course}
              index={index}
              total={list.length}
              previous={list[index - 1]}
              next={list[index + 1]}
            />
          ))}
        </ol>
      )}

      <form onSubmit={onSubmit} className="flex gap-s-3 pt-s-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nieuwe gang (bv. Voorgerecht)"
        />
        <Button
          type="submit"
          variant="accent"
          disabled={createMutation.isPending || !draft.trim()}
        >
          <Plus size={16} aria-hidden /> Voeg toe
        </Button>
      </form>
    </div>
  )
}
