import { useState, useEffect } from 'react'
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
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

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
        try { importData(JSON.parse(ev.target?.result as string)) }
        catch { alert('Fichier JSON invalide') }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const pill: React.CSSProperties = {
    padding: '5px 11px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--header-btn-border)',
    background: 'var(--header-btn-bg)',
    color: 'var(--header-text)',
    fontSize: 12,
    fontWeight: 500,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    outline: 'none',
    letterSpacing: '.01em',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    transition: 'background 100ms ease, border-color 100ms ease',
  }

  return (
    <header style={{
      background: 'var(--header-bg)',
      borderBottom: '1px solid var(--header-border)',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1400, margin: '0 auto',
        height: 56,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {/* Logo */}
        {onBack ? (
          <button onClick={onBack} style={{ ...pill, fontSize: 12 }}>
            ← Retour
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26,
              borderRadius: 6,
              background: 'var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13,
            }}>🏠</div>
            <span style={{
              fontWeight: 800, fontSize: 14,
              color: 'var(--header-text)',
              letterSpacing: '-.02em',
            }}>Locatif</span>
          </div>
        )}

        <div style={{ height: 18, width: 1, background: 'var(--header-border)', margin: '0 4px' }} />

        {/* Title */}
        <span style={{
          fontSize: 13, fontWeight: 500,
          flex: 1,
          color: 'var(--header-muted)',
          letterSpacing: '-.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {title}
        </span>

        {/* Period */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10.5, color: 'var(--header-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.10em' }}>Période</span>
          <select
            style={{ ...pill, paddingRight: 8 } as React.CSSProperties}
            value={period.mode}
            onChange={(e) => handleModeChange(e.target.value as PeriodFilter['mode'])}
          >
            <option value="year">Année</option>
            <option value="rolling_12m">12 mois glissants</option>
          </select>
          {period.mode === 'year' && (
            <select
              style={{ ...pill, paddingRight: 8 } as React.CSSProperties}
              value={period.year ?? currentYear}
              onChange={(e) => setPeriod({ mode: 'year', year: parseInt(e.target.value) })}
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={handleImport} style={pill as React.CSSProperties}>↑ Import</button>
          <button onClick={() => { const { exportData: e } = useAppData(); e() }} style={pill as React.CSSProperties} onClick={exportData}>↓ Export</button>

          <button
            onClick={() => setDark(!dark)}
            style={{
              ...pill,
              width: 32, height: 32,
              padding: 0,
              justifyContent: 'center',
              fontSize: 14,
              borderRadius: 'var(--radius)',
            } as React.CSSProperties}
            title={dark ? 'Mode clair' : 'Mode sombre'}
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  )
}
