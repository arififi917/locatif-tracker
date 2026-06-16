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
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
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

  const selectStyle: React.CSSProperties = {
    padding: '5px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--header-btn-border)',
    background: 'var(--header-btn-bg)',
    color: 'var(--header-text)',
    fontSize: 11.5,
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    outline: 'none',
    letterSpacing: '.02em',
  }

  const actionBtnStyle: React.CSSProperties = {
    background: 'var(--header-btn-bg)',
    border: '1px solid var(--header-btn-border)',
    color: 'var(--header-text)',
    borderRadius: 'var(--radius-sm)',
    padding: '5px 12px',
    fontSize: 11.5,
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    letterSpacing: '.02em',
    transition: 'background 120ms ease',
  }

  return (
    <header style={{
      background: 'var(--header-bg)',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 0 var(--header-border)',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        height: 58,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>

        {/* Logo / Retour */}
        {onBack ? (
          <button onClick={onBack} style={actionBtnStyle}>
            ← Retour
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--terracotta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}>🏠</div>
          </div>
        )}

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 16,
          fontWeight: 700,
          fontStyle: 'italic',
          flex: 1,
          color: 'var(--header-text)',
          letterSpacing: '-.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {title}
        </h1>

        {/* Period selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--header-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.10em' }}>Période</span>
          <select
            style={selectStyle}
            value={period.mode}
            onChange={(e) => handleModeChange(e.target.value as PeriodFilter['mode'])}
          >
            <option value="year">Année</option>
            <option value="rolling_12m">12 derniers mois</option>
          </select>
          {period.mode === 'year' && (
            <select
              style={selectStyle}
              value={period.year ?? currentYear}
              onChange={(e) => setPeriod({ mode: 'year', year: parseInt(e.target.value) })}
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={handleImport} style={actionBtnStyle}>↑ Import</button>
          <button onClick={exportData} style={actionBtnStyle}>↓ Export</button>

          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(!dark)}
            style={{
              ...actionBtnStyle,
              width: 34,
              height: 34,
              padding: 0,
              justifyContent: 'center',
              fontSize: 15,
              borderRadius: 'var(--radius-sm)',
            }}
            title={dark ? 'Mode clair' : 'Mode sombre'}
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  )
}
