import { useState } from 'react'

export default function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="accordion">
      <button className="accordion__toggle" onClick={() => setOpen(o => !o)}>
        {title}
        <span className={`accordion__icon${open ? '' : ' accordion__icon--closed'}`}>▾</span>
      </button>
      {open && <div className="accordion__body">{children}</div>}
    </div>
  )
}
