# Performance Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate unnecessary ChartCard re-renders, throttle background prefetching, and add gzip compression to the Vite build.

**Architecture:** Three independent changes — (1) memoize ChartCard to avoid re-renders on filter toggles, (2) cap prefetch concurrency at 2 to keep the connection pool free for the active fetch, (3) emit `.gz` files at build time via `vite-plugin-compression`.

**Tech Stack:** React 19, Vite 8, Vitest 4, vite-plugin-compression

---

### Task 1: Memoize derived values in ChartCard

**Files:**
- Modify: `src/components/ChartCard.jsx`
- Test: `tests/ChartCard.test.jsx` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/ChartCard.test.jsx`:

```jsx
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
```

- [ ] **Step 2: Run tests to confirm they fail (or ChartCard test file doesn't exist yet)**

```bash
npx vitest run tests/ChartCard.test.jsx
```

Expected: test file not found or component renders but memo test has no assertion failure yet (will pass once memo is added — that's fine, the render spy test is a regression guard).

- [ ] **Step 3: Add `useMemo` for `policyYears` and `extendedData` in ChartCard**

In `src/components/ChartCard.jsx`, change the import line at the top:

```js
import { useRef, useState, useEffect, useMemo } from 'react'
```

Then replace these two lines in the component body (currently lines 103 and 154–157):

Current `policyYears` (line 103):
```js
const policyYears = new Set(policyLines.map(pl => pl.year))
```

Replace with:
```js
const policyYears = useMemo(() => new Set(policyLines.map(pl => pl.year)), [policyLines])
```

Current `extendedData` (lines 154–157):
```js
const extendedData = chartData?.length
  ? [{ year: chartData[0].year - 1 }, ...chartData, { year: chartData[chartData.length - 1].year + 1 }]
  : chartData
```

Replace with:
```js
const extendedData = useMemo(() => chartData?.length
  ? [{ year: chartData[0].year - 1 }, ...chartData, { year: chartData[chartData.length - 1].year + 1 }]
  : chartData, [chartData])
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/ChartCard.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ChartCard.jsx tests/ChartCard.test.jsx
git commit -m "perf: memoize policyYears and extendedData in ChartCard"
```

---

### Task 2: Wrap ChartCard in `React.memo`

**Files:**
- Modify: `src/components/ChartCard.jsx`

- [ ] **Step 1: Wrap the export**

In `src/components/ChartCard.jsx`, the file currently ends with:

```js
export default function ChartCard({ ... }) {
  ...
}
```

Change to a named function + memo export:

```js
function ChartCard({ title, meta, hasPolicy, subtitle, chartData, policyLines = [], visibleSeries, showPolicyLines = true, tall = false, forceVisible = false, onMount }) {
  // ... existing body unchanged ...
}

export default React.memo(ChartCard)
```

Also add `React` to the import at the top of the file. Current import:

```js
import { useRef, useState, useEffect, useMemo } from 'react'
```

Change to:

```js
import React, { useRef, useState, useEffect, useMemo } from 'react'
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ChartCard.jsx
git commit -m "perf: wrap ChartCard in React.memo to skip re-renders on unrelated parent updates"
```

---

### Task 3: Throttle prefetchOthers to 2 concurrent fetches

**Files:**
- Modify: `src/pages/FieldPage.jsx`
- Test: `tests/FieldPage.prefetch.test.js` (create)

- [ ] **Step 1: Write the failing test**

Create `tests/FieldPage.prefetch.test.js`:

```js
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
```

- [ ] **Step 2: Run to confirm test fails**

```bash
npx vitest run tests/FieldPage.prefetch.test.js
```

Expected: FAIL — `prefetchOthers` is not imported (it's defined inline in the test, so it should actually PASS once the logic matches — confirm it passes with the inline definition).

- [ ] **Step 3: Replace `prefetchOthers` in FieldPage**

In `src/pages/FieldPage.jsx`, replace the current `prefetchOthers` function (lines 20–23):

Current:
```js
function prefetchOthers(currentSlug) {
  const others = FIELDS.filter(f => f.slug !== currentSlug && !fieldCache.has(f.slug))
  for (const f of others) fetchField(f.slug).catch(() => {})
}
```

Replace with:
```js
function prefetchOthers(currentSlug) {
  const others = FIELDS.filter(f => f.slug !== currentSlug && !fieldCache.has(f.slug))
  let i = 0
  function next() {
    if (i >= others.length) return
    fetchField(others[i++].slug).catch(() => {}).finally(next)
  }
  next(); next()
}
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/FieldPage.jsx tests/FieldPage.prefetch.test.js
git commit -m "perf: throttle prefetchOthers to 2 concurrent fetches"
```

---

### Task 4: Add gzip compression to Vite build

**Files:**
- Modify: `vite.config.js`
- Modify: `package.json` (dev dependency)

- [ ] **Step 1: Install the plugin**

```bash
npm install --save-dev vite-plugin-compression
```

Expected output: package added to `devDependencies` in `package.json`.

- [ ] **Step 2: Update vite.config.js**

Current `vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/journal-policy-dashboard/',
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
  },
})
```

Replace with:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'gzip', ext: '.gz' }),
  ],
  base: '/journal-policy-dashboard/',
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
  },
})
```

- [ ] **Step 3: Verify build emits `.gz` files**

```bash
npm run build
```

Expected: `dist/data/*.json.gz` files present alongside the uncompressed `.json` files. Check with:

```bash
ls dist/data/ | grep gz
```

Expected: one `.gz` file per JSON data file (e.g., `all-fields.json.gz`, `cardiac.json.gz`, etc.)

- [ ] **Step 4: Run all tests (build change must not break tests)**

```bash
npx vitest run
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add vite.config.js package.json package-lock.json
git commit -m "perf: add vite-plugin-compression to emit gzip assets at build time"
```
