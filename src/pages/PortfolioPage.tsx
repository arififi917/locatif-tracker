import { useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { usePortfolioKPI, usePropertyKPI } from '../hooks/usePropertyKPI'
import { usePeriodFilter } from '../hooks/usePeriodFilter'
import { PropertyForm } from '../components/forms/PropertyForm'
import { KpiCard } from '../components/ui/KpiCard'
import { AmountCell } from '../components/ui/AmountCell'
import { formatCurrency, formatPercent } from '../utils/format'
import { type Property } from '../domain/types'

type Props = { onSelectProperty: (id: string) => void }

function PropertyRow({ property, onSelect }: { property: Property; onSelect: () => void }) {
  const kpi = usePropertyKPI(property.id)
  return (
    <tr style={{ cursor: 'pointer' }} onClick={onSelect}>
      <td>
        <div style={{ fontWeight: 600 }}>{property.name}</div>
        {property.location && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{property.location}</div>}
      </td>
      <td style={{ textAlign: 'right' }}>{formatCurrency(kpi.currentValue)}</td>
      <td style={{ textAlign: 'right' }}>{formatCurrency(kpi.netValue)}</td>
      <td style={{ textAlign: 'right' }}><AmountCell value={kpi.cashflowBeforeDebt} showSign /></td>
      <td style={{ textAlign: 'right' }}><AmountCell value={kpi.cashflowAfterDebt} showSign /></td>
      <td style={{ textAlign: 'right' }}>{formatPercent(kpi.grossYield)}</td>
      <td style={{ textAlign: 'right' }}>{formatPercent(kpi.netYieldBeforeDebt)}</td>
      <td style={{ textAlign: 'right' }}>{formatPercent(kpi.netYieldAfterDebt)}</td>
      <td style={{ textAlign: 'right' }}>{formatPercent(kpi.equityYield)}</td>
    </tr>
  )
}

export function PortfolioPage({ onSelectProperty }: Props) {
  const { data } = useAppData()
  const { period } = usePeriodFilter()
  const portfolio = usePortfolioKPI()
  const [showAdd, setShowAdd] = useState(false)

  const periodLabel = period.mode === 'year' ? `${period.year}` : '12 derniers mois'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Vue portefeuille</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Période : {periodLabel}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Ajouter un bien</button>
      </div>

      {data.properties.length > 0 && (
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          <KpiCard label="Valeur brute" value={formatCurrency(portfolio.totalCurrentValue)} />
          <KpiCard label="Valeur nette" value={formatCurrency(portfolio.totalNetValue)} />
          <KpiCard label="CRD total" value={formatCurrency(portfolio.totalCRD)} />
          <KpiCard label="Loyers" value={formatCurrency(portfolio.realRents)} positive={portfolio.realRents > 0} />
          <KpiCard label="Charges" value={formatCurrency(portfolio.nonRecoverableCharges)} />
          <KpiCard label="Coût crédit" value={formatCurrency(portfolio.creditCost)} />
          <KpiCard
            label="CF avant dette"
            value={formatCurrency(portfolio.cashflowBeforeDebt)}
            positive={portfolio.cashflowBeforeDebt > 0}
            negative={portfolio.cashflowBeforeDebt < 0}
          />
          <KpiCard
            label="CF après dette"
            value={formatCurrency(portfolio.cashflowAfterDebt)}
            positive={portfolio.cashflowAfterDebt > 0}
            negative={portfolio.cashflowAfterDebt < 0}
          />
          <KpiCard label="Rdt brut" value={formatPercent(portfolio.grossYield)} />
          <KpiCard label="Rdt net av. dette" value={formatPercent(portfolio.netYieldBeforeDebt)} />
          <KpiCard label="Rdt net ap. dette" value={formatPercent(portfolio.netYieldAfterDebt)} />
          <KpiCard label="Rdt fonds propres" value={formatPercent(portfolio.equityYield)} />
        </div>
      )}

      {data.properties.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-muted)' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🏗</p>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Aucun bien pour l'instant</p>
          <p style={{ marginBottom: 20 }}>Ajoutez votre premier bien pour commencer le suivi.</p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Ajouter un bien</button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Bien</th>
                <th style={{ textAlign: 'right' }}>Valeur brute</th>
                <th style={{ textAlign: 'right' }}>Valeur nette</th>
                <th style={{ textAlign: 'right' }}>CF av. dette</th>
                <th style={{ textAlign: 'right' }}>CF ap. dette</th>
                <th style={{ textAlign: 'right' }}>Rdt brut</th>
                <th style={{ textAlign: 'right' }}>Rdt net av. dette</th>
                <th style={{ textAlign: 'right' }}>Rdt net ap. dette</th>
                <th style={{ textAlign: 'right' }}>Rdt FP</th>
              </tr>
            </thead>
            <tbody>
              {data.properties.map((p) => (
                <PropertyRow key={p.id} property={p} onSelect={() => onSelectProperty(p.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <PropertyForm onClose={() => setShowAdd(false)} />}
    </div>
  )
}
