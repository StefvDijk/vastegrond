import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Pencil, Trash2, X } from 'lucide-react'
import type { Course } from '../../types/domain'
import { cn } from '../../lib/cn'
import {
  useDeleteCourse,
  useRenameCourse,
  useUpdateCoursePosition,
} from './hooks'

type CourseRowProps = {
  course: Course
  index: number
  total: number
  previous?: Course
  next?: Course
}

export function CourseRow({
  course,
  index,
  total,
  previous,
  next,
}: CourseRowProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(course.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const renameMutation = useRenameCourse()
  const deleteMutation = useDeleteCourse()
  const positionMutation = useUpdateCoursePosition()

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  useEffect(() => {
    setName(course.name)
  }, [course.name])

  async function commitRename() {
    const trimmed = name.trim()
    if (!trimmed) {
      setName(course.name)
      setEditing(false)
      return
    }
    if (trimmed === course.name) {
      setEditing(false)
      return
    }
    await renameMutation.mutateAsync({ id: course.id, name: trimmed })
    setEditing(false)
  }

  function cancelRename() {
    setName(course.name)
    setEditing(false)
  }

  async function move(target: Course | undefined) {
    if (!target) return
    // Wissel positions tussen course en target. Twee losse updates — geen
    // unique-index meer (zie migratie 0004).
    await Promise.all([
      positionMutation.mutateAsync({ id: course.id, position: target.position }),
      positionMutation.mutateAsync({ id: target.id, position: course.position }),
    ])
  }

  async function handleDelete() {
    const ok = window.confirm(`"${course.name}" verwijderen?`)
    if (!ok) return
    await deleteMutation.mutateAsync(course.id)
  }

  return (
    <li className="flex items-center gap-2 rounded-ios border border-border bg-surface px-3 py-2">
      <span className="grid size-7 shrink-0 place-items-center rounded-ios bg-surface-2 text-xs font-medium tabular-nums text-text-muted">
        {index + 1}
      </span>

      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void commitRename()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              cancelRename()
            }
          }}
          className="flex-1 rounded-ios border border-border bg-bg px-2 py-1 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex-1 cursor-text text-left text-sm font-medium hover:text-accent"
        >
          {course.name}
        </button>
      )}

      <div className="flex items-center gap-1">
        {editing ? (
          <>
            <IconBtn
              label="Opslaan"
              onClick={commitRename}
              disabled={renameMutation.isPending}
              icon={<Check className="size-4" aria-hidden />}
            />
            <IconBtn
              label="Annuleren"
              onClick={cancelRename}
              icon={<X className="size-4" aria-hidden />}
            />
          </>
        ) : (
          <>
            <IconBtn
              label="Omhoog"
              onClick={() => void move(previous)}
              disabled={index === 0 || positionMutation.isPending}
              icon={<ArrowUp className="size-4" aria-hidden />}
            />
            <IconBtn
              label="Omlaag"
              onClick={() => void move(next)}
              disabled={index === total - 1 || positionMutation.isPending}
              icon={<ArrowDown className="size-4" aria-hidden />}
            />
            <IconBtn
              label="Hernoemen"
              onClick={() => setEditing(true)}
              icon={<Pencil className="size-4" aria-hidden />}
            />
            <IconBtn
              label="Verwijderen"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              icon={<Trash2 className="size-4" aria-hidden />}
              variant="danger"
            />
          </>
        )}
      </div>
    </li>
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
        'rounded-ios p-1.5 transition-colors disabled:opacity-30',
        variant === 'danger'
          ? 'text-text-muted hover:bg-danger/10 hover:text-danger'
          : 'text-text-muted hover:bg-surface-2 hover:text-text',
      )}
    >
      {icon}
    </button>
  )
}
