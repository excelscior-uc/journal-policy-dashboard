import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FIELDS, SERIES_CONFIG } from '../data/fields'
import ChartCard from '../components/ChartCard'
import FilterBar from '../components/FilterBar'
import JournalSidebar from '../components/JournalSidebar'

const DEFAULT_VISIBLE = new Set(SERIES_CONFIG.map(s => s.key))

export default function FieldPage() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [selectedJournal, setSelectedJournal] = useState('__agg__')
  const [visibleSeries, setVisibleSeries] = useState(DEFAULT_VISIBLE)
  const [policyFilter, setPolicyFilter] = useState('all')

  const field = FIELDS.find(f => f.slug === slug)

  useEffect(() => {
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

  if (error) return <div style={{ padding: 24, color: '#c0392b' }}>Failed to load data: {error}</div>

  return (
    <>
      {/* breadcrumb */}
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb__home">← Home</Link>
        <span className="breadcrumb__sep">/</span>
        <span>{field ? `${field.icon} ${field.name}` : slug}</span>
      </div>

      {/* field header */}
      {field && (
        <div className="field-header">
          <div className="field-header__icon">{field.icon}</div>
          <h2>{field.name}</h2>
        </div>
      )}

      {/* filter bar */}
      <FilterBar
        visibleSeries={visibleSeries}
        onToggleSeries={toggleSeries}
        policyFilter={policyFilter}
        onPolicyFilter={setPolicyFilter}
      />

      {/* main layout */}
      <div className="field-layout">
        {data && (
          <JournalSidebar
            journals={filteredJournals}
            selectedId={selectedJournal}
            onSelect={setSelectedJournal}
          />
        )}

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
              <div className="chart-section-title">Aggregated Trend</div>
              <div className="chart-grid chart-grid--full">
                {aggData && (
                  <ChartCard
                    title={`${field?.name ?? slug} — All Journals`}
                    chartData={aggData.chartData}
                    policyLines={aggData.policyLines}
                    visibleSeries={visibleSeries}
                    tall
                  />
                )}
              </div>

              {data.fields?.length > 0 ? (
                <>
                  <div className="chart-section-title">Per-Field Charts</div>
                  <div className="chart-grid">
                    {data.fields.map(f => {
                      const meta = FIELDS.find(x => x.slug === f.slug)
                      return (
                        <ChartCard
                          key={f.slug}
                          title={`${meta?.icon ?? ''} ${f.field}`}
                          chartData={f.aggAll?.chartData}
                          policyLines={f.aggAll?.policyLines}
                          visibleSeries={visibleSeries}
                        />
                      )
                    })}
                  </div>
                </>
              ) : filteredJournals.length > 0 ? (
                <>
                  <div className="chart-section-title">Per-Journal Charts</div>
                  <div className="chart-grid">
                    {filteredJournals.map(j => (
                      <ChartCard
                        key={j.id}
                        title={j.name}
                        meta={j.hasPolicy ? `Policy ${j.policyYear}` : 'No policy'}
                        chartData={j.chartData}
                        policyLines={j.policyLines}
                        visibleSeries={visibleSeries}
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
                  chartData={activeJournal.chartData}
                  policyLines={activeJournal.policyLines}
                  visibleSeries={visibleSeries}
                  tall
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
