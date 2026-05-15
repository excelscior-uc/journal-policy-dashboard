---
title: Performance Improvements
date: 2026-05-15
status: approved
---

# Performance Improvements Design

## Goal

Reduce initial data-load time, eliminate unnecessary re-renders during filter/toggle interactions, and compress static assets at build time.

## Changes

### 1. ChartCard — `React.memo` + `useMemo`

**File:** `src/components/ChartCard.jsx`

Wrap the default export in `React.memo`. The parent replaces the `visibleSeries` Set on every toggle (`new Set(prev)`), so reference equality is sufficient for memo comparison — no custom comparator needed.

Move two derived values from render body to `useMemo`:

- `policyYears` — `new Set(policyLines.map(...))` allocated every render → memoize on `policyLines`
- `extendedData` — new array splice allocated every render → memoize on `chartData`

**Effect:** toggling series visibility or policy lines no longer re-renders every chart card in the list — only cards whose props changed re-render.

### 2. FieldPage — Throttled prefetch

**File:** `src/pages/FieldPage.jsx`

Replace `prefetchOthers` implementation with a concurrency-limited queue (max 2 simultaneous fetches):

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

**Effect:** browser connection pool (6-connection limit) stays available for the current field fetch and other page assets instead of being saturated by 12 simultaneous prefetch requests.

### 3. Vite build — gzip compression

**File:** `vite.config.js`

Add `vite-plugin-compression` to emit `.gz` files alongside every static asset at build time.

```js
import viteCompression from 'vite-plugin-compression'

plugins: [
  react(),
  viteCompression({ algorithm: 'gzip', ext: '.gz' }),
]
```

**Effect:** ~70-80% reduction in JSON transfer size when served from a host that serves pre-compressed files (nginx, Netlify, Vercel, Cloudflare Pages).

**Note:** GitHub Pages uses its own CDN compression and does not serve pre-compressed `.gz` files from the repo. If deployed to GitHub Pages, this build step is harmless but the compression benefit comes from the CDN layer, not the emitted files. For self-hosted or alternative deployments, this provides significant wins for the 24–204 KB JSON data files.

## Non-changes

- `useVisible` options stability — `DEFAULT_OPTIONS` is already a module-level constant; no change needed.
- Data file structure — JSON sizes (24–204 KB raw) compress well enough; no schema split required.
- `fieldCache` Map — already correct; no change needed.

## Files Changed

| File | Change |
|------|--------|
| `src/components/ChartCard.jsx` | `React.memo` wrap, `useMemo` for `policyYears` and `extendedData` |
| `src/pages/FieldPage.jsx` | Throttled `prefetchOthers` (2 concurrent) |
| `vite.config.js` | Add `vite-plugin-compression` |
| `package.json` | Add `vite-plugin-compression` dev dependency |
