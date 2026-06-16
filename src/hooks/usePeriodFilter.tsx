import { createContext, useContext, useState, type ReactNode } from 'react'
import { type PeriodFilter } from '../domain/types'
import { getReferenceDate } from '../domain/period'

type PeriodFilterContextValue = {
  period: PeriodFilter
  setPeriod: (p: PeriodFilter) => void
  referenceDate: string
}

const PeriodFilterContext = createContext<PeriodFilterContextValue | null>(null)

export function PeriodFilterProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<PeriodFilter>({
    mode: 'year',
    year: new Date().getFullYear(),
  })

  const referenceDate = getReferenceDate(period)

  return (
    <PeriodFilterContext.Provider value={{ period, setPeriod, referenceDate }}>
      {children}
    </PeriodFilterContext.Provider>
  )
}

export function usePeriodFilter(): PeriodFilterContextValue {
  const ctx = useContext(PeriodFilterContext)
  if (!ctx) throw new Error('usePeriodFilter must be used within PeriodFilterProvider')
  return ctx
}
