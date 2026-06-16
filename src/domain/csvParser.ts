import Papa from 'papaparse'
import { type LoanScheduleRow } from './types'
import { nanoid } from '../utils/nanoid'

type RawRow = Record<string, string>

const EXPECTED_COLUMNS = [
  'date',
  'paymentNumber',
  'paymentAmount',
  'principalPaid',
  'interestPaid',
  'insurancePaid',
  'remainingPrincipal',
]

export function parseLoanScheduleCSV(
  csvText: string,
  loanId: string
): { rows: LoanScheduleRow[]; errors: string[] } {
  const result = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  const errors: string[] = []
  const headers = result.meta.fields ?? []
  const missing = EXPECTED_COLUMNS.filter((c) => !headers.includes(c) && c !== 'insurancePaid')
  if (missing.length > 0) {
    errors.push(`Colonnes manquantes : ${missing.join(', ')}`)
    return { rows: [], errors }
  }

  const rows: LoanScheduleRow[] = result.data.map((raw, idx) => {
    const row: LoanScheduleRow = {
      id: nanoid(),
      loanId,
      date: raw['date']?.trim() ?? '',
      paymentNumber: parseInt(raw['paymentNumber'] ?? '0', 10),
      paymentAmount: parseFloat(raw['paymentAmount'] ?? '0'),
      principalPaid: parseFloat(raw['principalPaid'] ?? '0'),
      interestPaid: parseFloat(raw['interestPaid'] ?? '0'),
      insurancePaid: raw['insurancePaid'] ? parseFloat(raw['insurancePaid']) : undefined,
      remainingPrincipal: parseFloat(raw['remainingPrincipal'] ?? '0'),
    }
    if (!row.date) errors.push(`Ligne ${idx + 2}: date manquante`)
    return row
  })

  return { rows, errors }
}
