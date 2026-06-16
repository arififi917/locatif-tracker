import { useMemo } from 'react'
import { useAppData } from './useAppData'
import { usePeriodFilter } from './usePeriodFilter'
import { computePropertyKPI, computePortfolioKPI } from '../domain/calc'
import { type PropertyKPI, type PortfolioKPI } from '../domain/types'

export function usePropertyKPI(propertyId: string): PropertyKPI {
  const { data } = useAppData()
  const { period, referenceDate } = usePeriodFilter()
  return useMemo(
    () => computePropertyKPI(propertyId, data, period, referenceDate),
    [propertyId, data, period, referenceDate]
  )
}

export function usePortfolioKPI(): PortfolioKPI {
  const { data } = useAppData()
  const { period, referenceDate } = usePeriodFilter()
  return useMemo(
    () => computePortfolioKPI(data, period, referenceDate),
    [data, period, referenceDate]
  )
}
