// tests/extract-data.test.js
import { parseCsv, aggregateChartData, buildAll } from '../scripts/extract-data.js'

const HEADER = [
  'Journal_Name','year','e_issn','policy','policy_year','Field','All_Fields','JCR_Abbrev',
  'sum_bar','sum_inf','sum_eligible','n_bar_or_informative',
  'sum_only_bar','sum_only_inf','sum_bar_and_inf','n_articles',
  'p_bar','p_informative','p_eligible','p_only_bar','p_only_inf','p_bar_and_inf',
].join(',')

function row({ name='J A', year=2010, policy=0, policyYear='', field='Cardiac & Cardiovascular Systems', allFields='Cardiac & Cardiovascular Systems', abbrev='J A', sb=24, si=9, bi=5, e=38, n=79 }) {
  const bar = sb + bi
  const inf = si + bi
  const pb = bar / e, pi = inf / e, pe = e / n
  const pob = sb / e, poi = si / e, pbi = bi / e
  const allFieldsCsv = allFields.includes(',') ? `"${allFields}"` : allFields
  return [
    name, year, '0000-0000', policy, policyYear, field, allFieldsCsv, abbrev,
    bar, inf, e, e, sb, si, bi, n,
    pb, pi, pe, pob, poi, pbi,
  ].join(',')
}

describe('parseCsv', () => {
  it('parses header and rows', () => {
    const csv = `${HEADER}\n${row({})}`
    const rows = parseCsv(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].Journal_Name).toBe('J A')
    expect(rows[0].year).toBe('2010')
  })

  it('handles quoted fields with embedded commas', () => {
    const csv = `${HEADER}\n${row({ allFields: 'Cardiac & Cardiovascular Systems; Radiology, Nuclear Medicine & Medical Imaging' })}`
    const rows = parseCsv(csv)
    expect(rows[0].All_Fields).toBe('Cardiac & Cardiovascular Systems; Radiology, Nuclear Medicine & Medical Imaging')
    expect(rows[0].JCR_Abbrev).toBe('J A')
  })

  it('handles escaped double quotes', () => {
    const csv = `${HEADER}\nA,2010,x,0,,F,"He said ""hi""",AB,1,1,2,2,1,1,0,4,0.5,0.5,0.5,0.5,0.5,0`
    const rows = parseCsv(csv)
    expect(rows[0].All_Fields).toBe('He said "hi"')
  })
})

describe('aggregateChartData', () => {
  it('weights percentages by eligible sums and pct_eligible by total articles', () => {
    const rows = parseCsv([
      HEADER,
      row({ name: 'A', abbrev: 'A', year: 2010, sb: 10, si: 0, bi: 0, e: 10, n: 100 }),
      row({ name: 'B', abbrev: 'B', year: 2010, sb: 0,  si: 10, bi: 0, e: 10, n: 100 }),
    ].join('\n'))
    const [p] = aggregateChartData(rows)
    expect(p.year).toBe(2010)
    expect(p.pct_only_bar).toBeCloseTo(50, 6)
    expect(p.pct_only_informative).toBeCloseTo(50, 6)
    expect(p.pct_bar_informative).toBeCloseTo(0, 6)
    expect(p.pct_eligible).toBeCloseTo(10, 6)
    expect(p.eligibleArticles).toBe(20)
    expect(p.totalArticles).toBe(200)
  })

  it('emits sorted years and one point per year', () => {
    const rows = parseCsv([
      HEADER,
      row({ year: 2012 }), row({ year: 2010 }), row({ year: 2011 }),
    ].join('\n'))
    expect(aggregateChartData(rows).map(p => p.year)).toEqual([2010, 2011, 2012])
  })
})

describe('buildAll', () => {
  const rows = parseCsv([
    HEADER,
    row({ name: 'J1', abbrev: 'J1', year: 2010, allFields: 'Cardiac & Cardiovascular Systems', policy: 1, policyYear: 2014 }),
    row({ name: 'J1', abbrev: 'J1', year: 2011, allFields: 'Cardiac & Cardiovascular Systems', policy: 1, policyYear: 2014 }),
    row({ name: 'J2', abbrev: 'J2', year: 2010, allFields: 'Cardiac & Cardiovascular Systems; Pharmacology & Pharmacy', policy: 0 }),
    row({ name: 'J3', abbrev: 'J3', year: 2010, field: 'Oncology', allFields: 'Oncology', policy: 0 }),
  ].join('\n'))

  const { fieldJsons, allFields } = buildAll(rows)
  const cardiac = fieldJsons.find(f => f.slug === 'cardiac')
  const pharma = fieldJsons.find(f => f.slug === 'pharmacology')

  it('includes journals matched by All_Fields membership', () => {
    expect(cardiac.journals.map(j => j.name).sort()).toEqual(['J1', 'J2'])
    expect(pharma.journals.map(j => j.name)).toEqual(['J2'])
  })

  it('splits aggPolicy / aggNoPolicy by per-journal policy flag', () => {
    expect(cardiac.aggPolicy.chartData.length).toBeGreaterThan(0)
    expect(cardiac.aggNoPolicy.chartData.length).toBeGreaterThan(0)
    expect(cardiac.aggPolicy.policyLines).toEqual([
      { year: 2014, label: '100% of journals adopted', count: 1 },
    ])
  })

  it('all-fields aggAll covers every row', () => {
    const p2010 = allFields.aggAll.chartData.find(p => p.year === 2010)
    expect(p2010.totalArticles).toBe(79 * 3)
  })

  it('all-fields includes a fields array with per-field aggregates', () => {
    expect(allFields.fields.map(f => f.slug)).toContain('cardiac')
    expect(allFields.fields.find(f => f.slug === 'cardiac').aggAll.chartData.length).toBeGreaterThan(0)
  })

  it('journal id is JCR_Abbrev lowercased with underscores', () => {
    expect(cardiac.journals.find(j => j.name === 'J1').id).toBe('j1')
  })
})
