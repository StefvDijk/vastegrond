import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import type { TeamMember } from '../../types/domain'
import { cn } from '../../lib/cn'
import {
  useCreateTeamMember,
  useUpdateTeamMember,
} from './hooks'

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

export function TeamMemberForm({
  member,
  onCancel,
  onSaved,
}: TeamMemberFormProps) {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="E-mail" error={errors.email?.message}>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            className={inputClass(Boolean(errors.email))}
            placeholder="jan@vogelfrei.nl"
            {...register('email')}
          />
        </Field>
        <Field label="Weergavenaam" error={errors.displayName?.message}>
          <input
            type="text"
            className={inputClass(Boolean(errors.displayName))}
            placeholder="Bv. Jan"
            {...register('displayName')}
          />
        </Field>
      </div>

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
