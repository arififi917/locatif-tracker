import { type AppData, type PeriodFilter, type PropertyKPI, type PortfolioKPI } from './types'
import { isWithinPeriod, getPeriodBounds } from './period'

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getPeriodDateStrings(period: PeriodFilter): { start: string; end: string } {
  const { start, end } = getPeriodBounds(period)
  return { start: toLocalDateStr(start), end: toLocalDateStr(end) }
}

/**
 * Retourne la borne de début effective pour les calculs de flux :
 * max(début période, rentStartDate) si rentStartDate est défini.
 */
function getEffectiveStart(periodStart: string, rentStartDate?: string): string {
  if (!rentStartDate) return periodStart
  return periodStart < rentStartDate ? rentStartDate : periodStart
}

export function getAcquisitionCost(p: AppData['properties'][0]): number {
  return p.purchasePrice + p.notaryFees + p.agencyFees + p.initialWorks
}

/**
 * Apport réel = coût acquisition − Σ nominaux prêts
 * + capital remboursé sur les échéances antérieures à rentStartDate
 * (mensualités payées sans loyer en face, qui augmentent le vrai apport engagé)
 */
export function getApportReel(propertyId: string, data: AppData): number {
  const property = data.properties.find((p) => p.id === propertyId)!
  const acq = getAcquisitionCost(property)
  const totalPrincipal = data.loans
    .filter((l) => l.propertyId === propertyId)
    .reduce((s, l) => s + l.principal, 0)
  const baseApport = acq - totalPrincipal

  // Capital remboursé avant mise en location
  if (!property.rentStartDate) return baseApport
  const capitalAvantLocation = data.loans
    .filter((l) => l.propertyId === propertyId)
    .reduce((sum, loan) => {
      const rows = data.loanSchedules.filter(
        (r) => r.loanId === loan.id && r.date < property.rentStartDate!
      )
      return sum + rows.reduce((s, r) => s + r.principalPaid, 0)
    }, 0)

  return baseApport + capitalAvantLocation
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
  const property = data.properties.find((p) => p.id === propertyId)!
  const { start: rawStart, end } = getPeriodDateStrings(period)
  const start = getEffectiveStart(rawStart, property.rentStartDate)

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
        e.date >= start && e.date <= end &&
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
  const property = data.properties.find((p) => p.id === propertyId)!
  const { start: rawStart, end } = getPeriodDateStrings(period)
  const start = getEffectiveStart(rawStart, property.rentStartDate)
  const loans = data.loans.filter((l) => l.propertyId === propertyId)

  return loans.reduce((sum, loan) => {
    const rows = data.loanSchedules.filter(
      (r) => r.loanId === loan.id && r.date >= start && r.date <= end
    )
    if (rows.length > 0) {
      return sum + rows.reduce((s, r) => s + r.principalPaid + r.interestPaid + (r.insurancePaid ?? 0), 0)
    }
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
  const property = data.properties.find((p) => p.id === propertyId)!
  return data.rentEvents
    .filter((r) => {
      if (r.propertyId !== propertyId) return false
      if (!isWithinPeriod(r.date, period)) return false
      if (property.rentStartDate && r.date < property.rentStartDate) return false
      return true
    })
    .reduce((sum, r) => sum + r.amount, 0)
}

export function getTotalCharges(
  propertyId: string,
  data: AppData,
  period: PeriodFilter
): number {
  const property = data.properties.find((p) => p.id === propertyId)!
  return data.expenseEvents
    .filter((e) => {
      if (e.propertyId !== propertyId) return false
      if (!isWithinPeriod(e.date, period)) return false
      if (e.category === 'assurance_emprunteur') return false
      if (property.rentStartDate && e.date < property.rentStartDate) return false
      return true
    })
    .reduce((sum, e) => sum + e.amount, 0)
}

export function getAnneesCouvertes(
  propertyId: string,
  data: AppData,
  period: PeriodFilter
): number {
  if (period.mode === 'year' || period.mode === 'rolling_12m') return 1

  const property = data.properties.find((p) => p.id === propertyId)!
  const minDate = property.rentStartDate

  const dates: string[] = [
    ...data.rentEvents
      .filter((r) => r.propertyId === propertyId)
      .map((r) => r.date),
    ...data.expenseEvents
      .filter((e) => e.propertyId === propertyId && e.category !== 'assurance_emprunteur')
      .map((e) => e.date),
    ...data.loans
      .filter((l) => l.propertyId === propertyId)
      .flatMap((loan) =>
        data.loanSchedules
          .filter((r) => r.loanId === loan.id)
          .map((r) => r.date)
      ),
  ].filter((d) => !minDate || d >= minDate)

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
  const apportReel = getApportReel(propertyId, data)
  const totalCRD = getTotalCRD(propertyId, data, referenceDate)
  const realRents = getRealRents(propertyId, data, period)
  const totalCharges = getTotalCharges(propertyId, data, period)
  const creditCostOnly = getCreditCostOnly(propertyId, data, period)
  const creditMensualiteComplete = getCreditMensualiteComplete(propertyId, data, period)
  const anneesCouvertes = getAnneesCouvertes(propertyId, data, period)

  const cashflowOperationnel = realRents - totalCharges
  const cashflowEconomique = cashflowOperationnel - creditCostOnly
  const cashflowTresorerie = cashflowOperationnel - creditMensualiteComplete
  const cashflowNet = cashflowTresorerie

  const plusValue = property.currentValue - acquisitionCost
  const equityDynamique = property.currentValue - totalCRD

  const cfNetAnnualise = cashflowNet / anneesCouvertes

  const grossYield = acquisitionCost > 0 ? (realRents / anneesCouvertes) / acquisitionCost : 0
  const netYield = acquisitionCost > 0 ? cfNetAnnualise / acquisitionCost : 0
  const equityNetYield = equityDynamique > 0 ? cfNetAnnualise / equityDynamique : 0
  const cashOnCash = apportReel > 0 ? cfNetAnnualise / apportReel : 0

  const netYieldOperationnel = acquisitionCost > 0 ? (cashflowOperationnel / anneesCouvertes) / acquisitionCost : 0
  const netYieldEconomique = acquisitionCost > 0 ? (cashflowEconomique / anneesCouvertes) / acquisitionCost : 0
  const equityDynamiqueYield = equityDynamique > 0 ? (cashflowEconomique / anneesCouvertes) / equityDynamique : 0
  const tauxEffort = realRents > 0 ? creditMensualiteComplete / realRents : 0

  return {
    acquisitionCost,
    apportReel,
    currentValue: property.currentValue,
    totalCRD,
    netValue: property.currentValue - totalCRD,
    plusValue,
    equityDynamique,
    realRents,
    totalCharges,
    creditCostOnly,
    creditMensualiteComplete,
    cashflowNet,
    cashflowOperationnel,
    cashflowEconomique,
    cashflowTresorerie,
    anneesCouvertes,
    grossYield,
    netYield,
    equityNetYield,
    cashOnCash,
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
    acquisitionCost: 0, apportReel: 0, currentValue: 0, totalCRD: 0, netValue: 0,
    plusValue: 0, equityDynamique: 0,
    realRents: 0, totalCharges: 0,
    creditCostOnly: 0, creditMensualiteComplete: 0,
    cashflowNet: 0, cashflowOperationnel: 0, cashflowEconomique: 0, cashflowTresorerie: 0,
    anneesCouvertes: 1,
    grossYield: 0, netYield: 0, equityNetYield: 0, cashOnCash: 0,
    netYieldOperationnel: 0, netYieldEconomique: 0,
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
  const apportReel = sum('apportReel')
  const realRents = sum('realRents')
  const totalCharges = sum('totalCharges')
  const creditCostOnly = sum('creditCostOnly')
  const creditMensualiteComplete = sum('creditMensualiteComplete')
  const cashflowOperationnel = realRents - totalCharges
  const cashflowEconomique = cashflowOperationnel - creditCostOnly
  const cashflowTresorerie = cashflowOperationnel - creditMensualiteComplete
  const cashflowNet = cashflowTresorerie
  const totalEquity = data.properties.reduce((s, p) => s + p.equity, 0)
  const totalCurrentValue = sum('currentValue')
  const totalCRD = sum('totalCRD')
  const totalNetValue = totalCurrentValue - totalCRD
  const equityDynamique = totalNetValue
  const plusValue = sum('plusValue')
  const anneesCouvertes = period.mode === 'all' ? Math.max(...kpis.map((k) => k.anneesCouvertes)) : 1

  const cfNetAnnualise = cashflowNet / anneesCouvertes

  return {
    acquisitionCost,
    apportReel,
    currentValue: totalCurrentValue,
    totalCRD,
    netValue: totalNetValue,
    plusValue,
    equityDynamique,
    realRents,
    totalCharges,
    creditCostOnly,
    creditMensualiteComplete,
    cashflowNet,
    cashflowOperationnel,
    cashflowEconomique,
    cashflowTresorerie,
    anneesCouvertes,
    grossYield: acquisitionCost > 0 ? (realRents / anneesCouvertes) / acquisitionCost : 0,
    netYield: acquisitionCost > 0 ? cfNetAnnualise / acquisitionCost : 0,
    equityNetYield: equityDynamique > 0 ? cfNetAnnualise / equityDynamique : 0,
    cashOnCash: apportReel > 0 ? cfNetAnnualise / apportReel : 0,
    netYieldOperationnel: acquisitionCost > 0 ? (cashflowOperationnel / anneesCouvertes) / acquisitionCost : 0,
    netYieldEconomique: acquisitionCost > 0 ? (cashflowEconomique / anneesCouvertes) / acquisitionCost : 0,
    equityDynamiqueYield: equityDynamique > 0 ? (cashflowEconomique / anneesCouvertes) / equityDynamique : 0,
    tauxEffort: realRents > 0 ? creditMensualiteComplete / realRents : 0,
    totalCurrentValue,
    totalNetValue,
    totalEquity,
  }
}
