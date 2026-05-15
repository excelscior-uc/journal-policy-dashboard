import { useState, useEffect } from 'react'

const DEFAULT_OPTIONS = { threshold: 0.1, rootMargin: '300px' }

export function useVisible(ref, options = DEFAULT_OPTIONS) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current || visible) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true)
        obs.disconnect()
      }
    }, options)
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref, visible, options])

  return visible
}
