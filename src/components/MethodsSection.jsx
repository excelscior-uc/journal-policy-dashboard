import CollapsibleHomeSection from './CollapsibleHomeSection'

const STEPS = [
  {
    n: 1,
    title: 'Corpus assembly',
    desc:
      'For each field we collect the published research articles of the tracked journals across the study years. Each article PDF is retrieved and its figures are extracted for screening.',
  },
  {
    n: 2,
    title: 'Automated figure screening',
    desc:
      'Figures are classified by barzooka, a deep-learning tool that detects how continuous data are displayed. It flags bar graphs of continuous data and the informative alternatives (bar-and-dot, box plots, dot / strip plots, histograms, violin plots).',
  },
  {
    n: 3,
    title: 'Eligibility filter',
    desc:
      'A paper counts as eligible for a given year only if it contains at least one bar or informative graph of continuous data. Papers with no such graphics are excluded so the denominator reflects papers that actually had the choice.',
  },
  {
    n: 4,
    title: 'Per-journal, per-year metrics',
    desc:
      'Within the eligible set we compute, for every journal and year, the share of papers using bar graphs only, both formats, or informative graphics only. These three shares are what the charts plot over time.',
  },
  {
    n: 5,
    title: 'Policy quasi-experiment',
    desc:
      'Journals that introduced an editorial policy encouraging informative graphics create a natural before/after comparison. Trajectories are read against the policy date and against journals that never adopted a policy, to gauge whether recommendations shift author behaviour.',
  },
]

const METRIC_DEFS = [
  ['% only bar', 'eligible papers that used bar graphs only ÷ all eligible papers, that year'],
  ['% bar and informative', 'eligible papers that used both formats ÷ all eligible papers, that year'],
  ['% only informative', 'eligible papers that used informative graphics only ÷ all eligible papers, that year'],
]

export default function MethodsSection() {
  return (
    <CollapsibleHomeSection
      sectionClassName="methods-section"
      panelClassName="methods-section__body"
      headingId="methods-heading"
      panelId="methods-panel"
      title="Methods"
    >
      <p>
        The dashboard visualises data from{' '}
        <a href="https://osf.io/tcyxg/overview" target="_blank" rel="noreferrer">
          Schulz et al. (2025), <em>Do journal policies reduce the use of bar graphs?</em>
        </a>{' '}
        Figure classification is produced automatically; no figure is hand-labelled. The pipeline runs in five steps.
      </p>

      <ol className="methods-section__steps">
        {STEPS.map((s) => (
          <li key={s.n} className="methods-section__step">
            <span className="methods-section__step-n" aria-hidden>{s.n}</span>
            <div>
              <div className="methods-section__step-title">{s.title}</div>
              <p className="methods-section__step-desc">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      <h4 className="methods-section__subhead">How each metric is computed</h4>
      <ul className="methods-section__defs">
        {METRIC_DEFS.map(([k, v]) => (
          <li key={k}>
            <strong>{k}</strong>: {v}
          </li>
        ))}
      </ul>

      <h4 className="methods-section__subhead">Classification tool</h4>
      <p>
        Chart types are detected by{' '}
        <a href="https://github.com/quest-bih/barzooka" target="_blank" rel="noreferrer">
          barzooka
        </a>
        , an open-source deep-learning screener (Riedel N, Nachev V, Schulz R, Kazezian V, Weissgerber T). Its
        detection of bar vs. informative graphics for continuous data is the basis of every metric shown here.
      </p>

      <h4 className="methods-section__subhead">Limitations</h4>
      <ul className="methods-section__defs">
        <li>Classification is automated, so occasional mislabelled figures are possible.</li>
        <li>Only continuous-data graphics are counted; other figure types are outside scope.</li>
        <li>
          Policy comparisons are observational quasi-experiments, not randomised, so trends are suggestive of, but
          do not prove, a causal effect of a policy.
        </li>
        <li>Journals and years with very few eligible papers give noisier percentages.</li>
      </ul>
    </CollapsibleHomeSection>
  )
}
