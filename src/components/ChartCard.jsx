import React, { useRef, useState, useEffect, useMemo } from 'react'
import { toPng } from 'html-to-image'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'
import { useVisible } from '../hooks/useVisible'
import { SERIES_CONFIG } from '../data/fields'

const EMPTY_POLICY_LINES = []

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{
      background: '#fefce8',
      border: '1px solid #fef08a',
      borderRadius: 6,
      padding: '6px 10px',
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1.6,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2, color: '#713f12' }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name} : {p.value?.toFixed(1)}%
        </div>
      ))}
      {(d?.eligibleArticles != null || d?.totalArticles != null) && (
        <div style={{ marginTop: 4, borderTop: '1px solid #fef08a', paddingTop: 3, color: '#713f12', fontWeight: 600 }}>
          {d.eligibleArticles != null && <div>Eligible articles: {d.eligibleArticles.toLocaleString()}</div>}
          {d.totalArticles != null && <div>Total articles: {d.totalArticles.toLocaleString()}</div>}
        </div>
      )}
    </div>
  )
}

function PolicyAwareTick({ x, y, payload, policyYears, showPolicyLines }) {
  const isPolicy = showPolicyLines && policyYears.has(payload.value)
  return (
    <g transform={`translate(${x},${y}) rotate(-40)`}>
      {isPolicy && (
        <rect
          x={-28} y={-8} width={30} height={15}
          rx={3} ry={3}
          fill="rgba(253,231,37,0.55)"
          stroke="rgba(253,231,37,0.9)"
          strokeWidth={1}
        />
      )}
      <text
        x={0} y={0}
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={isPolicy ? 700 : 400}
        fill={isPolicy ? '#6d5f00' : '#495057'}
      >
        {payload.value}
      </text>
    </g>
  )
}

function CustomLegend({ visibleSeries, showPolicyLines, hasPolicyLines }) {
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
      <div style={{ display: 'flex', gap: '6px 12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {line2.map(s => <LegendItem key={s.key} s={s} />)}
        {showPolicyLines && hasPolicyLines && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6d5f00' }}>
            <svg width="10" height="14">
              <rect x="3" y="0" width="4" height="14" rx="1" fill="rgba(253,231,37,0.7)" />
            </svg>
            Policy Year
          </span>
        )}
      </div>
    </div>
  )
}

function ChartCard({ title, meta, hasPolicy, subtitle, chartData, policyLines = EMPTY_POLICY_LINES, visibleSeries, showPolicyLines = true, tall = false, forceVisible = false, onMount }) {
  const ref = useRef()
  const cardRef = useRef()
  const visible = useVisible(ref)
  const policyYears = useMemo(() => new Set(policyLines.map(pl => pl.year)), [policyLines])
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

  const extendedData = useMemo(() => chartData?.length
    ? [{ year: chartData[0].year - 1 }, ...chartData, { year: chartData[chartData.length - 1].year + 1 }]
    : chartData, [chartData])

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
            <div className="chart-card__menu" ref={menuRef}>
              <button
                className="chart-card__menu-btn"
                onClick={() => setMenuOpen(o => !o)}
                disabled={busy}
                title="Export chart"
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
                <div className="chart-card__menu-dropdown">
                  <button className="chart-card__menu-item" onClick={copyAsPng}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy as PNG
                  </button>
                  <button className="chart-card__menu-item" onClick={downloadAsPng}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="year"
                type="category"
                interval={0}
                minTickGap={0}
                height={46}
                tickMargin={4}
                tick={<PolicyAwareTick policyYears={policyYears} showPolicyLines={showPolicyLines} />}
                tickLine={{ stroke: '#adb5bd' }}
                axisLine={{ stroke: '#ced4da' }}
                label={{ value: 'Year', position: 'insideBottom', offset: -4, fontSize: 11, fill: '#6c757d', fontWeight: 700 }}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                domain={[0, 100]}
                unit="%"
                label={{ value: '% Papers', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#6c757d', fontWeight: 700, dy: 20 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                content={<CustomLegend visibleSeries={visibleSeries} showPolicyLines={showPolicyLines} hasPolicyLines={policyLines.length > 0} />}
                verticalAlign="top"
                align="right"
              />
              {showPolicyLines && policyLines.map(pl => (
                <ReferenceLine
                  key={pl.year}
                  x={pl.year}
                  stroke="rgba(253,231,37,0.7)"
                  strokeWidth={4}
                />
              ))}
              {SERIES_CONFIG.filter(s => !visibleSeries || visibleSeries.has(s.key)).map(s => (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  strokeDasharray={s.dashed ? '4 2' : undefined}
                  dot={{ r: 3 }}
                  connectNulls
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
