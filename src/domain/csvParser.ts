import Papa from 'papaparse'
import { type LoanScheduleRow, type RentEvent, type ExpenseEvent, EXPENSE_CATEGORIES } from './types'
import { nanoid } from '../utils/nanoid'

type RawRow = Record<string, string>

// ─────────────────────────────────────────────────────────────────────────────
// PRÊTS
// ─────────────────────────────────────────────────────────────────────────────

const LOAN_REQUIRED = [
  'date',
  'paymentNumber',
  'paymentAmount',
  'principalPaid',
  'interestPaid',
  'remainingPrincipal',
]

export type LoanFieldsFromSchedule = {
  principal: number
  startDate: string
  endDate: string
  durationMonths: number
  monthlyPayment: number
  rate: number
  insuranceRate: number | undefined
  hasInsurance: boolean
}

export function parseLoanScheduleCSV(
  csvText: string,
  loanId: string
): { rows: LoanScheduleRow[]; deduced: LoanFieldsFromSchedule | null; errors: string[] } {
  const result = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
  })

  const errors: string[] = []
  const headers = result.meta.fields ?? []
  const missing = LOAN_REQUIRED.filter((c) => !headers.includes(c))
  if (missing.length > 0) {
    errors.push(`Colonnes manquantes : ${missing.join(', ')}`)
    return { rows: [], deduced: null, errors }
  }

  const hasInsurance = headers.includes('insurancePaid')

  const rows: LoanScheduleRow[] = result.data.map((raw, idx) => {
    const row: LoanScheduleRow = {
      id: nanoid(),
      loanId,
      date: raw['date']?.trim() ?? '',
      paymentNumber: parseInt(raw['paymentNumber'] ?? '0', 10),
      paymentAmount: parseFloat(raw['paymentAmount'] ?? '0'),
      principalPaid: parseFloat(raw['principalPaid'] ?? '0'),
      interestPaid: parseFloat(raw['interestPaid'] ?? '0'),
      insurancePaid:
        hasInsurance && raw['insurancePaid']?.trim()
          ? parseFloat(raw['insurancePaid'])
          : undefined,
      remainingPrincipal: parseFloat(raw['remainingPrincipal'] ?? '0'),
    }
    if (!row.date) errors.push(`Ligne ${idx + 2} : date manquante`)
    return row
  })

  if (errors.length > 0) return { rows: [], deduced: null, errors }

  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const principal = first.remainingPrincipal + first.principalPaid
  const rate =
    principal > 0
      ? parseFloat(((first.interestPaid / principal) * 12 * 100).toFixed(3))
      : 0
  const insuranceRate =
    hasInsurance && first.insurancePaid != null && principal > 0
      ? parseFloat(((first.insurancePaid / principal) * 12 * 100).toFixed(3))
      : undefined
  const payments = sorted
    .map((r) => r.principalPaid + r.interestPaid)
    .sort((a, b) => a - b)
  const mid = Math.floor(payments.length / 2)
  const monthlyPayment =
    payments.length % 2 === 0
      ? parseFloat(((payments[mid - 1] + payments[mid]) / 2).toFixed(2))
      : parseFloat(payments[mid].toFixed(2))

  return {
    rows,
    deduced: {
      principal: parseFloat(principal.toFixed(2)),
      startDate: first.date,
      endDate: last.date,
      durationMonths: sorted.length,
      monthlyPayment,
      rate,
      insuranceRate,
      hasInsurance,
    },
    errors: [],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOYERS
//
// Format CSV (séparateur "," ou ";" auto-détecté) :
//
//   date,propertyId,amount,label,chargesReceived,managementFees
//
// • date             YYYY-MM-DD                            obligatoire
// • propertyId       id du bien                            obligatoire
// • amount           décimal, peut être négatif (régul)   obligatoire
// • label            texte libre                           optionnel
//                    défaut : "Loyer" ou "Régularisation"
// • chargesReceived  provisions charges locataire          optionnel
// • managementFees   frais de gestion (valeur absolue)     optionnel
//
// rentHC est déduit automatiquement :
//   rentHC = amount - (chargesReceived ?? 0) + (managementFees ?? 0)
// ─────────────────────────────────────────────────────────────────────────────

const RENT_REQUIRED = ['date', 'propertyId', 'amount']

/** rentHC = amount encaissé - charges reçues + frais de gestion récupérés */
export function deriveRentHC(amount: number, chargesReceived?: number, managementFees?: number): number {
  return amount - (chargesReceived ?? 0) + (managementFees ?? 0)
}

export function parseRentCSV(
  csvText: string
): { rows: RentEvent[]; errors: string[] } {
  const result = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
    delimiter: csvText.includes(';') && !csvText.includes(',') ? ';' : ',',
  })

  const errors: string[] = []
  const headers = result.meta.fields ?? []
  const missing = RENT_REQUIRED.filter((c) => !headers.includes(c))
  if (missing.length > 0) {
    errors.push(`Colonnes manquantes : ${missing.join(', ')}`)
    return { rows: [], errors }
  }

  const rows: RentEvent[] = []

  result.data.forEach((raw, idx) => {
    const lineNum = idx + 2
    const date = raw['date']?.trim() ?? ''
    const propertyId = raw['propertyId']?.trim() ?? ''
    const rawAmount = raw['amount']?.trim().replace(',', '.') ?? ''
    const amount = parseFloat(rawAmount)

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(`Ligne ${lineNum} : date invalide (attendu YYYY-MM-DD)`)
      return
    }
    if (!propertyId) {
      errors.push(`Ligne ${lineNum} : propertyId manquant`)
      return
    }
    if (isNaN(amount)) {
      errors.push(`Ligne ${lineNum} : amount invalide`)
      return
    }

    const parseOpt = (key: string): number | undefined => {
      const v = raw[key]?.trim().replace(',', '.')
      if (!v) return undefined
      const n = parseFloat(v)
      return isNaN(n) ? undefined : n
    }

    const chargesReceived = parseOpt('chargesReceived')
    const managementFees = parseOpt('managementFees')

    rows.push({
      id: nanoid(),
      propertyId,
      date,
      amount,
      label: raw['label']?.trim() || (amount < 0 ? 'Régularisation' : 'Loyer'),
      // rentHC déduit : loyer HC = encaissement total - charges perçues + frais gestion
      rentHC: deriveRentHC(amount, chargesReceived, managementFees),
      chargesReceived,
      managementFees,
    })
  })

  return { rows, errors }
}

// ─────────────────────────────────────────────────────────────────────────────
// DÉPENSES
//
// Format CSV :
//
//   date,propertyId,category,amount,label
//
// • date        YYYY-MM-DD                              obligatoire
// • propertyId  id du bien                             obligatoire
// • category    charges | taxe_fonciere | assurance |  obligatoire
//               travaux | gestion | divers
// • amount      décimal positif                        obligatoire
// • label       texte libre                            optionnel
// ─────────────────────────────────────────────────────────────────────────────

const EXPENSE_REQUIRED = ['date', 'propertyId', 'category', 'amount']

export function parseExpenseCSV(
  csvText: string
): { rows: ExpenseEvent[]; errors: string[] } {
  const result = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
    delimiter: csvText.includes(';') && !csvText.includes(',') ? ';' : ',',
  })

  const errors: string[] = []
  const headers = result.meta.fields ?? []
  const missing = EXPENSE_REQUIRED.filter((c) => !headers.includes(c))
  if (missing.length > 0) {
    errors.push(`Colonnes manquantes : ${missing.join(', ')}`)
    return { rows: [], errors }
  }

  const validCategories = EXPENSE_CATEGORIES as readonly string[]
  const rows: ExpenseEvent[] = []

  result.data.forEach((raw, idx) => {
    const lineNum = idx + 2
    const date = raw['date']?.trim() ?? ''
    const propertyId = raw['propertyId']?.trim() ?? ''
    const category = raw['category']?.trim() ?? ''
    const rawAmount = raw['amount']?.trim().replace(',', '.') ?? ''
    const amount = parseFloat(rawAmount)

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(`Ligne ${lineNum} : date invalide (attendu YYYY-MM-DD)`)
      return
    }
    if (!propertyId) {
      errors.push(`Ligne ${lineNum} : propertyId manquant`)
      return
    }
    if (!validCategories.includes(category)) {
      errors.push(
        `Ligne ${lineNum} : catégorie "${category}" inconnue — valeurs acceptées : ${validCategories.join(', ')}`
      )
      return
    }
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Ligne ${lineNum} : amount doit être un nombre positif`)
      return
    }

    rows.push({
      id: nanoid(),
      propertyId,
      date,
      amount,
      label: raw['label']?.trim() || category,
      category,
      isRecoverable: false,
    })
  })

  return { rows, errors }
}
