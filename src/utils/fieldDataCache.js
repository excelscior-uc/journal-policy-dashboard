const cache = new Map()

export function fetchField(slug) {
  if (cache.has(slug)) return Promise.resolve(cache.get(slug))
  return fetch(`${import.meta.env.BASE_URL}data/${slug}.json`)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
    .then(json => { cache.set(slug, json); return json })
}

export function getCachedField(slug) {
  return cache.get(slug)
}

export function setCachedField(slug, json) {
  cache.set(slug, json)
}
