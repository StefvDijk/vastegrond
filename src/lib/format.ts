import { format as fmtDate } from 'date-fns'
import { nl } from 'date-fns/locale'

const eurFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('nl-NL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatEuro(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return eurFormatter.format(value)
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return numberFormatter.format(value)
}

export function formatDateLong(value: Date | string | null | undefined): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  return fmtDate(date, 'd MMMM yyyy', { locale: nl })
}

export function formatDateShort(value: Date | string | null | undefined): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  return fmtDate(date, 'd MMM', { locale: nl })
}
