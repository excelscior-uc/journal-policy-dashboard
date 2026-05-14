import { Link } from 'react-router-dom'
import { FIELDS } from '../data/fields'

export default function FieldGrid() {
  return (
    <div className="home-section section-wrap">
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6c757d', marginBottom: 14, fontWeight: 600 }}>
        Browse by Research Field
      </div>
      <div id="field-grid" className="field-grid">
        {FIELDS.map(f => (
          <Link key={f.slug} to={`/field/${f.slug}`} className="field-card">
            <div className="field-card__icon">{f.icon}</div>
            <div className="field-card__name">{f.name}</div>
            <div className="field-card__arrow">Explore →</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
