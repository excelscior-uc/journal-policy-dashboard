import Hero from '../components/Hero'
import StatsStrip from '../components/StatsStrip'
import Accordion from '../components/Accordion'
import FieldGrid from '../components/FieldGrid'
import Footer from '../components/Footer'

function MetricsContent() {
  const metrics = [
    { color: '#c0392b', label: '% only bar', desc: 'Percentage of eligible papers in that year using only bar graphs for continuous data, as detected by the Barzooka screening tool.' },
    { color: '#e8998d', label: '% bar and informative', desc: 'Percentage of eligible papers using both bar and informative visualisation types for continuous data in that year.' },
    { color: '#76b5b2', label: '% only informative', desc: 'Percentage of eligible papers using only informative visualisation types (e.g. dot plots, violin plots, box plots) for continuous data in that year.' },
  ]
  return (
    <>
      {metrics.map(m => (
        <div key={m.label} className="metric-item">
          <div className="metric-swatch" style={{ background: m.color }} />
          <div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-desc">{m.desc}</div>
          </div>
        </div>
      ))}
    </>
  )
}

function RefsContent() {
  const refs = [
    'Weissgerber et al. (2015). Beyond bar and line graphs. PLOS Biology, 13(4), e1002128.',
    'Weissgerber et al. (2019). From static to interactive. PLOS Biology, 17(1), e1002484.',
    "Weissgerber et al. (2019). Reveal, don't conceal. Circulation, 140(18), 1506–1518.",
    'Riedel et al. (2022). Replacing bar graphs. Clinical Science, 136(15), 1139–1156.',
    'Riedel, Nachev, Schulz, Kazezian, Weissgerber. Barzooka. GitHub.',
    'Schulz et al. (2025). Do journal policies reduce the use of bar graphs? osf.io/tcyxg/overview',
  ]
  return (
    <ul className="ref-list">
      {refs.map((r, i) => <li key={i}>{r}</li>)}
    </ul>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <StatsStrip />

      <div className="home-section section-wrap" style={{ marginTop: 36 }}>
        <Accordion title="Why Journal Policy Matters" defaultOpen>
          <p>Bar charts that reduce continuous data to a mean and error bar are widely criticised for concealing distributional features. A growing number of journals have introduced editorial policies that encourage or require more informative alternatives, creating natural quasi-experiments.</p>
          <p style={{ marginTop: 8 }}>The pre-registered study protocol is at <a href="https://osf.io/tcyxg" target="_blank" rel="noreferrer">osf.io/tcyxg</a>.</p>
        </Accordion>

        <Accordion title="What the Metrics Mean" defaultOpen>
          <MetricsContent />
        </Accordion>
      </div>

      <FieldGrid />

      <div className="section-wrap" style={{ marginTop: 24, paddingBottom: 0 }}>
        <Accordion title="References & Bibliography">
          <RefsContent />
        </Accordion>
      </div>

      <Footer />
    </>
  )
}
