import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TopNav from '../src/components/TopNav'
import { ThemeProvider } from '../src/hooks/useTheme'

function renderWithRouter(ui) {
  return render(<ThemeProvider><MemoryRouter>{ui}</MemoryRouter></ThemeProvider>)
}

describe('TopNav', () => {
  it('renders the app logo link', () => {
    renderWithRouter(<TopNav />)
    expect(screen.getByText(/Journal Policy Dashboard/i)).toBeInTheDocument()
  })

  it('renders the search input', () => {
    renderWithRouter(<TopNav />)
    expect(screen.getByPlaceholderText(/search fields/i)).toBeInTheDocument()
  })

  it('shows dropdown results when query matches a field', () => {
    renderWithRouter(<TopNav />)
    const input = screen.getByPlaceholderText(/search fields/i)
    fireEvent.change(input, { target: { value: 'cardio' } })
    expect(screen.getByText(/Cardiac/i)).toBeInTheDocument()
  })

  it('hides dropdown when query is cleared', () => {
    renderWithRouter(<TopNav />)
    const input = screen.getByPlaceholderText(/search fields/i)
    fireEvent.change(input, { target: { value: 'cardio' } })
    fireEvent.change(input, { target: { value: '' } })
    expect(screen.queryByText(/Cardiac/i)).not.toBeInTheDocument()
  })

  it('clears input and dropdown when Escape is pressed', () => {
    renderWithRouter(<TopNav />)
    const input = screen.getByPlaceholderText(/search fields/i)
    fireEvent.change(input, { target: { value: 'onco' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input.value).toBe('')
    expect(screen.queryByText(/Oncology/i)).not.toBeInTheDocument()
  })
})
