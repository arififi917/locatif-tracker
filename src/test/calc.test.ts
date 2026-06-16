import { describe, it, expect } from 'vitest'
import { getAcquisitionCost, computePropertyKPI, computePortfolioKPI } from '../domain/calc'
import { type AppData, type Property } from '../domain/types'

const property: Property = {
  id: 'p1',
  name: 'Appart Paris 11',
  location: 'Paris',
  purchasePrice: 200000,
  notaryFees: 16000,
  agencyFees: 4000,
  initialWorks: 10000,
  equity: 50000,
  currentValue: 240000,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
}

const mockData: AppData = {
  version: 1,
  properties: [property],
  loans: [],
  loanSchedules: [],
  rentEvents: [
    { id: 'r1', propertyId: 'p1', date: '2024-03-01', amount: 1000, label: 'Loyer mars' },
    { id: 'r2', propertyId: 'p1', date: '2024-06-01', amount: 1000, label: 'Loyer juin' },
    { id: 'r3', propertyId: 'p1', date: '2025-01-01', amount: 1000, label: 'Loyer jan 2025' }, // hors période
  ],
  expenseEvents: [
    { id: 'e1', propertyId: 'p1', date: '2024-02-01', amount: 500, label: 'TF', category: 'taxe_fonciere', isRecoverable: false },
    { id: 'e2', propertyId: 'p1', date: '2024-04-01', amount: 200, label: 'Assurance', category: 'assurance', isRecoverable: false },
    { id: 'e3', propertyId: 'p1', date: '2024-05-01', amount: 100, label: 'Charge récup', category: 'charges', isRecoverable: true },
  ],
  snapshots: [],
}

const period2024 = { mode: 'year' as const, year: 2024 }
const refDate = '2024-12-31'

describe('getAcquisitionCost', () => {
  it('calcule le coût total acquisition', () => {
    expect(getAcquisitionCost(property)).toBe(230000)
  })
})

describe('computePropertyKPI', () => {
  it('calcule les loyers filtrés sur 2024', () => {
    const kpi = computePropertyKPI('p1', mockData, period2024, refDate)
    expect(kpi.realRents).toBe(2000)
  })

  it('calcule les charges non récupérables (hors crédit et récup)', () => {
    const kpi = computePropertyKPI('p1', mockData, period2024, refDate)
    expect(kpi.nonRecoverableCharges).toBe(700) // TF 500 + Assurance 200
  })

  it('calcule le cashflow avant dette', () => {
    const kpi = computePropertyKPI('p1', mockData, period2024, refDate)
    expect(kpi.cashflowBeforeDebt).toBe(1300) // 2000 - 700
  })

  it('calcule le rendement brut', () => {
    const kpi = computePropertyKPI('p1', mockData, period2024, refDate)
    expect(kpi.grossYield).toBeCloseTo(2000 / 230000, 6)
  })

  it('rendement fonds propres = 0 si equity = 0', () => {
    const dataNoEquity: AppData = {
      ...mockData,
      properties: [{ ...property, equity: 0 }],
    }
    const kpi = computePropertyKPI('p1', dataNoEquity, period2024, refDate)
    expect(kpi.equityYield).toBe(0)
  })
})

describe('computePortfolioKPI', () => {
  it('retourne des zéros si portefeuille vide', () => {
    const emptyData: AppData = { ...mockData, properties: [] }
    const kpi = computePortfolioKPI(emptyData, period2024, refDate)
    expect(kpi.totalCurrentValue).toBe(0)
    expect(kpi.grossYield).toBe(0)
  })

  it('agrège les KPI du portefeuille', () => {
    const kpi = computePortfolioKPI(mockData, period2024, refDate)
    expect(kpi.realRents).toBe(2000)
    expect(kpi.totalCurrentValue).toBe(240000)
  })
})
