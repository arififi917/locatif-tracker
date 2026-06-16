import { useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { EXPENSE_CATEGORIES, type ExpenseEvent } from '../../domain/types'
import { Modal } from '../ui/Modal'

type Props = {
  propertyId: string
  /** Si fourni : pré-remplit le formulaire (duplication) */
  initial?: Partial<ExpenseEvent>
  onClose: () => void
}

export function ExpenseEventForm({ propertyId, initial, onClose }: Props) {
  const { addExpenseEvent } = useAppData()
  const [date, setDate] = useState(initial?.date ?? '')
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [category, setCategory] = useState<string>(initial?.category ?? EXPENSE_CATEGORIES[0])
  const [isRecoverable, setIsRecoverable] = useState(initial?.isRecoverable ?? false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addExpenseEvent({
      propertyId,
      date,
      amount: parseFloat(amount) || 0,
      label,
      category,
      isRecoverable,
    })
    onClose()
  }

  return (
    <Modal title="Enregistrer une dépense" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Montant (€) *</label>
            <input className="form-input" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Catégorie</label>
            <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Libellé</label>
            <input className="form-input" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
        </div>
        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input
            id="recoverable"
            type="checkbox"
            checked={isRecoverable}
            onChange={(e) => setIsRecoverable(e.target.checked)}
          />
          <label htmlFor="recoverable" style={{ fontSize: 13 }}>Charge récupérable (refacturable au locataire)</label>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    </Modal>
  )
}
