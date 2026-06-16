import Papa from 'papaparse'
import { type LoanScheduleRow } from './types'
import { nanoid } from '../utils/nanoid'

type RawRow = Record<string, string>

const REQUIRED_COLUMNS = [
  'date',
  'paymentNumber',
  'paymentAmount',
  'principalPaid',
  'interestPaid',
  'remainingPrincipal',
]

/** Champs du prêt déductibles depuis le tableau d'amortissement */
export type LoanFieldsFromSchedule = {
  /** Capital initial = remainingPrincipal ligne 1 + principalPaid ligne 1 */
  principal: number
  /** Date de début = date de la première échéance */
  startDate: string
  /** Date de fin = date de la dernière échéance */
  endDate: string
  /** Durée en mois */
  durationMonths: number
  /** Mensualité médiane (hors assurance) */
  monthlyPayment: number
  /** Taux nominal annuel déduit (intérêts / CRD début * 12) */
  rate: number
  /** Taux assurance annuel déduit si insurancePaid présent */
  insuranceRate: number | undefined
  /** Présence de la colonne insurancePaid dans le CSV */
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
  const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c))
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
      insurancePaid: hasInsurance && raw['insurancePaid']?.trim()
        ? parseFloat(raw['insurancePaid'])
        : undefined,
      remainingPrincipal: parseFloat(raw['remainingPrincipal'] ?? '0'),
    }
    if (!row.date) errors.push(`Ligne ${idx + 2} : date manquante`)
    return row
  })

  if (errors.length > 0) return { rows: [], deduced: null, errors }

  // ── Déduction des champs du prêt ─────────────────────────────────────────
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  // Capital initial = CRD avant la 1ère échéance = CRD_après + principal remboursé
  const principal = first.remainingPrincipal + first.principalPaid

  // Taux nominal annuel : intérêts ligne 1 / capital initial * 12
  const rate = principal > 0
    ? parseFloat(((first.interestPaid / principal) * 12 * 100).toFixed(3))
    : 0

  // Taux assurance annuel : assurance ligne 1 / capital initial * 12
  const insuranceRate = hasInsurance && first.insurancePaid != null && principal > 0
    ? parseFloat(((first.insurancePaid / principal) * 12 * 100).toFixed(3))
    : undefined

  // Mensualité médiane (capital + intérêts, hors assurance) pour être robuste aux paliers
  const payments = sorted.map((r) => r.principalPaid + r.interestPaid).sort((a, b) => a - b)
  const mid = Math.floor(payments.length / 2)
  const monthlyPayment = payments.length % 2 === 0
    ? parseFloat(((payments[mid - 1] + payments[mid]) / 2).toFixed(2))
    : parseFloat(payments[mid].toFixed(2))

  const deduced: LoanFieldsFromSchedule = {
    principal: parseFloat(principal.toFixed(2)),
    startDate: first.date,
    endDate: last.date,
    durationMonths: sorted.length,
    monthlyPayment,
    rate,
    insuranceRate,
    hasInsurance,
  }

  return { rows, deduced, errors: [] }
}
