import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import type { TeamMember } from '../../types/domain'
import { Button, Field, Input } from '../../components/ui'
import { useCreateTeamMember, useUpdateTeamMember } from './hooks'

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Ongeldig e-mailadres'),
  displayName: z.string().trim().max(120).optional(),
})

type FormValues = z.input<typeof schema>

type TeamMemberFormProps = {
  member?: TeamMember
  onCancel: () => void
  onSaved: () => void
}

export function TeamMemberForm({ member, onCancel, onSaved }: TeamMemberFormProps) {
  const create = useCreateTeamMember()
  const update = useUpdateTeamMember()
  const isPending = create.isPending || update.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: member?.email ?? '',
      displayName: member?.displayName ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    const parsed = schema.parse(values)
    const payload = {
      email: parsed.email,
      displayName: parsed.displayName?.trim() ? parsed.displayName : null,
    }
    try {
      if (member) {
        await update.mutateAsync({ id: member.id, ...payload })
      } else {
        await create.mutateAsync(payload)
      }
      toast.success(member ? 'Bijgewerkt' : 'Toegevoegd')
      onSaved()
    } catch {
      /* toast in hook */
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-s-4">
      <div className="grid grid-cols-2 gap-s-3">
        <Field label="E-mail" error={errors.email?.message}>
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="jan@vogelfrei.nl"
            {...register('email')}
            invalid={Boolean(errors.email)}
          />
        </Field>
        <Field label="Weergavenaam" error={errors.displayName?.message}>
          <Input
            placeholder="Bv. Jan"
            {...register('displayName')}
            invalid={Boolean(errors.displayName)}
          />
        </Field>
      </div>

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
