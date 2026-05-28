import Hero from '../components/Hero'
import AboutDashboard from '../components/AboutDashboard'
import WhyPolicyMatters from '../components/WhyPolicyMatters'
import WhatMetricsMean from '../components/WhatMetricsMean'
import FieldGrid from '../components/FieldGrid'
import CollapsibleHomeSection from '../components/CollapsibleHomeSection'
import Footer from '../components/Footer'
import { FEATURES } from '../data/features.jsx'

const REFS = [
  {
    author: 'Weissgerber et al. (2015).',
    title: 'Beyond bar and line graphs: time for a new data presentation paradigm.',
    venue: 'PLOS Biology.',
    url: 'https://doi.org/10.1371/journal.pbio.1002128',
  },
  {
    author: 'Weissgerber et al. (2019).',
    title: 'From static to interactive: Transforming data visualization to improve transparency.',
    venue: 'PLOS Biology.',
    url: 'https://doi.org/10.1371/journal.pbio.1002484',
  },
  {
    author: 'Weissgerber et al. (2019).',
    title: "Reveal, don't conceal: Transforming data visualization to improve transparency.",
    venue: 'Circulation.',
    url: 'https://doi.org/10.1161/CIRCULATIONAHA.118.037777',
  },
  {
    author: 'Riedel et al. (2022).',
    title: 'Replacing bar graphs of continuous data with more informative graphics: are we making progress?',
    venue: 'Clinical Science.',
    url: 'https://doi.org/10.1042/CS20220313',
  },
  {
    author: 'Schulz et al. (2025).',
    title: 'Do journal policies reduce the use of bar graphs?',
    venue: 'osf.io/tcyxg',
    url: 'https://osf.io/tcyxg/overview',
  },
  {
    author: 'Riedel N, Nachev V, Schulz R, Kazezian V, Weissgerber T.',
    title: 'barzooka.',
    venue: 'GitHub',
    url: 'https://github.com/NiRiedel/barzooka',
  },
]

export default function Home() {
  return (
    <>
      <Hero />
      <div className="section-wrap" style={{ marginTop: 24, paddingBottom: 0 }}>
        <AboutDashboard />
        <WhyPolicyMatters />
        <FieldGrid />
        <WhatMetricsMean />
      </div>
      <div className="section-wrap" style={{ marginTop: 24, paddingBottom: 0 }}>
        <CollapsibleHomeSection
          headingId="features-heading"
          panelId="features-panel"
          title="How to use the dashboard"
          defaultOpen={true}
        >
          <ul className="intro-modal__features intro-modal__features--home">
            {FEATURES.map(f => (
              <li key={f.title} className="intro-modal__feature">
                <span className="intro-modal__feature-icon">{f.icon}</span>
                <div>
                  <div className="intro-modal__feature-title">{f.title}</div>
                  <div className="intro-modal__feature-desc">{f.desc}</div>
                  {f.extra}
                </div>
              </li>
            ))}
          </ul>
        </CollapsibleHomeSection>
      </div>
      <div className="section-wrap" style={{ marginTop: 24, paddingBottom: 0 }}>
        <CollapsibleHomeSection
          sectionClassName="refs-section"
          panelClassName="refs-section__body"
          headingId="refs-heading"
          panelId="refs-panel"
          title="References & Bibliography"
          defaultOpen={true}
        >
          <ul className="ref-list">
            {REFS.map((r, i) => (
              <li key={i}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.author} <em>{r.title}</em> {r.venue}
                </a>
              </li>
            ))}
          </ul>
        </CollapsibleHomeSection>
      </div>
      <Footer />
    </>
  )
}
