import { useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { usePeriodFilter } from '../../hooks/usePeriodFilter'
import { isWithinPeriod } from '../../domain/period'
import { RentEventForm } from '../../components/forms/RentEventForm'
import { formatCurrency, formatDate } from '../../utils/format'
import { type RentEvent } from '../../domain/types'

type Props = { propertyId: string }

export function RentsTab({ propertyId }: Props) {
  const { data, deleteRentEvent } = useAppData()
  const { period } = usePeriodFilter()
  const [showAdd, setShowAdd] = useState(false)
  const [duplicate, setDuplicate] = useState<RentEvent | null>(null)

  const rents = data.rentEvents
    .filter((r) => r.propertyId === propertyId && isWithinPeriod(r.date, period))
    .sort((a, b) => b.date.localeCompare(a.date))

  const totalAmount = rents.reduce((s, r) => s + r.amount, 0)
  const totalRentHC = rents.reduce((s, r) => s + (r.rentHC ?? 0), 0)
  const totalChargesReceived = rents.reduce((s, r) => s + (r.chargesReceived ?? 0), 0)
  const totalManagementFees = rents.reduce((s, r) => s + (r.managementFees ?? 0), 0)
  const hasDetail = rents.some((r) => r.rentHC != null)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Total encaissé : {formatCurrency(totalAmount)}</span>
          {hasDetail && (
            <span style={{ marginLeft: 14, fontSize: 12, color: 'var(--color-text-muted)' }}>
              HC {formatCurrency(totalRentHC)}
              {totalChargesReceived > 0 && ` + ch. {formatCurrency(totalChargesReceived)}`}
              {totalManagementFees > 0 && ` − gestion {formatCurrency(totalManagementFees)}`}
            </span>
          )}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Ajouter</button>
      </div>

      {rents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>
          Aucun loyer sur cette période.
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
                  <td>{formatDate(r.date)}</td>
                  <td>{r.label}</td>
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
                  <td style={{ textAlign: 'right' }} className="positive">
                    {formatCurrency(r.amount)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        title="Dupliquer"
                        onClick={() => setDuplicate(r)}
                      >
                        ⧉
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        title="Supprimer"
                        onClick={() => deleteRentEvent(r.id)}
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <RentEventForm
          propertyId={propertyId}
          onClose={() => setShowAdd(false)}
        />
      )}
      {duplicate && (
        <RentEventForm
          propertyId={propertyId}
          initial={{ ...duplicate, date: '' }} // date vide pour forcer la sélection
          onClose={() => setDuplicate(null)}
        />
      )}
    </div>
  )
}
