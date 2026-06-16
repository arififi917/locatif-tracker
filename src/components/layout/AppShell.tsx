import { useState } from 'react'
import { Header } from './Header'
import { PortfolioPage } from '../../pages/PortfolioPage'
import { PropertyPage } from '../../pages/PropertyPage'
import '../../styles/global.css'
import '../../styles/components.css'

export function AppShell() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        onBack={selectedPropertyId ? () => setSelectedPropertyId(null) : undefined}
        title={selectedPropertyId ? undefined : 'Portefeuille Locatif'}
      />
      <main style={{
        flex: 1,
        maxWidth: 1400,
        margin: '0 auto',
        width: '100%',
        padding: '32px 24px',
      }}>
        {selectedPropertyId ? (
          <PropertyPage
            propertyId={selectedPropertyId}
            onBack={() => setSelectedPropertyId(null)}
          />
        ) : (
          <PortfolioPage onSelectProperty={setSelectedPropertyId} />
        )}
      </main>
    </div>
  )
}
