import { useState } from 'react'
import { type Property } from '../../domain/types'
import { useAppData } from '../../hooks/useAppData'
import { Modal } from '../ui/Modal'

type Props = {
  property?: Property
  onClose: () => void
}

type FormState = Omit<Property, 'id' | 'createdAt' | 'updatedAt'>

const DEFAULT: FormState = {
  name: '',
  location: '',
  purchasePrice: 0,
  notaryFees: 0,
  agencyFees: 0,
  initialWorks: 0,
  equity: 0,
  currentValue: 0,
}

export function PropertyForm({ property, onClose }: Props) {
  const { addProperty, updateProperty } = useAppData()
  const [form, setForm] = useState<FormState>(property ?? DEFAULT)

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  function setNum(key: keyof FormState, val: string) {
    set(key, parseFloat(val) || 0)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (property) {
      updateProperty({ ...property, ...form })
    } else {
      addProperty(form)
    }
    onClose()
  }

  return (
    <Modal title={property ? 'Modifier le bien' : 'Ajouter un bien'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nom *</label>
            <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Localisation</label>
            <input className="form-input" value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Prix d'achat (€) *</label>
            <input className="form-input" type="number" value={form.purchasePrice} onChange={(e) => setNum('purchasePrice', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Frais notaire (€)</label>
            <input className="form-input" type="number" value={form.notaryFees} onChange={(e) => setNum('notaryFees', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Frais agence (€)</label>
            <input className="form-input" type="number" value={form.agencyFees} onChange={(e) => setNum('agencyFees', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Travaux initiaux (€)</label>
            <input className="form-input" type="number" value={form.initialWorks} onChange={(e) => setNum('initialWorks', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Fonds propres (€)</label>
            <input className="form-input" type="number" value={form.equity} onChange={(e) => setNum('equity', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Valeur actuelle (€)</label>
            <input className="form-input" type="number" value={form.currentValue} onChange={(e) => setNum('currentValue', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    </Modal>
  )
}
