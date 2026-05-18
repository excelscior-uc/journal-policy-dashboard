import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJournalIndex, primeJournalIndex } from '../data/journalIndex'
import { useJournalNames } from '../data/journalNames'

export default function GlobalJournalSearch() {
  const navigate = useNavigate()
  const index = useJournalIndex()
  const getFullName = useJournalNames()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef(null)

  useEffect(() => { primeJournalIndex() }, [])

  useEffect(() => {
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !index) return []
    const out = []
    for (const j of index) {
      const full = getFullName(j.name, j.name)
      const hayAbbrev = j.name.toLowerCase()
      const hayFull = full.toLowerCase()
      if (hayAbbrev.includes(q) || hayFull.includes(q)) {
        out.push({ ...j, fullName: full })
        if (out.length >= 50) break
      }
    }
    return out
  }, [query, index, getFullName])

  useEffect(() => { setActive(0) }, [query])

  function selectResult(r) {
    const target = r.fields[0]
    if (!target) return
    navigate(`/field/${target.slug}?journal=${encodeURIComponent(r.id)}`)
    setOpen(false)
    setQuery('')
  }

  function onKeyDown(e) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); selectResult(results[active]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  return (
    <div className="global-search" ref={wrapRef}>
      <label className="global-search__pill">
        <input
          type="text"
          className="global-search__input"
          placeholder={index ? 'Find a journal…' : 'Loading journals…'}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-label="Find a journal"
        />
        {query ? (
          <button type="button" className="global-search__clear" onClick={() => { setQuery(''); setOpen(false) }} aria-label="Clear">
            ×
          </button>
        ) : (
          <svg className="global-search__icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.65" y2="16.65" />
          </svg>
        )}
      </label>
      {open && query.trim() && (
        <div className="global-search__dropdown" role="listbox">
          {results.length === 0 && (
            <div className="global-search__empty">No matching journals</div>
          )}
          {results.map((r, i) => (
            <button
              key={r.id}
              type="button"
              role="option"
              aria-selected={i === active}
              className={`global-search__item${i === active ? ' active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => selectResult(r)}
            >
              <span className="global-search__item-name">{r.fullName}</span>
              <span className="global-search__item-meta">
                <span className="global-search__item-field">{r.fields.map(f => f.name).join(', ')}</span>
                {r.hasPolicy && <span className="global-search__item-policy">Policy {r.policyYear}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
