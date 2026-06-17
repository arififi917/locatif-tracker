import { useAppData } from '../../hooks/useAppData'
import { usePropertyKPI } from '../../hooks/usePropertyKPI'
import { usePeriodFilter } from '../../hooks/usePeriodFilter'
import { getAcquisitionCost } from '../../domain/calc'
import { KpiCard } from '../../components/ui/KpiCard'
import { formatCurrency, formatPercent } from '../../utils/format'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

type Props = { propertyId: string }

export function SynthesisTab({ propertyId }: Props) {
  const { data } = useAppData()
  const { period } = usePeriodFilter()
  const kpi = usePropertyKPI(propertyId)
  const property = data.properties.find((p) => p.id === propertyId)!
  const acqCost = getAcquisitionCost(property)

  const periodLabel = period.mode === 'year'
    ? period.year?.toString()
    : period.mode === 'rolling_12m'
    ? '12 derniers mois'
    : 'Tout'

  const annLabel = kpi.anneesCouvertes !== 1
    ? ` (annualisé sur ${kpi.anneesCouvertes.toFixed(1)} ans)`
    : ''

  const chartData = [
    { name: 'Loyers', value: kpi.realRents, color: 'var(--kpi-accent-emerald)' },
    { name: 'Charges', value: kpi.totalCharges, color: 'var(--kpi-accent-rose)' },
    { name: 'Mensualités', value: kpi.creditMensualiteComplete, color: 'var(--kpi-accent-amber)' },
    { name: 'CF net', value: kpi.cashflowNet, color: kpi.cashflowNet >= 0 ? '#059669' : '#dc2626' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>

      {/* Patrimoine */}
      <section>
        <div className="section-header">
          <span className="section-title">Patrimoine</span>
        </div>
        <div className="kpi-grid">
          <KpiCard
            label="Coût acquisition"
            value={formatCurrency(acqCost)}
            accent="var(--kpi-accent-blue)"
            tooltip="Prix d'achat + frais de notaire + frais d'agence + travaux initiaux."
          />
          <KpiCard
            label="Apport réel"
            value={formatCurrency(kpi.apportReel)}
            accent="var(--kpi-accent-blue)"
            sub="Coût acq. − Σ nominaux prêts"
            tooltip="Argent sorti de votre poche : coût d'acquisition total moins le cumul des nominaux des prêts. Base du calcul cash-on-cash."
          />
          <KpiCard
            label="Valeur actuelle"
            value={formatCurrency(kpi.currentValue)}
            accent="var(--kpi-accent-sky)"
            tooltip="Valeur de marché estimée du bien aujourd'hui."
          />
          <KpiCard
            label="Plus-value latente"
            value={formatCurrency(kpi.plusValue)}
            positive={kpi.plusValue > 0}
            negative={kpi.plusValue < 0}
            tooltip="Valeur actuelle − coût d'acquisition."
          />
          <KpiCard
            label="CRD total"
            value={formatCurrency(kpi.totalCRD)}
            accent="var(--kpi-accent-amber)"
            tooltip="Capital Restant Dû à la date de référence."
          />
          <KpiCard
            label="Equity nette"
            value={formatCurrency(kpi.equityDynamique)}
            positive={kpi.equityDynamique > 0}
            negative={kpi.equityDynamique < 0}
            sub="Valeur actuelle − CRD"
            tooltip="Votre part réelle du bien : valeur actuelle moins le capital restant dû."
          />
        </div>
      </section>

      {/* Flux période */}
      <section>
        <div className="section-header">
          <span className="section-title">Flux — {periodLabel}{annLabel}</span>
        </div>
        <div className="kpi-grid">
          <KpiCard
            label="Loyers encaissés"
            value={formatCurrency(kpi.realRents)}
            positive={kpi.realRents > 0}
            tooltip="Total des loyers réellement encaissés sur la période."
          />
          <KpiCard
            label="Charges totales"
            value={formatCurrency(kpi.totalCharges)}
            accent="var(--kpi-accent-rose)"
            tooltip="Toutes les dépenses liées au bien sur la période (hors assurance emprunteur comptée dans les mensualités)."
          />
          <KpiCard
            label="Mensualités complètes"
            value={formatCurrency(kpi.creditMensualiteComplete)}
            accent="var(--kpi-accent-amber)"
            sub="Capital + int. + ass."
            tooltip="Total des sommes débitées pour le(s) crédit(s) : capital remboursé + intérêts + assurance emprunteur."
          />
          <KpiCard
            label="CF net"
            value={formatCurrency(kpi.cashflowNet)}
            positive={kpi.cashflowNet > 0}
            negative={kpi.cashflowNet < 0}
            sub="Loyers − charges − mensualités"
            tooltip="Argent réellement disponible après toutes les sorties. Positif = le bien s'autofinance."
          />
          <KpiCard
            label="Taux d'effort"
            value={formatPercent(kpi.tauxEffort)}
            positive={kpi.tauxEffort < 0.8}
            negative={kpi.tauxEffort >= 1}
            sub="Mensualités / loyers"
            tooltip="Part des loyers absorbée par les mensualités. En dessous de 80% : sain. Au-dessus de 100% : les loyers ne couvrent pas les mensualités."
          />
        </div>
      </section>

      {/* Rendements */}
      <section>
        <div className="section-header">
          <span className="section-title">Rendements annualisés</span>
        </div>
        <div className="kpi-grid">
          <KpiCard
            label="Rendement brut"
            value={formatPercent(kpi.grossYield)}
            accent="var(--kpi-accent-violet)"
            sub="Loyers / coût acq."
            tooltip="Loyers annuels bruts divisés par le coût total d'acquisition. Indicateur de premier niveau, avant charges et crédit."
          />
          <KpiCard
            label="Rendement net"
            value={formatPercent(kpi.netYield)}
            accent="var(--kpi-accent-sky)"
            sub="CF net / coût acq."
            tooltip="Cash-flow net annuel (loyers − charges − mensualités complètes) rapporté au coût d'acquisition. Rentabilité réelle après tout."
          />
          <KpiCard
            label="Rdt equity net"
            value={formatPercent(kpi.equityNetYield)}
            accent="var(--kpi-accent-emerald)"
            sub="CF net / equity nette"
            tooltip="CF net annuel rapporté à votre equity nette actuelle (valeur − CRD). Mesure le rendement sur votre capital patrimonial aujourd'hui."
          />
          <KpiCard
            label="Cash-on-cash"
            value={formatPercent(kpi.cashOnCash)}
            accent="var(--kpi-accent-emerald)"
            sub="CF net / apport réel"
            tooltip="CF net annuel rapporté à votre apport réel (coût acq. − nominaux prêts). Ce que votre mise de départ rapporte vraiment — comparable à d'autres placements."
          />
        </div>
      </section>

      {/* Graphique */}
      <section>
        <div className="section-header">
          <span className="section-title">Aperçu cashflows</span>
        </div>
        <div className="card" style={{ padding: '24px 12px 20px' }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 24, left: 24, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), '']}
                contentStyle={{
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-md)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

    </div>
  )
}
