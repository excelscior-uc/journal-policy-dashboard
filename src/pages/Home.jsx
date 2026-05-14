import Hero from '../components/Hero'
import MetricStrip from '../components/MetricStrip'
import FieldGrid from '../components/FieldGrid'
import Accordion from '../components/Accordion'
import Footer from '../components/Footer'

const REFS = [
  'Weissgerber et al. (2015). Beyond bar and line graphs. PLOS Biology, 13(4), e1002128.',
  'Weissgerber et al. (2019). From static to interactive. PLOS Biology, 17(1), e1002484.',
  "Weissgerber et al. (2019). Reveal, don't conceal. Circulation, 140(18), 1506–1518.",
  'Riedel et al. (2022). Replacing bar graphs. Clinical Science, 136(15), 1139–1156.',
  'Riedel, Nachev, Schulz, Kazezian, Weissgerber. Barzooka. GitHub.',
  'Schulz et al. (2025). Do journal policies reduce the use of bar graphs? osf.io/tcyxg/overview',
]

export default function Home() {
  return (
    <>
      <Hero />
      <MetricStrip />
      <FieldGrid />
      <div className="section-wrap" style={{ marginTop: 24, paddingBottom: 0 }}>
        <Accordion title="References & Bibliography">
          <ul className="ref-list">
            {REFS.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </Accordion>
      </div>
      <Footer />
    </>
  )
}
