import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import type { Expense } from '../../types/domain'
import { cn } from '../../lib/cn'
import { useCreateExpense, useUpdateExpense } from './hooks'

const schema = z.object({
  category: z.string().trim().min(1, 'Categorie is verplicht').max(80),
  description: z.string().trim().min(1, 'Omschrijving is verplicht').max(200),
  amountEuros: z.coerce.number().min(0).max(1_000_000),
})

type FormValues = z.input<typeof schema>

type ExpenseFormProps = {
  expense?: Expense
  onCancel: () => void
  onSaved: () => void
}

export function ExpenseForm({ expense, onCancel, onSaved }: ExpenseFormProps) {
  const create = useCreateExpense()
  const update = useUpdateExpense()
  const isPending = create.isPending || update.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: expense?.category ?? '',
      description: expense?.description ?? '',
      amountEuros: expense ? Math.round(expense.amountCents) / 100 : 0,
    },
  })

  async function onSubmit(values: FormValues) {
    const parsed = schema.parse(values)
    const payload = {
      category: parsed.category,
      description: parsed.description,
      amountCents: Math.round(parsed.amountEuros * 100),
    }
    try {
      if (expense) {
        await update.mutateAsync({ id: expense.id, ...payload })
      } else {
        await create.mutateAsync(payload)
      }
      toast.success(expense ? 'Bijgewerkt' : 'Toegevoegd')
      onSaved()
    } catch {
      /* toast in hook */
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categorie" error={errors.category?.message}>
          <input
            type="text"
            placeholder="Drank · Decor · Servicebureau"
            className={inputClass(Boolean(errors.category))}
            {...register('category')}
          />
        </Field>
        <Field label="Bedrag (€)" error={errors.amountEuros?.message}>
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            className={inputClass(Boolean(errors.amountEuros))}
            {...register('amountEuros')}
          />
        </Field>
      </div>
      <Field label="Omschrijving" error={errors.description?.message}>
        <input
          type="text"
          className={inputClass(Boolean(errors.description))}
          {...register('description')}
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
