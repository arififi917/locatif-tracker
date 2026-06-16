import { useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { usePeriodFilter } from '../../hooks/usePeriodFilter'
import { isWithinPeriod } from '../../domain/period'
import { RentEventForm } from '../../components/forms/RentEventForm'
import { formatCurrency, formatDate } from '../../utils/format'

type Props = { propertyId: string }

export function RentsTab({ propertyId }: Props) {
  const { data, deleteRentEvent } = useAppData()
  const { period } = usePeriodFilter()
  const [showAdd, setShowAdd] = useState(false)

  const rents = data.rentEvents
    .filter((r) => r.propertyId === propertyId && isWithinPeriod(r.date, period))
    .sort((a, b) => b.date.localeCompare(a.date))

  const total = rents.reduce((s, r) => s + r.amount, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Total loyers : {formatCurrency(total)}</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Ajouter</button>
      </div>

      {rents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>Aucun loyer sur cette période.</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Libellé</th>
                <th style={{ textAlign: 'right' }}>Montant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rents.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.date)}</td>
                  <td>{r.label}</td>
                  <td style={{ textAlign: 'right' }} className="positive">{formatCurrency(r.amount)}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteRentEvent(r.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <RentEventForm propertyId={propertyId} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
