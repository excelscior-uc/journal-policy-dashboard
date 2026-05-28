import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'theme'

const CHART_COLORS = {
  light: {
    grid: '#f0f0f0',
    axisLine: '#ced4da',
    tickLine: '#adb5bd',
    tickText: '#495057',
    axisLabel: '#6c757d',
    tooltipBg: '#fefce8',
    tooltipBorder: '#fef08a',
    tooltipText: '#713f12',
    tooltipPolicyText: '#6d5f00',
    policyMarker: 'rgba(253,231,37,0.7)',
    policyTickBg: 'rgba(253,231,37,0.55)',
    policyTickStroke: 'rgba(253,231,37,0.9)',
    policyTickText: '#6d5f00',
  },
  dark: {
    grid: '#2c3744',
    axisLine: '#3a4654',
    tickLine: '#4a5666',
    tickText: '#c2cad4',
    axisLabel: '#9aa5b1',
    tooltipBg: '#2a2410',
    tooltipBorder: '#5c5320',
    tooltipText: '#f3e9b0',
    tooltipPolicyText: '#e8d77a',
    policyMarker: 'rgba(253,231,37,0.55)',
    policyTickBg: 'rgba(253,231,37,0.28)',
    policyTickStroke: 'rgba(253,231,37,0.7)',
    policyTickText: '#e8d77a',
  },
}

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch { return null }
}

function systemPrefersDark() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => readStored() ?? 'system')
  const [systemDark, setSystemDark] = useState(() => systemPrefersDark())

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = e => setSystemDark(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  const theme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggle = useCallback(() => {
    setPreference(prev => {
      const resolved = prev === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : prev
      const next = resolved === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
      return next
    })
  }, [])

  const value = useMemo(() => ({
    theme,
    toggle,
    chartColors: CHART_COLORS[theme],
  }), [theme, toggle])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
