import Papa from 'papaparse'
import { type LoanScheduleRow, type RentEvent, type ExpenseEvent, type Property } from './types'
import { nanoid } from '../utils/nanoid'

type RawRow = Record<string, string>

/**
 * Normalise une date en YYYY-MM-DD strict (zero-pad mois et jour).
 * Accepte YYYY-M-D, YYYY-MM-D, YYYY-M-DD, YYYY-MM-DD.
 */
export function normalizeDate(raw: string): string {
  const trimmed = raw.trim()
  const parts = trimmed.split('-')
  if (parts.length === 3) {
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
  }
  return trimmed
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRE : résolution propertyId
// ─────────────────────────────────────────────────────────────────────────────

function resolvePropertyId(
  raw: string,
  properties: Property[],
): { id: string } | { error: string } {
  if (!raw) return { error: 'propertyId manquant' }
  const byId = properties.find((p) => p.id === raw)
  if (byId) return { id: byId.id }
  const lower = raw.toLowerCase()
  const byName = properties.find((p) => p.name.toLowerCase() === lower)
  if (byName) return { id: byName.id }
  return { error: `bien "${raw}" introuvable (ni par ID ni par nom)` }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPPING CODES CATÉGORIE
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_CODE_MAP: Record<string, string> = {
  COPR: 'Charge copropriété',
  ELEC: 'Électricité',
  GAZ: 'Gaz',
  EAU: 'Eau',
  ASSU: 'Assurance PNO',
  INTT: 'Internet',
  TAXE: 'Taxe',
  TRAV: 'Travaux',
  GEST: 'Gestion',
  TRAN: 'Transport',
  CPTA: 'Comptabilité',
  MOBL: 'Mobilier',
  DVRS: 'Autres',
}

/** Résout un code court (ex: "COPR") ou passe la valeur telle quelle si inconnue. */
function resolveCategory(raw: string): string {
  return CATEGORY_CODE_MAP[raw.toUpperCase()] ?? raw
}

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
      date: normalizeDate(raw['date'] ?? ''),
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
// ─────────────────────────────────────────────────────────────────────────────

const RENT_REQUIRED = ['date', 'propertyId', 'amount']

/** rentHC = amount encaissé - charges reçues + frais de gestion récupérés */
export function deriveRentHC(amount: number, chargesReceived?: number, managementFees?: number): number {
  return amount - (chargesReceived ?? 0) + (managementFees ?? 0)
}

export function parseRentCSV(
  csvText: string,
  properties: Property[],
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
    const rawPropertyId = raw['propertyId']?.trim() ?? ''
    const rawAmount = raw['amount']?.trim().replace(',', '.') ?? ''
    const amount = parseFloat(rawAmount)

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(`Ligne ${lineNum} : date invalide (attendu YYYY-MM-DD)`)
      return
    }
    if (isNaN(amount)) {
      errors.push(`Ligne ${lineNum} : amount invalide`)
      return
    }

    const resolved = resolvePropertyId(rawPropertyId, properties)
    if ('error' in resolved) {
      errors.push(`Ligne ${lineNum} : ${resolved.error}`)
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
      propertyId: resolved.id,
      date,
      amount,
      label: raw['label']?.trim() || '',
      rentHC: deriveRentHC(amount, chargesReceived, managementFees),
      chargesReceived,
      managementFees,
    })
  })

  return { rows, errors }
}

// ─────────────────────────────────────────────────────────────────────────────
// DÉPENSES
// ─────────────────────────────────────────────────────────────────────────────

const EXPENSE_REQUIRED = ['date', 'propertyId', 'category', 'amount']

export function parseExpenseCSV(
  csvText: string,
  properties: Property[],
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

  const rows: ExpenseEvent[] = []

  result.data.forEach((raw, idx) => {
    const lineNum = idx + 2
    const date = raw['date']?.trim() ?? ''
    const rawPropertyId = raw['propertyId']?.trim() ?? ''
    const rawCategory = raw['category']?.trim() ?? ''
    const category = resolveCategory(rawCategory)
    const rawAmount = raw['amount']?.trim().replace(',', '.') ?? ''
    const amount = parseFloat(rawAmount)

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(`Ligne ${lineNum} : date invalide (attendu YYYY-MM-DD)`)
      return
    }
    if (!rawCategory) {
      errors.push(`Ligne ${lineNum} : category manquante`)
      return
    }
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Ligne ${lineNum} : amount doit être un nombre positif`)
      return
    }

    const resolved = resolvePropertyId(rawPropertyId, properties)
    if ('error' in resolved) {
      errors.push(`Ligne ${lineNum} : ${resolved.error}`)
      return
    }

    rows.push({
      id: nanoid(),
      propertyId: resolved.id,
      date,
      amount,
      label: raw['label']?.trim() || '',
      category,
      isRecoverable: false,
    })
  })

  return { rows, errors }
}
