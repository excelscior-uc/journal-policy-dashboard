// tests/extract-data.test.js
import { tracesToChartData, tracesToPolicyLines, seriesKeyMap } from '../scripts/extract-data.js'

describe('tracesToChartData', () => {
  it('converts Plotly scatter traces to flat chartData array', () => {
    const traces = [
      { legendgroup: '% only bar', x: [2010, 2011], y: [72.3, 68.1], name: '% only bar' },
      { legendgroup: '% only informative', x: [2010, 2011], y: [5.2, 8.4], name: '% only informative' },
    ]
    const result = tracesToChartData(traces)
    expect(result).toEqual([
      { year: 2010, pct_only_bar: 72.3, pct_only_informative: 5.2 },
      { year: 2011, pct_only_bar: 68.1, pct_only_informative: 8.4 },
    ])
  })

  it('ignores policy_vlines traces', () => {
    const traces = [
      { legendgroup: 'policy_vlines', x: [2016, 2016], y: [0, 120] },
      { legendgroup: '% only bar', x: [2010], y: [72.3] },
    ]
    const result = tracesToChartData(traces)
    expect(result).toEqual([{ year: 2010, pct_only_bar: 72.3 }])
  })
})

describe('tracesToPolicyLines', () => {
  it('extracts unique policy years from vline traces', () => {
    const traces = [
      { legendgroup: 'policy_vlines', x: [2016, 2016], hovertemplate: 'Policy year: 2016<br>13% of journals adopted<extra></extra>' },
      { legendgroup: 'policy_vlines', x: [2019, 2019], hovertemplate: 'Policy year: 2019<br>5% of journals adopted<extra></extra>' },
      { legendgroup: '% only bar', x: [2010], y: [72] },
    ]
    const result = tracesToPolicyLines(traces)
    expect(result).toEqual([
      { year: 2016, label: '13% of journals adopted' },
      { year: 2019, label: '5% of journals adopted' },
    ])
  })

  it('deduplicates policy lines for the same year', () => {
    const traces = [
      { legendgroup: 'policy_vlines', x: [2016, 2016], hovertemplate: 'Policy year: 2016<br>13% of journals adopted<extra></extra>' },
      { legendgroup: 'policy_vlines', x: [2016, 2016], hovertemplate: 'Policy year: 2016<br>13% of journals adopted<extra></extra>' },
    ]
    expect(tracesToPolicyLines(traces)).toHaveLength(1)
  })
})

describe('seriesKeyMap', () => {
  it('maps all known legend groups to keys', () => {
    expect(seriesKeyMap['% only bar']).toBe('pct_only_bar')
    expect(seriesKeyMap['% bar and informative']).toBe('pct_bar_informative')
    expect(seriesKeyMap['% only informative']).toBe('pct_only_informative')
    expect(seriesKeyMap['% eligible articles']).toBe('pct_eligible')
  })
})
