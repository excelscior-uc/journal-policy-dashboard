import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { FIELDS, SERIES_CONFIG } from '../data/fields'
import { fetchField, getCachedField } from '../utils/fieldDataCache'
import { useJournalIndex } from '../data/journalIndex'
import { useJournalNames } from '../data/journalNames'
import { useTheme } from '../hooks/useTheme'

const MAX_ITEMS = 2

const ITEM_STYLES = [
  { dash: undefined, label: 'solid'  },
  { dash: '6 3',     label: 'dashed' },
]

function CompareTooltip({ active, label, payload, items, activeMetrics, hiddenItems, cc }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    if (!active) return
    const el = ref.current
    if (!el) return
    const wrapper = el.parentElement
    if (!wrapper) return
    let chart = wrapper.parentElement
    while (chart && !chart.classList?.contains('recharts-wrapper')) {
      chart = chart.parentElement
    }
    if (!chart) return
    wrapper.style.marginLeft = '0px'
    const chartRect = chart.getBoundingClientRect()
    const wrapRect = wrapper.getBoundingClientRect()
    const pad = 8
    let shift = 0
    if (wrapRect.right > chartRect.right - pad) {
      shift = chartRect.right - pad - wrapRect.right
    } else if (wrapRect.left < chartRect.left + pad) {
      shift = chartRect.left + pad - wrapRect.left
    }
    if (shift !== 0) wrapper.style.marginLeft = `${shift}px`
  })
  if (!active || !payload?.length) return null
  const visibleItems = items.filter(it => !hiddenItems.has(it.id))
  if (!visibleItems.length || !activeMetrics.length) return null
  const valueFor = (itemId, metricKey) => {
    const p = payload.find(p => p.dataKey === `${itemId}::${metricKey}`)
    return p?.value
  }
  const articleFor = (item) => item.chartData?.find(d => d.year === label)
  const fmt = (n) => Number(n).toLocaleString()
  const hasArticleData = visibleItems.some(it => {
    const d = articleFor(it)
    return d && (d.totalArticles != null || d.eligibleArticles != null)
  })
  return (
    <div className="compare-tooltip" ref={ref}>
      <table className="compare-tooltip__table">
        <thead>
          <tr>
            <th className="compare-tooltip__year-cell">{label}</th>
            {visibleItems.map((it, idx) => (
              <th key={it.id} className="compare-tooltip__head-cell" title={it.name}>
                <svg width="18" height="6" aria-hidden="true">
                  <line x1="1" y1="3" x2="17" y2="3"
                    stroke={cc.tickText} strokeWidth="2"
                    strokeDasharray={ITEM_STYLES[idx]?.dash} strokeLinecap="round" />
                </svg>
                <span>{it.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activeMetrics.map(m => (
            <tr key={m.key} className="compare-tooltip__metric-row" style={{ color: m.color }}>
              <td>
                <span className="compare-tooltip__dot" style={{ background: m.color }} />
                <span>{m.name}</span>
              </td>
              {visibleItems.map(it => {
                const v = valueFor(it.id, m.key)
                return (
                  <td key={it.id} className="compare-tooltip__val">
                    {v != null ? `${Number(v).toFixed(1)}%` : '—'}
                  </td>
                )
              })}
            </tr>
          ))}
          {hasArticleData && (
            <>
              <tr className="compare-tooltip__sep">
                <td><span className="compare-tooltip__label-soft">Total articles</span></td>
                {visibleItems.map(it => {
                  const d = articleFor(it)
                  return (
                    <td key={it.id} className="compare-tooltip__val">
                      {d?.totalArticles != null ? fmt(d.totalArticles) : '—'}
                    </td>
                  )
                })}
              </tr>
              <tr>
                <td><span className="compare-tooltip__label-soft">Included articles</span></td>
                {visibleItems.map(it => {
                  const d = articleFor(it)
                  if (!d || d.eligibleArticles == null) return <td key={it.id} className="compare-tooltip__val">—</td>
                  const pct = d.totalArticles ? (d.eligibleArticles / d.totalArticles * 100).toFixed(1) : null
                  return (
                    <td key={it.id} className="compare-tooltip__val">
                      {fmt(d.eligibleArticles)}{pct != null && <span className="compare-tooltip__val-sub"> ({pct}%)</span>}
                    </td>
                  )
                })}
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}

function pickAgg(node, policyFilter) {
  if (!node) return null
  if (policyFilter === 'policy') return node.aggPolicy ?? node.aggAll
  if (policyFilter === 'nopolicy') return node.aggNoPolicy ?? node.aggAll
  return node.aggAll
}

async function resolveFieldChart(slug, policyFilter) {
  const json = getCachedField(slug) ?? await fetchField(slug)
  if (slug === 'all-fields') {
    return pickAgg(json, policyFilter)
  }
  return pickAgg(json, policyFilter)
}

async function resolveJournalChart(journalId, fieldSlug) {
  const json = getCachedField(fieldSlug) ?? await fetchField(fieldSlug)
  const j = json?.journals?.find(x => x.id === journalId)
  if (!j) return null
  return { chartData: j.chartData, policyLines: j.policyLines, hasPolicy: j.hasPolicy, policyYear: j.policyYear, name: j.name }
}

export default function CompareModal({ kind, base, currentFieldSlug, policyFilter = 'all', onClose }) {
  const journalIndex = useJournalIndex()
  const getFullName = useJournalNames()
  const { chartColors: cc } = useTheme()
  const [items, setItems] = useState(() => [{ ...base }])
  const [metrics, setMetrics] = useState(() => new Set(SERIES_CONFIG.map(s => s.key)))
  const [hiddenItems, setHiddenItems] = useState(() => new Set())
  const [showPolicy, setShowPolicy] = useState(true)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const searchRef = useRef(null)
  const dialogRef = useRef(null)
  const captureRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (!menuOpen) return
    function close(e) {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const exportName = useMemo(() => {
    const base = items.map(it => it.name).join('-vs-') || 'comparison'
    return `compare-${base}`.replace(/\s+/g, '-')
  }, [items])

  async function captureChart() {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#fff'
    return toPng(captureRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: bg })
  }

  async function copyAsPng() {
    setMenuOpen(false)
    setBusy(true)
    try {
      const dataUrl = await captureChart()
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    } finally {
      setBusy(false)
    }
  }

  async function downloadAsPng() {
    setMenuOpen(false)
    setBusy(true)
    try {
      const dataUrl = await captureChart()
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${exportName}.png`
      a.click()
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const selectedIds = useMemo(() => new Set(items.map(it => it.id)), [items])

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (kind === 'field') {
      const list = FIELDS.filter(f => !selectedIds.has(f.slug))
      const ranked = list.map(f => {
        const sameField = currentFieldSlug && f.slug !== 'all-fields' && f.slug === currentFieldSlug ? -1 : 0
        return { ...f, _rank: sameField }
      })
      const filtered = q ? ranked.filter(f => f.name.toLowerCase().includes(q) || f.slug.includes(q)) : ranked
      return filtered.slice(0, 50).map(f => ({
        id: f.slug,
        primary: f.name,
        secondary: `${f.totalJournals} journals · ${f.withPolicy} with policy`,
        icon: f.icon,
        policyYear: null,
      }))
    }
    if (!journalIndex) return []
    const inSameField = (j) => !currentFieldSlug || j.fields?.some(f => f.slug === currentFieldSlug)
    const sameFieldFirst = (a, b) => Number(!inSameField(a)) - Number(!inSameField(b))
    const filtered = journalIndex
      .filter(j => !selectedIds.has(j.id))
      .filter(j => {
        if (q) {
          const full = getFullName(j.name, j.name).toLowerCase()
          return j.name.toLowerCase().includes(q) || full.includes(q)
        }
        return inSameField(j)
      })
      .sort(sameFieldFirst)
      .slice(0, 50)
    return filtered.map(j => {
      const sameField = currentFieldSlug ? j.fields?.find(f => f.slug === currentFieldSlug) : null
      const secondary = sameField
        ? sameField.name
        : (j.fields?.map(f => f.name).join(', ') ?? '')
      return {
        id: j.id,
        primary: getFullName(j.name, j.name),
        secondary,
        icon: null,
        policyYear: j.hasPolicy ? j.policyYear : null,
        _journal: j,
      }
    })
  }, [kind, query, journalIndex, selectedIds, currentFieldSlug, getFullName])

  useEffect(() => { setActive(0) }, [query, kind])

  async function addItem(cand) {
    if (items.length >= MAX_ITEMS) return
    if (kind === 'field') {
      const agg = await resolveFieldChart(cand.id, policyFilter)
      if (!agg) return
      setItems(prev => [...prev, {
        id: cand.id,
        name: cand.primary,
        chartData: agg.chartData,
        policyLines: agg.policyLines,
      }])
    } else {
      const j = cand._journal
      const fieldSlug = j.fields?.[0]?.slug
      if (!fieldSlug) return
      const data = await resolveJournalChart(j.id, fieldSlug)
      if (!data) return
      setItems(prev => [...prev, {
        id: j.id,
        name: getFullName(j.name, j.name),
        chartData: data.chartData,
        policyLines: data.policyLines,
        hasPolicy: data.hasPolicy,
        policyYear: data.policyYear,
        fieldName: j.fields?.[0]?.name,
      }])
    }
    setQuery('')
    searchRef.current?.focus()
  }

  function removeItem(id) {
    setItems(prev => prev.filter(it => it.id !== id))
  }

  const activeMetrics = useMemo(
    () => SERIES_CONFIG.filter(s => metrics.has(s.key)),
    [metrics]
  )

  const policyYearSet = useMemo(() => {
    const set = new Set()
    items.forEach(it => {
      if (hiddenItems.has(it.id)) return
      ;(it.policyLines ?? []).forEach(pl => { if (pl?.year) set.add(pl.year) })
      if (it.hasPolicy && it.policyYear) set.add(it.policyYear)
    })
    return set
  }, [items, hiddenItems])

  const policyMarkers = useMemo(() => {
    const out = []
    items.forEach((it, idx) => {
      const dash = ITEM_STYLES[idx]?.dash
      const lines = Array.isArray(it.policyLines) ? it.policyLines : []
      if (lines.length > 0) {
        lines.forEach(pl => {
          const m = pl.label?.match(/(\d+(?:\.\d+)?)\s*%/)
          const pct = m ? parseFloat(m[1]) : null
          const valid = pl.count != null ? pl.count > 0 : pct != null ? pct > 0 : true
          if (!valid) return
          out.push({
            itemId: it.id,
            itemName: it.name,
            dash,
            year: pl.year,
            count: pl.count ?? null,
            pct,
          })
        })
      } else if (it.hasPolicy && it.policyYear) {
        out.push({ itemId: it.id, itemName: it.name, dash, year: it.policyYear, count: null, pct: null })
      }
    })
    return out
  }, [items])

  const mergedRows = useMemo(() => {
    const years = new Set()
    items.forEach(it => it.chartData?.forEach(d => years.add(d.year)))
    items.forEach(it => (it.policyLines ?? []).forEach(pl => pl?.year && years.add(pl.year)))
    if (years.size === 0) return []
    const arr = [...years]
    const min = Math.min(...arr) - 1
    const max = Math.max(...arr) + 1
    const rows = []
    for (let y = min; y <= max; y++) {
      const row = { year: y }
      items.forEach(it => {
        const d = it.chartData?.find(x => x.year === y)
        if (!d) return
        activeMetrics.forEach(m => {
          if (d[m.key] != null) row[`${it.id}::${m.key}`] = d[m.key]
        })
      })
      rows.push(row)
    }
    return rows
  }, [items, activeMetrics])

  function toggleMetric(key) {
    setMetrics(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function toggleItemHidden(id) {
    setHiddenItems(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function onSearchKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, candidates.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && candidates[active]) { e.preventDefault(); addItem(candidates[active]) }
  }

  const title = kind === 'field' ? 'Compare research fields' : 'Compare journals'
  const searchPlaceholder = kind === 'field'
    ? 'Search fields…'
    : (journalIndex ? 'Search journals…' : 'Loading journals…')

  return (
    <div className="compare-modal__backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="compare-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-label={title}>
        <header className="compare-modal__header">
          <div>
            <h2 className="compare-modal__title">{title}</h2>
            <div className="compare-modal__subtitle">Pick up to {MAX_ITEMS}. Color = metric, line style = item.</div>
          </div>
          <button className="compare-modal__close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="compare-modal__body">
          <aside className="compare-modal__sidebar">

            <div className="compare-modal__selected">
              <div className="compare-modal__section-title">Selected ({items.length}/{MAX_ITEMS})</div>
              <ul className="compare-modal__chips">
                {items.map((it, idx) => {
                  const dash = ITEM_STYLES[idx]?.dash
                  return (
                    <li key={it.id} className="compare-modal__chip">
                      <svg width="28" height="10" aria-hidden="true" className="compare-modal__chip-swatch">
                        <line x1="1" y1="5" x2="27" y2="5" stroke={cc.tickText} strokeWidth="2.2"
                          strokeDasharray={dash} strokeLinecap="round" />
                      </svg>
                      <span className="compare-modal__chip-name" title={it.name}>{it.name}</span>
                      {idx === 0 && <span className="compare-modal__chip-base">base</span>}
                      <button className="compare-modal__chip-remove" onClick={() => removeItem(it.id)} aria-label={`Remove ${it.name}`}>×</button>
                    </li>
                  )
                })}
                {items.length === 0 && (
                  <li className="compare-modal__chips-empty">No items. Pick {kind === 'field' ? 'fields' : 'journals'} below.</li>
                )}
              </ul>
            </div>

            <div className="compare-modal__search-wrap">
              <div className="compare-modal__section-title">
                {kind === 'field' ? 'Add a field' : 'Add a journal'}
              </div>
              <input
                ref={searchRef}
                type="text"
                className="compare-modal__search"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKey}
                disabled={items.length >= MAX_ITEMS || (kind === 'journal' && !journalIndex)}
              />
              <div className="compare-modal__results" role="listbox">
                {candidates.length === 0 && (
                  <div className="compare-modal__empty">
                    {items.length >= MAX_ITEMS ? 'Maximum reached.' : 'No matches.'}
                  </div>
                )}
                {candidates.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    className={`compare-modal__result${i === active ? ' active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => addItem(c)}
                  >
                    <div className="compare-modal__result-primary">
                      {c.icon && <span className="compare-modal__result-icon">{c.icon}</span>}
                      <span className="compare-modal__result-name">{c.primary}</span>
                      {c.policyYear && (
                        <span className="policy-badge compare-modal__result-policy">Policy {c.policyYear}</span>
                      )}
                    </div>
                    {c.secondary && <div className="compare-modal__result-secondary">{c.secondary}</div>}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="compare-modal__chart">
            <div className="compare-modal__chart-toolbar">
              <div
                className="chart-card__menu"
                ref={menuRef}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="chart-card__menu-btn"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o) }}
                  disabled={busy || mergedRows.length === 0}
                  title="Export chart"
                  aria-label="Export chart"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  {busy ? '…' : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                      <circle cx="3" cy="9" r="2" />
                      <circle cx="9" cy="9" r="2" />
                      <circle cx="15" cy="9" r="2" />
                    </svg>
                  )}
                </button>
                {menuOpen && (
                  <div className="chart-card__menu-dropdown" role="menu">
                    <button
                      type="button"
                      className="chart-card__menu-item"
                      onClick={(e) => { e.stopPropagation(); copyAsPng() }}
                      role="menuitem"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy as PNG
                    </button>
                    <button
                      type="button"
                      className="chart-card__menu-item"
                      onClick={(e) => { e.stopPropagation(); downloadAsPng() }}
                      role="menuitem"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download as PNG
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="compare-modal__capture" ref={captureRef}>
            <div className="compare-modal__chart-legend">
              <div className="compare-modal__legend-row" role="group" aria-label="Series">
                {SERIES_CONFIG.map(s => {
                  const on = metrics.has(s.key)
                  return (
                    <button
                      key={s.key}
                      type="button"
                      aria-pressed={on}
                      className={`compare-modal__legend-toggle${on ? '' : ' is-off'}`}
                      onClick={() => toggleMetric(s.key)}
                      title={on ? `Hide ${s.name}` : `Show ${s.name}`}
                    >
                      <svg width="18" height="6" aria-hidden="true">
                        <line x1="1" y1="3" x2="17" y2="3"
                          stroke={on ? s.color : cc.axisLine} strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      {s.name}
                    </button>
                  )
                })}
                <button
                  type="button"
                  aria-pressed={showPolicy}
                  className={`compare-modal__legend-toggle${showPolicy ? '' : ' is-off'}`}
                  onClick={() => setShowPolicy(v => !v)}
                  title={showPolicy ? 'Hide policy lines' : 'Show policy lines'}
                >
                  <svg width="18" height="6" aria-hidden="true">
                    <line x1="1" y1="3" x2="17" y2="3"
                      stroke={showPolicy ? '#d4a017' : cc.axisLine} strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Policy lines
                </button>
              </div>
              <div className="compare-modal__legend-row compare-modal__legend-row--styles" role="group" aria-label="Items">
                {items.map((it, idx) => {
                  const on = !hiddenItems.has(it.id)
                  return (
                    <button
                      key={it.id}
                      type="button"
                      aria-pressed={on}
                      className={`compare-modal__legend-toggle${on ? '' : ' is-off'}`}
                      onClick={() => toggleItemHidden(it.id)}
                      title={`${on ? 'Hide' : 'Show'} ${it.name}`}
                    >
                      <svg width="28" height="10" aria-hidden="true">
                        <line x1="1" y1="5" x2="27" y2="5"
                          stroke={on ? cc.tickText : cc.axisLine} strokeWidth="2.2"
                          strokeDasharray={ITEM_STYLES[idx]?.dash} strokeLinecap="round" />
                      </svg>
                      {it.name}
                    </button>
                  )
                })}
              </div>
            </div>
            {mergedRows.length === 0 ? (
              <div className="compare-modal__chart-empty">No data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mergedRows} margin={{ top: 24, right: 16, left: 4, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={cc.grid} />
                  <XAxis
                    dataKey="year"
                    interval={0}
                    tick={(props) => {
                      const { x, y, payload } = props
                      const isPolicy = showPolicy && policyYearSet.has(payload.value)
                      return (
                        <g transform={`translate(${x},${y}) rotate(-40)`}>
                          {isPolicy && (
                            <rect x={-30} y={-8} width={36} height={15} rx={3} ry={3}
                              fill={cc.policyTickBg} stroke={cc.policyTickStroke} strokeWidth={1} />
                          )}
                          <text x={isPolicy ? -12 : 0} y={0} textAnchor={isPolicy ? 'middle' : 'end'} dominantBaseline="middle"
                            fontSize={11} fontWeight={isPolicy ? 700 : 400}
                            fill={isPolicy ? cc.policyTickText : cc.tickText}>
                            {payload.value}
                          </text>
                        </g>
                      )
                    }}
                    height={46}
                    tickMargin={4}
                    tickLine={{ stroke: cc.tickLine }}
                    axisLine={{ stroke: cc.axisLine }}
                    label={{ value: 'Year', position: 'insideBottom', offset: -4, fontSize: 11, fill: cc.axisLabel, fontWeight: 700 }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: cc.tickText }}
                    domain={[0, 100]}
                    unit="%"
                    label={{ value: '% Papers', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: cc.axisLabel, fontWeight: 700, dy: 30 }}
                  />
                  <Tooltip
                    cursor={{ stroke: cc.axisLine, strokeDasharray: '3 3' }}
                    wrapperStyle={{ outline: 'none', zIndex: 10, pointerEvents: 'none' }}
                    offset={16}
                    isAnimationActive={false}
                    content={(props) => (
                      <CompareTooltip
                        {...props}
                        items={items}
                        activeMetrics={activeMetrics}
                        hiddenItems={hiddenItems}
                        cc={cc}
                      />
                    )}
                  />
                  {showPolicy && policyMarkers.filter(pm => !hiddenItems.has(pm.itemId)).map((pm, i) => {
                    const w = pm.count != null
                      ? Math.max(3, Math.min(12, 3 + pm.count * 1.2))
                      : pm.pct != null
                      ? Math.max(3, Math.min(12, 3 + pm.pct * 0.4))
                      : 4
                    return (
                      <ReferenceLine
                        key={`pol-${pm.itemId}-${pm.year}-${i}`}
                        x={pm.year}
                        stroke={cc.policyMarker}
                        strokeWidth={w}
                        strokeDasharray={pm.dash ?? '0'}
                        isAnimationActive={false}
                        label={{
                          value: pm.year,
                          position: 'top',
                          fill: cc.policyTickText,
                          fontSize: 9,
                          fontWeight: 700,
                        }}
                      />
                    )
                  })}
                  {items.flatMap((it, idx) => hiddenItems.has(it.id) ? [] : activeMetrics.map(m => (
                    <Line
                      key={`${it.id}::${m.key}`}
                      type="monotone"
                      dataKey={`${it.id}::${m.key}`}
                      name={`${it.name} · ${m.name}`}
                      stroke={m.color}
                      strokeWidth={2}
                      strokeDasharray={ITEM_STYLES[idx]?.dash}
                      dot={{ r: 2.5 }}
                      connectNulls
                      isAnimationActive={false}
                    />
                  )))}
                </LineChart>
              </ResponsiveContainer>
            )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
