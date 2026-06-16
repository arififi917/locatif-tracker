import { type AppData, type PeriodFilter, type PropertyKPI, type PortfolioKPI } from './types'
import { isWithinPeriod, getPeriodBounds } from './period'

/** Convertit une Date en string YYYY-MM-DD locale (pas UTC) */
function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Retourne { start, end } en string YYYY-MM-DD pour filtrer les lignes du TA */
function getPeriodDateStrings(period: PeriodFilter): { start: string; end: string } {
  const { start, end } = getPeriodBounds(period)
  return { start: toLocalDateStr(start), end: toLocalDateStr(end) }
}

export function getAcquisitionCost(p: AppData['properties'][0]): number {
  return p.purchasePrice + p.notaryFees + p.agencyFees + p.initialWorks
}

export function getTotalCRD(propertyId: string, data: AppData, referenceDate: string): number {
  const loans = data.loans.filter((l) => l.propertyId === propertyId)
  return loans.reduce((sum, loan) => {
    const scheduleRows = data.loanSchedules
      .filter((r) => r.loanId === loan.id && r.date <= referenceDate)
      .sort((a, b) => b.date.localeCompare(a.date))
    if (scheduleRows.length > 0) return sum + scheduleRows[0].remainingPrincipal
    return sum + loan.principal
  }, 0)
}

export function getCreditCostOnly(
  propertyId: string,
  data: AppData,
  period: PeriodFilter
): number {
  const { start, end } = getPeriodDateStrings(period)

  const fromSchedules = data.loans
    .filter((l) => l.propertyId === propertyId)
    .reduce((sum, loan) => {
      const rows = data.loanSchedules.filter(
        (r) => r.loanId === loan.id && r.date >= start && r.date <= end
      )
      return sum + rows.reduce((s, r) => s + r.interestPaid + (r.insurancePaid ?? 0), 0)
    }, 0)

  const fromExpenses = data.expenseEvents
    .filter(
      (e) =>
        e.propertyId === propertyId &&
        isWithinPeriod(e.date, period) &&
        e.category === 'assurance_emprunteur'
    )
    .reduce((sum, e) => sum + e.amount, 0)

  return fromSchedules + fromExpenses
}

export function getCreditMensualiteComplete(
  propertyId: string,
  data: AppData,
  period: PeriodFilter
): number {
  const { start, end } = getPeriodDateStrings(period)
  const loans = data.loans.filter((l) => l.propertyId === propertyId)

  return loans.reduce((sum, loan) => {
    const rows = data.loanSchedules.filter(
      (r) => r.loanId === loan.id && r.date >= start && r.date <= end
    )
    if (rows.length > 0) {
      return sum + rows.reduce((s, r) => s + r.principalPaid + r.interestPaid + (r.insurancePaid ?? 0), 0)
    }
    // Fallback sans TA importé
    if (loan.monthlyPayment) {
      const nbMois = getFallbackMonthsForLoan(loan, period)
      return sum + loan.monthlyPayment * nbMois
    }
    return sum
  }, 0)
}

function getFallbackMonthsForLoan(
  loan: AppData['loans'][0],
  period: PeriodFilter
): number {
  if (period.mode === 'year' || period.mode === 'rolling_12m') return 12
  // mode 'all' : on estime la durée du prêt
  if (loan.startDate && loan.endDate) {
    const start = new Date(loan.startDate).getTime()
    const end = new Date(loan.endDate).getTime()
    const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30.4375)) + 1
    return Math.max(months, 1)
  }
  return 12
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

export function getTotalCharges(
  propertyId: string,
  data: AppData,
  period: PeriodFilter
): number {
  return data.expenseEvents
    .filter(
      (e) =>
        e.propertyId === propertyId &&
        isWithinPeriod(e.date, period) &&
        e.category !== 'assurance_emprunteur'
    )
    .reduce((sum, e) => sum + e.amount, 0)
}

export function getAnneesCouvertes(
  propertyId: string,
  data: AppData,
  period: PeriodFilter
): number {
  if (period.mode === 'year' || period.mode === 'rolling_12m') return 1

  const dates: string[] = [
    ...data.rentEvents.filter((r) => r.propertyId === propertyId).map((r) => r.date),
    ...data.expenseEvents.filter((e) => e.propertyId === propertyId).map((e) => e.date),
    ...data.loans
      .filter((l) => l.propertyId === propertyId)
      .flatMap((loan) => data.loanSchedules.filter((r) => r.loanId === loan.id).map((r) => r.date)),
  ]

  if (dates.length === 0) return 1
  const sorted = dates.sort()
  const diffMs = new Date(sorted[sorted.length - 1]).getTime() - new Date(sorted[0]).getTime()
  const years = diffMs / (1000 * 60 * 60 * 24 * 365.25)
  return Math.max(years, 1)
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
  const totalCharges = getTotalCharges(propertyId, data, period)
  const creditCostOnly = getCreditCostOnly(propertyId, data, period)
  const creditMensualiteComplete = getCreditMensualiteComplete(propertyId, data, period)
  const anneesCouvertes = getAnneesCouvertes(propertyId, data, period)

  const cashflowOperationnel = realRents - totalCharges
  const cashflowEconomique = cashflowOperationnel - creditCostOnly
  const cashflowTresorerie = cashflowOperationnel - creditMensualiteComplete

  const plusValue = property.currentValue - acquisitionCost
  const equityDynamique = property.currentValue - totalCRD

  const grossYield = acquisitionCost > 0 ? (realRents / anneesCouvertes) / acquisitionCost : 0
  const netYieldOperationnel = acquisitionCost > 0 ? (cashflowOperationnel / anneesCouvertes) / acquisitionCost : 0
  const netYieldEconomique = acquisitionCost > 0 ? (cashflowEconomique / anneesCouvertes) / acquisitionCost : 0
  const equityDynamiqueYield = equityDynamique > 0 ? (cashflowEconomique / anneesCouvertes) / equityDynamique : 0
  const tauxEffort = realRents > 0 ? creditMensualiteComplete / realRents : 0

  return {
    acquisitionCost,
    currentValue: property.currentValue,
    totalCRD,
    netValue: property.currentValue - totalCRD,
    plusValue,
    equityDynamique,
    realRents,
    totalCharges,
    creditCostOnly,
    creditMensualiteComplete,
    cashflowOperationnel,
    cashflowEconomique,
    cashflowTresorerie,
    anneesCouvertes,
    grossYield,
    netYieldOperationnel,
    netYieldEconomique,
    equityDynamiqueYield,
    tauxEffort,
  }
}

export function computePortfolioKPI(
  data: AppData,
  period: PeriodFilter,
  referenceDate: string
): PortfolioKPI {
  const empty: PortfolioKPI = {
    acquisitionCost: 0, currentValue: 0, totalCRD: 0, netValue: 0,
    plusValue: 0, equityDynamique: 0,
    realRents: 0, totalCharges: 0,
    creditCostOnly: 0, creditMensualiteComplete: 0,
    cashflowOperationnel: 0, cashflowEconomique: 0, cashflowTresorerie: 0,
    anneesCouvertes: 1,
    grossYield: 0, netYieldOperationnel: 0, netYieldEconomique: 0,
    equityDynamiqueYield: 0, tauxEffort: 0,
    totalCurrentValue: 0, totalNetValue: 0, totalEquity: 0,
  }
  if (data.properties.length === 0) return empty

  const kpis = data.properties.map((p) =>
    computePropertyKPI(p.id, data, period, referenceDate)
  )

  const sum = <K extends keyof import('./types').PropertyKPI>(key: K): number =>
    kpis.reduce((s, k) => s + (k[key] as number), 0)

  const acquisitionCost = sum('acquisitionCost')
  const realRents = sum('realRents')
  const totalCharges = sum('totalCharges')
  const creditCostOnly = sum('creditCostOnly')
  const creditMensualiteComplete = sum('creditMensualiteComplete')
  const cashflowOperationnel = realRents - totalCharges
  const cashflowEconomique = cashflowOperationnel - creditCostOnly
  const cashflowTresorerie = cashflowOperationnel - creditMensualiteComplete
  const totalEquity = data.properties.reduce((s, p) => s + p.equity, 0)
  const totalCurrentValue = sum('currentValue')
  const totalCRD = sum('totalCRD')
  const totalNetValue = totalCurrentValue - totalCRD
  const equityDynamique = totalNetValue
  const plusValue = sum('plusValue')
  const anneesCouvertes = period.mode === 'all' ? Math.max(...kpis.map((k) => k.anneesCouvertes)) : 1

  return {
    acquisitionCost,
    currentValue: totalCurrentValue,
    totalCRD,
    netValue: totalNetValue,
    plusValue,
    equityDynamique,
    realRents,
    totalCharges,
    creditCostOnly,
    creditMensualiteComplete,
    cashflowOperationnel,
    cashflowEconomique,
    cashflowTresorerie,
    anneesCouvertes,
    grossYield: acquisitionCost > 0 ? (realRents / anneesCouvertes) / acquisitionCost : 0,
    netYieldOperationnel: acquisitionCost > 0 ? (cashflowOperationnel / anneesCouvertes) / acquisitionCost : 0,
    netYieldEconomique: acquisitionCost > 0 ? (cashflowEconomique / anneesCouvertes) / acquisitionCost : 0,
    equityDynamiqueYield: equityDynamique > 0 ? (cashflowEconomique / anneesCouvertes) / equityDynamique : 0,
    tauxEffort: realRents > 0 ? creditMensualiteComplete / realRents : 0,
    totalCurrentValue,
    totalNetValue,
    totalEquity,
  }
}
