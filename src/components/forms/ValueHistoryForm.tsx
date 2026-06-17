import { useState } from 'react'
import { type ValueHistory } from '../../domain/types'
import { useAppData } from '../../hooks/useAppData'
import { Modal } from '../ui/Modal'
import { formatCurrency } from '../../utils/format'

type Props = {
  propertyId: string
  entry?: ValueHistory
  onClose: () => void
}

type FormState = {
  date: string
  value: string
  note: string
}

export function ValueHistoryForm({ propertyId, entry, onClose }: Props) {
  const { addValueHistory, updateValueHistory } = useAppData()
  const [form, setForm] = useState<FormState>({
    date: entry?.date ?? new Date().toISOString().slice(0, 10),
    value: entry?.value.toString() ?? '',
    note: entry?.note ?? '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = parseFloat(form.value)
    if (!form.date || isNaN(value) || value <= 0) return
    if (entry) {
      updateValueHistory({ ...entry, date: form.date, value, note: form.note || undefined })
    } else {
      addValueHistory({ propertyId, date: form.date, value, note: form.note || undefined })
    }
    onClose()
  }

  return (
    <Modal title={entry ? 'Modifier l\'estimation' : 'Ajouter une estimation de valeur'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              className="form-input"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Valeur estimée (€) *</label>
            <input
              className="form-input"
              type="number"
              min="0"
              step="1"
              placeholder="ex : 355200"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Note (optionnel)</label>
          <input
            className="form-input"
            placeholder="ex : estimation notaire, annonces similaires..."
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </div>
        {form.value && !isNaN(parseFloat(form.value)) && (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
            = {formatCurrency(parseFloat(form.value))}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    </Modal>
  )
}
