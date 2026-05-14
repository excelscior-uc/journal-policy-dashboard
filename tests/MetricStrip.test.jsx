import { render, screen } from '@testing-library/react'
import MetricStrip from '../src/components/MetricStrip'

describe('MetricStrip', () => {
  it('renders three metric items', () => {
    render(<MetricStrip />)
    expect(screen.getByText(/% only bar graphs/i)).toBeInTheDocument()
    expect(screen.getByText(/% bar and informative/i)).toBeInTheDocument()
    expect(screen.getByText(/% only informative/i)).toBeInTheDocument()
  })

  it('renders three color swatches', () => {
    const { container } = render(<MetricStrip />)
    expect(container.querySelectorAll('.metric-strip__swatch')).toHaveLength(3)
  })
})
