import { useEffect, useState } from 'react'

let cache = null
let promise = null

function load() {
  if (cache) return Promise.resolve(cache)
  if (promise) return promise
  promise = fetch(`${import.meta.env.BASE_URL}data/journal-names.json`)
    .then(r => r.ok ? r.json() : {})
    .then(map => { cache = map || {}; return cache })
    .catch(() => { cache = {}; return cache })
  return promise
}

export function getFullName(abbrev, fallback = abbrev) {
  if (!abbrev) return fallback
  const entry = cache?.[abbrev]
  return entry?.full || fallback
}

export function useJournalNames() {
  const [, force] = useState(0)
  useEffect(() => {
    if (cache) return
    load().then(() => force(n => n + 1))
  }, [])
  return getFullName
}
