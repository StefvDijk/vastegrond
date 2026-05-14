import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import type { Guest, GuestStatus } from '../../types/domain'
import { Button, Field, Input, Select, Textarea } from '../../components/ui'
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-s-4">
      <Field label="Naam" error={errors.name?.message}>
        <Input {...register('name')} invalid={Boolean(errors.name)} />
      </Field>

      <div className="grid grid-cols-2 gap-s-3">
        <Field label="Status" error={errors.status?.message}>
          <Select {...register('status')} invalid={Boolean(errors.status)}>
            <option value="invited">Genodigd</option>
            <option value="confirmed">Bevestigd</option>
            <option value="tentative">Voorlopig</option>
            <option value="declined">Afgemeld</option>
          </Select>
        </Field>
        <Field label="Aantal personen" error={errors.partySize?.message}>
          <Input
            type="number"
            min={1}
            step={1}
            {...register('partySize')}
            invalid={Boolean(errors.partySize)}
          />
        </Field>
      </div>

      <Field label="Dieet / allergenen" error={errors.dietary?.message}>
        <Input
          placeholder="Bv. vegetarisch, gluten, noten"
          {...register('dietary')}
          invalid={Boolean(errors.dietary)}
        />
      </Field>

      <Field label="Notities" error={errors.notes?.message}>
        <Textarea rows={3} {...register('notes')} invalid={Boolean(errors.notes)} />
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
