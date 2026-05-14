// Vogelfrei-deal: 40% van de bruto ticket-omzet gaat naar de locatie.
// Locatie-extras (depot, schoonmaak) staan los als locatiekosten per event.
export const VOGELFREI_SHARE = 0.4

export function vogelfreiCutCents(revenueCents: number): number {
  return Math.round(revenueCents * VOGELFREI_SHARE)
}
