// scripts/extract-data.js
//
// Builds public/data/*.json from data/bz_journal_year_percentages_All_Fields.csv.
// Output schema matches what src/pages/FieldPage.jsx and src/components/ChartCard.jsx
// already expect; the rest of the app is untouched.

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

const DISPLAY_TO_SLUG = Object.fromEntries(
  Object.entries(FIELD_DISPLAY_MAP).map(([slug, name]) => [name, slug])
)

// --- CSV parsing (RFC 4180-ish: quoted fields, escaped quotes) ---

export function parseCsv(text) {
  const rows = []
  let field = ''
  let row = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = ''
    } else if (c === '\r') {
      // skip; \n handles row end
    } else {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  if (!rows.length) return []
  const header = rows[0]
  return rows.slice(1).filter(r => r.length === header.length).map(r => {
    const obj = {}
    for (let i = 0; i < header.length; i++) obj[header[i]] = r[i]
    return obj
  })
}

function num(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function jcrId(abbrev) {
  return abbrev.toLowerCase().replace(/\s+/g, '_')
}

function fieldsOf(row) {
  // All_Fields is a semicolon-delimited list of WoS categories.
  return (row.All_Fields || '').split(';').map(s => s.trim()).filter(Boolean)
}

// --- Aggregations ---

export function aggregateChartData(rows) {
  const byYear = new Map()
  for (const r of rows) {
    const y = num(r.year); if (y == null) continue
    const ob = num(r.sum_only_bar) ?? 0
    const oi = num(r.sum_only_inf) ?? 0
    const bi = num(r.sum_bar_and_inf) ?? 0
    const e = num(r.sum_eligible) ?? 0
    const n = num(r.n_articles) ?? 0
    const acc = byYear.get(y) ?? { ob: 0, oi: 0, bi: 0, e: 0, n: 0 }
    acc.ob += ob; acc.oi += oi; acc.bi += bi; acc.e += e; acc.n += n
    byYear.set(y, acc)
  }
  return [...byYear.keys()].sort((a, b) => a - b).map(year => {
    const a = byYear.get(year)
    return {
      year,
      pct_only_bar: a.e ? (a.ob / a.e) * 100 : 0,
      pct_bar_informative: a.e ? (a.bi / a.e) * 100 : 0,
      pct_only_informative: a.e ? (a.oi / a.e) * 100 : 0,
      pct_eligible: a.n ? (a.e / a.n) * 100 : 0,
      eligibleArticles: a.e,
      totalArticles: a.n,
    }
  })
}

function journalChartData(rows) {
  return rows
    .map(r => ({
      year: num(r.year),
      e: num(r.sum_eligible) ?? 0,
      n: num(r.n_articles) ?? 0,
      ob: num(r.p_only_bar) ?? 0,
      oi: num(r.p_only_inf) ?? 0,
      bi: num(r.p_bar_and_inf) ?? 0,
      pe: num(r.p_eligible) ?? 0,
    }))
    .filter(r => r.year != null)
    .sort((a, b) => a.year - b.year)
    .map(r => ({
      year: r.year,
      pct_only_bar: r.ob * 100,
      pct_bar_informative: r.bi * 100,
      pct_only_informative: r.oi * 100,
      pct_eligible: r.pe * 100,
      eligibleArticles: r.e,
      totalArticles: r.n,
    }))
}

function uniqueJournals(rows) {
  // Identity = JCR_Abbrev. Pick the latest row for stable policy/policy_year fields.
  const m = new Map()
  for (const r of rows) {
    const abbrev = r.JCR_Abbrev
    if (!abbrev) continue
    const prev = m.get(abbrev)
    if (!prev || num(r.year) > num(prev.year)) m.set(abbrev, r)
  }
  return m
}

function buildJournals(rows) {
  const meta = uniqueJournals(rows)
  const byAbbrev = new Map()
  for (const r of rows) {
    const k = r.JCR_Abbrev
    if (!k) continue
    if (!byAbbrev.has(k)) byAbbrev.set(k, [])
    byAbbrev.get(k).push(r)
  }
  return [...meta.entries()]
    .map(([abbrev, ref]) => {
      const hasPolicy = num(ref.policy) === 1
      const policyYear = hasPolicy ? num(ref.policy_year) : null
      return {
        id: jcrId(abbrev),
        name: abbrev,
        hasPolicy,
        policyYear,
        chartData: journalChartData(byAbbrev.get(abbrev)),
        policyLines: policyYear != null ? [{ year: policyYear, label: '' }] : [],
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function policyLinesFor(journals) {
  const counts = new Map()
  for (const j of journals) {
    if (j.policyYear == null) continue
    counts.set(j.policyYear, (counts.get(j.policyYear) ?? 0) + 1)
  }
  const total = journals.length
  return [...counts.keys()].sort((a, b) => a - b).map(year => {
    const count = counts.get(year)
    const pct = total ? Math.round((count / total) * 100) : 0
    return { year, label: `${pct}% of journals adopted`, count }
  })
}

function buildAgg(rows, journals) {
  return {
    chartData: aggregateChartData(rows),
    policyLines: policyLinesFor(journals),
  }
}

function buildFieldJson(slug, displayName, rows) {
  const fieldRows = rows.filter(r => fieldsOf(r).includes(displayName))
  const journals = buildJournals(fieldRows)
  const policyAbbrevs = new Set(journals.filter(j => j.hasPolicy).map(j => j.name))
  const policyRows = fieldRows.filter(r => policyAbbrevs.has(r.JCR_Abbrev))
  const noPolicyRows = fieldRows.filter(r => !policyAbbrevs.has(r.JCR_Abbrev))
  const policyJournals = journals.filter(j => j.hasPolicy)
  const noPolicyJournals = journals.filter(j => !j.hasPolicy)

  return {
    field: displayName,
    slug,
    aggAll: buildAgg(fieldRows, journals),
    aggPolicy: buildAgg(policyRows, policyJournals),
    aggNoPolicy: buildAgg(noPolicyRows, noPolicyJournals),
    journals,
  }
}

function buildAllFieldsJson(rows, fieldJsons) {
  const journals = buildJournals(rows)
  const policyAbbrevs = new Set(journals.filter(j => j.hasPolicy).map(j => j.name))
  const policyRows = rows.filter(r => policyAbbrevs.has(r.JCR_Abbrev))
  const noPolicyRows = rows.filter(r => !policyAbbrevs.has(r.JCR_Abbrev))
  const policyJournals = journals.filter(j => j.hasPolicy)
  const noPolicyJournals = journals.filter(j => !j.hasPolicy)

  return {
    field: 'All Research Fields',
    slug: 'all-fields',
    aggAll: buildAgg(rows, journals),
    aggPolicy: buildAgg(policyRows, policyJournals),
    aggNoPolicy: buildAgg(noPolicyRows, noPolicyJournals),
    journals: [],
    fields: fieldJsons.map(f => ({
      slug: f.slug,
      field: f.field,
      aggAll: f.aggAll,
      aggPolicy: f.aggPolicy ?? null,
      aggNoPolicy: f.aggNoPolicy ?? null,
    })),
  }
}

export function buildAll(rows) {
  const fieldJsons = Object.entries(FIELD_DISPLAY_MAP).map(
    ([slug, name]) => buildFieldJson(slug, name, rows)
  )
  const allFields = buildAllFieldsJson(rows, fieldJsons)
  return { fieldJsons, allFields }
}

export { FIELD_DISPLAY_MAP, DISPLAY_TO_SLUG }

// --- CLI entry ---

if (process.argv[1] && process.argv[1].endsWith('extract-data.js')) {
  const csvPath = join(__dirname, '../data/bz_journal_year_percentages_All_Fields.csv')
  const text = readFileSync(csvPath, 'utf8')
  const rows = parseCsv(text)
  const outDir = join(__dirname, '../public/data')
  mkdirSync(outDir, { recursive: true })

  const { fieldJsons, allFields } = buildAll(rows)
  for (const fj of fieldJsons) {
    writeFileSync(join(outDir, `${fj.slug}.json`), JSON.stringify(fj, null, 2))
    console.log(`OK ${fj.slug}.json`)
  }
  writeFileSync(join(outDir, 'all-fields.json'), JSON.stringify(allFields, null, 2))
  console.log('OK all-fields.json')
}
