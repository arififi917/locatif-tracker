import { useState } from 'react'
import { type Loan } from '../../domain/types'
import { useAppData } from '../../hooks/useAppData'
import { Modal } from '../ui/Modal'

type Props = {
  propertyId: string
  loan?: Loan
  onClose: () => void
}

type FormState = Omit<Loan, 'id'>

export function LoanForm({ propertyId, loan, onClose }: Props) {
  const { addLoan, updateLoan } = useAppData()
  const [form, setForm] = useState<FormState>(
    loan ?? {
      propertyId,
      name: '',
      lender: '',
      principal: 0,
      startDate: '',
      endDate: '',
      rate: 0,
      insuranceRate: 0,
      monthlyPayment: 0,
      hasSchedule: false,
    }
  )

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loan) updateLoan({ ...loan, ...form })
    else addLoan(form)
    onClose()
  }

  return (
    <Modal title={loan ? 'Modifier le prêt' : 'Ajouter un prêt'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nom du prêt *</label>
            <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Établissement</label>
            <input className="form-input" value={form.lender ?? ''} onChange={(e) => set('lender', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Capital (€)</label>
            <input className="form-input" type="number" value={form.principal} onChange={(e) => set('principal', parseFloat(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label className="form-label">Taux (%)</label>
            <input className="form-input" type="number" step="0.01" value={form.rate} onChange={(e) => set('rate', parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Taux assurance (%)</label>
            <input className="form-input" type="number" step="0.01" value={form.insuranceRate ?? 0} onChange={(e) => set('insuranceRate', parseFloat(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label className="form-label">Mensualité (€)</label>
            <input className="form-input" type="number" value={form.monthlyPayment ?? 0} onChange={(e) => set('monthlyPayment', parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date début</label>
            <input className="form-input" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Date fin</label>
            <input className="form-input" type="date" value={form.endDate ?? ''} onChange={(e) => set('endDate', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    </Modal>
  )
}
