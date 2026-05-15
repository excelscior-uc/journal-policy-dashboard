import CollapsibleHomeSection from './CollapsibleHomeSection'

const METRICS = [
  {
    color: '#c0392b',
    label: '% only bar',
    desc:
      'Percentage of eligible papers (papers with bar or informative graphs) in that year using this visualisation type for continuous data, as detected by the barzooka screening tool.',
  },
  {
    color: '#e8998d',
    label: '% bar and informative',
    desc:
      'Percentage of eligible papers (papers with bar or informative graphs) in that year using both visualisation types for continuous data, as detected by the barzooka screening tool.',
  },
  {
    color: '#76b5b2',
    label: '% only informative',
    desc:
      'Percentage of eligible papers (papers with informative graphs) in that year using this visualisation type for continuous data, as detected by the barzooka screening tool.',
  },
]

export default function WhatMetricsMean() {
  return (
    <CollapsibleHomeSection
      sectionClassName="metrics-mean"
      panelClassName="metrics-mean__cards"
      headingId="metrics-mean-heading"
      panelId="metrics-mean-panel"
      title="What the Metrics Mean"
    >
      {METRICS.map((m) => (
        <div key={m.label} className="metrics-mean__card">
          <div className="metrics-mean__card-head">
            <span
              className="metrics-mean__swatch"
              style={{ background: m.color }}
              aria-hidden
            />
            <span className="metrics-mean__card-title" style={{ color: m.color }}>
              {m.label}
            </span>
          </div>
          <p className="metrics-mean__card-desc">{m.desc}</p>
        </div>
      ))}
    </CollapsibleHomeSection>
  )
}
