const METRICS = [
  {
    color: '#c0392b',
    label: '% only bar graphs',
    desc: 'Papers using only bar graphs for continuous data, as detected by the Barzooka screening tool.',
  },
  {
    color: '#e8998d',
    label: '% bar and informative',
    desc: 'Papers using both bar and informative visualisation types for continuous data.',
  },
  {
    color: '#76b5b2',
    label: '% only informative',
    desc: 'Papers using only informative types (dot plots, violin plots, box plots) for continuous data.',
  },
]

export default function MetricStrip() {
  return (
    <div className="metric-strip">
      {METRICS.map(m => (
        <div key={m.label} className="metric-strip__item">
          <div className="metric-strip__swatch" style={{ background: m.color }} />
          <div>
            <div className="metric-strip__label">{m.label}</div>
            <div className="metric-strip__desc">{m.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
