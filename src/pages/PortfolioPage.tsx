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
        <div style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: 13 }}>{property.name}</div>
        {property.location && (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 10 }}>📍</span>{property.location}
          </div>
        )}
      </td>
      <td style={{ textAlign: 'right' }}>
        <span style={{ fontWeight: 700 }}>{formatCurrency(kpi.currentValue)}</span>
      </td>
      <td style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{formatCurrency(kpi.netValue)}</td>
      <td style={{ textAlign: 'right' }}><AmountCell value={kpi.cashflowBeforeDebt} showSign /></td>
      <td style={{ textAlign: 'right' }}><AmountCell value={kpi.cashflowAfterDebt} showSign /></td>
      <td style={{ textAlign: 'right' }}>
        <span style={{ fontWeight: 600, color: 'var(--color-info)' }}>{formatPercent(kpi.grossYield)}</span>
      </td>
      <td style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{formatPercent(kpi.netYieldBeforeDebt)}</td>
      <td style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{formatPercent(kpi.netYieldAfterDebt)}</td>
      <td style={{ textAlign: 'right' }}>
        <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{formatPercent(kpi.equityYield)}</span>
      </td>
      <td style={{ textAlign: 'right' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 11,
            color: 'var(--color-primary-muted)',
            background: 'var(--color-primary-light)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 600,
          }}
        >
          Détail →
        </span>
      </td>
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
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Vue portefeuille</h2>
          <p className="page-subtitle">Période&nbsp;: {periodLabel} · {data.properties.length} bien{data.properties.length > 1 ? 's' : ''}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Ajouter un bien
          </button>
        </div>
      </div>

      {/* KPI Portfolio */}
      {data.properties.length > 0 && (
        <>
          <div className="section-header" style={{ marginBottom: 'var(--space-3)' }}>
            <span className="section-title">Agrégats portefeuille</span>
          </div>
          <div className="kpi-grid">
            <KpiCard label="Valeur brute" value={formatCurrency(portfolio.totalCurrentValue)} accent="var(--kpi-accent-blue)" />
            <KpiCard label="Valeur nette" value={formatCurrency(portfolio.totalNetValue)} accent="var(--kpi-accent-sky)" />
            <KpiCard label="CRD total" value={formatCurrency(portfolio.totalCRD)} accent="var(--kpi-accent-amber)" />
            <KpiCard label="Loyers" value={formatCurrency(portfolio.realRents)}
              positive={portfolio.realRents > 0} accent="var(--kpi-accent-emerald)" />
            <KpiCard label="Charges" value={formatCurrency(portfolio.nonRecoverableCharges)} accent="var(--kpi-accent-rose)" />
            <KpiCard label="Coût crédit" value={formatCurrency(portfolio.creditCost)} accent="var(--kpi-accent-amber)" />
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
            <KpiCard label="Rdt brut" value={formatPercent(portfolio.grossYield)} accent="var(--kpi-accent-violet)" />
            <KpiCard label="Rdt net av. dette" value={formatPercent(portfolio.netYieldBeforeDebt)} accent="var(--kpi-accent-sky)" />
            <KpiCard label="Rdt net ap. dette" value={formatPercent(portfolio.netYieldAfterDebt)} accent="var(--kpi-accent-sky)" />
            <KpiCard label="Rdt fonds propres" value={formatPercent(portfolio.equityYield)} accent="var(--kpi-accent-emerald)" />
          </div>
        </>
      )}

      {/* Biens */}
      {data.properties.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏗</div>
            <p className="empty-state-title">Aucun bien pour l'instant</p>
            <p className="empty-state-desc">Ajoutez votre premier bien pour commencer le suivi de votre portefeuille locatif.</p>
            <button className="btn btn-primary btn-lg" onClick={() => setShowAdd(true)}>+ Ajouter un bien</button>
          </div>
        </div>
      ) : (
        <>
          <div className="section-header" style={{ marginBottom: 'var(--space-3)' }}>
            <span className="section-title">Détail des biens</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Cliquez sur un bien pour accéder au détail
            </span>
          </div>
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
                  <th style={{ textAlign: 'right' }}>Rdt net av.</th>
                  <th style={{ textAlign: 'right' }}>Rdt net ap.</th>
                  <th style={{ textAlign: 'right' }}>Rdt FP</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.properties.map((p) => (
                  <PropertyRow key={p.id} property={p} onSelect={() => onSelectProperty(p.id)} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showAdd && <PropertyForm onClose={() => setShowAdd(false)} />}
    </div>
  )
}
