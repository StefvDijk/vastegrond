// Vaste serie-constanten — Vaste Grond × Vogelfrei, zomer 2026.
// Drie avonden, identieke setup. Alleen RSVP-data verschilt per avond.

export const EVENT_CAPACITY = 50
export const TICKET_PRICE_CENTS = 6500
export const WINE_PAIRING_CENTS = 2500
export const BOB_WINE_PAIRING_CENTS = 1500

export const EVENT_DATES = [
  { id: 'event-1', date: '2026-07-30', label: 'Avond 1' },
  { id: 'event-2', date: '2026-07-31', label: 'Avond 2' },
  { id: 'event-3', date: '2026-08-01', label: 'Avond 3' },
] as const
