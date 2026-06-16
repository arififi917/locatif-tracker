import { type AppData, type PeriodFilter, type PropertyKPI, type PortfolioKPI } from './types'
import { isWithinPeriod } from './period'

export function getAcquisitionCost(p: AppData['properties'][0]): number {
  return p.purchasePrice + p.notaryFees + p.agencyFees + p.initialWorks
}

export function getTotalCRD(propertyId: string, data: AppData, referenceDate: string): number {
  const loans = data.loans.filter((l) => l.propertyId === propertyId)
  return loans.reduce((sum, loan) => {
    const scheduleRows = data.loanSchedules
      .filter((r) => r.loanId === loan.id && r.date <= referenceDate)
      .sort((a, b) => b.date.localeCompare(a.date))
    if (scheduleRows.length > 0) {
      return sum + scheduleRows[0].remainingPrincipal
    }
    // Fallback: use loan principal if no schedule
    return sum + loan.principal
  }, 0)
}

export function getCreditCost(
  propertyId: string,
  data: AppData,
  period: PeriodFilter
): number {
  // Option 1: from ExpenseEvents with category 'credit'
  const fromExpenses = data.expenseEvents
    .filter(
      (e) =>
        e.propertyId === propertyId &&
        e.category === 'credit' &&
        isWithinPeriod(e.date, period)
    )
    .reduce((sum, e) => sum + e.amount, 0)

  if (fromExpenses > 0) return fromExpenses

  // Option 2: from loan schedule (interest + insurance)
  const loans = data.loans.filter((l) => l.propertyId === propertyId)
  return loans.reduce((sum, loan) => {
    const rows = data.loanSchedules.filter(
      (r) => r.loanId === loan.id && isWithinPeriod(r.date, period)
    )
    return sum + rows.reduce((s, r) => s + r.interestPaid + (r.insurancePaid ?? 0), 0)
  }, 0)
}

export function getRealRents(
  propertyId: string,
  data: AppData,
  period: PeriodFilter
): number {
  return data.rentEvents
    .filter((r) => r.propertyId === propertyId && isWithinPeriod(r.date, period))
    .reduce((sum, r) => sum + r.amount, 0)
}

export function getNonRecoverableCharges(
  propertyId: string,
  data: AppData,
  period: PeriodFilter
): number {
  return data.expenseEvents
    .filter(
      (e) =>
        e.propertyId === propertyId &&
        isWithinPeriod(e.date, period) &&
        !e.isRecoverable &&
        e.category !== 'credit'
    )
    .reduce((sum, e) => sum + e.amount, 0)
}

export function computePropertyKPI(
  propertyId: string,
  data: AppData,
  period: PeriodFilter,
  referenceDate: string
): PropertyKPI {
  const property = data.properties.find((p) => p.id === propertyId)
  if (!property) throw new Error(`Property ${propertyId} not found`)

  const acquisitionCost = getAcquisitionCost(property)
  const totalCRD = getTotalCRD(propertyId, data, referenceDate)
  const realRents = getRealRents(propertyId, data, period)
  const nonRecoverableCharges = getNonRecoverableCharges(propertyId, data, period)
  const creditCost = getCreditCost(propertyId, data, period)

  const cashflowBeforeDebt = realRents - nonRecoverableCharges
  const cashflowAfterDebt = cashflowBeforeDebt - creditCost

  const grossYield = acquisitionCost > 0 ? realRents / acquisitionCost : 0
  const netYieldBeforeDebt = acquisitionCost > 0 ? cashflowBeforeDebt / acquisitionCost : 0
  const netYieldAfterDebt = acquisitionCost > 0 ? cashflowAfterDebt / acquisitionCost : 0
  const equityYield = property.equity > 0 ? cashflowAfterDebt / property.equity : 0

  return {
    acquisitionCost,
    currentValue: property.currentValue,
    totalCRD,
    netValue: property.currentValue - totalCRD,
    realRents,
    nonRecoverableCharges,
    creditCost,
    cashflowBeforeDebt,
    cashflowAfterDebt,
    grossYield,
    netYieldBeforeDebt,
    netYieldAfterDebt,
    equityYield,
  }
}

export function computePortfolioKPI(
  data: AppData,
  period: PeriodFilter,
  referenceDate: string
): PortfolioKPI {
  if (data.properties.length === 0) {
    return {
      acquisitionCost: 0,
      currentValue: 0,
      totalCRD: 0,
      netValue: 0,
      realRents: 0,
      nonRecoverableCharges: 0,
      creditCost: 0,
      cashflowBeforeDebt: 0,
      cashflowAfterDebt: 0,
      grossYield: 0,
      netYieldBeforeDebt: 0,
      netYieldAfterDebt: 0,
      equityYield: 0,
      totalCurrentValue: 0,
      totalNetValue: 0,
      totalEquity: 0,
    }
  }

  const kpis = data.properties.map((p) =>
    computePropertyKPI(p.id, data, period, referenceDate)
  )

  const sum = <K extends keyof PropertyKPI>(key: K): number =>
    kpis.reduce((s, k) => s + (k[key] as number), 0)

  const acquisitionCost = sum('acquisitionCost')
  const realRents = sum('realRents')
  const nonRecoverableCharges = sum('nonRecoverableCharges')
  const creditCost = sum('creditCost')
  const cashflowBeforeDebt = realRents - nonRecoverableCharges
  const cashflowAfterDebt = cashflowBeforeDebt - creditCost
  const totalEquity = data.properties.reduce((s, p) => s + p.equity, 0)
  const totalCurrentValue = sum('currentValue')
  const totalCRD = sum('totalCRD')
  const totalNetValue = totalCurrentValue - totalCRD

  return {
    acquisitionCost,
    currentValue: totalCurrentValue,
    totalCRD,
    netValue: totalNetValue,
    realRents,
    nonRecoverableCharges,
    creditCost,
    cashflowBeforeDebt,
    cashflowAfterDebt,
    grossYield: acquisitionCost > 0 ? realRents / acquisitionCost : 0,
    netYieldBeforeDebt: acquisitionCost > 0 ? cashflowBeforeDebt / acquisitionCost : 0,
    netYieldAfterDebt: acquisitionCost > 0 ? cashflowAfterDebt / acquisitionCost : 0,
    equityYield: totalEquity > 0 ? cashflowAfterDebt / totalEquity : 0,
    totalCurrentValue,
    totalNetValue,
    totalEquity,
  }
}
