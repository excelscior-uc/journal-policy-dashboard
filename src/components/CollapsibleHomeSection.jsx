import { useState } from 'react'

export default function CollapsibleHomeSection({
  title,
  headingId,
  panelId,
  sectionClassName = '',
  panelClassName = '',
  defaultOpen = true,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section
      className={`collapsible-home-section ${sectionClassName}`.trim()}
      aria-labelledby={headingId}
    >
      <button
        type="button"
        className="collapsible-home-section__toggle"
        id={headingId}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span
          className={`collapsible-home-section__chev${open ? '' : ' collapsible-home-section__chev--closed'}`}
          aria-hidden
        >
          ▾
        </span>
        {title}
      </button>
      <div className="collapsible-home-section__rule" aria-hidden />
      {open ? (
        <div
          id={panelId}
          className={`collapsible-home-section__panel ${panelClassName}`.trim()}
        >
          {children}
        </div>
      ) : null}
    </section>
  )
}
