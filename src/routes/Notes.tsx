import { useMemo, useState } from 'react'
import { Plus, StickyNote } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import type { Note } from '../types/domain'
import { Button, Search, Sheet } from '../components/ui'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'
import { NoteForm } from '../features/notes/NoteForm'
import { useDeleteNote, useNotes } from '../features/notes/hooks'
import { useDishes } from '../features/dishes/hooks'
import { useCourses } from '../features/menu/hooks'

export function Notes() {
  const { data, isLoading, isError, error } = useNotes()
  const dishesQ = useDishes()
  const coursesQ = useCourses()
  const del = useDeleteNote()
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<Note | null>(null)
  const [adding, setAdding] = useState(false)

  const dishById = useMemo(() => {
    const map = new Map<string, string>()
    for (const d of dishesQ.data ?? []) map.set(d.id, d.name)
    return map
  }, [dishesQ.data])

  const courseById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of coursesQ.data ?? []) map.set(c.id, c.name)
    return map
  }, [coursesQ.data])

  const filtered = useMemo(() => {
    if (!data) return []
    const q = filter.trim().toLowerCase()
    if (!q) return data
    return data.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.tags.some((t) => t.includes(q)),
    )
  }, [data, filter])

  async function handleDelete(note: Note) {
    if (!window.confirm('Notitie verwijderen?')) return
    try {
      await del.mutateAsync(note.id)
      toast.success('Verwijderd')
      setEditing(null)
    } catch {
      /* toast in hook */
    }
  }

  const total = data?.length ?? 0

  return (
    <div className="vg-page flex flex-col gap-s-7">
      {/* Header */}
      <header className="flex flex-col gap-s-3 md:flex-row md:items-end md:justify-between md:gap-s-6">
        <div>
          <span className="t-caption t-faded">Werkboek</span>
          <h1 className="t-display-m mt-s-2">Notities</h1>
          <p className="t-body-s t-soft mt-s-3" style={{ maxWidth: '52ch' }}>
            Vrij notitieblok — ideeën, to-do's, herinneringen.
          </p>
        </div>
        <Button variant="accent" onClick={() => setAdding(true)}>
          <Plus size={16} aria-hidden /> Notitie
        </Button>
      </header>

      <div className="flex items-center gap-s-4 flex-wrap">
        <div className="flex-1 max-w-[420px]">
          <Search
            placeholder="Zoek in notities…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <span className="t-mono-s t-faded tabular-nums">
          {filtered.length} van {total}
        </span>
      </div>

      {isLoading ? (
        <div className="grid gap-s-5 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : isError ? (
        <div className="vg-card vg-card--bordered">
          <p className="t-body-m text-negative">
            Kon notities niet laden — {error instanceof Error ? error.message : 'fout'}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title={data && data.length > 0 ? 'Geen resultaten' : 'Nog geen notities'}
          description={
            data && data.length > 0
              ? 'Probeer een ander zoekwoord.'
              : 'Maak je eerste notitie aan — ideeën, to-do’s, alles is goed.'
          }
        />
      ) : (
        <div className="grid gap-s-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              dishName={note.dishId ? dishById.get(note.dishId) : undefined}
              courseName={note.courseId ? courseById.get(note.courseId) : undefined}
              onClick={() => {
                setAdding(false)
                setEditing(note)
              }}
            />
          ))}
        </div>
      )}

      <Sheet
        open={adding}
        onClose={() => setAdding(false)}
        eyebrow="Nieuw"
        title="Notitie toevoegen"
      >
        <NoteForm onCancel={() => setAdding(false)} onSaved={() => setAdding(false)} />
      </Sheet>

      <Sheet
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        eyebrow="Bewerken"
        title={editing?.title || 'Notitie'}
      >
        {editing ? (
          <NoteForm
            note={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => setEditing(null)}
            onDelete={() => void handleDelete(editing)}
          />
        ) : null}
      </Sheet>
    </div>
  )
}

function NoteCard({
  note,
  dishName,
  courseName,
  onClick,
}: {
  note: Note
  dishName?: string
  courseName?: string
  onClick: () => void
}) {
  const preview = note.body.slice(0, 180)
  const updated = formatDistanceToNow(new Date(note.updatedAt), {
    addSuffix: true,
    locale: nl,
  })

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left vg-card vg-card--bordered hover:bg-paper-deep transition-colors"
      style={{ cursor: 'pointer' }}
    >
      <div className="flex flex-col gap-s-3">
        <div>
          <h3
            className="line-clamp-2"
            style={{ fontSize: 18, lineHeight: 1.3, letterSpacing: '-0.018em', fontWeight: 600 }}
          >
            {note.title || 'Zonder titel'}
          </h3>
          <span className="t-mono-s t-faded mt-s-1 inline-block">{updated}</span>
        </div>
        {preview ? (
          <p className="t-body-s t-soft whitespace-pre-wrap line-clamp-5">{preview}</p>
        ) : null}
        {(note.tags.length > 0 || dishName || courseName) && (
          <div className="flex flex-wrap gap-s-2">
            {courseName ? (
              <span className="t-mono-s t-faded">{courseName}</span>
            ) : null}
            {dishName ? (
              <span className="t-mono-s" style={{ color: 'var(--ink-soft)' }}>
                {dishName}
              </span>
            ) : null}
            {note.tags.map((t) => (
              <span key={t} className="t-mono-s t-accent">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
