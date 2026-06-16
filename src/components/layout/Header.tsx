import { usePeriodFilter } from '../../hooks/usePeriodFilter'
import { useAppData } from '../../hooks/useAppData'
import { type PeriodFilter } from '../../domain/types'

type HeaderProps = {
  title?: string
  onBack?: () => void
}

export function Header({ title = 'Portefeuille Locatif', onBack }: HeaderProps) {
  const { period, setPeriod } = usePeriodFilter()
  const { exportData, importData } = useAppData()

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)

  function handleModeChange(mode: PeriodFilter['mode']) {
    if (mode === 'year') setPeriod({ mode, year: currentYear })
    else setPeriod({ mode, referenceDate: new Date().toISOString().slice(0, 10) })
  }

  function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string)
          importData(parsed)
        } catch {
          alert('Fichier JSON invalide')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <header
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {onBack && (
          <button className="btn btn-secondary btn-sm" onClick={onBack}>
            ← Retour
          </button>
        )}
        <h1 style={{ fontSize: 18, fontWeight: 700, flex: 1 }}>🏠 {title}</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Période :</label>
          <select
            className="form-input"
            style={{ padding: '5px 8px' }}
            value={period.mode}
            onChange={(e) => handleModeChange(e.target.value as PeriodFilter['mode'])}
          >
            <option value="year">Année</option>
            <option value="rolling_12m">12 derniers mois</option>
          </select>

          {period.mode === 'year' && (
            <select
              className="form-input"
              style={{ padding: '5px 8px' }}
              value={period.year ?? currentYear}
              onChange={(e) => setPeriod({ mode: 'year', year: parseInt(e.target.value) })}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>

        <button className="btn btn-secondary btn-sm" onClick={handleImport}>⬆ Importer</button>
        <button className="btn btn-secondary btn-sm" onClick={exportData}>⬇ Exporter</button>
      </div>
    </header>
  )
}
