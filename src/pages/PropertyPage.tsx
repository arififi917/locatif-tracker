import { useState } from 'react'
import { useAppData } from '../hooks/useAppData'
import { SynthesisTab } from './tabs/SynthesisTab'
import { LoansTab } from './tabs/LoansTab'
import { RentsTab } from './tabs/RentsTab'
import { ExpensesTab } from './tabs/ExpensesTab'
import { PropertyForm } from '../components/forms/PropertyForm'

type Tab = 'synthesis' | 'loans' | 'rents' | 'expenses'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'synthesis', label: 'Synthèse', icon: '📊' },
  { id: 'loans', label: 'Prêts', icon: '🏦' },
  { id: 'rents', label: 'Loyers', icon: '💰' },
  { id: 'expenses', label: 'Dépenses', icon: '📋' },
]

type Props = { propertyId: string; onBack: () => void }

export function PropertyPage({ propertyId, onBack }: Props) {
  const { data, deleteProperty } = useAppData()
  const [activeTab, setActiveTab] = useState<Tab>('synthesis')
  const [showEdit, setShowEdit] = useState(false)

  const property = data.properties.find((p) => p.id === propertyId)
  if (!property) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
        <p style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-muted)' }}>Bien introuvable.</p>
        <button className="btn btn-secondary" onClick={onBack}>← Retour au portefeuille</button>
      </div>
    )
  }

  function handleDelete() {
    if (confirm(`Supprimer "${property!.name}" et toutes ses données ?`)) {
      deleteProperty(propertyId)
      onBack()
    }
  }

  return (
    <div>
      {/* Property header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">{property.name}</h2>
          {property.location && (
            <p className="page-subtitle">
              <span style={{ marginRight: 4 }}>📍</span>{property.location}
            </p>
          )}
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            ✏ Modifier
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            🗑 Supprimer
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span style={{ marginRight: 5 }}>{t.icon}</span>{t.label}
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
