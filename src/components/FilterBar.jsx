import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { SERIES_CONFIG } from '../data/fields'

const OPTS = [
  { value: 'all',      label: 'All' },
  { value: 'policy',   label: 'Policy' },
  { value: 'nopolicy', label: 'Non-Policy' },
]

function SegSwitch({ value, onChange }) {
  const btnRefs = useRef([])
  const pillRef = useRef(null)

  function positionPill(idx) {
    const btn = btnRefs.current[idx]
    const pill = pillRef.current
    if (!btn || !pill) return
    pill.style.transform = `translate3d(${btn.offsetLeft}px,0,0)`
    pill.style.width = `${btn.offsetWidth}px`
  }

  useLayoutEffect(() => {
    positionPill(OPTS.findIndex(o => o.value === value))
  }, [value])

  return (
    <div className="seg-switch">
      <span ref={pillRef} className="seg-switch__pill" />
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
  const [slot, setSlot] = useState(() => document.getElementById('nav-filter-slot'))
  useEffect(() => {
    if (slot) return
    setSlot(document.getElementById('nav-filter-slot'))
  }, [slot])
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
