import { useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { ValueHistoryForm } from '../../components/forms/ValueHistoryForm'
import { formatCurrency } from '../../utils/format'
import { type ValueHistory } from '../../domain/types'
import { getAcquisitionCost } from '../../domain/calc'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

type Props = { propertyId: string }

export function ValueHistoryTab({ propertyId }: Props) {
  const { data, deleteValueHistory } = useAppData()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ValueHistory | null>(null)

  const property = data.properties.find((p) => p.id === propertyId)!
  const acqCost = getAcquisitionCost(property)

  const history = (data.valueHistory ?? [])
    .filter((v) => v.propertyId === propertyId)
    .sort((a, b) => a.date.localeCompare(b.date))

  const chartData = history.map((v) => ({
    date: v.date.slice(0, 7), // YYYY-MM
    valeur: v.value,
    equity: null as number | null,
  }))

  // Enrichir avec equity si on a des données CRD (via loanSchedules)
  // On laisse simple pour l'instant : juste valeur + coût acq

  function handleDelete(id: string) {
    if (confirm('Supprimer cette estimation ?')) deleteValueHistory(id)
  }

  const plusValue = history.length > 0
    ? history[history.length - 1].value - acqCost
    : property.currentValue - acqCost

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Chaque point met à jour la valeur actuelle du bien (utilisée pour l’equity et les rendements).
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true) }}>
          + Ajouter
        </button>
      </div>

      {/* Graphique */}
      {history.length >= 2 && (
        <section>
          <div className="section-header">
            <span className="section-title">Évolution de la valeur</span>
          </div>
          <div className="card" style={{ padding: '24px 12px 20px' }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 4, right: 24, left: 24, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), 'Valeur estimée']}
                  contentStyle={{
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
                <ReferenceLine
                  y={acqCost}
                  stroke="var(--kpi-accent-rose)"
                  strokeDasharray="4 3"
                  label={{ value: 'Coût acq.', position: 'insideTopRight', fontSize: 10, fill: 'var(--kpi-accent-rose)' }}
                />
                <Line
                  type="monotone"
                  dataKey="valeur"
                  stroke="var(--kpi-accent-sky)"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: 'var(--kpi-accent-sky)', strokeWidth: 0 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Résumé plus-value */}
      {history.length > 0 && (
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Coût acquisition</p>
            <p style={{ fontWeight: 700, fontSize: 16 }}>{formatCurrency(acqCost)}</p>
          </div>
          <div className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Valeur actuelle</p>
            <p style={{ fontWeight: 700, fontSize: 16 }}>{formatCurrency(property.currentValue)}</p>
          </div>
          <div className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Plus-value latente</p>
            <p style={{ fontWeight: 700, fontSize: 16, color: plusValue >= 0 ? 'var(--kpi-accent-emerald)' : 'var(--kpi-accent-rose)' }}>
              {plusValue >= 0 ? '+' : ''}{formatCurrency(plusValue)}
            </p>
          </div>
        </div>
      )}

      {/* Liste */}
      <section>
        <div className="section-header">
          <span className="section-title">Historique</span>
        </div>
        {history.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)', fontSize: 13 }}>
            Aucune estimation saisie. Ajoutez un premier point pour démarrer l’historique.
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 11 }}>Date</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 11 }}>Valeur</th>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 11 }}>Note</th>
                  <th style={{ width: 80 }} />
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((v, i) => (
                  <tr key={v.id} style={{ borderBottom: i < history.length - 1 ? '1px solid var(--color-border-subtle)' : 'none' }}>
                    <td style={{ padding: '10px 16px' }}>{v.date}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(v.value)}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--color-text-muted)' }}>{v.note ?? '—'}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: 6, fontSize: 11 }}
                        onClick={() => { setEditing(v); setShowForm(true) }}
                      >✏</button>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ fontSize: 11 }}
                        onClick={() => handleDelete(v.id)}
                      >🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <ValueHistoryForm
          propertyId={propertyId}
          entry={editing ?? undefined}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
