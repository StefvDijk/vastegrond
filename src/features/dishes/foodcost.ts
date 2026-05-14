// Foodcost-rekenregels.
//
// CLAUDE.md, regel 1:
//   "Foodcost per gerecht = som(hoeveelheid × prijs_per_eenheid) van alle
//    ingredienten, gedeeld door portions."
//
// `amount` van een dish_ingredient is uitgedrukt in dezelfde eenheid als
// `ingredient.unit`, dus we hoeven niet om te rekenen.

import type { Ingredient } from '../../types/domain'
import type { DishIngredientLink } from './queries'

export function recipeCostCents(
  links: DishIngredientLink[],
  ingredients: Ingredient[],
): number {
  const byId = new Map(ingredients.map((i) => [i.id, i] as const))
  let totalCents = 0
  for (const link of links) {
    const ing = byId.get(link.ingredientId)
    if (!ing) continue
    totalCents += link.amount * ing.pricePerUnitCents
  }
  return totalCents
}

export function costPerPortionCents(
  links: DishIngredientLink[],
  ingredients: Ingredient[],
  portions: number,
): number {
  if (portions <= 0) return 0
  return recipeCostCents(links, ingredients) / portions
}
