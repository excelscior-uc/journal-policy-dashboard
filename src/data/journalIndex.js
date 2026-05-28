import { FIELDS } from './fields'
import { useEffect, useState } from 'react'

let cache = null
let promise = null

function fetchOne(slug) {
  return fetch(`${import.meta.env.BASE_URL}data/${slug}.json`).then(r => r.ok ? r.json() : null).catch(() => null)
}

function load() {
  if (cache) return Promise.resolve(cache)
  if (promise) return promise
  const slugs = FIELDS.filter(f => f.slug !== 'all-fields').map(f => f.slug)
  promise = Promise.all(slugs.map(fetchOne)).then(payloads => {
    const seen = new Map()
    for (let i = 0; i < payloads.length; i++) {
      const p = payloads[i]
      const slug = slugs[i]
      if (!p?.journals) continue
      const fieldMeta = FIELDS.find(f => f.slug === slug)
      for (const j of p.journals) {
        if (!j?.id) continue
        if (!seen.has(j.id)) {
          seen.set(j.id, {
            id: j.id,
            name: j.name,
            hasPolicy: !!j.hasPolicy,
            policyYear: j.policyYear ?? null,
            fields: [{ slug, name: fieldMeta?.name ?? slug }],
          })
        } else {
          const entry = seen.get(j.id)
          if (!entry.fields.some(f => f.slug === slug)) {
            entry.fields.push({ slug, name: fieldMeta?.name ?? slug })
          }
        }
      }
    }
    cache = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
    return cache
  })
  return promise
}

export function useJournalIndex() {
  const [data, setData] = useState(cache)
  useEffect(() => {
    if (cache) { setData(cache); return }
    load().then(setData)
  }, [])
  return data
}

export function primeJournalIndex() { load() }

function computeFieldCounts(index) {
  const counts = {}
  for (const f of FIELDS) counts[f.slug] = { totalJournals: 0, withPolicy: 0 }
  for (const j of index) {
    counts['all-fields'].totalJournals++
    if (j.hasPolicy) counts['all-fields'].withPolicy++
    for (const f of j.fields) {
      if (!counts[f.slug]) continue
      counts[f.slug].totalJournals++
      if (j.hasPolicy) counts[f.slug].withPolicy++
    }
  }
  return counts
}

export function useFieldCounts() {
  const index = useJournalIndex()
  return index ? computeFieldCounts(index) : null
}
