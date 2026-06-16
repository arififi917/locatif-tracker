import { formatCurrency } from '../../utils/format'

type Props = { value: number; showSign?: boolean }

export function AmountCell({ value, showSign }: Props) {
  const cls = value >= 0 ? 'positive' : 'negative'
  return (
    <span className={showSign ? cls : undefined}>
      {showSign && value > 0 ? '+' : ''}{formatCurrency(value)}
    </span>
  )
}
