import { Link } from 'react-router-dom'
import { FIELDS } from '../data/fields'
import CollapsibleHomeSection from './CollapsibleHomeSection'

export default function FieldGrid() {
  return (
    <CollapsibleHomeSection
        sectionClassName="field-grid-section"
        panelClassName="field-grid-section__body"
        headingId="field-grid-heading"
        panelId="field-grid-panel"
        title="Browse by Research Field"
      >
        <div id="field-grid" className="field-grid">
          {FIELDS.map(f => (
            <Link key={f.slug} to={`/field/${f.slug}`} className="field-card" data-icon={f.icon}>
              <div className="field-card__name">{f.name}</div>
              <div className="field-card__stats">
                <div className="field-card__stat">
                  <span className="field-card__count">{f.totalJournals}</span>
                  <span className="field-card__unit">Journals</span>
                </div>
                <div className="field-card__divider" aria-hidden />
                <div className="field-card__stat">
                  <span className="field-card__count field-card__count--policy">{f.withPolicy}</span>
                  <span className="field-card__unit">With policy</span>
                </div>
              </div>
              <div className="field-card__arrow">Explore →</div>
            </Link>
          ))}
        </div>
      </CollapsibleHomeSection>
  )
}
