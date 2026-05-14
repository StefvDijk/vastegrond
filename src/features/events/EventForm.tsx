import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import type { Event } from '../../types/domain'
import { updateEvent } from './mutations'
import { eventsKeys } from './hooks'
import { Button, Field, Input, Textarea } from '../../components/ui'

const schema = z.object({
  name: z.string().trim().min(1, 'Naam is verplicht').max(120),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Gebruik formaat JJJJ-MM-DD'),
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-s-4">
      <Field label="Naam" error={errors.name?.message}>
        <Input {...register('name')} invalid={Boolean(errors.name)} />
      </Field>

      <div className="grid grid-cols-2 gap-s-3">
        <Field label="Datum" error={errors.eventDate?.message}>
          <Input type="date" {...register('eventDate')} invalid={Boolean(errors.eventDate)} />
        </Field>
        <Field label="Aantal gasten" error={errors.guestCount?.message}>
          <Input
            type="number"
            min={0}
            step={1}
            {...register('guestCount')}
            invalid={Boolean(errors.guestCount)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-s-3">
        <Field label="Ticketprijs (€)" error={errors.ticketPriceEuros?.message}>
          <Input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            {...register('ticketPriceEuros')}
            invalid={Boolean(errors.ticketPriceEuros)}
          />
        </Field>
        <Field label="Locatiekosten (€)" error={errors.locationCostEuros?.message}>
          <Input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            {...register('locationCostEuros')}
            invalid={Boolean(errors.locationCostEuros)}
          />
        </Field>
      </div>

      <Field label="Locatie" error={errors.locationName?.message}>
        <Input placeholder="Vogelfrei" {...register('locationName')} invalid={Boolean(errors.locationName)} />
      </Field>

      <Field label="Notities" error={errors.notes?.message}>
        <Textarea rows={3} {...register('notes')} invalid={Boolean(errors.notes)} />
      </Field>

      <div className="flex justify-end gap-s-3 pt-s-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={mutation.isPending}>
          Annuleren
        </Button>
        <Button type="submit" variant="accent" disabled={mutation.isPending}>
          {mutation.isPending ? 'Opslaan…' : 'Opslaan'}
        </Button>
      </div>
    </form>
  )
}
