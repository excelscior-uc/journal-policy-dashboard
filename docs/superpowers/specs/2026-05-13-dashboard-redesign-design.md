# Dashboard Redesign Design

**Date:** 2026-05-13  
**Status:** Approved

## Overview

Redesign the journal policy dashboard from a monolithic 225KB single-HTML file (335 Plotly charts all parsed on load) into a fast, user-friendly Vite + React SPA deployable to GitHub Pages. Replace Plotly with Recharts. Add a landing home screen. Fix load performance via 3-layer lazy loading.

---

## Goals

1. Home screen as a landing page — hero, stats, context accordions, field grid, funder logos
2. Per-field pages accessible from the home screen field cards
3. Fix slow load times (current: ~3–5s; target: ~0.3s to home, ~200ms per field)
4. Replace Plotly with Recharts
5. Deploy to GitHub Pages via GitHub Actions

---

## File Structure

```
journal-policy-dashboard/
├── index.html                        ← Vite entry point
├── vite.config.js                    ← base: '/journal-policy-dashboard/'
├── package.json
├── src/
│   ├── main.jsx
│   ├── App.jsx                       ← React Router (hash router)
│   ├── pages/
│   │   ├── Home.jsx
│   │   └── FieldPage.jsx             ← receives :slug param
│   ├── components/
│   │   ├── Hero.jsx
│   │   ├── StatsStrip.jsx
│   │   ├── Accordion.jsx
│   │   ├── FieldGrid.jsx
│   │   ├── FilterBar.jsx
│   │   ├── JournalSidebar.jsx
│   │   ├── ChartCard.jsx
│   │   └── Footer.jsx
│   ├── data/
│   │   └── fields.js                 ← field metadata (slug, name, icon)
│   └── styles/
│       └── app.css
├── public/
│   ├── logos_gs.png
│   └── data/
│       ├── cardiac.json
│       ├── clinical-neurology.json
│       ├── endocrinology.json
│       ├── genetics.json
│       ├── immunology.json
│       ├── neurosciences.json
│       ├── oncology.json
│       ├── orthopedics.json
│       ├── pharmacology.json
│       ├── physiology.json
│       ├── rheumatology.json
│       ├── urology.json
│       └── all-fields.json
├── scripts/
│   └── extract-data.js               ← Node script: parses index.html → JSON files
└── .github/
    └── workflows/
        └── deploy.yml
```

---

## Pages

### Home (`/`)

Sections top to bottom:
1. **Hero** — gradient banner (`#1a252f` → `#2c3e50`), title, subtitle, two CTAs ("Explore by Research Field", "View All Fields →")
2. **Stats strip** — 12 fields / 335+ charts / 2008–2024 / Pre-registered
3. **Why Journal Policy Matters** accordion — expanded by default. Text about bar chart criticism + OSF link `osf.io/tcyxg`
4. **What the Metrics Mean** accordion — expanded by default. Three colored metric rows (% only bar `#c0392b`, % bar and informative `#e8998d`, % only informative `#76b5b2`)
5. **Browse by Research Field** — 4-column grid of 12 field cards + 1 "All Fields" card. Each card shows icon, field name, "Explore →" link
6. **References & Bibliography** accordion — collapsed by default. 6 references
7. **Footer** — "Funded by" label + `logos_gs.png`

### Field Page (`/field/:slug`)

Layout:
- **Breadcrumb** — `← Home / 🫀 Field Name`
- **Filter bar** — series visibility toggles (% only bar, % bar & informative, % only informative, Policy adoption) + policy filter dropdown (All / Policy only / Non-Policy only)
- **Body** — flex row:
  - **Journal sidebar** (220px) — "All Journals" link at top, then per-journal links with policy indicator dot (teal = has policy, grey = no policy)
  - **Chart area** — aggregated chart full-width at top, then 2-column per-journal grid below

---

## Data Shape

Each `public/data/*.json` follows this schema:

```json
{
  "field": "Cardiac & Cardiovascular Systems",
  "slug": "cardiac",
  "aggAll": {
    "series": [
      { "key": "pct_only_bar", "name": "% only bar", "color": "#c0392b", "data": [{"year": 2008, "value": 72}] },
      { "key": "pct_bar_informative", "name": "% bar and informative", "color": "#e8998d", "data": [] },
      { "key": "pct_only_informative", "name": "% only informative", "color": "#76b5b2", "data": [] }
    ],
    "policyLines": [{ "year": 2016, "label": "13% of journals adopted" }]
  },
  "journals": [
    {
      "id": "journal-a",
      "name": "Journal A",
      "hasPolicy": true,
      "policyYear": 2016,
      "series": []
    }
  ]
}
```

---

## Performance Strategy

Three layers of lazy loading:

**Layer 1 — Route-level code splitting (Vite)**  
`FieldPage` is a `React.lazy()` dynamic import. Vite emits separate chunks per route. Navigating to Oncology never downloads Cardiac's chunk.

**Layer 2 — JSON fetch on navigation**  
Chart data lives in `public/data/` as static JSON (not bundled). `FieldPage` fetches `fetch(/data/${slug}.json)` on mount. Browser caches after first visit. Skeleton cards shown while loading.

**Layer 3 — IntersectionObserver per chart**  
`ChartCard` uses `IntersectionObserver` — Recharts `LineChart` only mounts when the card enters the viewport. Cards outside the viewport render a skeleton placeholder. Once rendered, stays rendered.

**Expected result:**

| Metric | Before | After |
|--------|--------|-------|
| Initial HTML parse | 225KB | ~50KB JS |
| Time to home screen | ~3–5s | ~0.3s |
| Opening a field | already loaded (slow) | ~200ms fetch |
| Charts rendered at once | all 335 | only visible |

---

## Chart Layer

- **Library:** Recharts (`recharts`)
- **Chart type:** `LineChart` with `ResponsiveContainer`
- **Policy year markers:** `ReferenceLine x={year}` with label
- **Series visibility:** controlled by filter bar state, passed as `hide` prop to each `Line`
- **Tooltip:** Recharts `<Tooltip>` custom formatter showing year + percentages

---

## Stack

| Concern | Choice |
|---------|--------|
| Bundler | Vite |
| UI framework | React 18 |
| Routing | React Router v6, HashRouter |
| Charts | Recharts |
| Styling | Plain CSS (`app.css`) |
| Data extraction | Node.js script (`scripts/extract-data.js`) |
| Deploy | GitHub Actions → `gh-pages` branch |

---

## GitHub Actions Deploy

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [master]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## What Stays Unchanged

- `sankey_workflow.html` — kept as-is, linked from home if needed
- All existing chart data — preserved, reformatted to JSON
- Color scheme — `#2c3e50`, `#c0392b`, `#e8998d`, `#76b5b2`, `rgba(253,231,37,0.7)`

---

## Out of Scope

- Backend / server-side rendering
- Authentication
- User preferences persistence
- Mobile-specific layout (responsive CSS only)
