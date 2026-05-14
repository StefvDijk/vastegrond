import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Inspiration } from '../../types/domain'
import { Button, Field, Input, Textarea } from '../../components/ui'
import { TagInput } from '../../components/TagInput'
import { DishCourseSelect } from '../../components/DishCourseSelect'
import {
  useCreateInspiration,
  useInspirationImageUrl,
  useUpdateInspiration,
} from './hooks'
import { uploadInspirationImage, deleteInspirationImage } from './storage'

type InspirationFormProps = {
  inspiration?: Inspiration
  onCancel: () => void
  onSaved: () => void
  onDelete?: () => void
}

export function InspirationForm({
  inspiration,
  onCancel,
  onSaved,
  onDelete,
}: InspirationFormProps) {
  const create = useCreateInspiration()
  const update = useUpdateInspiration()
  const isSaving = create.isPending || update.isPending

  const [title, setTitle] = useState(inspiration?.title ?? '')
  const [note, setNote] = useState(inspiration?.note ?? '')
  const [url, setUrl] = useState(inspiration?.url ?? '')
  const [tags, setTags] = useState<string[]>(inspiration?.tags ?? [])
  const [dishId, setDishId] = useState<string | null>(inspiration?.dishId ?? null)
  const [courseId, setCourseId] = useState<string | null>(inspiration?.courseId ?? null)
  const [imagePath, setImagePath] = useState<string | null>(inspiration?.imagePath ?? null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const imageUrlQ = useInspirationImageUrl(imagePath)

  // Plak-handler: zodra het formulier focus heeft en je plakt een screenshot,
  // wordt-ie geüpload als image_path. Werkt vooral fijn op desktop.
  useEffect(() => {
    const form = formRef.current
    if (!form) return
    async function handlePaste(event: ClipboardEvent) {
      const items = event.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (!file) continue
          event.preventDefault()
          await handleUpload(file)
          break
        }
      }
    }
    form.addEventListener('paste', handlePaste)
    return () => form.removeEventListener('paste', handlePaste)
  }, [])

  async function handleUpload(file: File | Blob) {
    setUploading(true)
    try {
      // Eerst nieuwe upload, dan pas oude verwijderen — zo verlies je niets bij een crash.
      const newPath = await uploadInspirationImage(file)
      const previous = imagePath
      setImagePath(newPath)
      if (previous) await deleteInspirationImage(previous)
      toast.success('Afbeelding toegevoegd')
    } catch (error) {
      console.error('upload failed:', error)
      toast.error(error instanceof Error ? error.message : 'Upload mislukt')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemoveImage() {
    if (!imagePath) return
    if (!window.confirm('Afbeelding verwijderen?')) return
    const previous = imagePath
    setImagePath(null)
    await deleteInspirationImage(previous)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedNote = note.trim()
    const trimmedUrl = url.trim()
    if (!trimmedTitle && !trimmedNote && !trimmedUrl && !imagePath) {
      toast.error('Voeg titel, tekst, link of afbeelding toe')
      return
    }
    const payload = {
      title: trimmedTitle,
      note: trimmedNote,
      url: trimmedUrl || null,
      imagePath,
      tags,
      dishId,
      courseId,
    }
    try {
      if (inspiration) {
        await update.mutateAsync({ id: inspiration.id, ...payload })
      } else {
        await create.mutateAsync(payload)
      }
      toast.success(inspiration ? 'Bijgewerkt' : 'Toegevoegd')
      onSaved()
    } catch {
      /* toast in hook */
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-s-4">
      <Field label="Titel">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bv. Servies van Studio Linde"
          autoFocus
        />
      </Field>

      <Field label="Link (Instagram, recept, website)">
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          inputMode="url"
        />
      </Field>

      <Field label="Afbeelding">
        <div className="flex flex-col gap-s-3">
          {imagePath ? (
            <div className="relative overflow-hidden rounded-m border border-line">
              {imageUrlQ.data ? (
                <img
                  src={imageUrlQ.data}
                  alt=""
                  className="w-full max-h-80 object-cover"
                />
              ) : (
                <div className="h-40 grid place-items-center t-soft">Laden…</div>
              )}
              <button
                type="button"
                onClick={handleRemoveImage}
                aria-label="Afbeelding verwijderen"
                className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-paper/90 border border-line text-negative hover:bg-paper"
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-s-2 rounded-m border border-dashed border-line p-s-6 t-soft hover:bg-paper-deep"
            >
              <ImagePlus size={18} aria-hidden />
              <span>{uploading ? 'Uploaden…' : 'Kies foto of plak screenshot'}</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleUpload(file)
              e.target.value = ''
            }}
          />
        </div>
      </Field>

      <Field label="Notitie">
        <Textarea
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Wat valt je op? Hoe wil je het gebruiken?"
        />
      </Field>

      <Field label="Tags">
        <TagInput value={tags} onChange={setTags} placeholder="bv. styling, recept…" />
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
        {inspiration && onDelete ? (
          <Button type="button" variant="ghost" danger onClick={onDelete} disabled={isSaving}>
            Verwijderen
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-s-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
            Annuleren
          </Button>
          <Button type="submit" variant="accent" disabled={isSaving || uploading}>
            {isSaving ? 'Opslaan…' : 'Opslaan'}
          </Button>
        </div>
      </div>
    </form>
  )
}
