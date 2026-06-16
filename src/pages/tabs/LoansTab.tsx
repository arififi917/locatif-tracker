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
      <div className="section-header" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span className="section-title">Prêts</span>
          <span style={{
            background: 'var(--color-warning-light)',
            color: 'var(--color-warning)',
            borderRadius: 'var(--radius-full)',
            padding: '3px 10px',
            fontSize: 12,
            fontWeight: 700,
          }}>
            CRD total : {formatCurrency(totalCRD)}
          </span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Ajouter un prêt</button>
      </div>

      {loans.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏦</div>
            <p className="empty-state-title">Aucun prêt enregistré</p>
            <p className="empty-state-desc">Ajoutez vos prêts immobiliers pour suivre le CRD et le coût du crédit.</p>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Ajouter un prêt</button>
          </div>
        </div>
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
                const loanRows = data.loanSchedules
                  .filter((r) => r.loanId === loan.id && r.date <= referenceDate)
                  .sort((a, b) => b.date.localeCompare(a.date))
                const crd = loanRows[0]?.remainingPrincipal ?? loan.principal
                return (
                  <tr key={loan.id}>
                    <td style={{ fontWeight: 700 }}>{loan.name}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{loan.lender ?? '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(loan.principal)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--color-info)', fontWeight: 600 }}>{loan.rate}%</span>
                      {loan.insuranceRate ? <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}> + {loan.insuranceRate}% ass.</span> : null}
                    </td>
                    <td style={{ textAlign: 'right' }}>{loan.monthlyPayment ? formatCurrency(loan.monthlyPayment) : '—'}</td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{formatDate(loan.startDate)}</td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{loan.endDate ? formatDate(loan.endDate) : '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-warning)' }}>{formatCurrency(crd)}</td>
                    <td>
                      <span className={`badge ${loan.hasSchedule ? 'badge-green' : 'badge-gray'}`}>
                        {loan.hasSchedule ? '✓ TA' : 'Sans TA'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-xs" onClick={() => setImportLoan(loan)} title="Importer tableau d'amortissement">↑ TA</button>
                        <button className="btn btn-ghost btn-xs" onClick={() => setEditLoan(loan)} title="Modifier">✏</button>
                        <button className="btn btn-danger btn-xs" onClick={() => deleteLoan(loan.id)} title="Supprimer">🗑</button>
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
