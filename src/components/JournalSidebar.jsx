import { useState } from 'react'

export default function JournalSidebar({ journals, selectedId, onSelect }) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? journals.filter(j => j.name.toLowerCase().includes(search.toLowerCase()))
    : journals

  return (
    <nav className="journal-sidebar">
      <div className="journal-sidebar__title">Journals</div>
      <div className="journal-sidebar__search">
        <input
          className="journal-search-input"
          type="search"
          placeholder="Search journals…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search journals"
        />
      </div>
      <div
        className={`journal-link${selectedId === '__agg__' ? ' active' : ''}`}
        onClick={() => onSelect('__agg__')}
      >
        <span>All Journals (aggregated)</span>
      </div>
      {filtered.map(j => (
        <div
          key={j.id}
          className={`journal-link${selectedId === j.id ? ' active' : ''}`}
          onClick={() => onSelect(j.id)}
        >
          <span>{j.name}</span>
          <span
            className={`policy-dot${j.hasPolicy ? '' : ' policy-dot--none'}`}
            title={j.hasPolicy ? `Policy ${j.policyYear}` : 'No policy'}
          />
        </div>
      ))}
      {filtered.length === 0 && search && (
        <div className="journal-sidebar__no-results">No journals match "{search}"</div>
      )}
      <div style={{ fontSize: 9, color: '#adb5bd', padding: '8px 10px 4px', display: 'flex', gap: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#76b5b2', display: 'inline-block' }} />
          has policy
        </span>
      </div>
    </nav>
  )
}
