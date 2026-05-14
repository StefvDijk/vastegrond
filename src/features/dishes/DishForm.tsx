import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import type { Course, Dish } from '../../types/domain'
import { Button, Field, Input, Textarea } from '../../components/ui'
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-s-4">
      <Field label="Naam" error={errors.name?.message}>
        <Input
          placeholder="Bv. Gegrilde courgette met tahin"
          {...register('name')}
          invalid={Boolean(errors.name)}
        />
      </Field>

      <Field label="Porties (recept levert)" error={errors.portions?.message}>
        <Input
          type="number"
          min={1}
          step={1}
          {...register('portions')}
          invalid={Boolean(errors.portions)}
        />
      </Field>

      <Field label="Notities" error={errors.notes?.message}>
        <Textarea
          rows={3}
          placeholder="Bereidingstips, allergenen, mise-en-place…"
          {...register('notes')}
          invalid={Boolean(errors.notes)}
        />
      </Field>

      <div className="flex justify-end gap-s-3 pt-s-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
          Annuleren
        </Button>
        <Button type="submit" variant="accent" disabled={isPending}>
          {isPending ? 'Opslaan…' : 'Opslaan'}
        </Button>
      </div>
    </form>
  )
}
