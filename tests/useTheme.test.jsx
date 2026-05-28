import { renderHook, act, render, screen } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../src/hooks/useTheme'

function setMatchMedia(matchesDark) {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: matchesDark,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    setMatchMedia(false)
  })

  it('defaults to system → resolves light when OS is light', () => {
    setMatchMedia(false)
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('defaults to system → resolves dark when OS is dark', () => {
    setMatchMedia(true)
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('reads an explicit stored preference over the OS setting', () => {
    setMatchMedia(true)
    localStorage.setItem('theme', 'light')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('light')
  })

  it('toggle() flips the resolved theme and persists an explicit choice', () => {
    setMatchMedia(false)
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.toggle())
    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('exposes chartColors that differ between themes', () => {
    setMatchMedia(false)
    const { result } = renderHook(() => useTheme(), { wrapper })
    const light = result.current.chartColors.grid
    act(() => result.current.toggle())
    expect(result.current.chartColors.grid).not.toBe(light)
  })
})
