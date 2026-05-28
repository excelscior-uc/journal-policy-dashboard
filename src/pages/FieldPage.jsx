import { useState, useEffect, useMemo, useRef, useCallback, useDeferredValue, startTransition } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { FIELDS, SERIES_CONFIG } from '../data/fields'
import ChartCard from '../components/ChartCard'
import FilterBar from '../components/FilterBar'
import JournalSidebar from '../components/JournalSidebar'
import CompareModal from '../components/CompareModal'
import FeaturesIntroModal from '../components/FeaturesIntroModal'
import { useJournalNames } from '../data/journalNames'
import { fetchField, getCachedField } from '../utils/fieldDataCache'
import JSZip from 'jszip'

const DEFAULT_VISIBLE = new Set(SERIES_CONFIG.map(s => s.key))

function prefetchOthers(currentSlug) {
  const others = FIELDS.filter(f => f.slug !== currentSlug && !getCachedField(f.slug))
  let i = 0
  function next() {
    if (i >= others.length) return
    fetchField(others[i++].slug).catch(() => {}).finally(next)
  }
  next(); next()
}

export default function FieldPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const getFullName = useJournalNames()
  const [data, setData] = useState(() => getCachedField(slug) ?? null)
  const [compare, setCompare] = useState(null)
  const [error, setError] = useState(null)
  const [selectedJournal, setSelectedJournal] = useState('__agg__')
  const [visibleSeries, setVisibleSeries] = useState(DEFAULT_VISIBLE)
  const [showPolicyLines, setShowPolicyLines] = useState(true)
  const [journalCols, setJournalCols] = useState(2)
  const [fieldCols, setFieldCols] = useState(2)
  const [policyFilter, setPolicyFilter] = useState('all')
  const [journalSearch, setJournalSearch] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)
  const captureRegistryRef = useRef([])

  const registerCapture = useCallback((entry) => {
    if (entry) captureRegistryRef.current.push(entry)
  }, [])

  const deferredVisibleSeries = useDeferredValue(visibleSeries)
  const deferredShowPolicyLines = useDeferredValue(showPolicyLines)
  const deferredPolicyFilter = useDeferredValue(policyFilter)

  const field = FIELDS.find(f => f.slug === slug)

  useEffect(() => {
    captureRegistryRef.current = []
    window.scrollTo(0, 0)
    setError(null)
    const journalParam = new URLSearchParams(location.search).get('journal')
    setSelectedJournal(journalParam || '__agg__')
    setPolicyFilter('all')
    setJournalSearch('')

    const cached = getCachedField(slug)
    if (cached) {
      setData(cached)
      prefetchOthers(slug)
      return
    }

    setData(null)
    fetchField(slug)
      .then(json => { setData(json); prefetchOthers(slug) })
      .catch(e => setError(e.message))
  }, [slug, location.search])

  function toggleSeries(key) {
    setVisibleSeries(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const filteredJournals = useMemo(() => {
    if (!data) return []
    if (deferredPolicyFilter === 'policy') return data.journals.filter(j => j.hasPolicy)
    if (deferredPolicyFilter === 'nopolicy') return data.journals.filter(j => !j.hasPolicy)
    return data.journals
  }, [data, deferredPolicyFilter])

  const aggData = useMemo(() => {
    if (!data) return null
    if (deferredPolicyFilter === 'policy') return data.aggPolicy
    if (deferredPolicyFilter === 'nopolicy') return data.aggNoPolicy
    return data.aggAll
  }, [data, deferredPolicyFilter])

  const activeJournal = useMemo(() => {
    if (!data || selectedJournal === '__agg__') return null
    return data.journals.find(j => j.id === selectedJournal)
  }, [data, selectedJournal])

  const fieldStats = useMemo(() => {
    if (!data?.fields) return {}
    const pickAgg = f => deferredPolicyFilter === 'policy'
      ? (f.aggPolicy ?? f.aggAll)
      : deferredPolicyFilter === 'nopolicy'
      ? (f.aggNoPolicy ?? f.aggAll)
      : f.aggAll
    const perField = Object.fromEntries(data.fields.map(f => {
      const rows = pickAgg(f)?.chartData ?? []
      return [f.slug, {
        totalArticles: rows.reduce((s, r) => s + (r.totalArticles ?? 0), 0),
        eligibleArticles: rows.reduce((s, r) => s + (r.eligibleArticles ?? 0), 0),
      }]
    }))
    const globalRows = aggData?.chartData ?? []
    perField['all-fields'] = {
      totalArticles: globalRows.reduce((s, r) => s + (r.totalArticles ?? 0), 0),
      eligibleArticles: globalRows.reduce((s, r) => s + (r.eligibleArticles ?? 0), 0),
    }
    return perField
  }, [data, deferredPolicyFilter, aggData])

  const aggSubtitle = useMemo(() => {
    if (!aggData?.chartData?.length) return null
    const rows = aggData.chartData
    const n = rows.reduce((s, r) => s + (r.eligibleArticles ?? 0), 0)
    const nTotal = rows.reduce((s, r) => s + (r.totalArticles ?? 0), 0)
    const pct = nTotal > 0 ? ((n / nTotal) * 100).toFixed(1) : '—'
    const journalCount = deferredPolicyFilter === 'policy'
      ? (field?.withPolicy ?? '—')
      : deferredPolicyFilter === 'nopolicy'
      ? ((field?.totalJournals ?? 0) - (field?.withPolicy ?? 0)) || '—'
      : (field?.totalJournals ?? '—')
    return `n = ${n.toLocaleString()} articles; ${pct}% of total (${nTotal.toLocaleString()}) | ${journalCount} journals`
  }, [aggData, field, deferredPolicyFilter])

  const aggTotalJournals = useMemo(() => {
    if (deferredPolicyFilter === 'policy') return field?.withPolicy ?? null
    if (deferredPolicyFilter === 'nopolicy') return ((field?.totalJournals ?? 0) - (field?.withPolicy ?? 0)) || null
    return field?.totalJournals ?? null
  }, [field, deferredPolicyFilter])

  useEffect(() => {
    if (!isCapturing) return
    let cancelled = false

    function waitFrames(n) {
      return new Promise(resolve => {
        let count = 0
        function tick() { ++count >= n ? resolve() : requestAnimationFrame(tick) }
        requestAnimationFrame(tick)
      })
    }

    async function run() {
      try {
        await waitFrames(2)
        if (cancelled) return

        const registry = captureRegistryRef.current
        if (registry.length === 0) return

        const captured = await Promise.all(
          registry.map(entry => entry.capture().then(dataUrl => ({ entry, dataUrl })))
        )

        const seen = new Map()
        const results = captured.map(({ entry, dataUrl }) => {
          const base = entry.title.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').toLowerCase()
          const count = (seen.get(base) ?? 0) + 1
          seen.set(base, count)
          const safeName = count > 1 ? `${base}-${count}` : base
          return { name: `${safeName}.png`, dataUrl }
        })

        const zip = new JSZip()
        for (const { name, dataUrl } of results) {
          const base64 = dataUrl.split(',')[1]
          zip.file(name, base64, { base64: true })
        }

        const blob = await zip.generateAsync({ type: 'blob' })
        const fieldName = (field?.name ?? slug).replace(/\s+/g, '-').toLowerCase()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${fieldName}-charts.zip`
        a.click()
        URL.revokeObjectURL(url)
      } catch (err) {
        console.error('[download-zip] capture failed:', err)
      } finally {
        if (!cancelled) setIsCapturing(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [isCapturing, slug])

  function journalSubtitle(j) {
    const rows = j.chartData ?? []
    const n = rows.reduce((s, r) => s + (r.eligibleArticles ?? 0), 0)
    const nTotal = rows.reduce((s, r) => s + (r.totalArticles ?? 0), 0)
    const pct = nTotal > 0 ? ((n / nTotal) * 100).toFixed(1) : '—'
    return `n = ${n.toLocaleString()} articles; ${pct}% of total (${nTotal.toLocaleString()})`
  }

  if (error) return <div style={{ padding: 24, color: '#c0392b' }}>Failed to load data: {error}</div>

  return (
    <>
      <FeaturesIntroModal />
      <div className="field-layout">
        {data && (
          <JournalSidebar
            journals={filteredJournals}
            selectedId={selectedJournal}
            onSelect={setSelectedJournal}
            fieldStats={fieldStats}
            policyFilter={deferredPolicyFilter}
          />
        )}

        <div key={slug} className="field-main">
          <FilterBar
            visibleSeries={visibleSeries}
            onToggleSeries={toggleSeries}
            showPolicyLines={showPolicyLines}
            onTogglePolicyLines={() => setShowPolicyLines(p => !p)}
            policyFilter={policyFilter}
            onPolicyFilter={setPolicyFilter}
          />

          <div className="chart-area">
          {!data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="chart-card">
                  <div className="chart-card__header"><span>Loading…</span></div>
                  <div className="chart-card__body chart-card__body--agg">
                    <div className="chart-card__skeleton" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {data && selectedJournal === '__agg__' && (
            <>
              <div className="chart-section-title">
                Aggregated Trend
                <button
                  className="chart-section-title__download-btn"
                  onClick={() => setIsCapturing(true)}
                  disabled={isCapturing}
                  title="Download all charts as ZIP"
                >
                  {isCapturing ? '…' : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                      <circle cx="3" cy="9" r="2" />
                      <circle cx="9" cy="9" r="2" />
                      <circle cx="15" cy="9" r="2" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="chart-grid chart-grid--full">
                {aggData && (
                  <ChartCard
                    title={`${field?.name ?? slug} — All Journals`}
                    subtitle={aggSubtitle}
                    chartData={aggData.chartData}
                    policyLines={aggData.policyLines}
                    totalJournals={aggTotalJournals}
                    visibleSeries={deferredVisibleSeries}
                    showPolicyLines={deferredShowPolicyLines}
                    tall
                    forceVisible={isCapturing}
                    onMount={registerCapture}
                    onCompare={() => setCompare({
                      kind: 'field',
                      base: {
                        id: slug,
                        name: field?.name ?? slug,
                        chartData: aggData.chartData,
                        policyLines: aggData.policyLines,
                      },
                      currentFieldSlug: slug,
                    })}
                  />
                )}
              </div>

              {data.fields?.length > 0 ? (
                <>
                  <div className="chart-section-title">
                    Per-Field Charts
                    <span className="chart-section-title__cols">
                      <span className={`cols-label${fieldCols === 1 ? ' active' : ''}`}>1 / row</span>
                      <button
                        className={`cols-toggle${fieldCols === 2 ? ' cols-toggle--right' : ''}`}
                        onClick={() => setFieldCols(n => n === 1 ? 2 : 1)}
                        aria-label="Toggle columns"
                      >
                        <span className="cols-toggle__thumb" />
                      </button>
                      <span className={`cols-label${fieldCols === 2 ? ' active' : ''}`}>2 / row</span>
                    </span>
                  </div>
                  <div className={`chart-grid${fieldCols === 1 ? ' chart-grid--full' : ''}`}>
                    {data.fields.map(f => {
                      const meta = FIELDS.find(x => x.slug === f.slug)
                      const fieldAgg = deferredPolicyFilter === 'policy'
                        ? (f.aggPolicy ?? f.aggAll)
                        : deferredPolicyFilter === 'nopolicy'
                        ? (f.aggNoPolicy ?? f.aggAll)
                        : f.aggAll
                      const rows = fieldAgg?.chartData ?? []
                      const n = rows.reduce((s, r) => s + (r.eligibleArticles ?? 0), 0)
                      const nTotal = rows.reduce((s, r) => s + (r.totalArticles ?? 0), 0)
                      const pct = nTotal > 0 ? ((n / nTotal) * 100).toFixed(1) : '—'
                      const jCount = deferredPolicyFilter === 'policy'
                        ? (meta?.withPolicy ?? '—')
                        : deferredPolicyFilter === 'nopolicy'
                        ? ((meta?.totalJournals ?? 0) - (meta?.withPolicy ?? 0)) || '—'
                        : (meta?.totalJournals ?? '—')
                      const fieldSub = `n = ${n.toLocaleString()} articles; ${pct}% of total (${nTotal.toLocaleString()}) | ${jCount} journals`
                      return (
                        <div
                          key={f.slug}
                          role="button"
                          tabIndex={0}
                          className="field-chart-link"
                          onClick={() => navigate(`/field/${f.slug}`)}
                          onKeyDown={e => e.key === 'Enter' && navigate(`/field/${f.slug}`)}
                        >
                          <ChartCard
                            title={f.field}
                            subtitle={fieldSub}
                            chartData={fieldAgg?.chartData}
                            policyLines={fieldAgg?.policyLines}
                            totalJournals={typeof jCount === 'number' ? jCount : null}
                            visibleSeries={deferredVisibleSeries}
                            showPolicyLines={deferredShowPolicyLines}
                            forceVisible={isCapturing}
                            onMount={registerCapture}
                            onCompare={() => setCompare({
                              kind: 'field',
                              base: {
                                id: f.slug,
                                name: f.field,
                                chartData: fieldAgg?.chartData,
                                policyLines: fieldAgg?.policyLines,
                              },
                              currentFieldSlug: f.slug,
                            })}
                          />
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : filteredJournals.length > 0 ? (
                <>
                  <div className="chart-section-title">
                    Per-Journal Charts
                    <span className="chart-section-title__cols">
                      <span className={`cols-label${journalCols === 1 ? ' active' : ''}`}>1 / row</span>
                      <button
                        className={`cols-toggle${journalCols === 2 ? ' cols-toggle--right' : ''}`}
                        onClick={() => setJournalCols(n => n === 1 ? 2 : 1)}
                        aria-label="Toggle columns"
                      >
                        <span className="cols-toggle__thumb" />
                      </button>
                      <span className={`cols-label${journalCols === 2 ? ' active' : ''}`}>2 / row</span>
                    </span>
                  </div>
                  <div className={`chart-grid${journalCols === 1 ? ' chart-grid--full' : ''}`}>
                    {data.journals.map(j => {
                      const q = journalSearch.trim().toLowerCase()
                      const matchesQuery = !q ||
                        j.name.toLowerCase().includes(q) ||
                        getFullName(j.name, j.name).toLowerCase().includes(q)
                      const show = matchesQuery && (
                        deferredPolicyFilter === 'all' ||
                        (deferredPolicyFilter === 'policy' ? j.hasPolicy : !j.hasPolicy)
                      )
                      return (
                        <div
                          key={j.id}
                          style={show ? undefined : { display: 'none' }}
                          role="button"
                          tabIndex={0}
                          className="field-chart-link"
                          onClick={() => setSelectedJournal(j.id)}
                          onKeyDown={e => e.key === 'Enter' && setSelectedJournal(j.id)}
                        >
                          <ChartCard
                            title={getFullName(j.name, j.name)}
                            meta={j.hasPolicy ? `Policy ${j.policyYear}` : 'No policy'}
                            hasPolicy={j.hasPolicy}
                            subtitle={journalSubtitle(j)}
                            chartData={j.chartData}
                            policyLines={j.policyLines}
                            visibleSeries={deferredVisibleSeries}
                            showPolicyLines={deferredShowPolicyLines}
                            forceVisible={isCapturing}
                            onMount={registerCapture}
                            onCompare={() => setCompare({
                              kind: 'journal',
                              base: {
                                id: j.id,
                                name: getFullName(j.name, j.name),
                                chartData: j.chartData,
                                policyLines: j.policyLines,
                                hasPolicy: j.hasPolicy,
                                policyYear: j.policyYear,
                              },
                              currentFieldSlug: slug,
                            })}
                          />
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : null}
            </>
          )}

          {data && activeJournal && (
            <>
              <div className="chart-section-title" title={activeJournal.name}>
                {getFullName(activeJournal.name, activeJournal.name)}
                {activeJournal.hasPolicy && (
                  <span className="policy-badge">Policy {activeJournal.policyYear}</span>
                )}
              </div>
              <div className="chart-grid chart-grid--full">
                <ChartCard
                  title={getFullName(activeJournal.name, activeJournal.name)}
                  subtitle={journalSubtitle(activeJournal)}
                  chartData={activeJournal.chartData}
                  policyLines={activeJournal.policyLines}
                  visibleSeries={deferredVisibleSeries}
                  showPolicyLines={deferredShowPolicyLines}
                  tall
                  forceVisible={isCapturing}
                  onMount={registerCapture}
                  onCompare={() => setCompare({
                    kind: 'journal',
                    base: {
                      id: activeJournal.id,
                      name: getFullName(activeJournal.name, activeJournal.name),
                      chartData: activeJournal.chartData,
                      policyLines: activeJournal.policyLines,
                      hasPolicy: activeJournal.hasPolicy,
                      policyYear: activeJournal.policyYear,
                    },
                    currentFieldSlug: slug,
                  })}
                />
              </div>
            </>
          )}
          </div>
        </div>
      </div>
      {compare && (
        <CompareModal
          kind={compare.kind}
          base={compare.base}
          currentFieldSlug={compare.currentFieldSlug}
          policyFilter={deferredPolicyFilter}
          onClose={() => setCompare(null)}
        />
      )}
    </>
  )
}
