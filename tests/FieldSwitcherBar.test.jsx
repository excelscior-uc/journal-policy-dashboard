import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { FIELDS } from '../src/data/fields'
import FieldSwitcherBar from '../src/components/FieldSwitcherBar'

function renderWithRouter(slug = 'oncology') {
  return render(
    <MemoryRouter initialEntries={[`/field/${slug}`]}>
      <Routes>
        <Route path="/field/:slug" element={<FieldSwitcherBar currentSlug={slug} />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('FieldSwitcherBar', () => {
  it('renders a back-to-home link', () => {
    renderWithRouter()
    expect(screen.getByText(/← Home/i)).toBeInTheDocument()
  })

  it('renders a select with all fields', () => {
    renderWithRouter()
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    FIELDS.forEach(f => {
      expect(screen.getByRole('option', { name: new RegExp(f.name, 'i') })).toBeInTheDocument()
    })
  })

  it('shows the current field as selected', () => {
    renderWithRouter('oncology')
    const select = screen.getByRole('combobox')
    expect(select.value).toBe('oncology')
  })
})
