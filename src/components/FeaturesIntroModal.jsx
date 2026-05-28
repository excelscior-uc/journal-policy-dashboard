import { useEffect, useState } from 'react'

const STORAGE_KEY = 'graphs-intro-dismissed'

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="6" /><line x1="13.5" y1="13.5" x2="17" y2="17" />
      </svg>
    ),
    title: 'Search journals & fields',
    desc: 'Find any journal or research field fast using the search box to jump straight to its charts.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="17" y2="6" /><circle cx="8" cy="6" r="2" fill="#fff" />
        <line x1="3" y1="12" x2="17" y2="12" /><circle cx="13" cy="12" r="2" fill="#fff" />
      </svg>
    ),
    title: 'Filter & show/hide lines',
    desc: 'Use the top bar to toggle which metrics appear, hide/show policy markers, and filter journals by policy status.',
    extra: (
      <div className="intro-states">
        <div className="intro-states__group">
          <span className="intro-states__caption">Show: click a metric to toggle its line</span>
          <div className="intro-states__row">
            <span className="intro-chip intro-chip--on">
              <span className="intro-chip__swatch" style={{ background: '#d55e00' }} />
              % only bar
            </span>
            <span className="intro-states__tag intro-states__tag--on">shown</span>
            <span className="intro-chip intro-chip--off">
              <span className="intro-chip__swatch" style={{ background: '#0072b2' }} />
              % only informative
            </span>
            <span className="intro-states__tag intro-states__tag--off">hidden</span>
          </div>
        </div>
        <div className="intro-states__group">
          <span className="intro-states__caption">Journals: pick which journals feed the charts</span>
          <div className="intro-seg">
            <span className="intro-seg__btn intro-seg__btn--on">All</span>
            <span className="intro-seg__btn">Policy</span>
            <span className="intro-seg__btn">Non-Policy</span>
          </div>
          <span className="intro-states__caption intro-states__caption--soft">
            The highlighted option is active. All shows every journal, Policy / Non-Policy narrow it down.
          </span>
        </div>
      </div>
    ),
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="7" height="16" rx="1.5" />
        <rect x="14" y="4" width="7" height="16" rx="1.5" />
        <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="2 2" />
      </svg>
    ),
    title: 'Compare graphs',
    desc: 'Open any chart’s menu and pick Compare to overlay up to two journals or fields on one chart.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <circle cx="4" cy="10" r="1.8" /><circle cx="10" cy="10" r="1.8" /><circle cx="16" cy="10" r="1.8" />
      </svg>
    ),
    title: 'Copy or download as PNG',
    desc: 'Open the three-dots menu on any chart to copy it to your clipboard or download it as a PNG.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="14" height="6" rx="1.5" />
        <rect x="3" y="11" width="6" height="6" rx="1.5" />
        <rect x="11" y="11" width="6" height="6" rx="1.5" />
      </svg>
    ),
    title: '1 or 2 graphs per row',
    desc: 'Switch the layout between one or two charts per row to focus in or scan more at a glance.',
  },
]

export default function FeaturesIntroModal() {
  const [open, setOpen] = useState(false)
  const [dontShow, setDontShow] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true)
    } catch {
      setOpen(true)
    }
  }, [])

  useEffect(() => {
    function onOpen() { setOpen(true) }
    window.addEventListener('open-features-intro', onOpen)
    return () => window.removeEventListener('open-features-intro', onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  function close() {
    if (dontShow) {
      try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
    }
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="intro-modal__backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="intro-modal" role="dialog" aria-modal="true" aria-label="What you can do on this page">
        <header className="intro-modal__header">
          <div>
            <h2 className="intro-modal__title">Exploring the charts</h2>
            <div className="intro-modal__subtitle">A few things you can do on this page.</div>
          </div>
          <button className="intro-modal__close" onClick={close} aria-label="Close">×</button>
        </header>

        <div className="intro-modal__body">
          <ul className="intro-modal__features">
            {FEATURES.map(f => (
              <li key={f.title} className="intro-modal__feature">
                <span className="intro-modal__feature-icon">{f.icon}</span>
                <div>
                  <div className="intro-modal__feature-title">{f.title}</div>
                  <div className="intro-modal__feature-desc">{f.desc}</div>
                  {f.extra}
                </div>
              </li>
            ))}
          </ul>
          <p className="intro-modal__note">
            Every number and subtitle updates dynamically as you change the filters, so the totals always
            reflect what you’re currently viewing.
          </p>
        </div>

        <footer className="intro-modal__footer">
          <label className="intro-modal__dontshow">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
            />
            Don’t show this again
          </label>
          <button className="intro-modal__got-it" onClick={close}>Got it</button>
        </footer>
      </div>
    </div>
  )
}
