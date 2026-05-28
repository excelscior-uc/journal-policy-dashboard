import React, { useRef, useState, useEffect, useMemo } from 'react'
import { toPng } from 'html-to-image'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'
import { useVisible } from '../hooks/useVisible'
import { SERIES_CONFIG } from '../data/fields'
import { useTheme } from '../hooks/useTheme'

const EMPTY_POLICY_LINES = []

function CustomTooltip({ active, payload, label, policyByYear, totalJournals, cc }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  const policy = policyByYear?.get(label)
  return (
    <div style={{
      background: cc.tooltipBg,
      border: `1px solid ${cc.tooltipBorder}`,
      borderRadius: 6,
      padding: '6px 10px',
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1.6,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2, color: cc.tooltipText }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name} : {p.value?.toFixed(1)}%
        </div>
      ))}
      {(d?.totalArticles != null || d?.eligibleArticles != null) && (
        <div style={{ marginTop: 4, borderTop: `1px solid ${cc.tooltipBorder}`, paddingTop: 3, color: cc.tooltipText, fontWeight: 600 }}>
          {d?.totalArticles != null && <div>Total articles: {d.totalArticles.toLocaleString()}</div>}
          {d?.eligibleArticles != null && (
            <div>
              Included articles: {d.eligibleArticles.toLocaleString()}
              {d?.totalArticles ? ` (${(d.eligibleArticles / d.totalArticles * 100).toFixed(1)}%)` : ''}
            </div>
          )}
        </div>
      )}
      {policy && ((policy.count ?? 0) > 0 || (policy.count == null && policy.pct > 0)) && (
        <div style={{ marginTop: 4, borderTop: `1px solid ${cc.tooltipBorder}`, paddingTop: 3, color: cc.tooltipPolicyText, fontWeight: 700 }}>
          {policy.count != null
            ? <>Policy adopted: {policy.count} journal{policy.count === 1 ? '' : 's'}{totalJournals ? ` of ${totalJournals}` : ''}{policy.pct != null ? ` (${policy.pct}%)` : ''}</>
            : <>Policy adopted: {policy.pct}% of journals{totalJournals ? ` (~${Math.round(policy.pct / 100 * totalJournals)} of ${totalJournals})` : ''}</>
          }
        </div>
      )}
    </div>
  )
}

function PolicyAwareTick({ x, y, payload, policyYears, showPolicyLines, hideYear, cc }) {
  if (payload.value === hideYear) return null
  const isPolicy = showPolicyLines && policyYears.has(payload.value)
  return (
    <g transform={`translate(${x},${y}) rotate(-40)`}>
      {isPolicy && (
        <rect
          x={-28} y={-8} width={30} height={15}
          rx={3} ry={3}
          fill={cc.policyTickBg}
          stroke={cc.policyTickStroke}
          strokeWidth={1}
        />
      )}
      <text
        x={0} y={0}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={isPolicy ? 700 : 400}
        fill={isPolicy ? cc.policyTickText : cc.tickText}
      >
        {payload.value}
      </text>
    </g>
  )
}

function CustomLegend({ visibleSeries, showPolicyLines, hasPolicyLines, cc }) {
  const series = SERIES_CONFIG.filter(s => !visibleSeries || visibleSeries.has(s.key))
  const line1 = series.slice(0, 3)
  const line2 = series.slice(3)
  const LegendItem = ({ s }) => (
    <span key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4, color: s.color }}>
      <svg width="18" height="10">
        <line x1="0" y1="5" x2="18" y2="5" stroke={s.color} strokeWidth={2} strokeDasharray={s.dashed ? '4 2' : undefined} />
        <circle cx="9" cy="5" r="3" fill="none" stroke={s.color} strokeWidth={1.5} />
      </svg>
      {s.name}
    </span>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, fontSize: 11, fontWeight: 700, padding: '0 4px 4px' }}>
      <div style={{ display: 'flex', gap: '6px 12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {line1.map(s => <LegendItem key={s.key} s={s} />)}
      </div>
      {(line2.length > 0 || (showPolicyLines && hasPolicyLines)) && (
        <div style={{ display: 'flex', gap: '6px 12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {line2.map(s => <LegendItem key={s.key} s={s} />)}
          {showPolicyLines && hasPolicyLines && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: cc.tooltipPolicyText }}>
              <svg width="10" height="14">
                <rect x="3" y="0" width="4" height="14" rx="1" fill={cc.policyMarker} />
              </svg>
              Policy Year
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function ChartCard({ title, meta, hasPolicy, subtitle, chartData, policyLines = EMPTY_POLICY_LINES, totalJournals, visibleSeries, showPolicyLines = true, tall = false, forceVisible = false, onMount, onCompare }) {
  const ref = useRef()
  const cardRef = useRef()
  const visible = useVisible(ref)
  const { chartColors: cc } = useTheme()
  const enrichedPolicyLines = useMemo(() => policyLines
    .map(pl => {
      const m = pl.label?.match(/(\d+(?:\.\d+)?)\s*%/)
      const pct = m ? parseFloat(m[1]) : null
      return { ...pl, pct }
    })
    .filter(pl => {
      if (pl.count != null) return pl.count > 0
      if (pl.pct != null) return pl.pct > 0
      return true
    }),
    [policyLines]
  )
  const policyYears = useMemo(() => new Set(enrichedPolicyLines.map(pl => pl.year)), [enrichedPolicyLines])
  const policyByYear = useMemo(
    () => new Map(enrichedPolicyLines.map(pl => [pl.year, pl])),
    [enrichedPolicyLines]
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const menuRef = useRef()

  useEffect(() => {
    if (!menuOpen) return
    function close(e) {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  useEffect(() => {
    if (!onMount) return
    onMount({ title, capture: () => toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 }) })
    return () => onMount(null)
  }, [onMount, title])

  async function captureCard() {
    return toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 })
  }

  async function copyAsPng() {
    setMenuOpen(false)
    setBusy(true)
    try {
      const dataUrl = await captureCard()
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
      const dataUrl = await captureCard()
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${title.replace(/\s+/g, '-')}.png`
      a.click()
    } finally {
      setBusy(false)
    }
  }

  const extendedData = useMemo(() => {
    if (!chartData?.length) return chartData
    const dataMin = chartData[0].year
    const dataMax = chartData[chartData.length - 1].year
    const policyMin = enrichedPolicyLines.length ? Math.min(...enrichedPolicyLines.map(p => p.year)) : dataMin
    const policyMax = enrichedPolicyLines.length ? Math.max(...enrichedPolicyLines.map(p => p.year)) : dataMax
    const min = Math.min(dataMin, policyMin) - 1
    const max = Math.max(dataMax, policyMax) + 1
    const byYear = new Map(chartData.map(d => [d.year, d]))
    const out = []
    for (let y = min; y <= max; y++) out.push(byYear.get(y) ?? { year: y })
    return out
  }, [chartData, enrichedPolicyLines])

  return (
    <div className="chart-card" ref={cardRef}>
      <div className="chart-card__header">
        <div className="chart-card__header-top">
          <span>{title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {meta && (
              <span className={`chart-card__meta chart-card__meta--${hasPolicy ? 'policy' : 'no-policy'}`}>
                {meta}
              </span>
            )}
            {onCompare && (
              <button
                type="button"
                className="chart-card__menu-btn chart-card__compare-btn"
                onClick={(e) => { e.stopPropagation(); onCompare() }}
                title="Compare side by side"
                aria-label="Compare side by side"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="7" height="16" rx="1.5" />
                  <rect x="14" y="4" width="7" height="16" rx="1.5" />
                  <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="2 2" />
                </svg>
              </button>
            )}
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
                disabled={busy}
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
        </div>
        {subtitle && <div className="chart-card__subtitle">{subtitle}</div>}
      </div>
      <div ref={ref} className={`chart-card__body${tall ? ' chart-card__body--agg' : ''}`}>
        {visible || forceVisible ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={extendedData} margin={{ top: 16, right: 14, left: 4, bottom: 14 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={cc.grid} />
              <XAxis
                dataKey="year"
                type="category"
                interval={0}
                minTickGap={0}
                height={46}
                tickMargin={4}
                tick={<PolicyAwareTick policyYears={policyYears} showPolicyLines={showPolicyLines} hideYear={extendedData?.[0]?.year} cc={cc} />}
                tickLine={{ stroke: cc.tickLine }}
                axisLine={{ stroke: cc.axisLine }}
                label={{ value: 'Year', position: 'insideBottom', offset: -4, fontSize: 11, fill: cc.axisLabel, fontWeight: 700 }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: cc.tickText }}
                domain={[0, 100]}
                unit="%"
                label={{ value: '% Papers', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: cc.axisLabel, fontWeight: 700, dy: 20 }}
              />
              <Tooltip content={<CustomTooltip policyByYear={policyByYear} totalJournals={totalJournals} cc={cc} />} />
              <Legend
                key={`legend-${showPolicyLines && enrichedPolicyLines.length > 0 ? 'p' : 'np'}`}
                content={<CustomLegend visibleSeries={visibleSeries} showPolicyLines={showPolicyLines} hasPolicyLines={enrichedPolicyLines.length > 0} cc={cc} />}
                verticalAlign="top"
                align="right"
                height={showPolicyLines && enrichedPolicyLines.length > 0 ? 44 : 22}
              />
              {showPolicyLines && enrichedPolicyLines.map(pl => {
                const w = pl.count != null
                  ? Math.max(2, Math.min(14, 2 + pl.count * 1.5))
                  : pl.pct != null
                  ? Math.max(2, Math.min(14, 2 + pl.pct * 0.45))
                  : 4
                return (
                  <ReferenceLine
                    key={pl.year}
                    x={pl.year}
                    stroke={cc.policyMarker}
                    strokeWidth={w}
                    isAnimationActive={false}
                  />
                )
              })}
              {SERIES_CONFIG.filter(s => !visibleSeries || visibleSeries.has(s.key)).map(s => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  strokeDasharray={s.dashed ? '4 2' : undefined}
                  dot={{ r: 3 }}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-card__skeleton" />
        )}
      </div>
    </div>
  )
}

export default React.memo(ChartCard)
