import { memo, useState, useLayoutEffect, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { FIELDS } from '../data/fields'

const FIELDS_EXCEPT_ALL = FIELDS.filter(f => f.slug !== 'all-fields')

function ArticlesBar({ total = 0, eligible = 0 }) {
  const nonElig = Math.max(0, total - eligible)
  const ePct = total > 0 ? (eligible / total) * 100 : 0
  const nPct = total > 0 ? (nonElig / total) * 100 : 0
  const fmt = n => n.toLocaleString()
  return (
    <div className="articles-bar" aria-label={`${fmt(total)} total articles, ${fmt(eligible)} eligible`}>
      <span className="policy-bar__total articles-bar__total">{fmt(total)} total</span>
      <div className="policy-bar__track">
        {ePct > 0 && (
          <div
            className="policy-bar__seg articles-bar__seg--eligible"
            style={{ flexBasis: `${ePct}%` }}
            title={`${fmt(eligible)} eligible`}
          >
            <span className="policy-bar__lbl">{fmt(eligible)}</span>
          </div>
        )}
        {nPct > 0 && (
          <div
            className="policy-bar__seg articles-bar__seg--non"
            style={{ flexBasis: `${nPct}%` }}
            title={`${fmt(nonElig)} not eligible`}
          >
            <span className="policy-bar__lbl articles-bar__lbl--dark">{fmt(nonElig)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function PolicyBar({ total = 0, withPolicy = 0, filter = 'all' }) {
  const without = Math.max(0, total - withPolicy)
  const pPct = total > 0 ? (withPolicy / total) * 100 : 0
  const nPct = total > 0 ? (without / total) * 100 : 0
  return (
    <div className="policy-bar" data-filter={filter} aria-label={`${total} journals: ${withPolicy} with policy, ${without} without`}>
      <span className="policy-bar__total">{total} journals</span>
      <div className="policy-bar__track">
        {pPct > 0 && (
          <div
            className="policy-bar__seg policy-bar__seg--policy"
            style={{ width: `${pPct}%` }}
            title={`${withPolicy} with policy`}
          >
            {pPct >= 14 && <span className="policy-bar__lbl">{withPolicy}</span>}
          </div>
        )}
        {nPct > 0 && (
          <div
            className="policy-bar__seg policy-bar__seg--no"
            style={{ width: `${nPct}%` }}
            title={`${without} without policy`}
          >
            {nPct >= 14 && <span className="policy-bar__lbl">{without}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
const SIDEBAR_WIDTH_MIN = 300
const SIDEBAR_WIDTH_MAX = 520
const SIDEBAR_NAV_PAD_X = 20

function JournalSidebar({ journals, selectedId, onSelect, fieldStats = {}, policyFilter = 'all' }) {
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
          <div className="bar-legend" aria-label="Bar color legend">
            <div className="bar-legend__item">
              <span className="bar-legend__label">Journals</span>
              <div className="bar-legend__bar">
                <div className="bar-legend__seg bar-legend__seg--policy">with policy</div>
                <div className="bar-legend__seg bar-legend__seg--no">no policy</div>
              </div>
            </div>
            <div className="bar-legend__item">
              <span className="bar-legend__label">Articles</span>
              <div className="bar-legend__bar">
                <div className="bar-legend__seg bar-legend__seg--eligible">eligible</div>
                <div className="bar-legend__seg bar-legend__seg--non bar-legend__seg--dark">not eligible</div>
              </div>
            </div>
          </div>
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
                    <PolicyBar total={allMeta?.totalJournals ?? 0} withPolicy={allMeta?.withPolicy ?? 0} filter={policyFilter} />
                    {allStats && <ArticlesBar total={allStats.totalArticles} eligible={allStats.eligibleArticles} />}
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
                        <PolicyBar total={f.totalJournals ?? 0} withPolicy={f.withPolicy ?? 0} filter={policyFilter} />
                        {stats && <ArticlesBar total={stats.totalArticles} eligible={stats.eligibleArticles} />}
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
            onClick={() => onSelect('__agg__')}
          >
            <div className="journal-link__body">
              <span className="journal-link__name">{currentField?.name}</span>
              <span className="journal-link__tags">
                <PolicyBar total={currentField?.totalJournals ?? journals.length} withPolicy={currentField?.withPolicy ?? 0} filter={policyFilter} />
                <ArticlesBar
                  total={journals.reduce((s, j) => s + (j.chartData ?? []).reduce((a, r) => a + (r.totalArticles ?? 0), 0), 0)}
                  eligible={journals.reduce((s, j) => s + (j.chartData ?? []).reduce((a, r) => a + (r.eligibleArticles ?? 0), 0), 0)}
                />
              </span>
            </div>
            <button
              type="button"
              className="journal-link__chevron"
              onClick={(e) => { e.stopPropagation(); fieldsOpen ? closeFlyout() : openFlyout() }}
              aria-label={fieldsOpen ? 'Close fields menu' : 'Open fields menu'}
            >
              {fieldsOpen ? '▲' : '▼'}
            </button>
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
                        <PolicyBar total={f.totalJournals ?? 0} withPolicy={f.withPolicy ?? 0} filter={policyFilter} />
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
                    <ArticlesBar total={total} eligible={eligible} />
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

export default memo(JournalSidebar)
