import { useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { SynthesisTab } from './tabs/SynthesisTab'
import { LoansTab } from './tabs/LoansTab'
import { RentsTab } from './tabs/RentsTab'
import { ExpensesTab } from './tabs/ExpensesTab'
import { PropertyForm } from '../components/forms/PropertyForm'

type Tab = 'synthesis' | 'loans' | 'rents' | 'expenses'

const TABS: { id: Tab; label: string }[] = [
  { id: 'synthesis', label: '📊 Synthèse' },
  { id: 'loans', label: '🏦 Prêts' },
  { id: 'rents', label: '💰 Loyers' },
  { id: 'expenses', label: '📋 Dépenses' },
]

type Props = { propertyId: string; onBack: () => void }

export function PropertyPage({ propertyId, onBack }: Props) {
  const { data, deleteProperty } = useAppData()
  const [activeTab, setActiveTab] = useState<Tab>('synthesis')
  const [showEdit, setShowEdit] = useState(false)

  const property = data.properties.find((p) => p.id === propertyId)
  if (!property) {
    return <div>Bien introuvable. <button className="btn btn-secondary" onClick={onBack}>Retour</button></div>
  }

  function handleDelete() {
    if (confirm(`Supprimer "${property!.name}" et toutes ses données ?`)) {
      deleteProperty(propertyId)
      onBack()
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>{property.name}</h2>
          {property.location && <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>📍 {property.location}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}>✏ Modifier</button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑 Supprimer</button>
        </div>
      </div>

      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'synthesis' && <SynthesisTab propertyId={propertyId} />}
      {activeTab === 'loans' && <LoansTab propertyId={propertyId} />}
      {activeTab === 'rents' && <RentsTab propertyId={propertyId} />}
      {activeTab === 'expenses' && <ExpensesTab propertyId={propertyId} />}

      {showEdit && <PropertyForm property={property} onClose={() => setShowEdit(false)} />}
    </div>
  )
}
