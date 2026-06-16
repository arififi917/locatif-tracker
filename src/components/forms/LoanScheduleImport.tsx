import { useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { parseLoanScheduleCSV, type LoanFieldsFromSchedule } from '../../domain/csvParser'
import { Modal } from '../ui/Modal'
import { type Loan } from '../../domain/types'
import { formatCurrency, formatDate } from '../../utils/format'

type Props = {
  loan: Loan
  onClose: () => void
}

type ParseResult = {
  rowCount: number
  deduced: LoanFieldsFromSchedule
  rows: ReturnType<typeof parseLoanScheduleCSV>['rows']
}

/** Indique si un champ du prêt existant sera écrasé (valeur non nulle) */
function willOverride(current: number | string | undefined, next: number | string | undefined): boolean {
  if (next == null) return false
  if (typeof current === 'number') return current !== 0
  if (typeof current === 'string') return current.trim() !== ''
  return false
}

export function LoanScheduleImport({ loan, onClose }: Props) {
  const { setLoanSchedule } = useAppData()
  const [errors, setErrors] = useState<string[]>([])
  const [parsed, setParsed] = useState<ParseResult | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParsed(null)
    setErrors([])
    setConfirmed(false)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { rows, deduced, errors: errs } = parseLoanScheduleCSV(text, loan.id)
      if (errs.length > 0) {
        setErrors(errs)
      } else if (deduced) {
        setParsed({ rowCount: rows.length, deduced, rows })
      }
    }
    reader.readAsText(file)
  }

  function handleConfirm() {
    if (!parsed) return
    setLoanSchedule(loan.id, parsed.rows, parsed.deduced)
    setConfirmed(true)
    setTimeout(onClose, 900)
  }

  const d = parsed?.deduced

  // Champs qui seront patchés (valeur actuelle vide) vs ignorés (déjà renseignés)
  const fields: { label: string; deduced: string; current: string | number | undefined; willPatch: boolean }[] = d
    ? [
        {
          label: 'Capital initial',
          deduced: formatCurrency(d.principal),
          current: loan.principal,
          willPatch: !loan.principal || loan.principal === 0,
        },
        {
          label: 'Date début',
          deduced: formatDate(d.startDate),
          current: loan.startDate,
          willPatch: !loan.startDate,
        },
        {
          label: 'Date fin',
          deduced: formatDate(d.endDate),
          current: loan.endDate,
          willPatch: !loan.endDate,
        },
        {
          label: 'Durée',
          deduced: `${d.durationMonths} mois`,
          current: undefined,
          willPatch: false, // informationnel uniquement
        },
        {
          label: 'Mensualité (hors assurance)',
          deduced: formatCurrency(d.monthlyPayment),
          current: loan.monthlyPayment,
          willPatch: !loan.monthlyPayment || loan.monthlyPayment === 0,
        },
        {
          label: 'Taux nominal (%)',
          deduced: `${d.rate} %`,
          current: loan.rate,
          willPatch: !loan.rate || loan.rate === 0,
        },
        ...(d.hasInsurance
          ? [
              {
                label: 'Taux assurance (%)',
                deduced: `${d.insuranceRate ?? '—'} %`,
                current: loan.insuranceRate,
                willPatch: !loan.insuranceRate || loan.insuranceRate === 0,
              },
            ]
          : []),
      ]
    : []

  const patchCount = fields.filter((f) => f.willPatch).length
  const overrideCount = fields.filter(
    (f) => f.current !== undefined && willOverride(f.current, d?.principal)
  ).length

  return (
    <Modal title={`Importer TA — ${loan.name}`} onClose={onClose}>
      <p style={{ marginBottom: 12, color: 'var(--color-text-muted)', fontSize: 13 }}>
        Colonnes attendues :{' '}
        <code style={{ fontSize: 11 }}>date, paymentNumber, paymentAmount, principalPaid, interestPaid, [insurancePaid], remainingPrincipal</code>
      </p>

      <input
        type="file"
        accept=".csv"
        onChange={handleFile}
        className="form-input"
        style={{ marginBottom: 12 }}
        disabled={confirmed}
      />

      {errors.length > 0 && (
        <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>
          {errors.map((err, i) => (
            <div key={i}>⚠ {err}</div>
          ))}
        </div>
      )}

      {parsed && !confirmed && (
        <>
          <div style={{ marginBottom: 14, fontSize: 13 }}>
            <span className="badge badge-blue" style={{ marginRight: 8 }}>
              {parsed.rowCount} échéances
            </span>
            <span style={{ color: 'var(--color-text-muted)' }}>
              Champs déduits du TA :
            </span>
          </div>

          <div className="table-container" style={{ marginBottom: 16 }}>
            <table style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Champ</th>
                  <th style={{ textAlign: 'right' }}>Valeur déduite</th>
                  <th style={{ textAlign: 'right' }}>Valeur actuelle</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f) => (
                  <tr key={f.label}>
                    <td style={{ fontWeight: 500 }}>{f.label}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {f.deduced}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>
                      {f.current != null && f.current !== 0 && f.current !== ''
                        ? String(f.current)
                        : <em>—</em>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {f.label === 'Durée' ? (
                        <span className="badge badge-gray">Info</span>
                      ) : f.willPatch ? (
                        <span className="badge badge-green">✓ Appliqué</span>
                      ) : (
                        <span className="badge badge-gray">Conservé</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {patchCount > 0 && (
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
              ✓ {patchCount} champ{patchCount > 1 ? 's' : ''} vide{patchCount > 1 ? 's' : ''} sera{patchCount > 1 ? 'ont' : ''} rempli{patchCount > 1 ? 's' : ''} automatiquement.
              Les champs déjà renseignés sont conservés.
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" onClick={handleConfirm}>
              ✓ Confirmer l'import ({parsed.rowCount} lignes)
            </button>
          </div>
        </>
      )}

      {confirmed && (
        <div style={{ color: 'var(--color-success)', fontSize: 14, textAlign: 'center', padding: '12px 0' }}>
          ✓ Tableau d'amortissement importé avec succès
        </div>
      )}

      {!parsed && !errors.length && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Fermer</button>
        </div>
      )}
    </Modal>
  )
}
