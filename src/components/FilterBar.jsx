import { SERIES_CONFIG } from '../data/fields'

export default function FilterBar({ visibleSeries, onToggleSeries, policyFilter, onPolicyFilter }) {
  return (
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
      <span className="filter-sep">|</span>
      <span className="filter-bar__label">Journals:</span>
      <div className="seg-switch">
        {[
          { value: 'all',      label: 'All' },
          { value: 'policy',   label: 'Policy' },
          { value: 'nopolicy', label: 'Non-Policy' },
        ].map(opt => (
          <button
            key={opt.value}
            className={`seg-switch__btn${policyFilter === opt.value ? ' active' : ''}`}
            onClick={() => onPolicyFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
