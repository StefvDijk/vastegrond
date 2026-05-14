import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import type { Guest, GuestStatus } from '../../types/domain'
import { cn } from '../../lib/cn'
import { useCreateGuest, useUpdateGuest } from './hooks'

const schema = z.object({
  name: z.string().trim().min(1, 'Naam is verplicht').max(120),
  status: z.enum(['invited', 'confirmed', 'declined', 'tentative']),
  partySize: z.coerce.number().int().min(1).max(20),
  dietary: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(2000).optional(),
})

type FormValues = z.input<typeof schema>

type GuestFormProps = {
  eventId: string
  guest?: Guest
  onCancel: () => void
  onSaved: () => void
}

export function GuestForm({ eventId, guest, onCancel, onSaved }: GuestFormProps) {
  const create = useCreateGuest()
  const update = useUpdateGuest()
  const isPending = create.isPending || update.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: guest?.name ?? '',
      status: guest?.status ?? 'invited',
      partySize: guest?.partySize ?? 1,
      dietary: guest?.dietary ?? '',
      notes: guest?.notes ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    const parsed = schema.parse(values)
    const payload = {
      eventId,
      name: parsed.name,
      status: parsed.status as GuestStatus,
      partySize: parsed.partySize,
      dietary: parsed.dietary?.trim() ? parsed.dietary : null,
      notes: parsed.notes?.trim() ? parsed.notes : null,
    }
    try {
      if (guest) {
        await update.mutateAsync({ id: guest.id, ...payload })
      } else {
        await create.mutateAsync(payload)
      }
      toast.success(guest ? 'Bijgewerkt' : 'Toegevoegd')
      onSaved()
    } catch {
      /* toast in hook */
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Field label="Naam" error={errors.name?.message}>
        <input
          type="text"
          className={inputClass(Boolean(errors.name))}
          {...register('name')}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Status" error={errors.status?.message}>
          <select
            className={inputClass(Boolean(errors.status))}
            {...register('status')}
          >
            <option value="invited">Genodigd</option>
            <option value="confirmed">Bevestigd</option>
            <option value="tentative">Voorlopig</option>
            <option value="declined">Afgemeld</option>
          </select>
        </Field>
        <Field label="Aantal personen" error={errors.partySize?.message}>
          <input
            type="number"
            min={1}
            step={1}
            className={inputClass(Boolean(errors.partySize))}
            {...register('partySize')}
          />
        </Field>
      </div>

      <Field label="Dieet / allergenen" error={errors.dietary?.message}>
        <input
          type="text"
          placeholder="Bv. vegetarisch, gluten, noten"
          className={inputClass(Boolean(errors.dietary))}
          {...register('dietary')}
        />
      </Field>

      <Field label="Notities" error={errors.notes?.message}>
        <textarea
          rows={2}
          className={cn(inputClass(Boolean(errors.notes)), 'resize-none')}
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
