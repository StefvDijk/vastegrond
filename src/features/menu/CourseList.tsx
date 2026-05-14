import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
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
    return <p className="text-sm text-text-muted">Gangen laden…</p>
  }

  if (isError) {
    return (
      <p className="text-sm text-danger">
        Kon gangen niet laden — {error instanceof Error ? error.message : 'fout'}
      </p>
    )
  }

  const list = courses ?? []

  return (
    <div className="space-y-3">
      {list.length === 0 ? (
        <p className="rounded-ios bg-surface-2 p-4 text-sm text-text-muted">
          Nog geen gangen. Voeg de eerste hieronder toe.
        </p>
      ) : (
        <ol className="space-y-2">
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

      <form onSubmit={onSubmit} className="flex gap-2 pt-1">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nieuwe gang (bv. Voorgerecht)"
          className="flex-1 rounded-ios border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        <button
          type="submit"
          disabled={createMutation.isPending || !draft.trim()}
          className="inline-flex items-center gap-1 rounded-ios bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="size-4" aria-hidden /> Voeg toe
        </button>
      </form>
    </div>
  )
}
