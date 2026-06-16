import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { type AppData, type Property, type Loan, type LoanScheduleRow, type RentEvent, type ExpenseEvent } from '../domain/types'
import { nanoid } from '../utils/nanoid'

const STORAGE_KEY = 'locatifAppData'

const EMPTY_DATA: AppData = {
  version: 1,
  properties: [],
  loans: [],
  loanSchedules: [],
  rentEvents: [],
  expenseEvents: [],
  snapshots: [],
}

function loadFromStorage(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_DATA
    const parsed = JSON.parse(raw) as AppData
    if (typeof parsed.version !== 'number' || !Array.isArray(parsed.properties)) {
      return EMPTY_DATA
    }
    return { ...EMPTY_DATA, ...parsed }
  } catch {
    return EMPTY_DATA
  }
}

type AppDataContextValue = {
  data: AppData
  addProperty: (p: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProperty: (p: Property) => void
  deleteProperty: (id: string) => void
  addLoan: (l: Omit<Loan, 'id'>) => void
  updateLoan: (l: Loan) => void
  deleteLoan: (id: string) => void
  setLoanSchedule: (loanId: string, rows: LoanScheduleRow[]) => void
  addRentEvent: (e: Omit<RentEvent, 'id'>) => void
  deleteRentEvent: (id: string) => void
  addExpenseEvent: (e: Omit<ExpenseEvent, 'id'>) => void
  deleteExpenseEvent: (id: string) => void
  importData: (d: AppData) => void
  exportData: () => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadFromStorage)

  const persist = useCallback((next: AppData) => {
    setData(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const addProperty = useCallback(
    (p: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString()
      persist({
        ...data,
        properties: [...data.properties, { ...p, id: nanoid(), createdAt: now, updatedAt: now }],
      })
    },
    [data, persist]
  )

  const updateProperty = useCallback(
    (p: Property) => {
      persist({
        ...data,
        properties: data.properties.map((x) =>
          x.id === p.id ? { ...p, updatedAt: new Date().toISOString() } : x
        ),
      })
    },
    [data, persist]
  )

  const deleteProperty = useCallback(
    (id: string) => {
      persist({
        ...data,
        properties: data.properties.filter((p) => p.id !== id),
        loans: data.loans.filter((l) => l.propertyId !== id),
        rentEvents: data.rentEvents.filter((r) => r.propertyId !== id),
        expenseEvents: data.expenseEvents.filter((e) => e.propertyId !== id),
      })
    },
    [data, persist]
  )

  const addLoan = useCallback(
    (l: Omit<Loan, 'id'>) => {
      persist({ ...data, loans: [...data.loans, { ...l, id: nanoid() }] })
    },
    [data, persist]
  )

  const updateLoan = useCallback(
    (l: Loan) => {
      persist({ ...data, loans: data.loans.map((x) => (x.id === l.id ? l : x)) })
    },
    [data, persist]
  )

  const deleteLoan = useCallback(
    (id: string) => {
      persist({
        ...data,
        loans: data.loans.filter((l) => l.id !== id),
        loanSchedules: data.loanSchedules.filter((r) => r.loanId !== id),
      })
    },
    [data, persist]
  )

  const setLoanSchedule = useCallback(
    (loanId: string, rows: LoanScheduleRow[]) => {
      persist({
        ...data,
        loanSchedules: [
          ...data.loanSchedules.filter((r) => r.loanId !== loanId),
          ...rows,
        ],
        loans: data.loans.map((l) => (l.id === loanId ? { ...l, hasSchedule: rows.length > 0 } : l)),
      })
    },
    [data, persist]
  )

  const addRentEvent = useCallback(
    (e: Omit<RentEvent, 'id'>) => {
      persist({ ...data, rentEvents: [...data.rentEvents, { ...e, id: nanoid() }] })
    },
    [data, persist]
  )

  const deleteRentEvent = useCallback(
    (id: string) => {
      persist({ ...data, rentEvents: data.rentEvents.filter((r) => r.id !== id) })
    },
    [data, persist]
  )

  const addExpenseEvent = useCallback(
    (e: Omit<ExpenseEvent, 'id'>) => {
      persist({ ...data, expenseEvents: [...data.expenseEvents, { ...e, id: nanoid() }] })
    },
    [data, persist]
  )

  const deleteExpenseEvent = useCallback(
    (id: string) => {
      persist({ ...data, expenseEvents: data.expenseEvents.filter((e) => e.id !== id) })
    },
    [data, persist]
  )

  const importData = useCallback(
    (d: AppData) => {
      if (typeof d.version !== 'number' || !Array.isArray(d.properties)) {
        alert('Fichier invalide : structure AppData incorrecte')
        return
      }
      persist({ ...EMPTY_DATA, ...d })
    },
    [persist]
  )

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `locatif-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [data])

  return (
    <AppDataContext.Provider
      value={{
        data,
        addProperty,
        updateProperty,
        deleteProperty,
        addLoan,
        updateLoan,
        deleteLoan,
        setLoanSchedule,
        addRentEvent,
        deleteRentEvent,
        addExpenseEvent,
        deleteExpenseEvent,
        importData,
        exportData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
