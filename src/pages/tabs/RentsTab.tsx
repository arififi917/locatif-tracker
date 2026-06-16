import { useRef, useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { usePeriodFilter } from '../../hooks/usePeriodFilter'
import { isWithinPeriod } from '../../domain/period'
import { RentEventForm } from '../../components/forms/RentEventForm'
import { parseRentCSV } from '../../domain/csvParser'
import { formatCurrency, formatDate } from '../../utils/format'
import { type RentEvent } from '../../domain/types'

type Props = { propertyId: string }

export function RentsTab({ propertyId }: Props) {
  const { data, deleteRentEvent, bulkAddRentEvents } = useAppData()
  const { period } = usePeriodFilter()
  const [showAdd, setShowAdd] = useState(false)
  const [duplicate, setDuplicate] = useState<RentEvent | null>(null)
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const rents = data.rentEvents
    .filter((r) => r.propertyId === propertyId && isWithinPeriod(r.date, period))
    .sort((a, b) => b.date.localeCompare(a.date))

  const totalAmount = rents.reduce((s, r) => s + r.amount, 0)
  const totalRentHC = rents.reduce((s, r) => s + (r.rentHC ?? 0), 0)
  const totalChargesReceived = rents.reduce((s, r) => s + (r.chargesReceived ?? 0), 0)
  const totalManagementFees = rents.reduce((s, r) => s + (r.managementFees ?? 0), 0)
  const hasDetail = rents.some((r) => r.rentHC != null)

  function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { rows, errors } = parseRentCSV(text, data.properties)
      if (errors.length > 0) {
        setCsvErrors(errors)
        return
      }
      bulkAddRentEvents(rows)
      setCsvErrors([])
      alert(`${rows.length} loyer(s) importé(s) avec succès.`)
    }
    reader.readAsText(file)
    // reset pour permettre re-sélection du même fichier
    e.target.value = ''
  }

  return (
    <div>
      <div className="section-header" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <span className="section-title">Loyers</span>
          <span style={{
            background: 'var(--color-positive-light)',
            color: 'var(--color-positive)',
            borderRadius: 'var(--radius-full)',
            padding: '3px 10px',
            fontSize: 12,
            fontWeight: 700,
          }}>
            Total encaissé : {formatCurrency(totalAmount)}
          </span>
          {hasDetail && totalRentHC > 0 && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              HC {formatCurrency(totalRentHC)}
              {totalChargesReceived > 0 && ` + ch. ${formatCurrency(totalChargesReceived)}`}
              {totalManagementFees > 0 && ` − gestion ${formatCurrency(totalManagementFees)}`}
            </span>
          )}
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

      {rents.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <p className="empty-state-title">Aucun loyer sur cette période</p>
            <p className="empty-state-desc">Saisissez les loyers encaissés pour calculer vos rendements.</p>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Ajouter un loyer</button>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Libellé</th>
                {hasDetail && <th style={{ textAlign: 'right' }}>Loyer HC</th>}
                {hasDetail && <th style={{ textAlign: 'right' }}>Charges perçues</th>}
                {hasDetail && <th style={{ textAlign: 'right' }}>Frais gestion</th>}
                <th style={{ textAlign: 'right' }}>Total encaissé</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rents.map((r) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 500 }}>{formatDate(r.date)}</td>
                  <td style={{ fontWeight: 600 }}>{r.label}</td>
                  {hasDetail && (
                    <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>
                      {r.rentHC != null ? formatCurrency(r.rentHC) : '—'}
                    </td>
                  )}
                  {hasDetail && (
                    <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>
                      {r.chargesReceived != null && r.chargesReceived > 0 ? formatCurrency(r.chargesReceived) : '—'}
                    </td>
                  )}
                  {hasDetail && (
                    <td style={{ textAlign: 'right', color: r.managementFees ? 'var(--color-negative)' : 'var(--color-text-muted)' }}>
                      {r.managementFees ? `−${formatCurrency(r.managementFees)}` : '—'}
                    </td>
                  )}
                  <td style={{ textAlign: 'right' }}>
                    <span className="positive">{formatCurrency(r.amount)}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-xs" title="Dupliquer" onClick={() => setDuplicate(r)}>⧉</button>
                      <button className="btn btn-danger btn-xs" title="Supprimer" onClick={() => deleteRentEvent(r.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <RentEventForm propertyId={propertyId} onClose={() => setShowAdd(false)} />}
      {duplicate && <RentEventForm propertyId={propertyId} initial={{ ...duplicate, date: '' }} onClose={() => setDuplicate(null)} />}
    </div>
  )
}
