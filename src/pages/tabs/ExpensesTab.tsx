import { useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { usePeriodFilter } from '../../hooks/usePeriodFilter'
import { isWithinPeriod } from '../../domain/period'
import { ExpenseEventForm } from '../../components/forms/ExpenseEventForm'
import { formatCurrency, formatDate } from '../../utils/format'
import { EXPENSE_CATEGORIES } from '../../domain/types'

type Props = { propertyId: string }

export function ExpensesTab({ propertyId }: Props) {
  const { data, deleteExpenseEvent } = useAppData()
  const { period } = usePeriodFilter()
  const [showAdd, setShowAdd] = useState(false)

  const expenses = data.expenseEvents
    .filter((e) => e.propertyId === propertyId && isWithinPeriod(e.date, period))
    .sort((a, b) => b.date.localeCompare(a.date))

  const totalAll = expenses.reduce((s, e) => s + e.amount, 0)
  const totalNonRecoverable = expenses.filter((e) => !e.isRecoverable && e.category !== 'credit').reduce((s, e) => s + e.amount, 0)

  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    cat,
    total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter((x) => x.total > 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Total : {formatCurrency(totalAll)}</span>
          <span style={{ marginLeft: 16, color: 'var(--color-text-muted)', fontSize: 13 }}>
            dont non récupérables : {formatCurrency(totalNonRecoverable)}
          </span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Ajouter</button>
      </div>

      {byCategory.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {byCategory.map(({ cat, total }) => (
            <span key={cat} className="badge badge-blue">{cat} : {formatCurrency(total)}</span>
          ))}
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>Aucune dépense sur cette période.</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Libellé</th>
                <th>Catégorie</th>
                <th>Récupérable</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td>{formatDate(e.date)}</td>
                  <td>{e.label || '—'}</td>
                  <td><span className="badge badge-gray">{e.category}</span></td>
                  <td>{e.isRecoverable ? <span className="badge badge-green">Oui</span> : <span className="badge badge-gray">Non</span>}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(e.amount)}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteExpenseEvent(e.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <ExpenseEventForm propertyId={propertyId} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
