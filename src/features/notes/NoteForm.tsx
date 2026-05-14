import { useState } from 'react'
import { toast } from 'sonner'
import type { Note } from '../../types/domain'
import { Button, Field, Input, Textarea } from '../../components/ui'
import { TagInput } from '../../components/TagInput'
import { DishCourseSelect } from '../../components/DishCourseSelect'
import { useCreateNote, useUpdateNote } from './hooks'

type NoteFormProps = {
  note?: Note
  onCancel: () => void
  onSaved: () => void
  onDelete?: () => void
}

export function NoteForm({ note, onCancel, onSaved, onDelete }: NoteFormProps) {
  const create = useCreateNote()
  const update = useUpdateNote()
  const isPending = create.isPending || update.isPending

  const [title, setTitle] = useState(note?.title ?? '')
  const [body, setBody] = useState(note?.body ?? '')
  const [tags, setTags] = useState<string[]>(note?.tags ?? [])
  const [dishId, setDishId] = useState<string | null>(note?.dishId ?? null)
  const [courseId, setCourseId] = useState<string | null>(note?.courseId ?? null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedBody = body.trim()
    if (!trimmedTitle && !trimmedBody) {
      toast.error('Vul titel of inhoud in')
      return
    }
    const payload = {
      title: trimmedTitle,
      body: trimmedBody,
      tags,
      dishId,
      courseId,
    }
    try {
      if (note) {
        await update.mutateAsync({ id: note.id, ...payload })
      } else {
        await create.mutateAsync(payload)
      }
      toast.success(note ? 'Bijgewerkt' : 'Toegevoegd')
      onSaved()
    } catch {
      /* toast in hook */
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-s-4">
      <Field label="Titel">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bv. Idee voor amuse"
          autoFocus
        />
      </Field>

      <Field label="Notitie">
        <Textarea
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Schrijf vrij…"
        />
      </Field>

      <Field label="Tags">
        <TagInput value={tags} onChange={setTags} placeholder="bv. amuse, styling…" />
      </Field>

      <DishCourseSelect
        dishId={dishId}
        courseId={courseId}
        onChange={(next) => {
          setDishId(next.dishId)
          setCourseId(next.courseId)
        }}
      />

      <div className="flex justify-between gap-s-3 pt-s-2">
        {note && onDelete ? (
          <Button type="button" variant="ghost" danger onClick={onDelete} disabled={isPending}>
            Verwijderen
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-s-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
            Annuleren
          </Button>
          <Button type="submit" variant="accent" disabled={isPending}>
            {isPending ? 'Opslaan…' : 'Opslaan'}
          </Button>
        </div>
      </div>
    </form>
  )
}
