import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FIELDS } from '../data/fields'

export default function TopNav() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const navigate = useNavigate()

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)
    if (q.trim().length < 2) { setResults([]); return }
    setResults(
      FIELDS.filter(f => f.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    )
  }

  function handleSelect(slug) {
    setQuery('')
    setResults([])
    navigate(`/field/${slug}`)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && results.length > 0) handleSelect(results[0].slug)
    if (e.key === 'Escape') { setQuery(''); setResults([]) }
  }

  return (
    <nav className="top-nav">
      <Link to="/" className="top-nav__logo">📊 Journal Policy Dashboard</Link>
      <div className="top-nav__search">
        <input
          className="top-nav__input"
          type="search"
          placeholder="Search fields…"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-label="Search research fields"
        />
        {results.length > 0 && (
          <ul className="top-nav__dropdown">
            {results.map(f => (
              <li
                key={f.slug}
                className="top-nav__dropdown-item"
                onClick={() => handleSelect(f.slug)}
              >
                <span>{f.icon}</span> {f.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  )
}
