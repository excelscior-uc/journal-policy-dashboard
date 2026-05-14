import { useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts'
import { useVisible } from '../hooks/useVisible'
import { SERIES_CONFIG } from '../data/fields'

export default function ChartCard({ title, meta, chartData, policyLines = [], visibleSeries, tall = false }) {
  const ref = useRef()
  const visible = useVisible(ref)

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <span>{title}</span>
        {meta && <span className="chart-card__meta">{meta}</span>}
      </div>
      <div ref={ref} className={`chart-card__body${tall ? ' chart-card__body--agg' : ''}`}>
        {visible ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
              <Tooltip formatter={(v, name) => [`${v?.toFixed(1)}%`, name]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {policyLines.map(pl => (
                <ReferenceLine
                  key={pl.year}
                  x={pl.year}
                  stroke="rgba(253,231,37,0.7)"
                  strokeWidth={2}
                  label={{ value: pl.year, position: 'top', fontSize: 9, fill: '#b8a000' }}
                />
              ))}
              {SERIES_CONFIG.map(s => (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  strokeDasharray={s.dashed ? '4 2' : undefined}
                  dot={false}
                  hide={visibleSeries && !visibleSeries.has(s.key)}
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
