import { useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { usePeriodFilter } from '../../hooks/usePeriodFilter'
import { getTotalCRD } from '../../domain/calc'
import { LoanForm } from '../../components/forms/LoanForm'
import { LoanScheduleImport } from '../../components/forms/LoanScheduleImport'
import { formatCurrency, formatDate } from '../../utils/format'
import { type Loan } from '../../domain/types'

type Props = { propertyId: string }

export function LoansTab({ propertyId }: Props) {
  const { data, deleteLoan } = useAppData()
  const { referenceDate } = usePeriodFilter()
  const [showAdd, setShowAdd] = useState(false)
  const [editLoan, setEditLoan] = useState<Loan | null>(null)
  const [importLoan, setImportLoan] = useState<Loan | null>(null)

  const loans = data.loans.filter((l) => l.propertyId === propertyId)
  const totalCRD = getTotalCRD(propertyId, data, referenceDate)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>CRD total : {formatCurrency(totalCRD)}</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Ajouter un prêt</button>
      </div>

      {loans.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>Aucun prêt enregistré.</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Banque</th>
                <th style={{ textAlign: 'right' }}>Capital</th>
                <th style={{ textAlign: 'right' }}>Taux</th>
                <th style={{ textAlign: 'right' }}>Mensualité</th>
                <th>Début</th>
                <th>Fin</th>
                <th style={{ textAlign: 'right' }}>CRD</th>
                <th>TA</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => {
                const loanRows = data.loanSchedules.filter((r) => r.loanId === loan.id && r.date <= referenceDate).sort((a, b) => b.date.localeCompare(a.date))
                const crd = loanRows[0]?.remainingPrincipal ?? loan.principal
                return (
                  <tr key={loan.id}>
                    <td style={{ fontWeight: 600 }}>{loan.name}</td>
                    <td>{loan.lender ?? '—'}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(loan.principal)}</td>
                    <td style={{ textAlign: 'right' }}>{loan.rate}%{loan.insuranceRate ? ` + ${loan.insuranceRate}% ass.` : ''}</td>
                    <td style={{ textAlign: 'right' }}>{loan.monthlyPayment ? formatCurrency(loan.monthlyPayment) : '—'}</td>
                    <td>{formatDate(loan.startDate)}</td>
                    <td>{loan.endDate ? formatDate(loan.endDate) : '—'}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(crd)}</td>
                    <td>
                      <span className={`badge ${loan.hasSchedule ? 'badge-green' : 'badge-gray'}`}>
                        {loan.hasSchedule ? '✓ TA' : 'Sans TA'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setImportLoan(loan)}>↑ TA</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditLoan(loan)}>✏</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteLoan(loan.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <LoanForm propertyId={propertyId} onClose={() => setShowAdd(false)} />}
      {editLoan && <LoanForm propertyId={propertyId} loan={editLoan} onClose={() => setEditLoan(null)} />}
      {importLoan && <LoanScheduleImport loan={importLoan} onClose={() => setImportLoan(null)} />}
    </div>
  )
}
