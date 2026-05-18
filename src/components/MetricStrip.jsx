const METRICS = [
  {
    color: '#d55e00',
    label: '% only bar graphs',
    desc: 'Papers using only bar graphs for continuous data, as detected by the Barzooka screening tool.',
  },
  {
    color: '#e69f00',
    label: '% bar and informative',
    desc: 'Papers using both bar and informative visualisation types for continuous data.',
  },
  {
    color: '#0072b2',
    label: '% only informative',
    desc: 'Papers using only informative types (dot plots, violin plots, box plots) for continuous data.',
  },
]

export default function MetricStrip() {
  return (
    <div className="metric-strip">
      {METRICS.map(m => (
        <div key={m.label} className="metric-strip__item">
          <div className="metric-strip__swatch" aria-hidden="true" style={{ background: m.color }} />
          <div className="metric-strip__content">
            <div className="metric-strip__label">{m.label}</div>
            <div className="metric-strip__desc">{m.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
