// Domain types: camelCase weergave van de snake_case database-rijen.
// Bedragen blijven in cents (int) — UI gebruikt formatEuro(cents / 100).

import type { Tables } from './db'

export type EventRow = Tables<'events'>
export type CourseRow = Tables<'courses'>
export type DishRow = Tables<'dishes'>
export type IngredientRow = Tables<'ingredients'>
export type DishIngredientRow = Tables<'dish_ingredients'>
export type GuestRow = Tables<'guests'>
export type TeamMemberRow = Tables<'team_members'>
export type ExpenseRow = Tables<'expenses'>

export type Event = {
  id: string
  name: string
  eventDate: string
  guestCount: number
  ticketPriceCents: number
  locationName: string | null
  locationCostCents: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type Expense = {
  id: string
  category: string
  description: string
  amountCents: number
  createdAt: string
}

export function mapExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    amountCents: row.amount_cents,
    createdAt: row.created_at,
  }
}

export type GuestStatus = 'invited' | 'confirmed' | 'declined' | 'tentative'

export type Guest = {
  id: string
  eventId: string
  name: string
  status: GuestStatus
  partySize: number
  dietary: string | null
  notes: string | null
}

export type Course = {
  id: string
  position: number
  name: string
}

export type Dish = {
  id: string
  courseId: string
  name: string
  portions: number
  notes: string | null
}

export type Ingredient = {
  id: string
  name: string
  unit: string
  pricePerUnitCents: number
  purchaseUnit: string | null
  supplier: string | null
  notes: string | null
}

export type TeamMember = {
  id: string
  userId: string | null
  email: string
  displayName: string | null
  createdAt: string
}

export function mapEvent(row: EventRow): Event {
  return {
    id: row.id,
    name: row.name,
    eventDate: row.event_date,
    guestCount: row.guest_count,
    ticketPriceCents: row.ticket_price_cents,
    locationName: row.location_name,
    locationCostCents: row.location_cost_cents,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapGuest(row: GuestRow): Guest {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    status: row.status as GuestStatus,
    partySize: row.party_size,
    dietary: row.dietary,
    notes: row.notes,
  }
}

export function mapCourse(row: CourseRow): Course {
  return {
    id: row.id,
    position: row.position,
    name: row.name,
  }
}

export function mapDish(row: DishRow): Dish {
  return {
    id: row.id,
    courseId: row.course_id,
    name: row.name,
    portions: row.portions,
    notes: row.notes,
  }
}

export function mapIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    pricePerUnitCents: row.price_per_unit_cents,
    purchaseUnit: row.purchase_unit,
    supplier: row.supplier,
    notes: row.notes,
  }
}

export function mapTeamMember(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
  }
}
