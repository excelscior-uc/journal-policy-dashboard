// scripts/extract-data.js
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { createContext, runInContext } from 'vm'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const seriesKeyMap = {
  '% only bar': 'pct_only_bar',
  '% bar and informative': 'pct_bar_informative',
  '% only informative': 'pct_only_informative',
  '% eligible articles': 'pct_eligible',
}

function getSeriesKey(trace) {
  // Try legendgroup first, then name (source HTML omits legendgroup on data traces)
  return seriesKeyMap[trace.legendgroup] || seriesKeyMap[trace.name] || null
}

/**
 * Decode a Plotly axis value — either a plain JS array or a binary-encoded
 * {dtype, bdata} object (base64 little-endian float64 array).
 */
function decodeAxis(v) {
  if (Array.isArray(v)) return v
  if (v && typeof v === 'object' && v.bdata) {
    const buf = Buffer.from(v.bdata, 'base64')
    if (buf.length % 8 !== 0) return []
    const out = []
    for (let i = 0; i < buf.length; i += 8) {
      out.push(buf.readDoubleLE(i))
    }
    return out
  }
  return []
}

export function tracesToChartData(traces) {
  const dataTraces = traces.filter(t => t.legendgroup !== 'policy_vlines' && getSeriesKey(t))
  if (!dataTraces.length) return []

  const years = decodeAxis(dataTraces[0].x)
  const countTrace = dataTraces.find(t => Array.isArray(t.customdata) && t.customdata.length > 0)

  return years.map((year, i) => {
    const point = { year: Math.round(year) }
    for (const trace of dataTraces) {
      const key = getSeriesKey(trace)
      if (key) {
        const vals = decodeAxis(trace.y)
        point[key] = vals[i] ?? null
      }
    }
    if (countTrace) {
      const row = countTrace.customdata[i]
      if (Array.isArray(row)) {
        point.eligibleArticles = row[0] ?? null
        point.totalArticles = row[1] ?? null
      }
    }
    return point
  })
}

export function tracesToPolicyLines(traces) {
  const seen = new Set()
  return traces
    .filter(t => t.legendgroup === 'policy_vlines')
    .reduce((acc, t) => {
      const xArr = decodeAxis(t.x)
      const year = Math.round(xArr[0])
      if (seen.has(year)) return acc
      seen.add(year)
      const match = t.hovertemplate?.match(/(\d+% of journals[^<]*)/)
      acc.push({ year, label: match ? match[1] : '' })
      return acc
    }, [])
}

const FIELD_SLUG_MAP = {
  Cardiac_and_Cardiovascular_Systems: 'cardiac',
  Clinical_Neurology: 'clinical-neurology',
  Endocrinology_and_Metabolism: 'endocrinology',
  Genetics_and_Heredity: 'genetics',
  Immunology: 'immunology',
  Neurosciences: 'neurosciences',
  Oncology: 'oncology',
  Orthopedics: 'orthopedics',
  Pharmacology_and_Pharmacy: 'pharmacology',
  Physiology: 'physiology',
  Rheumatology: 'rheumatology',
  Urology_and_Nephrology: 'urology',
}

const FIELD_DISPLAY_MAP = {
  cardiac: 'Cardiac & Cardiovascular Systems',
  'clinical-neurology': 'Clinical Neurology',
  endocrinology: 'Endocrinology & Metabolism',
  genetics: 'Genetics & Heredity',
  immunology: 'Immunology',
  neurosciences: 'Neurosciences',
  oncology: 'Oncology',
  orthopedics: 'Orthopedics',
  pharmacology: 'Pharmacology & Pharmacy',
  physiology: 'Physiology',
  rheumatology: 'Rheumatology',
  urology: 'Urology & Nephrology',
}

function extractPlots(html) {
  const captured = {}
  const scriptRegex = /<script>([\s\S]*?)<\/script>/g
  let match
  while ((match = scriptRegex.exec(html)) !== null) {
    const code = match[1]
    if (!code.includes('Plotly.newPlot')) continue
    try {
      const ctx = createContext({
        Plotly: { newPlot: (id, data, layout) => { captured[id] = { data, layout } } },
      })
      runInContext(code, ctx)
    } catch (_) { /* skip non-chart blocks */ }
  }
  return captured
}

function buildFieldJson(slug, fieldKey, plots) {
  const agg = (suffix) => {
    const key = `plot_fagg_${fieldKey}_${suffix}`
    const p = plots[key]
    if (!p) return null
    return { chartData: tracesToChartData(p.data), policyLines: tracesToPolicyLines(p.data) }
  }

  const journalPrefix = `jplot_${fieldKey}_`
  const journalKeys = Object.keys(plots).filter(k => k.startsWith(journalPrefix))

  const journals = journalKeys.map(k => {
    const name = k.replace(journalPrefix, '').replace(/_/g, ' ')
    const p = plots[k]
    const policyLines = tracesToPolicyLines(p.data)
    return {
      id: k.replace(journalPrefix, '').toLowerCase(),
      name,
      hasPolicy: policyLines.length > 0,
      policyYear: policyLines[0]?.year ?? null,
      chartData: tracesToChartData(p.data),
      policyLines,
    }
  })

  return {
    field: FIELD_DISPLAY_MAP[slug],
    slug,
    aggAll: agg('all'),
    aggPolicy: agg('pol'),
    aggNoPolicy: agg('npo'),
    journals,
  }
}

function buildAllFieldsJson(plots, fieldJsons) {
  const p = plots['plot_global_agg_global']
  if (!p) return null
  return {
    field: 'All Research Fields',
    slug: 'all-fields',
    aggAll: { chartData: tracesToChartData(p.data), policyLines: tracesToPolicyLines(p.data) },
    aggPolicy: plots['plot_global_agg_pol']
      ? { chartData: tracesToChartData(plots['plot_global_agg_pol'].data), policyLines: tracesToPolicyLines(plots['plot_global_agg_pol'].data) }
      : null,
    aggNoPolicy: plots['plot_global_agg_npo']
      ? { chartData: tracesToChartData(plots['plot_global_agg_npo'].data), policyLines: tracesToPolicyLines(plots['plot_global_agg_npo'].data) }
      : null,
    journals: [],
    fields: fieldJsons.map(f => ({ slug: f.slug, field: f.field, aggAll: f.aggAll })),
  }
}

// Only run main when executed directly (not when imported for tests)
if (process.argv[1] && process.argv[1].endsWith('extract-data.js')) {
  const sourceHtml = readFileSync(join(__dirname, 'source.html'), 'utf8')
  const plots = extractPlots(sourceHtml)
  const outDir = join(__dirname, '../public/data')
  mkdirSync(outDir, { recursive: true })

  const fieldJsons = []
  for (const [fieldKey, slug] of Object.entries(FIELD_SLUG_MAP)) {
    const json = buildFieldJson(slug, fieldKey, plots)
    writeFileSync(join(outDir, `${slug}.json`), JSON.stringify(json, null, 2))
    console.log(`✓ ${slug}.json`)
    fieldJsons.push(json)
  }
  const allFields = buildAllFieldsJson(plots, fieldJsons)
  writeFileSync(join(outDir, 'all-fields.json'), JSON.stringify(allFields, null, 2))
  console.log('✓ all-fields.json')
}
