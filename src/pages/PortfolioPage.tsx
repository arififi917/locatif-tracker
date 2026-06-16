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
      <td style={{ textAlign: 'right' }}>
        <AmountCell value={kpi.plusValue} showSign />
      </td>
      <td style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{formatCurrency(kpi.equityDynamique)}</td>
      <td style={{ textAlign: 'right' }}><AmountCell value={kpi.cashflowOperationnel} showSign /></td>
      <td style={{ textAlign: 'right' }}><AmountCell value={kpi.cashflowTresorerie} showSign /></td>
      <td style={{ textAlign: 'right' }}>
        <span style={{ fontWeight: 600, color: 'var(--color-info)' }}>{formatPercent(kpi.grossYield)}</span>
      </td>
      <td style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{formatPercent(kpi.netYieldEconomique)}</td>
      <td style={{ textAlign: 'right' }}>
        <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{formatPercent(kpi.equityDynamiqueYield)}</span>
      </td>
      <td style={{ textAlign: 'right' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: 11, color: 'var(--color-primary-muted)',
          background: 'var(--color-primary-light)',
          padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600,
        }}>
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

  const periodLabel =
    period.mode === 'year' ? `${period.year}`
    : period.mode === 'rolling_12m' ? '12 derniers mois'
    : 'Tout'

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Vue portefeuille</h2>
          <p className="page-subtitle">Période : {periodLabel} · {data.properties.length} bien{data.properties.length > 1 ? 's' : ''}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Ajouter un bien
          </button>
        </div>
      </div>

      {data.properties.length > 0 && (
        <>
          {/* Patrimoine */}
          <div className="section-header" style={{ marginBottom: 'var(--space-3)' }}>
            <span className="section-title">Patrimoine</span>
          </div>
          <div className="kpi-grid" style={{ marginBottom: 'var(--space-6)' }}>
            <KpiCard
              label="Valeur brute"
              value={formatCurrency(portfolio.totalCurrentValue)}
              accent="var(--kpi-accent-blue)"
              tooltip="Somme des valeurs de marché estimées de tous vos biens."
            />
            <KpiCard
              label="CRD total"
              value={formatCurrency(portfolio.totalCRD)}
              accent="var(--kpi-accent-amber)"
              tooltip="Capital Restant Dû : total des emprunts encore à rembourser sur l'ensemble du portefeuille."
            />
            <KpiCard
              label="Equity nette"
              value={formatCurrency(portfolio.totalNetValue)}
              accent="var(--kpi-accent-sky)"
              sub="Valeur − CRD"
              tooltip="Votre patrimoine net : valeur totale des biens moins le total des CRD. C'est ce que vous récupèreriez (avant impôts) en vendant tout."
            />
            <KpiCard
              label="Plus-value latente"
              value={formatCurrency(portfolio.plusValue)}
              positive={portfolio.plusValue > 0}
              negative={portfolio.plusValue < 0}
              tooltip="Différence entre la valeur actuelle totale et le coût d'acquisition total de l'ensemble du portefeuille."
            />
          </div>

          {/* Flux */}
          <div className="section-header" style={{ marginBottom: 'var(--space-3)' }}>
            <span className="section-title">Flux — {periodLabel}</span>
          </div>
          <div className="kpi-grid" style={{ marginBottom: 'var(--space-6)' }}>
            <KpiCard
              label="Loyers"
              value={formatCurrency(portfolio.realRents)}
              positive={portfolio.realRents > 0}
              accent="var(--kpi-accent-emerald)"
              tooltip="Total des loyers encaissés sur tous les biens pour la période sélectionnée."
            />
            <KpiCard
              label="Charges"
              value={formatCurrency(portfolio.totalCharges)}
              accent="var(--kpi-accent-rose)"
              tooltip="Total des dépenses (hors assurance emprunteur) sur l'ensemble du portefeuille pour la période."
            />
            <KpiCard
              label="Coût crédit (int.+ass.)"
              value={formatCurrency(portfolio.creditCostOnly)}
              accent="var(--kpi-accent-amber)"
              tooltip="Somme des intérêts et assurances emprunteur payés sur la période. C'est le vrai coût économique du financement."
            />
            <KpiCard
              label="Mensualités complètes"
              value={formatCurrency(portfolio.creditMensualiteComplete)}
              accent="var(--kpi-accent-amber)"
              tooltip="Total des mensualités débitées (capital + intérêts + assurance) sur l'ensemble des prêts pour la période."
            />
            <KpiCard
              label="CF opérationnel"
              value={formatCurrency(portfolio.cashflowOperationnel)}
              positive={portfolio.cashflowOperationnel > 0}
              negative={portfolio.cashflowOperationnel < 0}
              sub="Loyers − charges"
              tooltip="Loyers totaux moins toutes les charges d'exploitation (hors crédit). Mesure la performance brute du parc locatif."
            />
            <KpiCard
              label="CF économique"
              value={formatCurrency(portfolio.cashflowEconomique)}
              positive={portfolio.cashflowEconomique > 0}
              negative={portfolio.cashflowEconomique < 0}
              sub="− int./assurance"
              tooltip="CF opérationnel moins le coût économique du crédit. Reflète la rentabilité réelle après financement, sans comptabiliser le remboursement du capital."
            />
            <KpiCard
              label="CF trésorerie"
              value={formatCurrency(portfolio.cashflowTresorerie)}
              positive={portfolio.cashflowTresorerie > 0}
              negative={portfolio.cashflowTresorerie < 0}
              sub="− mensualité complète"
              tooltip="Argent net disponible après toutes les sorties de trésorerie : loyers − charges − mensualités complètes. Impact réel sur votre compte courant."
            />
            <KpiCard
              label="Taux d'effort"
              value={formatPercent(portfolio.tauxEffort)}
              positive={portfolio.tauxEffort < 0.8}
              negative={portfolio.tauxEffort >= 1}
              sub="Mensualités / loyers"
              tooltip="Part des loyers absorbée par les mensualités de crédit sur l'ensemble du portefeuille. Indicateur de solidité financière : en dessous de 80% c'est sain, au-dessus de 100% les loyers ne couvrent plus les mensualités."
            />
          </div>

          {/* Rendements */}
          <div className="section-header" style={{ marginBottom: 'var(--space-3)' }}>
            <span className="section-title">Rendements annualisés</span>
          </div>
          <div className="kpi-grid" style={{ marginBottom: 'var(--space-6)' }}>
            <KpiCard
              label="Rendement brut"
              value={formatPercent(portfolio.grossYield)}
              accent="var(--kpi-accent-violet)"
              sub="Loyers / coût acq."
              tooltip="Loyers annuels bruts / coût total d'acquisition du portefeuille. Point de départ pour comparer des investissements entre eux."
            />
            <KpiCard
              label="Rdt opérationnel"
              value={formatPercent(portfolio.netYieldOperationnel)}
              accent="var(--kpi-accent-sky)"
              sub="CF opérat. / coût acq."
              tooltip="Cashflow opérationnel annuel (loyers − charges) / coût d'acquisition total. Rendement net de charges, indépendant du financement."
            />
            <KpiCard
              label="Rdt économique"
              value={formatPercent(portfolio.netYieldEconomique)}
              accent="var(--kpi-accent-sky)"
              sub="CF économ. / coût acq."
              tooltip="Cashflow économique annuel (loyers − charges − intérêts/assurance) / coût d'acquisition. Tient compte du coût réel du financement."
            />
            <KpiCard
              label="Rdt equity nette"
              value={formatPercent(portfolio.equityDynamiqueYield)}
              accent="var(--kpi-accent-emerald)"
              sub="CF économ. / equity nette"
              tooltip="Cashflow économique annuel rapporté à l'equity nette totale du portefeuille. Mesure ce que rapporte votre capital réellement engagé."
            />
          </div>
        </>
      )}

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
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Cliquez sur un bien pour accéder au détail</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Bien</th>
                  <th style={{ textAlign: 'right' }}>Valeur brute</th>
                  <th style={{ textAlign: 'right' }}>Plus-value</th>
                  <th style={{ textAlign: 'right' }}>Equity nette</th>
                  <th style={{ textAlign: 'right' }}>CF opérat.</th>
                  <th style={{ textAlign: 'right' }}>CF tréso.</th>
                  <th style={{ textAlign: 'right' }}>Rdt brut</th>
                  <th style={{ textAlign: 'right' }}>Rdt économ.</th>
                  <th style={{ textAlign: 'right' }}>Rdt equity</th>
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
