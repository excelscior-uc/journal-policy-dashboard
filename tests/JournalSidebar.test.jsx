import { render, screen, fireEvent } from '@testing-library/react'
import JournalSidebar from '../src/components/JournalSidebar'

const journals = [
  { id: 'j1', name: 'Cancer Cell', hasPolicy: true, policyYear: 2019 },
  { id: 'j2', name: 'Nature Cancer', hasPolicy: true, policyYear: 2020 },
  { id: 'j3', name: 'PLOS ONE', hasPolicy: false },
]

describe('JournalSidebar', () => {
  it('renders all journals when search is empty', () => {
    render(<JournalSidebar journals={journals} selectedId="__agg__" onSelect={() => {}} />)
    expect(screen.getByText('Cancer Cell')).toBeInTheDocument()
    expect(screen.getByText('Nature Cancer')).toBeInTheDocument()
    expect(screen.getByText('PLOS ONE')).toBeInTheDocument()
  })

  it('filters journals by search query (case-insensitive)', () => {
    render(<JournalSidebar journals={journals} selectedId="__agg__" onSelect={() => {}} />)
    const input = screen.getByPlaceholderText(/search journals/i)
    fireEvent.change(input, { target: { value: 'cancer' } })
    expect(screen.getByText('Cancer Cell')).toBeInTheDocument()
    expect(screen.getByText('Nature Cancer')).toBeInTheDocument()
    expect(screen.queryByText('PLOS ONE')).not.toBeInTheDocument()
  })

  it('shows no-results message when search matches nothing', () => {
    render(<JournalSidebar journals={journals} selectedId="__agg__" onSelect={() => {}} />)
    const input = screen.getByPlaceholderText(/search journals/i)
    fireEvent.change(input, { target: { value: 'zzz' } })
    expect(screen.getByText(/no journals match/i)).toBeInTheDocument()
  })

  it('calls onSelect with journal id when clicked', () => {
    const onSelect = vi.fn()
    render(<JournalSidebar journals={journals} selectedId="__agg__" onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Cancer Cell'))
    expect(onSelect).toHaveBeenCalledWith('j1')
  })
})
