type KpiCardProps = {
  label: string
  value: string
  positive?: boolean
  negative?: boolean
  sub?: string
  accent?: string
}

export function KpiCard({ label, value, positive, negative, sub, accent }: KpiCardProps) {
  const cls = positive ? 'positive' : negative ? 'negative' : ''
  const defaultAccent = positive
    ? 'var(--color-positive)'
    : negative
    ? 'var(--color-negative)'
    : 'var(--terracotta)'
  return (
    <div
      className="kpi-card"
      style={{ '--kpi-accent': accent ?? defaultAccent } as React.CSSProperties}
    >
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${cls}`}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}
