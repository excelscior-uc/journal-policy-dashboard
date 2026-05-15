# Download All Charts as ZIP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-dot button to the "Aggregated Trend" section title that captures every visible `ChartCard` as a PNG and downloads them as a single ZIP file.

**Architecture:** `ChartCard` exposes a capture function via an `onMount` callback prop; `FieldPage` registers these in a ref-array. On click, `isCapturing` state forces all cards to render (bypassing lazy `useVisible`), then a `useEffect` waits two `requestAnimationFrame` ticks before running parallel `toPng` captures and zipping via `jszip`.

**Tech Stack:** React 19, `html-to-image` (toPng), `jszip` — both already installed.

---

### Task 1: Add `forceVisible` prop to `ChartCard`

**Files:**
- Modify: `src/components/ChartCard.jsx`

The `useVisible` hook means off-screen cards render only a skeleton. `forceVisible` bypasses it so all cards render before capture.

- [ ] **Step 1: Update the ChartCard function signature**

In [src/components/ChartCard.jsx:99](src/components/ChartCard.jsx), change the destructured props from:

```jsx
export default function ChartCard({ title, meta, hasPolicy, subtitle, chartData, policyLines = [], visibleSeries, showPolicyLines = true, tall = false }) {
```

to:

```jsx
export default function ChartCard({ title, meta, hasPolicy, subtitle, chartData, policyLines = [], visibleSeries, showPolicyLines = true, tall = false, forceVisible = false, onMount }) {
```

- [ ] **Step 2: Apply `forceVisible` to the render condition**

In [src/components/ChartCard.jsx:202](src/components/ChartCard.jsx), the body div conditionally renders the chart. Change:

```jsx
      <div ref={ref} className={`chart-card__body${tall ? ' chart-card__body--agg' : ''}`}>
        {visible ? (
```

to:

```jsx
      <div ref={ref} className={`chart-card__body${tall ? ' chart-card__body--agg' : ''}`}>
        {visible || forceVisible ? (
```

- [ ] **Step 3: Verify no tests break**

```bash
cd /Users/yazidzalai/Desktop/journal-policy-dashboard && npm test
```

Expected: all tests pass (or "no tests found" for ChartCard — that's fine, we're not adding tests for this prop since it's a trivial boolean passthrough).

- [ ] **Step 4: Commit**

```bash
git add src/components/ChartCard.jsx
git commit -m "feat: add forceVisible prop to ChartCard to bypass lazy render"
```

---

### Task 2: Add `onMount` registration prop to `ChartCard`

**Files:**
- Modify: `src/components/ChartCard.jsx`

`onMount` lets `FieldPage` collect capture functions from each card as they mount.

- [ ] **Step 1: Add the registration `useEffect`**

In [src/components/ChartCard.jsx](src/components/ChartCard.jsx), after the existing `menuOpen` `useEffect` (around line 115), add:

```jsx
  useEffect(() => {
    if (!onMount) return
    onMount({ title, capture: () => toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 }) })
    return () => onMount(null)
  }, [onMount, title])
```

Note: `toPng` is already imported at the top of the file.

- [ ] **Step 2: Run tests**

```bash
cd /Users/yazidzalai/Desktop/journal-policy-dashboard && npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/ChartCard.jsx
git commit -m "feat: add onMount capture registration prop to ChartCard"
```

---

### Task 3: Add capture registry and `isCapturing` state to `FieldPage`

**Files:**
- Modify: `src/pages/FieldPage.jsx`

- [ ] **Step 1: Add `isCapturing` state and `captureRegistryRef`**

In [src/pages/FieldPage.jsx](src/pages/FieldPage.jsx), after the existing `useState` declarations (around line 20), add:

```jsx
  const [isCapturing, setIsCapturing] = useState(false)
  const captureRegistryRef = useRef([])
```

Also add `useRef` to the React import at the top — change:

```jsx
import { useState, useEffect, useMemo } from 'react'
```

to:

```jsx
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
```

- [ ] **Step 2: Add `registerCapture` helper**

After the `captureRegistryRef` declaration, add:

```jsx
  const registerCapture = useCallback((entry) => {
    if (entry) {
      captureRegistryRef.current.push(entry)
    } else {
      captureRegistryRef.current = captureRegistryRef.current.filter(e => e !== entry)
    }
  }, [])
```

Wait — the `filter(e => e !== entry)` won't work when `entry` is `null`. The unmount signal needs to match by reference. Fix: store entries with a stable identity. Replace the above with a ref-keyed approach using a `Map`:

```jsx
  const captureRegistryRef = useRef(new Map())

  const registerCapture = useCallback((entry) => {
    if (entry) {
      captureRegistryRef.current.set(entry.title + Math.random(), entry)
    }
  }, [])
```

Actually the cleanest approach: use an array and push on mount, and on unmount (when `entry` is `null`) the closure still holds the previous `entry` value because React calls the cleanup with the last rendered value. But `onMount(null)` loses the reference.

Use this pattern instead — pass a stable setter that returns a remove function:

Replace the `onMount` callback design with a simpler approach: push on mount, clear the whole array on slug change (which already happens). Don't attempt granular removal — cards only unmount when slug changes, at which point the registry is cleared anyway.

So `registerCapture` simply pushes:

```jsx
  const captureRegistryRef = useRef([])

  const registerCapture = useCallback((entry) => {
    if (entry) captureRegistryRef.current.push(entry)
  }, [])
```

- [ ] **Step 3: Reset registry on slug change**

In the existing `useEffect([slug])` (around line 24), add the registry reset:

```jsx
  useEffect(() => {
    window.scrollTo(0, 0)
    setData(null)
    setError(null)
    setSelectedJournal('__agg__')
    captureRegistryRef.current = []   // ← add this line
    fetch(`${import.meta.env.BASE_URL}data/${slug}.json`)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(setData)
      .catch(e => setError(e.message))
  }, [slug])
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/yazidzalai/Desktop/journal-policy-dashboard && npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/FieldPage.jsx
git commit -m "feat: add capture registry and isCapturing state to FieldPage"
```

---

### Task 4: Wire `onMount` and `forceVisible` into every `ChartCard` in `FieldPage`

**Files:**
- Modify: `src/pages/FieldPage.jsx`

There are three `<ChartCard>` render sites in `FieldPage`:
1. Aggregated card (line ~130)
2. Per-field cards inside the `data.fields.map` (line ~175)
3. Per-journal cards inside `filteredJournals.map` (line ~205)
4. Active journal single card (line ~233)

- [ ] **Step 1: Wire the aggregated ChartCard**

Find:
```jsx
                  <ChartCard
                    title={`${field?.name ?? slug} — All Journals`}
                    subtitle={aggSubtitle}
                    chartData={aggData.chartData}
                    policyLines={aggData.policyLines}
                    visibleSeries={visibleSeries}
                    showPolicyLines={showPolicyLines}
                    tall
                  />
```

Replace with:
```jsx
                  <ChartCard
                    title={`${field?.name ?? slug} — All Journals`}
                    subtitle={aggSubtitle}
                    chartData={aggData.chartData}
                    policyLines={aggData.policyLines}
                    visibleSeries={visibleSeries}
                    showPolicyLines={showPolicyLines}
                    tall
                    forceVisible={isCapturing}
                    onMount={registerCapture}
                  />
```

- [ ] **Step 2: Wire per-field ChartCards**

Find the `ChartCard` inside `data.fields.map`:
```jsx
                          <ChartCard
                            title={`${meta?.icon ?? ''} ${f.field}`}
                            subtitle={fieldSub}
                            chartData={f.aggAll?.chartData}
                            policyLines={f.aggAll?.policyLines}
                            visibleSeries={visibleSeries}
                            showPolicyLines={showPolicyLines}
                          />
```

Replace with:
```jsx
                          <ChartCard
                            title={`${meta?.icon ?? ''} ${f.field}`}
                            subtitle={fieldSub}
                            chartData={f.aggAll?.chartData}
                            policyLines={f.aggAll?.policyLines}
                            visibleSeries={visibleSeries}
                            showPolicyLines={showPolicyLines}
                            forceVisible={isCapturing}
                            onMount={registerCapture}
                          />
```

- [ ] **Step 3: Wire per-journal ChartCards**

Find the `ChartCard` inside `filteredJournals.map`:
```jsx
                      <ChartCard
                        key={j.id}
                        title={j.name}
                        meta={j.hasPolicy ? `Policy ${j.policyYear}` : 'No policy'}
                        hasPolicy={j.hasPolicy}
                        subtitle={journalSubtitle(j)}
                        chartData={j.chartData}
                        policyLines={j.policyLines}
                        visibleSeries={visibleSeries}
                        showPolicyLines={showPolicyLines}
                      />
```

Replace with:
```jsx
                      <ChartCard
                        key={j.id}
                        title={j.name}
                        meta={j.hasPolicy ? `Policy ${j.policyYear}` : 'No policy'}
                        hasPolicy={j.hasPolicy}
                        subtitle={journalSubtitle(j)}
                        chartData={j.chartData}
                        policyLines={j.policyLines}
                        visibleSeries={visibleSeries}
                        showPolicyLines={showPolicyLines}
                        forceVisible={isCapturing}
                        onMount={registerCapture}
                      />
```

- [ ] **Step 4: Wire the active-journal single ChartCard**

Find:
```jsx
                <ChartCard
                  title={activeJournal.name}
                  subtitle={journalSubtitle(activeJournal)}
                  chartData={activeJournal.chartData}
                  policyLines={activeJournal.policyLines}
                  visibleSeries={visibleSeries}
                  showPolicyLines={showPolicyLines}
                  tall
                />
```

Replace with:
```jsx
                <ChartCard
                  title={activeJournal.name}
                  subtitle={journalSubtitle(activeJournal)}
                  chartData={activeJournal.chartData}
                  policyLines={activeJournal.policyLines}
                  visibleSeries={visibleSeries}
                  showPolicyLines={showPolicyLines}
                  tall
                  forceVisible={isCapturing}
                  onMount={registerCapture}
                />
```

- [ ] **Step 5: Run tests**

```bash
cd /Users/yazidzalai/Desktop/journal-policy-dashboard && npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/FieldPage.jsx
git commit -m "feat: wire forceVisible and onMount into all ChartCard instances"
```

---

### Task 5: Implement the download-all logic and `useEffect`

**Files:**
- Modify: `src/pages/FieldPage.jsx`

- [ ] **Step 1: Add JSZip import**

At the top of [src/pages/FieldPage.jsx](src/pages/FieldPage.jsx), add:

```jsx
import JSZip from 'jszip'
```

- [ ] **Step 2: Add the capture `useEffect`**

After the `activeJournal` useMemo (around line 60), add:

```jsx
  useEffect(() => {
    if (!isCapturing) return
    let cancelled = false

    function waitFrames(n) {
      return new Promise(resolve => {
        let count = 0
        function tick() { ++count >= n ? resolve() : requestAnimationFrame(tick) }
        requestAnimationFrame(tick)
      })
    }

    async function run() {
      await waitFrames(2)
      if (cancelled) return

      const registry = captureRegistryRef.current
      const results = await Promise.all(
        registry.map(async entry => {
          const dataUrl = await entry.capture()
          const safeName = entry.title.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').toLowerCase()
          return { name: `${safeName}.png`, dataUrl }
        })
      )

      const zip = new JSZip()
      for (const { name, dataUrl } of results) {
        const base64 = dataUrl.split(',')[1]
        zip.file(name, base64, { base64: true })
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      const fieldName = (field?.name ?? slug).replace(/\s+/g, '-').toLowerCase()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fieldName}-charts.zip`
      a.click()
      URL.revokeObjectURL(url)

      if (!cancelled) setIsCapturing(false)
    }

    run()
    return () => { cancelled = true }
  }, [isCapturing, field, slug])
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/yazidzalai/Desktop/journal-policy-dashboard && npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/FieldPage.jsx
git commit -m "feat: add download-all ZIP logic with force-render wait"
```

---

### Task 6: Add the download button to the "Aggregated Trend" section title

**Files:**
- Modify: `src/pages/FieldPage.jsx`
- Modify: `src/styles/app.css`

- [ ] **Step 1: Add CSS for the download button**

In [src/styles/app.css](src/styles/app.css), after the `.chart-section-title__cols` rule (around line 522), add:

```css
.chart-section-title__download-btn {
  background: none; border: none; padding: 0 2px;
  cursor: pointer; line-height: 0;
  color: #adb5bd; transition: color 0.15s;
  display: flex; align-items: center;
}
.chart-section-title__download-btn:hover { color: #2c3e50; }
.chart-section-title__download-btn:disabled { opacity: 0.5; cursor: default; }
```

- [ ] **Step 2: Add the button to the "Aggregated Trend" section title**

In [src/pages/FieldPage.jsx](src/pages/FieldPage.jsx), find the "Aggregated Trend" section title (around line 127):

```jsx
              <div className="chart-section-title">Aggregated Trend</div>
```

Replace with:

```jsx
              <div className="chart-section-title">
                Aggregated Trend
                <button
                  className="chart-section-title__download-btn"
                  onClick={() => setIsCapturing(true)}
                  disabled={isCapturing}
                  title="Download all charts as ZIP"
                >
                  {isCapturing ? '…' : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                      <circle cx="3" cy="9" r="2" />
                      <circle cx="9" cy="9" r="2" />
                      <circle cx="15" cy="9" r="2" />
                    </svg>
                  )}
                </button>
              </div>
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/yazidzalai/Desktop/journal-policy-dashboard && npm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/FieldPage.jsx src/styles/app.css
git commit -m "feat: add download-all-charts ZIP button to Aggregated Trend title"
```

---

### Task 7: Manual smoke test

**Files:** none — verification only

- [ ] **Step 1: Start dev server**

```bash
cd /Users/yazidzalai/Desktop/journal-policy-dashboard && npm run dev
```

- [ ] **Step 2: Navigate to any field page**

Open `http://localhost:5173`, click any field card (e.g., Oncology).

- [ ] **Step 3: Click the three-dot button in "Aggregated Trend"**

Verify:
- Button shows `…` while processing
- All charts render (including those below the fold)
- Browser downloads a `.zip` file named `{field}-charts.zip`
- ZIP contains one PNG per chart card, correctly named
- Button returns to three-dot state after download completes

- [ ] **Step 4: Test with per-journal view**

Click a journal in the sidebar. Verify the ZIP button is still visible and downloads the single journal chart.

- [ ] **Step 5: Test slug navigation**

Navigate to a second field without refreshing. Click the button again. Verify the ZIP only contains charts for the current field (registry was cleared on slug change).
