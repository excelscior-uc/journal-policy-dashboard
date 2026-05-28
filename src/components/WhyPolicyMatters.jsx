import CollapsibleHomeSection from './CollapsibleHomeSection'
import { SITE_STATS } from '../data/siteStats'

export default function WhyPolicyMatters() {
  return (
    <CollapsibleHomeSection
      sectionClassName="why-policy"
      panelClassName="why-policy__body"
      headingId="why-policy-heading"
      panelId="why-policy-panel"
      title="Why Journal Policy Matters"
    >
      <p>
        Bar charts that reduce continuous data to a mean and error bar are widely criticised for
        concealing distributional features. This dashboard tracks how journal editorial policies are
        driving the shift toward more informative visualisations across {SITE_STATS.totalJournals} journals and {SITE_STATS.fieldCount} biomedical
        research fields. Pre-registered study protocol:{' '}
        <a href="https://osf.io/tcyxg" target="_blank" rel="noreferrer">osf.io/tcyxg</a>.
      </p>
    </CollapsibleHomeSection>
  )
}
