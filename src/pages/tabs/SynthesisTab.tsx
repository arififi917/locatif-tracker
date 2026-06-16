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

  const periodLabel = period.mode === 'year' ? period.year?.toString() : '12 derniers mois'

  const chartData = [
    { name: 'Valeur brute', value: kpi.currentValue, color: 'var(--kpi-accent-blue)' },
    { name: 'Valeur nette', value: kpi.netValue, color: 'var(--kpi-accent-sky)' },
    { name: 'Loyers', value: kpi.realRents, color: 'var(--kpi-accent-emerald)' },
    { name: 'Charges', value: kpi.nonRecoverableCharges, color: 'var(--kpi-accent-rose)' },
    { name: 'CF ap. dette', value: kpi.cashflowAfterDebt, color: kpi.cashflowAfterDebt >= 0 ? '#059669' : '#dc2626' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>

      {/* Acquisition */}
      <section>
        <div className="section-header">
          <span className="section-title">Acquisition</span>
        </div>
        <div className="kpi-grid">
          <KpiCard label="Coût acquisition" value={formatCurrency(acqCost)} accent="var(--kpi-accent-blue)" />
          <KpiCard label="Fonds propres" value={formatCurrency(property.equity)} accent="var(--kpi-accent-violet)" />
          <KpiCard label="Valeur actuelle" value={formatCurrency(kpi.currentValue)} accent="var(--kpi-accent-sky)" />
          <KpiCard label="CRD total" value={formatCurrency(kpi.totalCRD)} accent="var(--kpi-accent-amber)" />
          <KpiCard
            label="Valeur nette"
            value={formatCurrency(kpi.netValue)}
            positive={kpi.netValue > acqCost}
            accent={kpi.netValue > acqCost ? 'var(--color-positive)' : undefined}
          />
        </div>
      </section>

      {/* KPI période */}
      <section>
        <div className="section-header">
          <span className="section-title">KPI — Période {periodLabel}</span>
        </div>
        <div className="kpi-grid">
          <KpiCard label="Loyers" value={formatCurrency(kpi.realRents)} positive={kpi.realRents > 0} />
          <KpiCard label="Charges non récup." value={formatCurrency(kpi.nonRecoverableCharges)} accent="var(--kpi-accent-rose)" />
          <KpiCard label="Coût crédit" value={formatCurrency(kpi.creditCost)} accent="var(--kpi-accent-amber)" />
          <KpiCard
            label="CF avant dette"
            value={formatCurrency(kpi.cashflowBeforeDebt)}
            positive={kpi.cashflowBeforeDebt > 0}
            negative={kpi.cashflowBeforeDebt < 0}
          />
          <KpiCard
            label="CF après dette"
            value={formatCurrency(kpi.cashflowAfterDebt)}
            positive={kpi.cashflowAfterDebt > 0}
            negative={kpi.cashflowAfterDebt < 0}
          />
          <KpiCard label="Rdt brut" value={formatPercent(kpi.grossYield)} accent="var(--kpi-accent-violet)" />
          <KpiCard label="Rdt net av. dette" value={formatPercent(kpi.netYieldBeforeDebt)} accent="var(--kpi-accent-sky)" />
          <KpiCard label="Rdt net ap. dette" value={formatPercent(kpi.netYieldAfterDebt)} accent="var(--kpi-accent-sky)" />
          <KpiCard label="Rdt fonds propres" value={formatPercent(kpi.equityYield)} accent="var(--kpi-accent-emerald)" />
        </div>
      </section>

      {/* Graphique */}
      <section>
        <div className="section-header">
          <span className="section-title">Aperçu graphique</span>
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
