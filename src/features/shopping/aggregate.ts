// Boodschappen-aggregatie (CLAUDE.md regel 2):
//   "sommeer per ingredient over alle gerechten × gasten, afgerond naar
//    inkoop-eenheid."
//
// Afronden naar inkoop-eenheid doen we (nog) niet automatisch — `purchase_unit`
// is vrije tekst ("zak 25kg", "fles 750ml"), we tonen 'm als hint zodat de
// kok de aantallen zelf kan bepalen.

import type { Dish, Ingredient } from '../../types/domain'
import type { DishIngredientLink } from '../dishes/queries'

export type ShoppingContribution = {
  dish: Dish
  perPortion: number
  totalForDish: number
}

export type ShoppingLine = {
  ingredient: Ingredient
  totalAmount: number
  totalCostCents: number
  contributions: ShoppingContribution[]
}

export type ShoppingGroup = {
  supplier: string | null
  lines: ShoppingLine[]
  subtotalCents: number
}

export function aggregateShopping(args: {
  ingredients: Ingredient[]
  dishes: Dish[]
  linksByDish: Record<string, DishIngredientLink[]>
  totalGuests: number
}): ShoppingLine[] {
  const byIngredient = new Map<string, ShoppingLine>()

  for (const ing of args.ingredients) {
    byIngredient.set(ing.id, {
      ingredient: ing,
      totalAmount: 0,
      totalCostCents: 0,
      contributions: [],
    })
  }

  for (const dish of args.dishes) {
    if (dish.portions <= 0) continue
    const links = args.linksByDish[dish.id] ?? []
    for (const link of links) {
      const line = byIngredient.get(link.ingredientId)
      if (!line) continue
      const perPortion = link.amount / dish.portions
      const totalForDish = perPortion * args.totalGuests
      line.totalAmount += totalForDish
      line.contributions.push({ dish, perPortion, totalForDish })
    }
  }

  for (const line of byIngredient.values()) {
    line.totalCostCents = line.totalAmount * line.ingredient.pricePerUnitCents
  }

  return [...byIngredient.values()]
    .filter((l) => l.totalAmount > 0)
    .sort((a, b) =>
      a.ingredient.name.localeCompare(b.ingredient.name, 'nl', {
        sensitivity: 'base',
      }),
    )
}

export function groupBySupplier(lines: ShoppingLine[]): ShoppingGroup[] {
  const groups = new Map<string, ShoppingLine[]>()
  for (const line of lines) {
    const key = line.ingredient.supplier?.trim() || ''
    const list = groups.get(key) ?? []
    list.push(line)
    groups.set(key, list)
  }

  const result: ShoppingGroup[] = []
  for (const [key, gLines] of groups.entries()) {
    result.push({
      supplier: key || null,
      lines: gLines,
      subtotalCents: gLines.reduce((sum, l) => sum + l.totalCostCents, 0),
    })
  }

  // "Geen leverancier" naar achteren, rest alfabetisch.
  return result.sort((a, b) => {
    if (a.supplier === null && b.supplier !== null) return 1
    if (a.supplier !== null && b.supplier === null) return -1
    return (a.supplier ?? '').localeCompare(b.supplier ?? '', 'nl', {
      sensitivity: 'base',
    })
  })
}
