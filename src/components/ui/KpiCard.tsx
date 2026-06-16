type KpiCardProps = {
  label: string
  value: string
  positive?: boolean
  negative?: boolean
  sub?: string
  accent?: string
  tooltip?: string
}

export function KpiCard({ label, value, positive, negative, sub, accent, tooltip }: KpiCardProps) {
  const cls = positive ? 'positive' : negative ? 'negative' : ''
  const defaultAccent = positive
    ? 'var(--positive)'
    : negative
    ? 'var(--negative)'
    : 'var(--green)'
  return (
    <div
      className="kpi-card"
      style={{ '--kpi-accent': accent ?? defaultAccent } as React.CSSProperties}
    >
      <div className="kpi-label-row">
        <div className="kpi-label">{label}</div>
        {tooltip && (
          <div className="kpi-info" tabIndex={0} aria-label={`Info ${label}`}>
            <span className="kpi-info-icon">i</span>
            <div className="kpi-tooltip" role="tooltip">{tooltip}</div>
          </div>
        )}
      </div>
      <div className={`kpi-value ${cls}`}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}
