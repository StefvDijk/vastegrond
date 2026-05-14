import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Pencil, Trash2, X } from 'lucide-react'
import type { Course } from '../../types/domain'
import { cn } from '../../lib/cn'
import { useDeleteCourse, useRenameCourse, useUpdateCoursePosition } from './hooks'

type CourseRowProps = {
  course: Course
  index: number
  total: number
  previous?: Course
  next?: Course
}

export function CourseRow({ course, index, total, previous, next }: CourseRowProps) {
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
    <li
      className="flex items-center gap-s-3 px-s-4 py-s-3"
      style={{ borderTop: index === 0 ? 'none' : '1px solid var(--line)' }}
    >
      <span className="t-caption t-faded tabular w-6 text-center">{index + 1}</span>

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
          className="vg-input vg-input--inline flex-1"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex-1 text-left text-body-m font-medium text-ink hover:text-accent transition-colors"
        >
          {course.name}
        </button>
      )}

      <div className="flex items-center gap-s-1">
        {editing ? (
          <>
            <IconBtn
              label="Opslaan"
              onClick={commitRename}
              disabled={renameMutation.isPending}
              icon={<Check size={16} aria-hidden />}
            />
            <IconBtn label="Annuleren" onClick={cancelRename} icon={<X size={16} aria-hidden />} />
          </>
        ) : (
          <>
            <IconBtn
              label="Omhoog"
              onClick={() => void move(previous)}
              disabled={index === 0 || positionMutation.isPending}
              icon={<ArrowUp size={16} aria-hidden />}
            />
            <IconBtn
              label="Omlaag"
              onClick={() => void move(next)}
              disabled={index === total - 1 || positionMutation.isPending}
              icon={<ArrowDown size={16} aria-hidden />}
            />
            <IconBtn
              label="Hernoemen"
              onClick={() => setEditing(true)}
              icon={<Pencil size={16} aria-hidden />}
            />
            <IconBtn
              label="Verwijderen"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              icon={<Trash2 size={16} aria-hidden />}
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
        'vg-sheet__close',
        variant === 'danger' && 'hover:text-negative',
      )}
    >
      {icon}
    </button>
  )
}
