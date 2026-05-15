import { useState, useLayoutEffect, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { FIELDS } from '../data/fields'

const FIELDS_EXCEPT_ALL = FIELDS.filter(f => f.slug !== 'all-fields')
const SIDEBAR_WIDTH_MIN = 300
const SIDEBAR_WIDTH_MAX = 520
const SIDEBAR_NAV_PAD_X = 20

export default function JournalSidebar({ journals, selectedId, onSelect, fieldStats = {}, policyFilter = 'all' }) {
  const [search, setSearch] = useState('')
  const [fieldsOpen, setFieldsOpen] = useState(false)
  const [flyoutMounted, setFlyoutMounted] = useState(false)
  const [flyoutClosing, setFlyoutClosing] = useState(false)
  const [flyoutPos, setFlyoutPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const flyoutRef = useRef(null)
  const { slug: routeSlug } = useParams()

  function openFlyout() {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setFlyoutPos({ top: r.top + window.scrollY, left: r.right + 8 })
    }
    setFlyoutClosing(false)
    setFlyoutMounted(true)
    setFieldsOpen(true)
  }

  function closeFlyout() {
    setFlyoutClosing(true)
    setTimeout(() => { setFlyoutMounted(false); setFieldsOpen(false); setFlyoutClosing(false) }, 200)
  }

  useEffect(() => {
    if (!flyoutMounted) return
    function handleClick(e) {
      if (!flyoutRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target))
        closeFlyout()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [flyoutMounted])
  const navigate = useNavigate()
  const measureRef = useRef(null)
  const [sidebarPx, setSidebarPx] = useState(SIDEBAR_WIDTH_MIN)

  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) { setSidebarPx(SIDEBAR_WIDTH_MIN); return }

    let maxContent = 0
    if (routeSlug === 'all-fields') {
      for (const f of FIELDS_EXCEPT_ALL) {
        el.textContent = f.name
        maxContent = Math.max(maxContent, el.offsetWidth)
      }
    } else {
      const f = FIELDS.find(x => x.slug === routeSlug)
      if (!f) { setSidebarPx(SIDEBAR_WIDTH_MIN); return }
      el.textContent = f.name
      maxContent = el.offsetWidth
    }

    setSidebarPx(Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, maxContent + SIDEBAR_NAV_PAD_X)))
  }, [routeSlug])

  const filtered = search.trim()
    ? journals.filter(j => j.name.toLowerCase().includes(search.toLowerCase()))
    : journals

  const currentField = FIELDS.find(f => f.slug === routeSlug)
  const otherFields = FIELDS_EXCEPT_ALL.filter(f => f.slug !== routeSlug)

  return (
    <nav
      className="journal-sidebar"
      style={{ '--journal-sidebar-width': `${sidebarPx}px` }}
      aria-label="Journal list"
    >
      <span ref={measureRef} className="journal-sidebar__measure" aria-hidden />

      {/* All-fields page: "All Research Fields" entry + field list */}
      {routeSlug === 'all-fields' && (
        <div className="journal-sidebar__subfields" aria-label="Research fields">
          <div className="journal-sidebar__subfields-hint">All research fields — open one</div>
          {(() => {
            const allMeta = FIELDS.find(f => f.slug === 'all-fields')
            const allStats = fieldStats['all-fields']
            return (
              <button
                type="button"
                className="journal-sidebar__subfield-btn journal-sidebar__subfield-btn--all"
                data-icon={allMeta?.icon}
                style={{ marginBottom: 8, background: '#eff6ff', borderColor: '#bfdbfe' }}
                onClick={() => navigate('/field/all-fields')}
              >
                <span className="journal-sidebar__subfield-name">
                  {allMeta?.name}
                  <span className="journal-sidebar__subfield-tags">
                    <span className="sf-tag sf-tag--journals">{allMeta?.totalJournals} journals</span>
                    {policyFilter === 'nopolicy'
                      ? <span className="sf-tag sf-tag--no-policy">{(allMeta?.totalJournals ?? 0) - (allMeta?.withPolicy ?? 0)} without policy</span>
                      : allMeta?.withPolicy > 0 && <span className="sf-tag sf-tag--policy">{allMeta.withPolicy} with policy</span>}
                    {allStats && <span className="sf-tag sf-tag--total">{allStats.totalArticles.toLocaleString()} total</span>}
                    {allStats && <span className="sf-tag sf-tag--eligible">{allStats.eligibleArticles.toLocaleString()} eligible</span>}
                  </span>
                </span>
              </button>
            )
          })()}
          <ul className="journal-sidebar__subfields-list">
            {FIELDS_EXCEPT_ALL.map(f => {
              const stats = fieldStats[f.slug]
              return (
                <li key={f.slug}>
                  <button
                    type="button"
                    className="journal-sidebar__subfield-btn"
                    data-icon={f.icon}
                    onClick={() => navigate(`/field/${f.slug}`)}
                  >
                    <span className="journal-sidebar__subfield-name">
                      {f.name}
                      <span className="journal-sidebar__subfield-tags">
                        <span className="sf-tag sf-tag--journals">{f.totalJournals} journals</span>
                        {policyFilter === 'nopolicy'
                          ? <span className="sf-tag sf-tag--no-policy">{(f.totalJournals ?? 0) - (f.withPolicy ?? 0)} without policy</span>
                          : f.withPolicy > 0 && <span className="sf-tag sf-tag--policy">{f.withPolicy} with policy</span>}
                        {stats && <span className="sf-tag sf-tag--total">{stats.totalArticles.toLocaleString()} total</span>}
                        {stats && <span className="sf-tag sf-tag--eligible">{stats.eligibleArticles.toLocaleString()} eligible</span>}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Per-field page: current field header + collapsible other fields */}
      {routeSlug !== 'all-fields' && (
        <>
          {/* Current field + All Journals (aggregated) — combined */}
          <div ref={triggerRef}>
          <div
            className={`journal-link journal-link--agg${selectedId === '__agg__' ? ' active' : ''}`}
            style={{ marginBottom: 4 }}
            onClick={() => { onSelect('__agg__'); fieldsOpen ? closeFlyout() : openFlyout() }}
          >
            <div className="journal-link__body">
              <span className="journal-link__name">{currentField?.name}</span>
              <span className="journal-link__tags">
                <span className="sf-tag sf-tag--journals">{journals.length} journals</span>
                {policyFilter === 'nopolicy' ? (
                  <span className="sf-tag sf-tag--no-policy">
                    {(currentField?.totalJournals ?? 0) - (currentField?.withPolicy ?? 0)} without policy
                  </span>
                ) : currentField?.withPolicy > 0 ? (
                  <span className="sf-tag sf-tag--policy">{currentField.withPolicy} with policy</span>
                ) : null}
                <span className="sf-tag sf-tag--total">
                  {journals.reduce((s, j) => s + (j.chartData ?? []).reduce((a, r) => a + (r.totalArticles ?? 0), 0), 0).toLocaleString()} total
                </span>
                <span className="sf-tag sf-tag--eligible">
                  {journals.reduce((s, j) => s + (j.chartData ?? []).reduce((a, r) => a + (r.eligibleArticles ?? 0), 0), 0).toLocaleString()} eligible
                </span>
              </span>
            </div>
            <span className="journal-link__chevron">{fieldsOpen ? '▲' : '▼'}</span>
          </div>
          </div>
          {flyoutMounted && createPortal(
            <ul
              ref={flyoutRef}
              className={`journal-sidebar__fields-flyout${flyoutClosing ? ' journal-sidebar__fields-flyout--closing' : ''}`}
              style={{ position: 'absolute', top: flyoutPos.top, left: flyoutPos.left }}
            >
              {[FIELDS.find(f => f.slug === 'all-fields'), ...otherFields].map(f => (
                <li key={f.slug}>
                  <button
                    type="button"
                    className="journal-sidebar__subfield-btn"
                    data-icon={f.icon}
                    style={f.slug === 'all-fields' ? { background: '#eff6ff', borderColor: '#bfdbfe' } : undefined}
                    onClick={() => { closeFlyout(); navigate(`/field/${f.slug}`) }}
                  >
                    <span className="journal-sidebar__subfield-name">
                      {f.name}
                      <span className="journal-sidebar__subfield-tags">
                        <span className="sf-tag sf-tag--journals">{f.totalJournals} journals</span>
                        {policyFilter === 'nopolicy'
                          ? <span className="sf-tag sf-tag--no-policy">{(f.totalJournals ?? 0) - (f.withPolicy ?? 0)} without policy</span>
                          : f.withPolicy > 0 && <span className="sf-tag sf-tag--policy">{f.withPolicy} with policy</span>}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>,
            document.body
          )}

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
          {filtered.map(j => {
            const total = (j.chartData ?? []).reduce((s, r) => s + (r.totalArticles ?? 0), 0)
            const eligible = (j.chartData ?? []).reduce((s, r) => s + (r.eligibleArticles ?? 0), 0)
            return (
              <div
                key={j.id}
                className={`journal-link${selectedId === j.id ? ' active' : ''}`}
                onClick={() => onSelect(j.id)}
              >
                <div className="journal-link__body">
                  <span className="journal-link__name">{j.name}</span>
                  <span className="journal-link__tags">
                    <span className="sf-tag sf-tag--total">{total.toLocaleString()} total</span>
                    <span className="sf-tag sf-tag--eligible">{eligible.toLocaleString()} eligible</span>
                  </span>
                </div>
                {j.hasPolicy && (
                  <span className="policy-badge" title={`Policy since ${j.policyYear}`}>
                    Policy {j.policyYear}
                  </span>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && search && (
            <div className="journal-sidebar__no-results">No journals match "{search}"</div>
          )}
        </>
      )}
    </nav>
  )
}
