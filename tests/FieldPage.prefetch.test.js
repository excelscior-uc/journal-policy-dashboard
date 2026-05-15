import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Extract prefetchOthers logic to test it in isolation.
// We test the throttling behaviour: given N slugs to fetch,
// no more than 2 fetches should be in-flight simultaneously.

describe('prefetchOthers throttle', () => {
  let fetchOrder
  let resolvers
  let fetchMock

  beforeEach(() => {
    fetchOrder = []
    resolvers = {}

    fetchMock = vi.fn((slug) => {
      fetchOrder.push(slug)
      return new Promise(resolve => { resolvers[slug] = resolve })
    })
  })

  function prefetchOthers(slugs, fetchFn) {
    // Inline implementation — same logic as FieldPage
    let i = 0
    function next() {
      if (i >= slugs.length) return
      const slug = slugs[i++]
      fetchFn(slug).catch(() => {}).finally(next)
    }
    next(); next()
  }

  it('starts exactly 2 fetches immediately', () => {
    prefetchOthers(['a', 'b', 'c', 'd'], fetchMock)
    expect(fetchOrder).toEqual(['a', 'b'])
  })

  it('starts next fetch only when one slot frees', async () => {
    prefetchOthers(['a', 'b', 'c', 'd'], fetchMock)
    expect(fetchOrder).toEqual(['a', 'b'])

    resolvers['a']()
    await Promise.resolve()
    await Promise.resolve()

    expect(fetchOrder).toEqual(['a', 'b', 'c'])
  })
})
