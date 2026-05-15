import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FIELDS, SERIES_CONFIG } from '../data/fields'
import ChartCard from '../components/ChartCard'
import FilterBar from '../components/FilterBar'
import JournalSidebar from '../components/JournalSidebar'
import JSZip from 'jszip'

const DEFAULT_VISIBLE = new Set(SERIES_CONFIG.map(s => s.key))

export default function FieldPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [selectedJournal, setSelectedJournal] = useState('__agg__')
  const [visibleSeries, setVisibleSeries] = useState(DEFAULT_VISIBLE)
  const [showPolicyLines, setShowPolicyLines] = useState(true)
  const [journalCols, setJournalCols] = useState(2)
  const [fieldCols, setFieldCols] = useState(2)
  const [policyFilter, setPolicyFilter] = useState('all')
  const [isCapturing, setIsCapturing] = useState(false)
  const captureRegistryRef = useRef([])

  const registerCapture = useCallback((entry) => {
    if (entry) captureRegistryRef.current.push(entry)
  }, [])

  const field = FIELDS.find(f => f.slug === slug)

  useEffect(() => {
    captureRegistryRef.current = []
    window.scrollTo(0, 0)
    setData(null)
    setError(null)
    setSelectedJournal('__agg__')
    fetch(`${import.meta.env.BASE_URL}data/${slug}.json`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(setData)
      .catch(e => setError(e.message))
  }, [slug])

  function toggleSeries(key) {
    setVisibleSeries(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const filteredJournals = useMemo(() => {
    if (!data) return []
    if (policyFilter === 'policy') return data.journals.filter(j => j.hasPolicy)
    if (policyFilter === 'nopolicy') return data.journals.filter(j => !j.hasPolicy)
    return data.journals
  }, [data, policyFilter])

  const aggData = useMemo(() => {
    if (!data) return null
    if (policyFilter === 'policy') return data.aggPolicy
    if (policyFilter === 'nopolicy') return data.aggNoPolicy
    return data.aggAll
  }, [data, policyFilter])

  const activeJournal = useMemo(() => {
    if (!data || selectedJournal === '__agg__') return null
    return data.journals.find(j => j.id === selectedJournal)
  }, [data, selectedJournal])

  const fieldTotal = useMemo(() => {
    if (!data?.aggAll?.chartData) return 0
    return data.aggAll.chartData.reduce((s, r) => s + (r.eligibleArticles ?? 0), 0)
  }, [data])

  const aggSubtitle = useMemo(() => {
    if (!aggData?.chartData) return null
    const n = aggData.chartData.reduce((s, r) => s + (r.eligibleArticles ?? 0), 0)
    const nTotal = aggData.chartData.reduce((s, r) => s + (r.totalArticles ?? 0), 0)
    const pct = nTotal > 0 ? ((n / nTotal) * 100).toFixed(1) : '—'
    const journalCount = policyFilter === 'policy'
      ? (field?.policyJournals ?? '—')
      : policyFilter === 'nopolicy'
      ? ((field?.journals ?? 0) - (field?.policyJournals ?? 0)) || '—'
      : (field?.journals ?? '—')
    return `n = ${n.toLocaleString()} eligible articles; ${pct}% of total | ${journalCount} journals`
  }, [aggData, field, policyFilter])

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
      await waitFrames(2)
      if (cancelled) return

      const registry = captureRegistryRef.current
      const results = await Promise.all(
        registry.map(async entry => {
          const dataUrl = await entry.capture()
          const safeName = entry.title.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').toLowerCase()
          return { name: `${safeName}.png`, dataUrl }
        })
      )

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

      if (!cancelled) setIsCapturing(false)
    }

    run()
    return () => { cancelled = true }
  }, [isCapturing, field, slug])

  function journalSubtitle(j) {
    const n = j.chartData?.reduce((s, r) => s + (r.eligibleArticles ?? 0), 0) ?? 0
    const nTotal = j.chartData?.reduce((s, r) => s + (r.totalArticles ?? 0), 0) ?? 0
    const pct = nTotal > 0 ? ((n / nTotal) * 100).toFixed(1) : '—'
    return `n = ${n.toLocaleString()} eligible articles; ${pct}% of total`
  }

  if (error) return <div style={{ padding: 24, color: '#c0392b' }}>Failed to load data: {error}</div>

  return (
    <>
      <div className="field-layout">
        {data && (
          <JournalSidebar
            journals={filteredJournals}
            selectedId={selectedJournal}
            onSelect={setSelectedJournal}

          />
        )}

        <div className="field-main">
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
                    visibleSeries={visibleSeries}
                    showPolicyLines={showPolicyLines}
                    tall
                    forceVisible={isCapturing}
                    onMount={registerCapture}
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
                      const n = f.aggAll?.chartData?.reduce((s, r) => s + (r.eligibleArticles ?? 0), 0) ?? 0
                      const nTotal = f.aggAll?.chartData?.reduce((s, r) => s + (r.totalArticles ?? 0), 0) ?? 0
                      const pct = nTotal > 0 ? ((n / nTotal) * 100).toFixed(1) : '—'
                      const jCount = f.fieldJournalTotal ?? '—'
                      const fieldSub = `n = ${n.toLocaleString()} eligible articles; ${pct}% of total | ${jCount} journals`
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
                            title={`${meta?.icon ?? ''} ${f.field}`}
                            subtitle={fieldSub}
                            chartData={f.aggAll?.chartData}
                            policyLines={f.aggAll?.policyLines}
                            visibleSeries={visibleSeries}
                            showPolicyLines={showPolicyLines}
                            forceVisible={isCapturing}
                            onMount={registerCapture}
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
                    {filteredJournals.map(j => (
                      <ChartCard
                        key={j.id}
                        title={j.name}
                        meta={j.hasPolicy ? `Policy ${j.policyYear}` : 'No policy'}
                        hasPolicy={j.hasPolicy}
                        subtitle={journalSubtitle(j)}
                        chartData={j.chartData}
                        policyLines={j.policyLines}
                        visibleSeries={visibleSeries}
                        showPolicyLines={showPolicyLines}
                        forceVisible={isCapturing}
                        onMount={registerCapture}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </>
          )}

          {data && activeJournal && (
            <>
              <div className="chart-section-title">
                {activeJournal.name}
                {activeJournal.hasPolicy && (
                  <span className="policy-badge">Policy {activeJournal.policyYear}</span>
                )}
              </div>
              <div className="chart-grid chart-grid--full">
                <ChartCard
                  title={activeJournal.name}
                  subtitle={journalSubtitle(activeJournal)}
                  chartData={activeJournal.chartData}
                  policyLines={activeJournal.policyLines}
                  visibleSeries={visibleSeries}
                  showPolicyLines={showPolicyLines}
                  tall
                  forceVisible={isCapturing}
                  onMount={registerCapture}
                />
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </>
  )
}
