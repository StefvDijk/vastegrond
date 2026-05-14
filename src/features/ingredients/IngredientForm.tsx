import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import type { Ingredient } from '../../types/domain'
import { cn } from '../../lib/cn'
import {
  useCreateIngredient,
  useUpdateIngredient,
} from './hooks'

const schema = z.object({
  name: z.string().trim().min(1, 'Naam is verplicht').max(120),
  unit: z.string().trim().min(1, 'Eenheid is verplicht').max(20),
  pricePerUnitEuros: z.coerce.number().min(0).max(100_000),
  purchaseUnit: z.string().trim().max(80).optional(),
  supplier: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
})

type FormValues = z.input<typeof schema>

type IngredientFormProps = {
  ingredient?: Ingredient
  onCancel: () => void
  onSaved: () => void
}

export function IngredientForm({
  ingredient,
  onCancel,
  onSaved,
}: IngredientFormProps) {
  const create = useCreateIngredient()
  const update = useUpdateIngredient()
  const isPending = create.isPending || update.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: ingredient?.name ?? '',
      unit: ingredient?.unit ?? 'g',
      pricePerUnitEuros: ingredient
        ? Math.round(ingredient.pricePerUnitCents) / 100
        : 0,
      purchaseUnit: ingredient?.purchaseUnit ?? '',
      supplier: ingredient?.supplier ?? '',
      notes: ingredient?.notes ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    const parsed = schema.parse(values)
    const payload = {
      name: parsed.name,
      unit: parsed.unit,
      pricePerUnitCents: Math.round(parsed.pricePerUnitEuros * 100),
      purchaseUnit: parsed.purchaseUnit?.trim() ? parsed.purchaseUnit : null,
      supplier: parsed.supplier?.trim() ? parsed.supplier : null,
      notes: parsed.notes?.trim() ? parsed.notes : null,
    }
    try {
      if (ingredient) {
        await update.mutateAsync({ id: ingredient.id, ...payload })
      } else {
        await create.mutateAsync(payload)
      }
      toast.success(ingredient ? 'Bijgewerkt' : 'Toegevoegd')
      onSaved()
    } catch {
      /* error already toasted in hook */
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Field label="Naam" error={errors.name?.message}>
        <input
          type="text"
          className={inputClass(Boolean(errors.name))}
          placeholder="Bv. Bloem T55"
          {...register('name')}
        />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Eenheid" error={errors.unit?.message}>
          <input
            type="text"
            className={inputClass(Boolean(errors.unit))}
            placeholder="g · kg · l · stuk"
            {...register('unit')}
          />
        </Field>
        <Field
          label="Prijs (€ / eenheid)"
          error={errors.pricePerUnitEuros?.message}
        >
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            className={inputClass(Boolean(errors.pricePerUnitEuros))}
            {...register('pricePerUnitEuros')}
          />
        </Field>
        <Field label="Inkoop-eenheid" error={errors.purchaseUnit?.message}>
          <input
            type="text"
            className={inputClass(Boolean(errors.purchaseUnit))}
            placeholder="zak 25kg"
            {...register('purchaseUnit')}
          />
        </Field>
      </div>

      <Field label="Leverancier" error={errors.supplier?.message}>
        <input
          type="text"
          className={inputClass(Boolean(errors.supplier))}
          placeholder="Bv. De Molen"
          {...register('supplier')}
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
