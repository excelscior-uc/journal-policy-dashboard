import Hero from '../components/Hero'
import AboutDashboard from '../components/AboutDashboard'
import WhyPolicyMatters from '../components/WhyPolicyMatters'
import WhatMetricsMean from '../components/WhatMetricsMean'
import FieldGrid from '../components/FieldGrid'
import CollapsibleHomeSection from '../components/CollapsibleHomeSection'
import Footer from '../components/Footer'

const REFS = [
  {
    text: 'Weissgerber et al. (2015). Beyond bar and line graphs. PLOS Biology, 13(4), e1002128.',
    url: 'https://doi.org/10.1371/journal.pbio.1002128',
  },
  {
    text: 'Weissgerber et al. (2019). From static to interactive. PLOS Biology, 17(1), e1002484.',
    url: 'https://doi.org/10.1371/journal.pbio.1002484',
  },
  {
    text: "Weissgerber et al. (2019). Reveal, don't conceal. Circulation, 140(18), 1506–1518.",
    url: 'https://doi.org/10.1161/CIRCULATIONAHA.118.037777',
  },
  {
    text: 'Riedel et al. (2022). Replacing bar graphs. Clinical Science, 136(15), 1139–1156.',
    url: 'https://doi.org/10.1042/CS20220313',
  },
  {
    text: 'Riedel, Nachev, Schulz, Kazezian, Weissgerber. Barzooka. GitHub.',
    url: 'https://github.com/NiRiedel/barzooka',
  },
  {
    text: 'Schulz et al. (2025). Do journal policies reduce the use of bar graphs? osf.io/tcyxg/overview',
    url: 'https://osf.io/tcyxg/overview',
  },
]

export default function Home() {
  return (
    <>
      <Hero />
      <div className="section-wrap" style={{ marginTop: 24, paddingBottom: 0 }}>
        <AboutDashboard />
        <WhyPolicyMatters />
        <WhatMetricsMean />
      </div>
      <div className="section-wrap" style={{ marginTop: 24, paddingBottom: 0 }}>
        <FieldGrid />
      </div>
      <div className="section-wrap" style={{ marginTop: 24, paddingBottom: 0 }}>
        <CollapsibleHomeSection
          sectionClassName="refs-section"
          panelClassName="refs-section__body"
          headingId="refs-heading"
          panelId="refs-panel"
          title="References & Bibliography"
          defaultOpen={false}
        >
          <ul className="ref-list">
            {REFS.map((r, i) => (
              <li key={i}>
                <a href={r.url} target="_blank" rel="noreferrer">{r.text}</a>
              </li>
            ))}
          </ul>
        </CollapsibleHomeSection>
      </div>
      <Footer />
    </>
  )
}
