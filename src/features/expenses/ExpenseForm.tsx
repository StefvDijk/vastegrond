import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import type { Expense } from '../../types/domain'
import { Button, Field, Input } from '../../components/ui'
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-s-4">
      <div className="grid grid-cols-2 gap-s-3">
        <Field label="Categorie" error={errors.category?.message}>
          <Input
            placeholder="Drank · Decor · Servicebureau"
            {...register('category')}
            invalid={Boolean(errors.category)}
          />
        </Field>
        <Field label="Bedrag (€)" error={errors.amountEuros?.message}>
          <Input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            {...register('amountEuros')}
            invalid={Boolean(errors.amountEuros)}
          />
        </Field>
      </div>
      <Field label="Omschrijving" error={errors.description?.message}>
        <Input {...register('description')} invalid={Boolean(errors.description)} />
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
