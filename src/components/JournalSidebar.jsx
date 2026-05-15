import { useState, useLayoutEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FIELDS } from '../data/fields'

const FIELDS_EXCEPT_ALL = FIELDS.filter(f => f.slug !== 'all-fields')
const SIDEBAR_WIDTH_MIN = 300
const SIDEBAR_WIDTH_MAX = 520
/** Horizontal padding on `.journal-sidebar` (10px + 10px). */
const SIDEBAR_NAV_PAD_X = 20

export default function JournalSidebar({ journals, selectedId, onSelect, collapsed = false, onToggle }) {
  const [search, setSearch] = useState('')
  const { slug: routeSlug } = useParams()
  const navigate = useNavigate()
  const measureRef = useRef(null)
  const [sidebarPx, setSidebarPx] = useState(SIDEBAR_WIDTH_MIN)

  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) {
      setSidebarPx(SIDEBAR_WIDTH_MIN)
      return
    }

    let maxContent = 0
    if (routeSlug === 'all-fields') {
      for (const f of FIELDS_EXCEPT_ALL) {
        el.textContent = `${f.icon} ${f.name}`
        maxContent = Math.max(maxContent, el.offsetWidth)
      }
    } else {
      const f = FIELDS.find(x => x.slug === routeSlug)
      if (!f) {
        setSidebarPx(SIDEBAR_WIDTH_MIN)
        return
      }
      el.textContent = `${f.icon} ${f.name}`
      maxContent = el.offsetWidth
    }

    setSidebarPx(
      Math.min(
        SIDEBAR_WIDTH_MAX,
        Math.max(SIDEBAR_WIDTH_MIN, maxContent + SIDEBAR_NAV_PAD_X)
      )
    )
  }, [routeSlug])

  const filtered = search.trim()
    ? journals.filter(j => j.name.toLowerCase().includes(search.toLowerCase()))
    : journals

  const currentField = FIELDS.find(f => f.slug === routeSlug)

  return (
    <nav
      className={`journal-sidebar${collapsed ? ' journal-sidebar--collapsed' : ''}`}
      style={{ '--journal-sidebar-width': `${sidebarPx}px` }}
      aria-label="Journal list"
    >
      <span ref={measureRef} className="journal-sidebar__measure" aria-hidden />
      {collapsed ? (
        <>
          <button
            type="button"
            className="journal-sidebar__toggle"
            onClick={() => onToggle?.()}
            aria-label="Expand sidebar"
          >›</button>
          {currentField && (
            <div className="journal-sidebar__strip-icon" aria-hidden>{currentField.icon}</div>
          )}
        </>
      ) : (
        <div className="journal-sidebar__toggle-row">
          <button
            type="button"
            className="journal-sidebar__toggle"
            onClick={() => onToggle?.()}
            aria-label="Collapse sidebar"
          >‹</button>
        </div>
      )}
      {!collapsed && (
        <>
          <div className="journal-sidebar__field">
        <label className="journal-sidebar__field-label" htmlFor="sidebar-research-field">
          Research field
        </label>
        <select
          id="sidebar-research-field"
          className="journal-sidebar__field-select"
          value={routeSlug ?? ''}
          onChange={e => navigate(`/field/${e.target.value}`)}
          aria-label="Research field"
        >
          {FIELDS.map(f => (
            <option key={f.slug} value={f.slug}>
              {f.icon} {f.name}
            </option>
          ))}
        </select>
      </div>
      {routeSlug === 'all-fields' && (
        <div className="journal-sidebar__subfields" aria-label="Research fields">
          <div className="journal-sidebar__subfields-hint">All research fields — open one</div>
          <ul className="journal-sidebar__subfields-list">
            {FIELDS_EXCEPT_ALL.map(f => (
              <li key={f.slug}>
                <button
                  type="button"
                  className="journal-sidebar__subfield-btn"
                  onClick={() => navigate(`/field/${f.slug}`)}
                >
                  <span className="journal-sidebar__subfield-ico" aria-hidden>{f.icon}</span>
                  <span className="journal-sidebar__subfield-name">{f.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {routeSlug !== 'all-fields' && (
        <>
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
              {j.hasPolicy && (
                <span className="policy-badge" title={`Policy since ${j.policyYear}`}>
                  {j.policyYear}
                </span>
              )}
            </div>
          ))}
          {filtered.length === 0 && search && (
            <div className="journal-sidebar__no-results">No journals match "{search}"</div>
          )}
          <div className="journal-sidebar__legend">
            <span className="journal-sidebar__legend-item">
              <span className="policy-badge policy-badge--legend" aria-hidden>2023</span>
              has policy
            </span>
          </div>
        </>
      )}
        </>
      )}
    </nav>
  )
}
