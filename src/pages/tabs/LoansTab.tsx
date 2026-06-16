import { useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { usePeriodFilter } from '../../hooks/usePeriodFilter'
import { getTotalCRD } from '../../domain/calc'
import { LoanForm } from '../../components/forms/LoanForm'
import { LoanScheduleImport } from '../../components/forms/LoanScheduleImport'
import { formatCurrency, formatDate } from '../../utils/format'
import { type Loan } from '../../domain/types'

type Props = { propertyId: string }

function LoanSchedulePanel({ loan }: { loan: Loan }) {
  const { data } = useAppData()
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 24

  const rows = [...data.loanSchedules]
    .filter((r) => r.loanId === loan.id)
    .sort((a, b) => a.date.localeCompare(b.date))

  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const totalCapital = rows.reduce((s, r) => s + r.principalPaid, 0)
  const totalInterest = rows.reduce((s, r) => s + r.interestPaid, 0)
  const totalInsurance = rows.reduce((s, r) => s + (r.insurancePaid ?? 0), 0)
  const totalPayment = rows.reduce((s, r) => s + r.paymentAmount, 0)

  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={10} style={{ padding: '12px 20px', color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 12 }}>
          Aucune ligne dans le tableau d'amortissement.
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td colSpan={10} style={{ padding: 0, background: 'var(--bg-surface-2)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-3)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>Date</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>Mensualité</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>Capital</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>Intérêts</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>Assurance</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }}>CRD</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '7px 12px', color: 'var(--text-secondary)' }}>{formatDate(r.date)}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(r.paymentAmount)}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--color-info)' }}>{formatCurrency(r.principalPaid)}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--color-warning)' }}>{formatCurrency(r.interestPaid)}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                    {r.insurancePaid != null ? formatCurrency(r.insurancePaid) : '—'}
                  </td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--color-warning)' }}>{formatCurrency(r.remainingPrincipal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-surface-3)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 700, fontSize: 11, color: 'var(--text-muted)' }}>
                  {rows.length} lignes · pages {page + 1}/{totalPages}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(totalPayment)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--color-info)' }}>{formatCurrency(totalCapital)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--color-warning)' }}>{formatCurrency(totalInterest)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)' }}>{formatCurrency(totalInsurance)}</td>
                <td style={{ padding: '8px 12px' }} />
              </tr>
              {totalPages > 1 && (
                <tr style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface-2)' }}>
                  <td colSpan={6} style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        className="btn btn-secondary btn-xs"
                        disabled={page === 0}
                        onClick={() => setPage((p) => p - 1)}
                      >← Préc.</button>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, rows.length)} / {rows.length}
                      </span>
                      <button
                        className="btn btn-secondary btn-xs"
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage((p) => p + 1)}
                      >Suiv. →</button>
                    </div>
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </td>
    </tr>
  )
}

export function LoansTab({ propertyId }: Props) {
  const { data, deleteLoan } = useAppData()
  const { referenceDate } = usePeriodFilter()
  const [showAdd, setShowAdd] = useState(false)
  const [editLoan, setEditLoan] = useState<Loan | null>(null)
  const [importLoan, setImportLoan] = useState<Loan | null>(null)
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null)

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
                <th></th>
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
                const isExpanded = expandedLoan === loan.id
                return (
                  <>
                    <tr key={loan.id}>
                      <td style={{ width: 28, textAlign: 'center' }}>
                        {loan.hasSchedule && (
                          <button
                            className="btn btn-ghost btn-xs"
                            style={{ padding: '2px 6px', fontSize: 13, lineHeight: 1 }}
                            onClick={() => setExpandedLoan(isExpanded ? null : loan.id)}
                            title={isExpanded ? 'Masquer le TA' : 'Voir le TA'}
                          >
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        )}
                      </td>
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
                    {isExpanded && <LoanSchedulePanel loan={loan} />}
                  </>
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
