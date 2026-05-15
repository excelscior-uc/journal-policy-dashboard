import { useNavigate } from 'react-router-dom'
import { FIELDS } from '../data/fields'

export default function FieldSwitcherBar({ currentSlug }) {
  const navigate = useNavigate()
  return (
    <div className="field-switcher-bar">
      <label className="field-switcher-bar__label" htmlFor="field-select">Field:</label>
      <select
        id="field-select"
        className="field-switcher-bar__select"
        value={currentSlug}
        onChange={e => navigate(`/field/${e.target.value}`)}
      >
        {FIELDS.map(f => (
          <option key={f.slug} value={f.slug} aria-label={f.name}>{f.name}</option>
        ))}
      </select>
    </div>
  )
}
