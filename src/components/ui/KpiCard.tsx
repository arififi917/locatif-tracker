type KpiCardProps = {
  label: string
  value: string
  positive?: boolean
  negative?: boolean
  sub?: string
}

export function KpiCard({ label, value, positive, negative, sub }: KpiCardProps) {
  const cls = positive ? 'positive' : negative ? 'negative' : ''
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${cls}`}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
