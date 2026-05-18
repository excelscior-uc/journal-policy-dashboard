import { cloneElement, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const SHOW_DELAY = 200
const HIDE_DELAY = 80
const GAP = 10

export default function Tooltip({ content, children, placement = 'bottom' }) {
  const triggerRef = useRef(null)
  const tipRef = useRef(null)
  const showTimer = useRef(null)
  const hideTimer = useRef(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, arrowX: 0, place: placement })

  function clearTimers() {
    if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null }
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null }
  }

  function scheduleOpen() {
    clearTimers()
    showTimer.current = setTimeout(() => setOpen(true), SHOW_DELAY)
  }

  function scheduleClose() {
    clearTimers()
    hideTimer.current = setTimeout(() => setOpen(false), HIDE_DELAY)
  }

  useEffect(() => () => clearTimers(), [])

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !tipRef.current) return
    const trig = triggerRef.current.getBoundingClientRect()
    const tip = tipRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    let place = placement
    let top
    if (place === 'top') {
      top = trig.top - tip.height - GAP
      if (top < 8) { place = 'bottom'; top = trig.bottom + GAP }
    } else {
      top = trig.bottom + GAP
      if (top + tip.height > window.innerHeight - 8) { place = 'top'; top = trig.top - tip.height - GAP }
    }
    let left = trig.left + trig.width / 2 - tip.width / 2
    const minLeft = 8
    const maxLeft = vw - tip.width - 8
    left = Math.max(minLeft, Math.min(left, maxLeft))
    const arrowX = trig.left + trig.width / 2 - left
    setPos({ top: top + window.scrollY, left: left + window.scrollX, arrowX, place })
  }, [open, content, placement])

  const trigger = cloneElement(children, {
    ref: (node) => {
      triggerRef.current = node
      const { ref } = children
      if (typeof ref === 'function') ref(node)
      else if (ref && typeof ref === 'object') ref.current = node
    },
    onMouseEnter: (e) => { children.props.onMouseEnter?.(e); scheduleOpen() },
    onMouseLeave: (e) => { children.props.onMouseLeave?.(e); scheduleClose() },
    onFocus:      (e) => { children.props.onFocus?.(e); scheduleOpen() },
    onBlur:       (e) => { children.props.onBlur?.(e); scheduleClose() },
  })

  return (
    <>
      {trigger}
      {open && createPortal(
        <div
          ref={tipRef}
          className={`tooltip tooltip--${pos.place}`}
          role="tooltip"
          style={{ top: pos.top, left: pos.left }}
          onMouseEnter={() => clearTimers()}
          onMouseLeave={scheduleClose}
        >
          <span className="tooltip__arrow" style={{ left: pos.arrowX }} />
          <span className="tooltip__body">{content}</span>
        </div>,
        document.body
      )}
    </>
  )
}
