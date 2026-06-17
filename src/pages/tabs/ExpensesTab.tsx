import { useRef, useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { usePeriodFilter } from '../../hooks/usePeriodFilter'
import { isWithinPeriod } from '../../domain/period'
import { ExpenseEventForm } from '../../components/forms/ExpenseEventForm'
import { parseExpenseCSV } from '../../domain/csvParser'
import { formatCurrency, formatDate } from '../../utils/format'
import { type ExpenseEvent } from '../../domain/types'

type Props = { propertyId: string }

export function ExpensesTab({ propertyId }: Props) {
  const { data, deleteExpenseEvent, bulkAddExpenseEvents } = useAppData()
  const { period } = usePeriodFilter()
  const [showAdd, setShowAdd] = useState(false)
  const [duplicate, setDuplicate] = useState<ExpenseEvent | null>(null)
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const expenses = data.expenseEvents
    .filter((e) => e.propertyId === propertyId && isWithinPeriod(e.date, period))
    .sort((a, b) => b.date.localeCompare(a.date))

  const totalAll = expenses.reduce((s, e) => s + e.amount, 0)

  // Regroupement dynamique par catégorie
  const byCategory = Object.entries(
    expenses
      .filter((e) => e.category !== 'credit')
      .reduce<Record<string, number>>((acc, e) => {
        acc[e.category] = (acc[e.category] ?? 0) + e.amount
        return acc
      }, {})
  )
    .map(([cat, total]) => ({ cat, total }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)

  function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { rows, errors } = parseExpenseCSV(text, data.properties)
      if (errors.length > 0) {
        setCsvErrors(errors)
        return
      }
      bulkAddExpenseEvents(rows)
      setCsvErrors([])
      alert(`${rows.length} dépense(s) importée(s) avec succès.`)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div>
      <div className="section-header" style={{ marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <span className="section-title">Dépenses</span>
          <span style={{
            background: 'var(--color-negative-light)',
            color: 'var(--color-negative)',
            borderRadius: 'var(--radius-full)',
            padding: '3px 10px',
            fontSize: 12,
            fontWeight: 700,
          }}>
            Total : {formatCurrency(totalAll)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={handleCsvImport}
          />
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            ↑ Import CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Ajouter</button>
        </div>
      </div>

      {csvErrors.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--color-negative)', marginBottom: 'var(--space-4)' }}>
          <p style={{ fontWeight: 700, color: 'var(--color-negative)', marginBottom: 6 }}>Erreurs dans le CSV :</p>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
            {csvErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
          <button className="btn btn-ghost btn-xs" style={{ marginTop: 8 }} onClick={() => setCsvErrors([])}>Fermer</button>
        </div>
      )}

      {byCategory.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
          {byCategory.map(({ cat, total }) => (
            <span key={cat} className="badge badge-navy">{cat} : {formatCurrency(total)}</span>
          ))}
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-title">Aucune dépense sur cette période</p>
            <p className="empty-state-desc">Enregistrez vos charges et dépenses pour calculer le rendement net réel.</p>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Ajouter une dépense</button>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Libellé</th>
                <th>Catégorie</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 500 }}>{formatDate(e.date)}</td>
                  <td style={{ fontWeight: 600 }}>{e.label || '—'}</td>
                  <td><span className="badge badge-navy">{e.category}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(e.amount)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-xs" title="Dupliquer" onClick={() => setDuplicate(e)}>⧉</button>
                      <button className="btn btn-danger btn-xs" title="Supprimer" onClick={() => deleteExpenseEvent(e.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <ExpenseEventForm propertyId={propertyId} onClose={() => setShowAdd(false)} />}
      {duplicate && <ExpenseEventForm propertyId={propertyId} initial={{ ...duplicate, date: '' }} onClose={() => setDuplicate(null)} />}
    </div>
  )
}
