import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { SERIES_CONFIG } from '../data/fields'
import Tooltip from './Tooltip'

const OPTS = [
  { value: 'all',      label: 'All',        tip: 'Show every journal, regardless of whether it has adopted a data visualisation policy.' },
  { value: 'policy',   label: 'Policy',     tip: 'Only journals that have adopted an editorial policy on data visualisation.' },
  { value: 'nopolicy', label: 'Non-Policy', tip: 'Only journals without a published data visualisation policy.' },
]

const SERIES_TIPS = {
  pct_only_bar:         'Share of papers using only bar graphs for continuous data (Barzooka detection).\nLower = better practice.',
  pct_bar_informative:  'Share of papers using both bar graphs and informative plots (dot/violin/box) in the same article.',
  pct_only_informative: 'Share of papers using only informative plots (dot, violin, box) for continuous data.\nHigher = better practice.',
}

const POLICY_LINES_TIP = 'Vertical markers show the year each journal adopted its data visualisation policy.'

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
        <Tooltip key={opt.value} content={opt.tip}>
          <button
            ref={el => btnRefs.current[i] = el}
            className={`seg-switch__btn${value === opt.value ? ' active' : ''}`}
            onClick={() => onChange(opt.value)}
            aria-label={`${opt.label} — ${opt.tip}`}
          >
            {opt.label}
          </button>
        </Tooltip>
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
      <Tooltip content="Toggle which data-visualisation metrics appear on the charts.">
        <span className="filter-bar__label" tabIndex={0}>Show:</span>
      </Tooltip>
      {SERIES_CONFIG.map(s => (
        <Tooltip key={s.key} content={SERIES_TIPS[s.key] ?? s.name}>
          <button
            className={`filter-chip${visibleSeries.has(s.key) ? ' active' : ''}`}
            onClick={() => onToggleSeries(s.key)}
            aria-label={`${s.name} — ${SERIES_TIPS[s.key] ?? ''}`}
          >
            <span className="filter-chip__swatch" style={{ background: s.color }} />
            {s.name}
          </button>
        </Tooltip>
      ))}
      <Tooltip content={POLICY_LINES_TIP}>
        <button
          className={`filter-chip${showPolicyLines ? ' active' : ''}`}
          onClick={onTogglePolicyLines}
          aria-label={`Policy lines — ${POLICY_LINES_TIP}`}
        >
          <span className="filter-chip__swatch" style={{ background: 'rgba(253,231,37,0.9)', border: '1px solid #b8a000' }} />
          Policy lines
        </button>
      </Tooltip>
      <span className="filter-sep">|</span>
      <Tooltip content="Filter which journals are included in the aggregated trend.">
        <span className="filter-bar__label" tabIndex={0}>Journals:</span>
      </Tooltip>
      <SegSwitch value={policyFilter} onChange={onPolicyFilter} />
    </div>,
    slot
  )
}
