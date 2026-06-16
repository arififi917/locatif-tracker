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
    <header style={{
      background: 'var(--color-primary)',
      borderBottom: 'none',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 12px rgba(15,23,42,.18)',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        {onBack ? (
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255,255,255,.12)',
              border: '1px solid rgba(255,255,255,.2)',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background var(--transition-fast)',
              whiteSpace: 'nowrap',
            }}
          >
            ← Retour
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              boxShadow: '0 2px 6px rgba(5,150,105,.35)',
            }}>🏠</div>
          </div>
        )}

        <h1 style={{
          fontSize: 15,
          fontWeight: 700,
          flex: 1,
          color: '#fff',
          letterSpacing: '-.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {title}
        </h1>

        {/* Period selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Période</span>
          <select
            style={{
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255,255,255,.2)',
              background: 'rgba(255,255,255,.1)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
            value={period.mode}
            onChange={(e) => handleModeChange(e.target.value as PeriodFilter['mode'])}
          >
            <option value="year">Année</option>
            <option value="rolling_12m">12 derniers mois</option>
          </select>

          {period.mode === 'year' && (
            <select
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255,255,255,.2)',
                background: 'rgba(255,255,255,.1)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
              value={period.year ?? currentYear}
              onChange={(e) => setPeriod({ mode: 'year', year: parseInt(e.target.value) })}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleImport}
            style={{
              background: 'rgba(255,255,255,.1)',
              border: '1px solid rgba(255,255,255,.2)',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            ↑ Import
          </button>
          <button
            onClick={exportData}
            style={{
              background: 'rgba(255,255,255,.1)',
              border: '1px solid rgba(255,255,255,.2)',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            ↓ Export
          </button>
        </div>
      </div>
    </header>
  )
}
