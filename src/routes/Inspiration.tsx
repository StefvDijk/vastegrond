import { useMemo, useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import type { Inspiration } from '../types/domain'
import {
  Button,
  Card,
  Counter,
  ScreenHeader,
  Search,
  Sheet,
} from '../components/ui'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'
import {
  useDeleteInspiration,
  useInspirations,
} from '../features/inspirations/hooks'
import { InspirationCard } from '../features/inspirations/InspirationCard'
import { InspirationForm } from '../features/inspirations/InspirationForm'
import { useDishes } from '../features/dishes/hooks'
import { useCourses } from '../features/menu/hooks'

export function Inspiration() {
  const { data, isLoading, isError, error } = useInspirations()
  const dishesQ = useDishes()
  const coursesQ = useCourses()
  const del = useDeleteInspiration()
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<Inspiration | null>(null)
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
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.note.toLowerCase().includes(q) ||
        (i.url ?? '').toLowerCase().includes(q) ||
        i.tags.some((t) => t.includes(q)),
    )
  }, [data, filter])

  async function handleDelete(item: Inspiration) {
    if (!window.confirm('Inspiratie verwijderen?')) return
    try {
      await del.mutateAsync({ id: item.id, imagePath: item.imagePath })
      toast.success('Verwijderd')
      setEditing(null)
    } catch {
      /* toast in hook */
    }
  }

  const total = data?.length ?? 0

  return (
    <div className="vg-page flex flex-col gap-s-9">
      <ScreenHeader
        eyebrow="Moodboard"
        title="Inspiratie"
        description="Links, recepten, screenshots, foto's — alles dat de avonden vormgeeft."
        actions={
          <Button variant="accent" onClick={() => setAdding(true)}>
            <Plus size={16} aria-hidden /> Inspiratie
          </Button>
        }
      />

      <div className="flex items-center gap-s-4 flex-wrap">
        <div className="flex-1 max-w-[420px]">
          <Search
            placeholder="Zoek op titel, tag of link…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Counter>
          {filtered.length} van {total}
        </Counter>
      </div>

      {isLoading ? (
        <div className="grid gap-s-5 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : isError ? (
        <Card>
          <p className="t-body-m text-negative">
            Kon inspiratie niet laden — {error instanceof Error ? error.message : 'fout'}
          </p>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={data && data.length > 0 ? 'Geen resultaten' : 'Nog niets verzameld'}
          description={
            data && data.length > 0
              ? 'Probeer een ander zoekwoord.'
              : 'Plak een Instagram-link, deel een recept of upload een foto.'
          }
        />
      ) : (
        <div className="grid gap-s-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <InspirationCard
              key={item.id}
              inspiration={item}
              dishName={item.dishId ? dishById.get(item.dishId) : undefined}
              courseName={item.courseId ? courseById.get(item.courseId) : undefined}
              onClick={() => {
                setAdding(false)
                setEditing(item)
              }}
            />
          ))}
        </div>
      )}

      <Sheet
        open={adding}
        onClose={() => setAdding(false)}
        eyebrow="Nieuw"
        title="Inspiratie toevoegen"
        width={560}
      >
        <InspirationForm onCancel={() => setAdding(false)} onSaved={() => setAdding(false)} />
      </Sheet>

      <Sheet
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        eyebrow="Bewerken"
        title={editing?.title || 'Inspiratie'}
        width={560}
      >
        {editing ? (
          <InspirationForm
            inspiration={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => setEditing(null)}
            onDelete={() => void handleDelete(editing)}
          />
        ) : null}
      </Sheet>
    </div>
  )
}
