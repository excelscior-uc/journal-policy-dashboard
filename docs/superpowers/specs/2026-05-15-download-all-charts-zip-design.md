# Download All Charts as ZIP — Design Spec

**Date:** 2026-05-15  
**Status:** Approved

## Overview

Add a three-dot circle button to the "Aggregated Trend" section title row in `FieldPage`. Clicking it captures every rendered `ChartCard` on the current field page as a PNG and bundles them into a single ZIP file (`{fieldName}-charts.zip`).

## Architecture

### Approach: Ref Registration (B)

`ChartCard` exposes a capture function upward via an `onMount` callback prop. `FieldPage` collects these into a registry and iterates them when the user triggers the download.

### Force-Render Before Capture

Cards use `useVisible` (intersection observer) — off-screen cards render only a skeleton. Before capturing, all cards must be force-rendered.

Flow:
1. User clicks download button → `isCapturing = true`
2. All `<ChartCard forceVisible={isCapturing} />` bypass `useVisible` and render their Recharts SVG
3. `useEffect` watching `isCapturing`: after 2× `requestAnimationFrame` (time for Recharts to paint), run capture loop
4. Parallel `toPng()` on each registered card → zip via `jszip` → anchor download
5. `isCapturing = false`

## Component Changes

### `ChartCard.jsx`

- Add `onMount` prop (optional): called with `{ title, capture }` on mount, `null` on unmount
- Add `forceVisible` prop (optional, default `false`): render condition becomes `visible || forceVisible`
- `capture` function: `() => toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 })`
- No changes to existing per-card download behavior

### `FieldPage.jsx`

- Add `captureRegistryRef = useRef([])` — array of `{ title, capture }` entries
- Add `isCapturing` state (bool, default `false`)
- `registerCapture(entry)` helper: if `entry` is non-null, push to registry; if null, remove stale entries by filtering
- Pass `onMount={registerCapture}` and `forceVisible={isCapturing}` to every `<ChartCard>`
- Reset registry on `slug` change (inside existing `useEffect`)
- `useEffect([isCapturing])`: when `isCapturing` becomes true, wait 2× rAF, then run `downloadAllCharts()`
- `downloadAllCharts()`: parallel captures → JSZip → download as `{field.name}-charts.zip`

### Button Placement

- Lives in the `"Aggregated Trend"` `chart-section-title` row (right side)
- Three-dot SVG icon matching the existing `.chart-card__menu-btn` style
- Shows `…` while `isCapturing` is true (busy state)
- Only renders when `data` is loaded

### CSS

- New class `.chart-section-title__download-btn`: circle button, same dimensions as `.chart-card__menu-btn`, placed inline-flex in the section title row

## Data Flow

```
click → isCapturing=true
  → all ChartCards re-render with forceVisible=true
  → useEffect fires → 2× rAF
  → captureRegistryRef.current.map(e => e.capture())  [parallel]
  → JSZip.generateAsync('blob')
  → <a download> click
  → isCapturing=false
```

## Edge Cases

- Cards not yet registered (slug just changed, data still loading): button only shows when `data` is loaded, so registry will be populated
- Registry reset on slug change: existing `useEffect([slug])` clears `captureRegistryRef.current = []`
- `onMount(null)` on unmount: filters stale entries from registry
- ZIP filename sanitized: `field.name.replace(/\s+/g, '-')` + `-charts.zip`
- Individual PNG filenames: `entry.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '.png'`

## Files Touched

- `src/components/ChartCard.jsx` — add `onMount`, `forceVisible` props
- `src/pages/FieldPage.jsx` — registry, `isCapturing` state, download logic, button UI
- `src/styles/app.css` — `.chart-section-title__download-btn` style

## Dependencies

- `jszip` — already installed (`^3.10.1`)
- `html-to-image` — already installed (`^1.11.13`), already used in `ChartCard`
