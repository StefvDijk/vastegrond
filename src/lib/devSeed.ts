// Hardcoded fallback voor dev / localhost. Wordt gebruikt door hooks
// wanneer de Supabase-query een lege lijst teruggeeft, zodat de UI tijdens
// design-werk gevuld is. Geen invloed op productie-data.

import type { Event } from '../types/domain'
import {
  EVENT_CAPACITY,
  EVENT_DATES,
  TICKET_PRICE_CENTS,
} from './constants'

const LOCATION_COST_CENTS = 10000 // €100 per avond (placeholder)

export const SEED_EVENTS: Event[] = EVENT_DATES.map((entry, index) => ({
  id: entry.id,
  name: entry.label,
  eventDate: entry.date,
  guestCount: EVENT_CAPACITY,
  ticketPriceCents: TICKET_PRICE_CENTS,
  locationName: 'Vogelfrei',
  locationCostCents: LOCATION_COST_CENTS,
  notes: null,
  createdAt: `2026-01-${String(index + 1).padStart(2, '0')}T00:00:00Z`,
  updatedAt: `2026-01-${String(index + 1).padStart(2, '0')}T00:00:00Z`,
}))

export const useDevSeed = import.meta.env.DEV
