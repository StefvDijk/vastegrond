import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import type { Course, Dish } from '../../types/domain'
import { cn } from '../../lib/cn'
import { useCreateDish, useUpdateDish } from './hooks'

const schema = z.object({
  name: z.string().trim().min(1, 'Naam is verplicht').max(120),
  portions: z.coerce.number().int().min(1).max(1000),
  notes: z.string().trim().max(2000).optional(),
})

type FormValues = z.input<typeof schema>

type DishFormProps = {
  course: Course
  dish?: Dish
  onCancel: () => void
  onSaved: () => void
}

export function DishForm({ course, dish, onCancel, onSaved }: DishFormProps) {
  const create = useCreateDish()
  const update = useUpdateDish()
  const isPending = create.isPending || update.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: dish?.name ?? '',
      portions: dish?.portions ?? 50,
      notes: dish?.notes ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    const parsed = schema.parse(values)
    const payload = {
      courseId: course.id,
      name: parsed.name,
      portions: parsed.portions,
      notes: parsed.notes?.trim() ? parsed.notes : null,
    }
    try {
      if (dish) {
        await update.mutateAsync({ id: dish.id, ...payload })
      } else {
        await create.mutateAsync(payload)
      }
      toast.success(dish ? 'Bijgewerkt' : 'Toegevoegd')
      onSaved()
    } catch {
      /* error already toasted */
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Field label="Naam" error={errors.name?.message}>
        <input
          type="text"
          className={inputClass(Boolean(errors.name))}
          placeholder="Bv. Gegrilde courgette met tahin"
          {...register('name')}
        />
      </Field>

      <Field
        label="Porties (recept levert)"
        error={errors.portions?.message}
      >
        <input
          type="number"
          min={1}
          step={1}
          className={inputClass(Boolean(errors.portions))}
          {...register('portions')}
        />
      </Field>

      <Field label="Notities" error={errors.notes?.message}>
        <textarea
          rows={3}
          className={cn(inputClass(Boolean(errors.notes)), 'resize-none')}
          placeholder="Bereidingstips, allergenen, mise-en-place…"
          {...register('notes')}
        />
      </Field>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-ios px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-surface-2"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-ios bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Opslaan…' : 'Opslaan'}
        </button>
      </div>
    </form>
  )
}

function inputClass(hasError: boolean): string {
  return cn(
    'w-full rounded-ios border bg-surface px-3 py-2 text-sm outline-none transition-colors',
    'focus:ring-2 focus:ring-accent/30',
    hasError
      ? 'border-danger focus:border-danger'
      : 'border-border focus:border-accent',
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-text">{label}</span>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </label>
  )
}
