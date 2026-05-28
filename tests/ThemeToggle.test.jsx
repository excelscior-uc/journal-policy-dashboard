import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '../src/hooks/useTheme'
import ThemeToggle from '../src/components/ThemeToggle'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  window.matchMedia = vi.fn().mockImplementation(q => ({
    matches: false, media: q,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
})

it('renders a button and toggles the document theme on click', () => {
  render(<ThemeProvider><ThemeToggle /></ThemeProvider>)
  const btn = screen.getByRole('button', { name: /theme|dark|light/i })
  expect(document.documentElement.dataset.theme).toBe('light')
  fireEvent.click(btn)
  expect(document.documentElement.dataset.theme).toBe('dark')
})
