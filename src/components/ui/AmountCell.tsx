import { formatCurrency } from '../../utils/format'

type Props = {
  value: number
  showSign?: boolean
}

export function AmountCell({ value, showSign }: Props) {
  if (!showSign) return <span>{formatCurrency(value)}</span>
  const cls = value > 0 ? 'positive' : value < 0 ? 'negative' : ''
  const formatted = value > 0 ? `+${formatCurrency(value)}` : formatCurrency(value)
  return <span className={cls}>{formatted}</span>
}
