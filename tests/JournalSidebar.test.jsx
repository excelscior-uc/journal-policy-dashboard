import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import JournalSidebar from '../src/components/JournalSidebar'

const journals = [
  { id: 'j1', name: 'Cancer Cell', hasPolicy: true, policyYear: 2019 },
  { id: 'j2', name: 'Nature Cancer', hasPolicy: true, policyYear: 2020 },
  { id: 'j3', name: 'PLOS ONE', hasPolicy: false },
]

function renderSidebarAtField(path, props = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/field/:slug"
          element={<JournalSidebar journals={journals} selectedId="__agg__" onSelect={() => {}} {...props} />}
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('JournalSidebar', () => {
  it('renders all journals when search is empty', () => {
    renderSidebarAtField('/field/oncology')
    expect(screen.getByText('Cancer Cell')).toBeInTheDocument()
    expect(screen.getByText('Nature Cancer')).toBeInTheDocument()
    expect(screen.getByText('PLOS ONE')).toBeInTheDocument()
  })

  it('filters journals by search query (case-insensitive)', () => {
    renderSidebarAtField('/field/oncology')
    const input = screen.getByPlaceholderText(/search journals/i)
    fireEvent.change(input, { target: { value: 'cancer' } })
    expect(screen.getByText('Cancer Cell')).toBeInTheDocument()
    expect(screen.getByText('Nature Cancer')).toBeInTheDocument()
    expect(screen.queryByText('PLOS ONE')).not.toBeInTheDocument()
  })

  it('shows no-results message when search matches nothing', () => {
    renderSidebarAtField('/field/oncology')
    const input = screen.getByPlaceholderText(/search journals/i)
    fireEvent.change(input, { target: { value: 'zzz' } })
    expect(screen.getByText(/no journals match/i)).toBeInTheDocument()
  })

  it('calls onSelect with journal id when clicked', () => {
    const onSelect = vi.fn()
    renderSidebarAtField('/field/oncology', { onSelect })
    fireEvent.click(screen.getByText('Cancer Cell'))
    expect(onSelect).toHaveBeenCalledWith('j1')
  })

  it('hides journal search, list, and legend when All Research Fields is selected', () => {
    renderSidebarAtField('/field/all-fields')
    expect(screen.queryByPlaceholderText(/search journals/i)).not.toBeInTheDocument()
    expect(screen.queryByText('All Journals (aggregated)')).not.toBeInTheDocument()
    expect(screen.queryByText('Cancer Cell')).not.toBeInTheDocument()
    expect(screen.queryByText(/has policy/i)).not.toBeInTheDocument()
    expect(screen.getByText(/All research fields — open one/i)).toBeInTheDocument()
  })

  it('renders toggle button with expand chevron when collapsed', () => {
    renderSidebarAtField('/field/oncology', { collapsed: true, onToggle: () => {} })
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument()
  })

  it('hides journal list and search when collapsed', () => {
    renderSidebarAtField('/field/oncology', { collapsed: true, onToggle: () => {} })
    expect(screen.queryByPlaceholderText(/search journals/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Cancer Cell')).not.toBeInTheDocument()
  })

  it('calls onToggle when toggle button is clicked', () => {
    const onToggle = vi.fn()
    renderSidebarAtField('/field/oncology', { collapsed: false, onToggle })
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
