import { useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { parseLoanScheduleCSV } from '../../domain/csvParser'
import { Modal } from '../ui/Modal'
import { type Loan } from '../../domain/types'

type Props = {
  loan: Loan
  onClose: () => void
}

export function LoanScheduleImport({ loan, onClose }: Props) {
  const { setLoanSchedule } = useAppData()
  const [errors, setErrors] = useState<string[]>([])
  const [preview, setPreview] = useState<number | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { rows, errors: errs } = parseLoanScheduleCSV(text, loan.id)
      if (errs.length > 0) {
        setErrors(errs)
        setPreview(null)
      } else {
        setErrors([])
        setPreview(rows.length)
        setLoanSchedule(loan.id, rows)
        setTimeout(onClose, 800)
      }
    }
    reader.readAsText(file)
  }

  return (
    <Modal title={`Importer TA — ${loan.name}`} onClose={onClose}>
      <p style={{ marginBottom: 16, color: 'var(--color-text-muted)', fontSize: 13 }}>
        CSV attendu avec colonnes :{' '}
        <code>date, paymentNumber, paymentAmount, principalPaid, interestPaid, insurancePaid, remainingPrincipal</code>
      </p>
      <input type="file" accept=".csv" onChange={handleFile} className="form-input" style={{ marginBottom: 12 }} />
      {errors.length > 0 && (
        <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>
          {errors.map((e, i) => <div key={i}>⚠ {e}</div>)}
        </div>
      )}
      {preview !== null && (
        <div style={{ color: 'var(--color-success)', fontSize: 13 }}>
          ✓ {preview} lignes importées avec succès
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn btn-secondary" onClick={onClose}>Fermer</button>
      </div>
    </Modal>
  )
}
