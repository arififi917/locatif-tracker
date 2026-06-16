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
    { name: 'Valeur brute', value: kpi.currentValue, color: '#3b82f6' },
    { name: 'Valeur nette', value: kpi.netValue, color: '#10b981' },
    { name: 'Loyers', value: kpi.realRents, color: '#f59e0b' },
    { name: 'Charges', value: kpi.nonRecoverableCharges, color: '#ef4444' },
    { name: 'CF ap. dette', value: kpi.cashflowAfterDebt, color: kpi.cashflowAfterDebt >= 0 ? '#10b981' : '#ef4444' },
  ]

  return (
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, color: 'var(--color-text-muted)' }}>Acquisition</h3>
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KpiCard label="Coût acquisition" value={formatCurrency(acqCost)} />
        <KpiCard label="Fonds propres" value={formatCurrency(property.equity)} />
        <KpiCard label="Valeur actuelle" value={formatCurrency(kpi.currentValue)} />
        <KpiCard label="CRD total" value={formatCurrency(kpi.totalCRD)} />
        <KpiCard label="Valeur nette" value={formatCurrency(kpi.netValue)} positive={kpi.netValue > acqCost} />
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, color: 'var(--color-text-muted)' }}>KPI — Période {periodLabel}</h3>
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <KpiCard label="Loyers" value={formatCurrency(kpi.realRents)} positive={kpi.realRents > 0} />
        <KpiCard label="Charges non récup." value={formatCurrency(kpi.nonRecoverableCharges)} />
        <KpiCard label="Coût crédit" value={formatCurrency(kpi.creditCost)} />
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
        <KpiCard label="Rdt brut" value={formatPercent(kpi.grossYield)} />
        <KpiCard label="Rdt net av. dette" value={formatPercent(kpi.netYieldBeforeDebt)} />
        <KpiCard label="Rdt net ap. dette" value={formatPercent(kpi.netYieldAfterDebt)} />
        <KpiCard label="Rdt fonds propres" value={formatPercent(kpi.equityYield)} />
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, color: 'var(--color-text-muted)' }}>Aperçu graphique</h3>
      <div className="card" style={{ padding: '20px 8px' }}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 4, right: 20, left: 20, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
