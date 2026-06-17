import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type AppData, type Property, type Loan, type LoanScheduleRow, type RentEvent, type ExpenseEvent, type ValueHistory } from '../domain/types'
import { type LoanFieldsFromSchedule } from '../domain/csvParser'
import { normalizeDate } from '../domain/csvParser'
import { nanoid } from '../utils/nanoid'

const STORAGE_KEY = 'locatif-tracker-data'

const DEFAULT_DATA: AppData = {
  version: 1,
  properties: [],
  loans: [],
  loanSchedules: [],
  rentEvents: [],
  expenseEvents: [],
  valueHistory: [],
  snapshots: [],
}

/** Migration : zero-pad toutes les dates YYYY-M-D dans loanSchedules + init valueHistory */
function migrateData(raw: AppData): AppData {
  const schedules = raw.loanSchedules ?? []
  const needsMigration = schedules.some((r) => {
    const parts = r.date.split('-')
    return parts.length === 3 && (parts[1].length < 2 || parts[2].length < 2)
  })
  return {
    ...raw,
    valueHistory: raw.valueHistory ?? [],
    snapshots: raw.snapshots ?? [],
    loanSchedules: needsMigration
      ? schedules.map((r) => ({ ...r, date: normalizeDate(r.date) }))
      : schedules,
  }
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_DATA
    const parsed = JSON.parse(raw) as AppData
    return migrateData(parsed)
  } catch {
    return DEFAULT_DATA
  }
}

function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

type AppDataContextValue = {
  data: AppData
  addProperty: (p: Omit<Property, 'id'>) => void
  updateProperty: (p: Property) => void
  deleteProperty: (id: string) => void
  addLoan: (l: Omit<Loan, 'id' | 'hasSchedule'>) => void
  updateLoan: (l: Loan) => void
  deleteLoan: (id: string) => void
  setLoanSchedule: (loanId: string, rows: LoanScheduleRow[], deduced: LoanFieldsFromSchedule) => void
  addRentEvent: (e: Omit<RentEvent, 'id'>) => void
  updateRentEvent: (e: RentEvent) => void
  deleteRentEvent: (id: string) => void
  addRentEvents: (events: RentEvent[]) => void
  addExpenseEvent: (e: Omit<ExpenseEvent, 'id'>) => void
  updateExpenseEvent: (e: ExpenseEvent) => void
  deleteExpenseEvent: (id: string) => void
  addExpenseEvents: (events: ExpenseEvent[]) => void
  addValueHistory: (v: Omit<ValueHistory, 'id'>) => void
  updateValueHistory: (v: ValueHistory) => void
  deleteValueHistory: (id: string) => void
  importData: (data: AppData) => void
  exportData: () => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData)

  useEffect(() => {
    saveData(data)
  }, [data])

  function update(fn: (prev: AppData) => AppData) {
    setData((prev) => fn(prev))
  }

  const addProperty = (p: Omit<Property, 'id'>) =>
    update((d) => ({ ...d, properties: [...d.properties, { ...p, id: nanoid() }] }))

  const updateProperty = (p: Property) =>
    update((d) => ({ ...d, properties: d.properties.map((x) => (x.id === p.id ? p : x)) }))

  const deleteProperty = (id: string) =>
    update((d) => ({
      ...d,
      properties: d.properties.filter((p) => p.id !== id),
      loans: d.loans.filter((l) => l.propertyId !== id),
      loanSchedules: d.loanSchedules.filter(
        (r) => !d.loans.filter((l) => l.propertyId === id).map((l) => l.id).includes(r.loanId)
      ),
      rentEvents: d.rentEvents.filter((e) => e.propertyId !== id),
      expenseEvents: d.expenseEvents.filter((e) => e.propertyId !== id),
      valueHistory: d.valueHistory.filter((v) => v.propertyId !== id),
    }))

  const addLoan = (l: Omit<Loan, 'id' | 'hasSchedule'>) =>
    update((d) => ({ ...d, loans: [...d.loans, { ...l, id: nanoid(), hasSchedule: false }] }))

  const updateLoan = (l: Loan) =>
    update((d) => ({ ...d, loans: d.loans.map((x) => (x.id === l.id ? l : x)) }))

  const deleteLoan = (id: string) =>
    update((d) => ({
      ...d,
      loans: d.loans.filter((l) => l.id !== id),
      loanSchedules: d.loanSchedules.filter((r) => r.loanId !== id),
    }))

  const setLoanSchedule = (loanId: string, rows: LoanScheduleRow[], deduced: LoanFieldsFromSchedule) =>
    update((d) => ({
      ...d,
      loanSchedules: [...d.loanSchedules.filter((r) => r.loanId !== loanId), ...rows],
      loans: d.loans.map((l) =>
        l.id !== loanId
          ? l
          : {
              ...l,
              hasSchedule: true,
              principal: l.principal || deduced.principal,
              startDate: l.startDate || deduced.startDate,
              endDate: l.endDate || deduced.endDate,
              monthlyPayment: l.monthlyPayment || deduced.monthlyPayment,
              rate: l.rate || deduced.rate,
              insuranceRate: l.insuranceRate || deduced.insuranceRate,
            }
      ),
    }))

  const addRentEvent = (e: Omit<RentEvent, 'id'>) =>
    update((d) => ({ ...d, rentEvents: [...d.rentEvents, { ...e, id: nanoid() }] }))

  const updateRentEvent = (e: RentEvent) =>
    update((d) => ({ ...d, rentEvents: d.rentEvents.map((x) => (x.id === e.id ? e : x)) }))

  const deleteRentEvent = (id: string) =>
    update((d) => ({ ...d, rentEvents: d.rentEvents.filter((e) => e.id !== id) }))

  const addRentEvents = (events: RentEvent[]) =>
    update((d) => ({ ...d, rentEvents: [...d.rentEvents, ...events] }))

  const addExpenseEvent = (e: Omit<ExpenseEvent, 'id'>) =>
    update((d) => ({ ...d, expenseEvents: [...d.expenseEvents, { ...e, id: nanoid() }] }))

  const updateExpenseEvent = (e: ExpenseEvent) =>
    update((d) => ({ ...d, expenseEvents: d.expenseEvents.map((x) => (x.id === e.id ? e : x)) }))

  const deleteExpenseEvent = (id: string) =>
    update((d) => ({ ...d, expenseEvents: d.expenseEvents.filter((e) => e.id !== id) }))

  const addExpenseEvents = (events: ExpenseEvent[]) =>
    update((d) => ({ ...d, expenseEvents: [...d.expenseEvents, ...events] }))

  /** ValueHistory — ajoute et met à jour currentValue si c'est le point le plus récent */
  const addValueHistory = (v: Omit<ValueHistory, 'id'>) =>
    update((d) => {
      const entry: ValueHistory = { ...v, id: nanoid() }
      const newHistory = [...d.valueHistory, entry]
      const latestForProperty = newHistory
        .filter((h) => h.propertyId === v.propertyId)
        .sort((a, b) => b.date.localeCompare(a.date))[0]
      const properties = d.properties.map((p) =>
        p.id === v.propertyId
          ? { ...p, currentValue: latestForProperty.value }
          : p
      )
      return { ...d, valueHistory: newHistory, properties }
    })

  const updateValueHistory = (v: ValueHistory) =>
    update((d) => {
      const newHistory = d.valueHistory.map((x) => (x.id === v.id ? v : x))
      const latestForProperty = newHistory
        .filter((h) => h.propertyId === v.propertyId)
        .sort((a, b) => b.date.localeCompare(a.date))[0]
      const properties = latestForProperty
        ? d.properties.map((p) =>
            p.id === v.propertyId ? { ...p, currentValue: latestForProperty.value } : p
          )
        : d.properties
      return { ...d, valueHistory: newHistory, properties }
    })

  const deleteValueHistory = (id: string) =>
    update((d) => {
      const entry = d.valueHistory.find((v) => v.id === id)
      const newHistory = d.valueHistory.filter((v) => v.id !== id)
      if (!entry) return { ...d, valueHistory: newHistory }
      const remaining = newHistory.filter((h) => h.propertyId === entry.propertyId)
      const latest = remaining.sort((a, b) => b.date.localeCompare(a.date))[0]
      const properties = d.properties.map((p) =>
        p.id === entry.propertyId && latest
          ? { ...p, currentValue: latest.value }
          : p
      )
      return { ...d, valueHistory: newHistory, properties }
    })

  const importData = (incoming: AppData) =>
    update(() => migrateData(incoming))

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `locatif-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppDataContext.Provider value={{
      data, addProperty, updateProperty, deleteProperty,
      addLoan, updateLoan, deleteLoan, setLoanSchedule,
      addRentEvent, updateRentEvent, deleteRentEvent, addRentEvents,
      addExpenseEvent, updateExpenseEvent, deleteExpenseEvent, addExpenseEvents,
      addValueHistory, updateValueHistory, deleteValueHistory,
      importData, exportData,
    }}>
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
