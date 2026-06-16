import { useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { Modal } from '../ui/Modal'

type Props = { propertyId: string; onClose: () => void }

export function RentEventForm({ propertyId, onClose }: Props) {
  const { addRentEvent } = useAppData()
  const [date, setDate] = useState('')
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('Loyer')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addRentEvent({ propertyId, date, amount: parseFloat(amount) || 0, label })
    onClose()
  }

  return (
    <Modal title="Ajouter un loyer" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Date *</label>
          <input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Montant (€) *</label>
          <input className="form-input" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">Libellé</label>
          <input className="form-input" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    </Modal>
  )
}
