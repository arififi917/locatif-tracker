import { type PeriodFilter } from './types'
import { startOfYear, endOfYear, subMonths, parseISO, isWithinInterval } from 'date-fns'

export function getPeriodBounds(period: PeriodFilter): { start: Date; end: Date } {
  if (period.mode === 'all') {
    return { start: new Date(0), end: new Date() }
  }
  if (period.mode === 'year') {
    const year = period.year ?? new Date().getFullYear()
    const base = new Date(year, 0, 1)
    return { start: startOfYear(base), end: endOfYear(base) }
  }
  // rolling_12m
  const ref = period.referenceDate ? parseISO(period.referenceDate) : new Date()
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
