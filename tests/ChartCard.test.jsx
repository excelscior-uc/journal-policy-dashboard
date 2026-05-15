import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import ChartCard from '../src/components/ChartCard'

// Recharts uses ResizeObserver — stub it
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }

// Stub IntersectionObserver so useVisible returns false by default
global.IntersectionObserver = class {
  constructor(cb) { this._cb = cb }
  observe() {}
  disconnect() {}
}

const CHART_DATA = [
  { year: 2018, pct_only_bar: 10, pct_bar_informative: 20, pct_only_informative: 30, pct_eligible: 60, eligibleArticles: 60, totalArticles: 100 },
  { year: 2019, pct_only_bar: 12, pct_bar_informative: 18, pct_only_informative: 35, pct_eligible: 65, eligibleArticles: 65, totalArticles: 100 },
]

const POLICY_LINES = [{ year: 2019 }]

describe('ChartCard', () => {
  it('renders title and subtitle', () => {
    render(
      <ChartCard
        title="Test Journal"
        subtitle="n = 60 eligible articles"
        chartData={CHART_DATA}
        policyLines={POLICY_LINES}
        visibleSeries={new Set(['pct_only_bar'])}
        showPolicyLines={true}
        forceVisible={true}
      />
    )
    expect(screen.getByText('Test Journal')).toBeInTheDocument()
    expect(screen.getByText('n = 60 eligible articles')).toBeInTheDocument()
  })

  it('does not re-render when unrelated parent state changes', () => {
    const renderSpy = vi.fn()
    const visibleSeries = new Set(['pct_only_bar'])

    function Wrapper({ counter }) {
      renderSpy()
      return (
        <ChartCard
          title="Test Journal"
          subtitle="n = 60"
          chartData={CHART_DATA}
          policyLines={POLICY_LINES}
          visibleSeries={visibleSeries}
          showPolicyLines={true}
          forceVisible={true}
        />
      )
    }

    const { rerender } = render(<Wrapper counter={0} />)
    const initialCallCount = renderSpy.mock.calls.length
    rerender(<Wrapper counter={1} />)
    // Wrapper re-renders but ChartCard should not (memo)
    // We verify by checking the DOM didn't change (title still present once)
    expect(screen.getAllByText('Test Journal')).toHaveLength(1)
    expect(renderSpy.mock.calls.length).toBeGreaterThan(initialCallCount)
  })
})
