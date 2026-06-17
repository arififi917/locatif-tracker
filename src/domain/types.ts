export type Property = {
  id: string
  name: string
  location?: string
  purchasePrice: number
  notaryFees: number
  agencyFees: number
  initialWorks: number
  equity: number
  currentValue: number
  rentStartDate?: string
  createdAt: string
  updatedAt: string
}

export type Loan = {
  id: string
  propertyId: string
  name: string
  lender?: string
  principal: number
  startDate: string
  endDate?: string
  rate: number
  insuranceRate?: number
  monthlyPayment?: number
  hasSchedule: boolean
}

export type LoanScheduleRow = {
  id: string
  loanId: string
  date: string
  paymentNumber: number
  paymentAmount: number
  principalPaid: number
  interestPaid: number
  insurancePaid?: number
  remainingPrincipal: number
}

export type RentEvent = {
  id: string
  propertyId: string
  date: string
  /** Montant total encaissé */
  amount: number
  label: string
  rentHC?: number
  chargesReceived?: number
  managementFees?: number
}

export type ExpenseEvent = {
  id: string
  propertyId: string
  date: string
  amount: number
  label: string
  category: string
  isRecoverable: boolean
}

export type ValueHistory = {
  id: string
  propertyId: string
  date: string
  value: number
  note?: string
}

export type PropertySnapshot = {
  id: string
  propertyId: string
  date: string
  currentValue: number
  totalCRD: number
  annualRent: number
  annualCharges: number
  annualCreditCost: number
  cashflowBeforeDebt: number
  cashflowAfterDebt: number
  grossYield: number
  netYieldBeforeDebt: number
  netYieldAfterDebt: number
  equityYield: number
}

export type AppData = {
  version: number
  properties: Property[]
  loans: Loan[]
  loanSchedules: LoanScheduleRow[]
  rentEvents: RentEvent[]
  expenseEvents: ExpenseEvent[]
  valueHistory: ValueHistory[]
  snapshots: PropertySnapshot[]
}

export type PeriodMode = 'year' | 'rolling_12m' | 'all'

export type PeriodFilter = {
  mode: PeriodMode
  year?: number
  referenceDate?: string
}

export type PropertyKPI = {
  acquisitionCost: number
  apportReel: number
  currentValue: number
  totalCRD: number
  netValue: number
  plusValue: number
  equityDynamique: number
  realRents: number
  totalCharges: number
  creditCostOnly: number
  creditMensualiteComplete: number
  cashflowNet: number
  cashflowOperationnel: number
  cashflowEconomique: number
  cashflowTresorerie: number
  anneesCouvertes: number
  grossYield: number
  netYield: number
  equityNetYield: number
  cashOnCash: number
  netYieldOperationnel: number
  netYieldEconomique: number
  equityDynamiqueYield: number
  tauxEffort: number
}

export type PortfolioKPI = PropertyKPI & {
  totalCurrentValue: number
  totalNetValue: number
  totalEquity: number
}

export const EXPENSE_CATEGORIES = [
  'charges',
  'taxe_fonciere',
  'assurance',
  'assurance_emprunteur',
  'travaux',
  'gestion',
  'divers',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
