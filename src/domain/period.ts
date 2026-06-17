import { type PeriodFilter } from './types'
import { startOfYear, endOfYear, subMonths, parseISO, isWithinInterval } from 'date-fns'

export function getPeriodBounds(period: PeriodFilter): { start: Date; end: Date } {
  const today = new Date()

  if (period.mode === 'all') {
    return { start: new Date(0), end: today }
  }
  if (period.mode === 'year') {
    const year = period.year ?? today.getFullYear()
    const base = new Date(year, 0, 1)
    const end = endOfYear(base)
    // Pour l'année en cours, on ne prend pas les échéances futures
    return { start: startOfYear(base), end: year === today.getFullYear() ? today : end }
  }
  // rolling_12m
  const ref = period.referenceDate ? parseISO(period.referenceDate) : today
  return { start: subMonths(ref, 12), end: ref }
}

export function isWithinPeriod(dateStr: string, period: PeriodFilter): boolean {
  if (period.mode === 'all') {
    return parseISO(dateStr) <= new Date()
  }
  const date = parseISO(dateStr)
  const { start, end } = getPeriodBounds(period)
  return isWithinInterval(date, { start, end })
}

export function getReferenceDate(period: PeriodFilter): string {
  if (period.mode === 'all') return new Date().toISOString().slice(0, 10)
  const { end } = getPeriodBounds(period)
  return end.toISOString().slice(0, 10)
}
