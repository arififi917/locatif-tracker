import { useState } from 'react'
import { useAppData } from '../../hooks/useAppData'
import { Modal } from '../ui/Modal'
import { type RentEvent } from '../../domain/types'

type Props = {
  propertyId: string
  /** Si fourni, on édite / duplique un enregistrement existant */
  initial?: Partial<RentEvent>
  onClose: () => void
}

type FormState = {
  date: string
  label: string
  rentHC: string
  chargesReceived: string
  managementFees: string
}

function toNum(v: string): number {
  return parseFloat(v) || 0
}

function computeTotal(f: FormState): number {
  return toNum(f.rentHC) + toNum(f.chargesReceived) - toNum(f.managementFees)
}

export function RentEventForm({ propertyId, initial, onClose }: Props) {
  const { addRentEvent } = useAppData()

  const [form, setForm] = useState<FormState>({
    date: initial?.date ?? '',
    label: initial?.label ?? 'Loyer',
    rentHC: initial?.rentHC != null ? String(initial.rentHC) : '',
    chargesReceived: initial?.chargesReceived != null ? String(initial.chargesReceived) : '',
    managementFees: initial?.managementFees != null ? String(initial.managementFees) : '',
  })

  // Mode simple : l'utilisateur saisit directement le montant total
  const [simpleMode, setSimpleMode] = useState(
    initial?.rentHC == null && initial?.chargesReceived == null
  )
  const [simpleAmount, setSimpleAmount] = useState(
    initial?.amount != null && initial.rentHC == null ? String(initial.amount) : ''
  )

  const total = simpleMode ? toNum(simpleAmount) : computeTotal(form)
  const hasDetail = !simpleMode

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.date && !simpleMode) return
    const date = form.date

    if (simpleMode) {
      addRentEvent({
        propertyId,
        date,
        amount: toNum(simpleAmount),
        label: form.label,
      })
    } else {
      addRentEvent({
        propertyId,
        date,
        amount: total,
        label: form.label,
        rentHC: toNum(form.rentHC),
        chargesReceived: toNum(form.chargesReceived),
        managementFees: toNum(form.managementFees) || undefined,
      })
    }
    onClose()
  }

  function set(key: keyof FormState, val: string) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  return (
    <Modal title="Enregistrer un loyer" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              className="form-input"
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Libellé</label>
            <input
              className="form-input"
              value={form.label}
              onChange={(e) => set('label', e.target.value)}
            />
          </div>
        </div>

        {/* Toggle mode simple / détailé */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            className={`btn btn-sm ${simpleMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSimpleMode(true)}
          >
            Montant global
          </button>
          <button
            type="button"
            className={`btn btn-sm ${!simpleMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSimpleMode(false)}
          >
            Détail HC + charges
          </button>
        </div>

        {simpleMode ? (
          <div className="form-group">
            <label className="form-label">Montant total encaissé (€) *</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              value={simpleAmount}
              onChange={(e) => setSimpleAmount(e.target.value)}
              required
              autoFocus
            />
          </div>
        ) : (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Loyer HC (€)</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  value={form.rentHC}
                  onChange={(e) => set('rentHC', e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Charges perçues (€)</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  value={form.chargesReceived}
                  onChange={(e) => set('chargesReceived', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Frais de gestion à déduire (€)</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                value={form.managementFees}
                onChange={(e) => set('managementFees', e.target.value)}
                placeholder="0"
              />
            </div>
            <div
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '10px 14px',
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--color-text-muted)' }}>
                Total encaissé = {toNum(form.rentHC).toFixed(2)} + {toNum(form.chargesReceived).toFixed(2)} − {toNum(form.managementFees).toFixed(2)}
              </span>
              <span style={{ fontWeight: 700, fontSize: 16, color: total >= 0 ? 'var(--color-positive)' : 'var(--color-negative)' }}>
                {total.toFixed(2)} €
              </span>
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    </Modal>
  )
}
