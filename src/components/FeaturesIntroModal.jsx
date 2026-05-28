import { useEffect, useState } from 'react'
import { FEATURES } from '../data/features.jsx'

const STORAGE_KEY = 'graphs-intro-dismissed'

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
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
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
