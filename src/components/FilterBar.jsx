import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { SERIES_CONFIG } from '../data/fields'

const OPTS = [
  { value: 'all',      label: 'All' },
  { value: 'policy',   label: 'Policy' },
  { value: 'nopolicy', label: 'Non-Policy' },
]

function SegSwitch({ value, onChange }) {
  const containerRef = useRef(null)
  const btnRefs = useRef([])
  const [pill, setPill] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const idx = OPTS.findIndex(o => o.value === value)
    const btn = btnRefs.current[idx]
    const container = containerRef.current
    if (!btn || !container) return
    const bRect = btn.getBoundingClientRect()
    const cRect = container.getBoundingClientRect()
    setPill({ left: bRect.left - cRect.left, width: bRect.width })
  }, [value])

  return (
    <div className="seg-switch" ref={containerRef}>
      <span
        className="seg-switch__pill"
        style={{ left: pill.left, width: pill.width }}
      />
      {OPTS.map((opt, i) => (
        <button
          key={opt.value}
          ref={el => btnRefs.current[i] = el}
          className={`seg-switch__btn${value === opt.value ? ' active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function FilterBar({ visibleSeries, onToggleSeries, showPolicyLines, onTogglePolicyLines, policyFilter, onPolicyFilter }) {
  const slot = document.getElementById('nav-filter-slot')
  if (!slot) return null

  return createPortal(
    <div className="filter-bar">
      <span className="filter-bar__label">Show:</span>
      {SERIES_CONFIG.map(s => (
        <button
          key={s.key}
          className={`filter-chip${visibleSeries.has(s.key) ? ' active' : ''}`}
          onClick={() => onToggleSeries(s.key)}
        >
          <span className="filter-chip__swatch" style={{ background: s.color }} />
          {s.name}
        </button>
      ))}
      <button
        className={`filter-chip${showPolicyLines ? ' active' : ''}`}
        onClick={onTogglePolicyLines}
      >
        <span className="filter-chip__swatch" style={{ background: 'rgba(253,231,37,0.9)', border: '1px solid #b8a000' }} />
        Policy lines
      </button>
      <span className="filter-sep">|</span>
      <span className="filter-bar__label">Journals:</span>
      <SegSwitch value={policyFilter} onChange={onPolicyFilter} />
    </div>,
    slot
  )
}
