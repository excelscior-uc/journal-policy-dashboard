import { Link } from 'react-router-dom'
import { FIELDS } from '../data/fields'
import { useFieldCounts } from '../data/journalIndex'
import CollapsibleHomeSection from './CollapsibleHomeSection'

export default function FieldGrid() {
  const counts = useFieldCounts()
  return (
    <CollapsibleHomeSection
        sectionClassName="field-grid-section"
        panelClassName="field-grid-section__body"
        headingId="field-grid-heading"
        panelId="field-grid-panel"
        title="Explore the Dashboard by Research Field"
      >
        <div id="field-grid" className="field-grid">
          {FIELDS.map(f => {
            const c = counts?.[f.slug]
            const total = c?.totalJournals ?? f.totalJournals
            const withPolicy = c?.withPolicy ?? f.withPolicy
            return (
            <Link key={f.slug} to={`/field/${f.slug}`} className="field-card" data-icon={f.icon}>
              <div className="field-card__name">{f.name}</div>
              <div className="field-card__stats">
                <div className="field-card__stat">
                  <span className="field-card__count">{total}</span>
                  <span className="field-card__unit">Journals</span>
                </div>
                <div className="field-card__divider" aria-hidden />
                <div className="field-card__stat">
                  <span className="field-card__count field-card__count--policy">{withPolicy}</span>
                  <span className="field-card__unit">With policy</span>
                </div>
              </div>
              <div className="field-card__arrow">Explore →</div>
            </Link>
            )
          })}
        </div>
        <p className="field-grid__note">
          <strong>Note:</strong> a journal can belong to more than one research
          field, so the per-field counts above overlap and add up to more than
          the site totals of <strong>213 journals</strong> (
          <strong>71 with a policy</strong>).
        </p>
      </CollapsibleHomeSection>
  )
}
