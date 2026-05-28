import CollapsibleHomeSection from './CollapsibleHomeSection'

export default function AboutDashboard() {
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
      <img
        src={`${import.meta.env.BASE_URL}bz_graphs_for_continuous_data.png`}
        alt="Barzooka graph types for continuous data"
        style={{ maxWidth: '100%', marginTop: '1rem' }}
      />
    </CollapsibleHomeSection>
  )
}
