import { useState } from 'react'
import CollapsibleHomeSection from './CollapsibleHomeSection'

/* The barzooka figure is a single strip of six 640px circles (4085x640), so each
   tile is addressed by background-position 0/20/40/60/80/100% at auto 100% size. */
const CHART_TYPES = [
  { name: 'Bar chart', verdict: 'avoid' },
  { name: 'Bar with dots', verdict: 'good' },
  { name: 'Box plot', verdict: 'good' },
  { name: 'Dot plot', verdict: 'good' },
  { name: 'Histogram', verdict: 'good' },
  { name: 'Violin plot', verdict: 'good' },
]

function ForbiddenMark() {
  return (
    <svg viewBox="0 0 100 100" className="chart-flip__mark" aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="37" fill="none" stroke="currentColor" strokeWidth="12" />
      <line x1="24" y1="24" x2="76" y2="76" stroke="currentColor" strokeWidth="12" />
    </svg>
  )
}

function CheckMark() {
  return (
    <svg viewBox="0 0 100 100" className="chart-flip__mark" aria-hidden="true" focusable="false">
      <path
        d="M20 53 L41 74 L80 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function AboutDashboard() {
  const [flipped, setFlipped] = useState(null)
  const strip = `${import.meta.env.BASE_URL}bz_graphs_for_continuous_data.png`

  return (
    <CollapsibleHomeSection
      sectionClassName="about-dashboard"
      panelClassName="about-dashboard__body"
      headingId="about-dashboard-heading"
      panelId="about-dashboard-panel"
      title="About this Dashboard"
    >
      <p>
        This dashboard tracks how data-visualisation practices in scientific publishing have evolved
        over time, focusing on the use of bar charts versus more informative alternatives.
        Visualisation types are classified by{' '}
        <strong>barzooka</strong>, an automated deep-learning tool that screens PDF figures.
      </p>
      <ul>
        <li><strong className="label-bar">Bar charts</strong> — the conventional mean-and-error bar format</li>
        <li>
          <strong className="label-informative">Informative charts</strong> — bars with dots, box plots, dot plots, histograms, or
          violin plots
        </li>
      </ul>

      <ul className="chart-flips">
        {CHART_TYPES.map((chart, i) => (
          <li key={chart.name} className="chart-flips__item">
            <button
              type="button"
              className={`chart-flip${flipped === i ? ' chart-flip--flipped' : ''}`}
              onClick={() => setFlipped(flipped === i ? null : i)}
              aria-label={`${chart.name} — ${chart.verdict === 'avoid' ? 'discouraged' : 'informative'}`}
            >
              <span className="chart-flip__inner">
                <span
                  className="chart-flip__face chart-flip__face--front"
                  style={{ backgroundImage: `url("${strip}")`, backgroundPositionX: `${i * 20}%` }}
                />
                <span className={`chart-flip__face chart-flip__face--back chart-flip__face--${chart.verdict}`}>
                  {chart.verdict === 'avoid' ? <ForbiddenMark /> : <CheckMark />}
                  {chart.verdict === 'avoid' && <span className="chart-flip__rip">RIP</span>}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </CollapsibleHomeSection>
  )
}
