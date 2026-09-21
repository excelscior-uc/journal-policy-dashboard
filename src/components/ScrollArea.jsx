import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const MIN_THUMB = 28

/**
 * Vertical scroll container with a scrollbar that is always painted.
 * Native macOS overlay scrollbars fade out a second after scrolling and
 * ignore most styling, so the native bar is hidden and the thumb drawn here.
 */
export default function ScrollArea({ className = '', children, ...rest }) {
  const viewportRef = useRef(null)
  const trackRef = useRef(null)
  const dragRef = useRef(null)
  const [thumb, setThumb] = useState({ height: MIN_THUMB, top: 0, scrollable: false })

  const measure = useCallback(() => {
    const vp = viewportRef.current
    const track = trackRef.current
    if (!vp || !track) return
    const trackH = track.clientHeight
    const { scrollHeight, clientHeight, scrollTop } = vp
    const scrollable = scrollHeight - clientHeight > 1
    const height = scrollable
      ? Math.max(MIN_THUMB, (clientHeight / scrollHeight) * trackH)
      : trackH
    const maxTop = trackH - height
    const top = scrollable
      ? (scrollTop / (scrollHeight - clientHeight)) * maxTop
      : 0
    // bail out when nothing moved, otherwise every render queues another render
    setThumb(prev =>
      prev.scrollable === scrollable &&
      Math.abs(prev.height - height) < 0.5 &&
      Math.abs(prev.top - top) < 0.5
        ? prev
        : { height, top, scrollable }
    )
  }, [])

  useLayoutEffect(() => { measure() }, [measure, children])

  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    vp.addEventListener('scroll', measure, { passive: true })
    const ro = new ResizeObserver(measure)
    ro.observe(vp)
    if (vp.firstElementChild) ro.observe(vp.firstElementChild)
    return () => {
      vp.removeEventListener('scroll', measure)
      ro.disconnect()
    }
  }, [measure])

  const onThumbPointerDown = e => {
    const vp = viewportRef.current
    const track = trackRef.current
    if (!vp || !track || !thumb.scrollable) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startY: e.clientY, startScroll: vp.scrollTop }
  }

  const onThumbPointerMove = e => {
    const drag = dragRef.current
    const vp = viewportRef.current
    const track = trackRef.current
    if (!drag || !vp || !track) return
    const maxTop = track.clientHeight - thumb.height
    if (maxTop <= 0) return
    const ratio = (vp.scrollHeight - vp.clientHeight) / maxTop
    vp.scrollTop = drag.startScroll + (e.clientY - drag.startY) * ratio
  }

  const endDrag = e => {
    if (!dragRef.current) return
    dragRef.current = null
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const onTrackPointerDown = e => {
    const vp = viewportRef.current
    const track = trackRef.current
    if (!vp || !track || e.target !== track || !thumb.scrollable) return
    const clickY = e.clientY - track.getBoundingClientRect().top
    const maxTop = track.clientHeight - thumb.height
    const target = Math.min(Math.max(clickY - thumb.height / 2, 0), maxTop)
    vp.scrollTop = (target / maxTop) * (vp.scrollHeight - vp.clientHeight)
  }

  return (
    <div className={`scrollarea ${className}`.trim()} {...rest}>
      <div className="scrollarea__viewport" ref={viewportRef}>
        <div className="scrollarea__content">{children}</div>
      </div>
      <div
        className="scrollarea__track"
        ref={trackRef}
        onPointerDown={onTrackPointerDown}
        aria-hidden
      >
        <div
          className={`scrollarea__thumb${thumb.scrollable ? '' : ' scrollarea__thumb--idle'}`}
          style={{ height: `${thumb.height}px`, transform: `translateY(${thumb.top}px)` }}
          onPointerDown={onThumbPointerDown}
          onPointerMove={onThumbPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      </div>
    </div>
  )
}
