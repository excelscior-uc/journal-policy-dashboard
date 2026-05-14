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
      <select
        className="filter-select"
        value={policyFilter}
        onChange={e => onPolicyFilter(e.target.value)}
      >
        <option value="all">All (Policy + Non-Policy)</option>
        <option value="policy">Policy journals only</option>
        <option value="nopolicy">Non-Policy journals only</option>
      </select>
    </div>
  )
}
