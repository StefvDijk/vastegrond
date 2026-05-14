import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import type { Event } from '../../types/domain'
import { updateEvent } from './mutations'
import { eventsKeys } from './hooks'
import { cn } from '../../lib/cn'

// Euro's worden in het formulier als decimaal getoond (bv 65 of 65.50) en
// pas bij submit naar cents geconverteerd om afrondingsfouten te vermijden.
const schema = z.object({
  name: z.string().trim().min(1, 'Naam is verplicht').max(120),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Gebruik formaat JJJJ-MM-DD'),
  guestCount: z.coerce.number().int().min(0).max(500),
  ticketPriceEuros: z.coerce.number().min(0).max(10_000),
  locationName: z.string().trim().max(120).optional(),
  locationCostEuros: z.coerce.number().min(0).max(1_000_000),
  notes: z.string().trim().max(2000).optional(),
})

type FormValues = z.input<typeof schema>

type EventFormProps = {
  event: Event
  onCancel: () => void
  onSaved: () => void
}

function centsToEuros(cents: number): number {
  return Math.round(cents) / 100
}

function eurosToCents(euros: number): number {
  return Math.round(euros * 100)
}

export function EventForm({ event, onCancel, onSaved }: EventFormProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: event.name,
      eventDate: event.eventDate,
      guestCount: event.guestCount,
      ticketPriceEuros: centsToEuros(event.ticketPriceCents),
      locationName: event.locationName ?? '',
      locationCostEuros: centsToEuros(event.locationCostCents),
      notes: event.notes ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: updateEvent,
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: eventsKeys.all })
      queryClient.setQueryData(eventsKeys.byId(updated.id), updated)
      toast.success('Opgeslagen')
      onSaved()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  function onSubmit(values: FormValues) {
    const parsed = schema.parse(values)
    mutation.mutate({
      id: event.id,
      name: parsed.name,
      eventDate: parsed.eventDate,
      guestCount: parsed.guestCount,
      ticketPriceCents: eurosToCents(parsed.ticketPriceEuros),
      locationName: parsed.locationName?.trim() ? parsed.locationName : null,
      locationCostCents: eurosToCents(parsed.locationCostEuros),
      notes: parsed.notes?.trim() ? parsed.notes : null,
    })
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
        <Field label="Datum" error={errors.eventDate?.message}>
          <input
            type="date"
            className={inputClass(Boolean(errors.eventDate))}
            {...register('eventDate')}
          />
        </Field>
        <Field label="Aantal gasten" error={errors.guestCount?.message}>
          <input
            type="number"
            min={0}
            step={1}
            className={inputClass(Boolean(errors.guestCount))}
            {...register('guestCount')}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ticketprijs (€)" error={errors.ticketPriceEuros?.message}>
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            className={inputClass(Boolean(errors.ticketPriceEuros))}
            {...register('ticketPriceEuros')}
          />
        </Field>
        <Field
          label="Locatie­kosten (€)"
          error={errors.locationCostEuros?.message}
        >
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            className={inputClass(Boolean(errors.locationCostEuros))}
            {...register('locationCostEuros')}
          />
        </Field>
      </div>

      <Field label="Locatie" error={errors.locationName?.message}>
        <input
          type="text"
          placeholder="Vogelfrei"
          className={inputClass(Boolean(errors.locationName))}
          {...register('locationName')}
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
          disabled={mutation.isPending}
          className="rounded-ios px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-surface-2"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-ios bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Opslaan…' : 'Opslaan'}
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
