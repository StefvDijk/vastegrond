import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import type { Ingredient } from '../../types/domain'
import { Button, Field, Input, Textarea } from '../../components/ui'
import { useCreateIngredient, useUpdateIngredient } from './hooks'

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
  onDelete?: () => void
}

export function IngredientForm({ ingredient, onCancel, onSaved, onDelete }: IngredientFormProps) {
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
      pricePerUnitEuros: ingredient ? Math.round(ingredient.pricePerUnitCents) / 100 : 0,
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
      /* toast in hook */
    }
  }

  return (
    <form
      id="ingredient-form"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-s-4"
    >
      <Field label="Naam" error={errors.name?.message}>
        <Input
          placeholder="Bv. Bloem T55"
          {...register('name')}
          invalid={Boolean(errors.name)}
        />
      </Field>

      <div className="grid grid-cols-3 gap-s-3">
        <Field label="Eenheid" error={errors.unit?.message}>
          <Input placeholder="g · kg · l · stuk" {...register('unit')} invalid={Boolean(errors.unit)} />
        </Field>
        <Field label="Prijs / eenheid (€)" error={errors.pricePerUnitEuros?.message}>
          <Input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            {...register('pricePerUnitEuros')}
            invalid={Boolean(errors.pricePerUnitEuros)}
          />
        </Field>
        <Field label="Inkoop-eenheid" error={errors.purchaseUnit?.message}>
          <Input
            placeholder="zak 25kg"
            {...register('purchaseUnit')}
            invalid={Boolean(errors.purchaseUnit)}
          />
        </Field>
      </div>

      <Field label="Leverancier" error={errors.supplier?.message}>
        <Input
          placeholder="Bv. De Molen"
          {...register('supplier')}
          invalid={Boolean(errors.supplier)}
        />
      </Field>

      <Field label="Notities" error={errors.notes?.message}>
        <Textarea rows={3} {...register('notes')} invalid={Boolean(errors.notes)} />
      </Field>

      <div className="flex justify-between gap-s-3 pt-s-2">
        {ingredient && onDelete ? (
          <Button type="button" variant="ghost" danger onClick={onDelete} disabled={isPending}>
            Verwijderen
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-s-3">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
            Annuleren
          </Button>
          <Button type="submit" variant="accent" disabled={isPending}>
            {isPending ? 'Opslaan…' : 'Opslaan'}
          </Button>
        </div>
      </div>
    </form>
  )
}
