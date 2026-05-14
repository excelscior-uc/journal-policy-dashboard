# App Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Journal Policy Dashboard with a persistent top nav, informative home hero, always-visible metric legend, in-page field switcher, and journal search in the sidebar.

**Architecture:** Add a persistent `TopNav` rendered above all routes in `App.jsx`. Replace the hero with a two-column layout (description + stat cards). Add `MetricStrip` (always-visible legend) and `FieldSwitcherBar` (field dropdown on field pages). Add search to `JournalSidebar`. All state is local; no data model changes.

**Tech Stack:** React 19, React Router 7, Recharts, Vite, Vitest + @testing-library/react

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/TopNav.jsx` | Persistent nav bar with logo + field search dropdown |
| Create | `src/components/MetricStrip.jsx` | Always-visible 3-metric legend strip |
| Create | `src/components/FieldSwitcherBar.jsx` | Sub-header with back link + field dropdown |
| Create | `tests/TopNav.test.jsx` | TopNav unit tests |
| Create | `tests/MetricStrip.test.jsx` | MetricStrip unit tests |
| Create | `tests/FieldSwitcherBar.test.jsx` | FieldSwitcherBar unit tests |
| Create | `tests/JournalSidebar.test.jsx` | JournalSidebar search tests |
| Modify | `src/components/Hero.jsx` | Two-column layout with description + stat cards |
| Modify | `src/components/JournalSidebar.jsx` | Add journal search input + filter logic |
| Modify | `src/pages/Home.jsx` | Use MetricStrip; remove StatsStrip + two accordions |
| Modify | `src/pages/FieldPage.jsx` | Use FieldSwitcherBar; remove breadcrumb + field-header |
| Modify | `src/App.jsx` | Render TopNav above all routes |
| Modify | `src/styles/app.css` | New CSS for all new/changed components |

---

## Task 1: CSS — Add new component styles to app.css

**Files:**
- Modify: `src/styles/app.css`

- [ ] **Step 1: Append new CSS rules to app.css**

Open `src/styles/app.css` and append the following block at the end of the file:

```css
/* ── TOP NAV ── */
.top-nav {
  background: #1a252f;
  color: #fff;
  padding: 10px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}
.top-nav__logo {
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  text-decoration: none;
  letter-spacing: .02em;
  white-space: nowrap;
}
.top-nav__search { position: relative; }
.top-nav__input {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 12px;
  color: #fff;
  width: 220px;
  outline: none;
}
.top-nav__input::placeholder { color: rgba(255,255,255,0.5); }
.top-nav__input:focus { border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.18); }
.top-nav__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 7px;
  list-style: none;
  padding: 4px 0;
  width: 260px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  z-index: 200;
}
.top-nav__dropdown-item {
  padding: 8px 14px;
  font-size: 12px;
  color: #212529;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.top-nav__dropdown-item:hover { background: #f1f3f5; }

/* ── HERO (two-column) ── */
.hero { padding: 48px 48px 44px; }
.hero__inner {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  gap: 32px;
  align-items: flex-start;
}
.hero__text { flex: 1; }
.hero__sub { margin-bottom: 10px; }
.hero__sub strong { color: #fff; }
.hero__preref { font-size: 11px; color: rgba(255,255,255,0.45); margin-bottom: 24px; }
.hero__link { color: #76b5b2; }
.hero__actions { display: flex; gap: 10px; }
.hero__stats { display: flex; flex-direction: column; gap: 10px; min-width: 130px; flex-shrink: 0; }
.hero__stat-card {
  background: rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 14px 18px;
  text-align: center;
}
.hero__stat-num { font-size: 22px; font-weight: 800; color: #76b5b2; }
.hero__stat-lbl {
  font-size: 9px; color: rgba(255,255,255,0.5);
  text-transform: uppercase; letter-spacing: .08em; margin-top: 3px;
}

/* ── METRIC STRIP ── */
.metric-strip {
  background: #fff;
  border-bottom: 1px solid #dee2e6;
  padding: 14px 48px;
  display: flex;
  gap: 32px;
  justify-content: center;
}
.metric-strip__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  max-width: 280px;
}
.metric-strip__swatch {
  width: 28px; height: 6px; border-radius: 3px;
  flex-shrink: 0; margin-top: 5px;
}
.metric-strip__label { font-size: 11px; font-weight: 700; color: #212529; margin-bottom: 2px; }
.metric-strip__desc { font-size: 10px; color: #6c757d; line-height: 1.5; }

/* ── FIELD SWITCHER BAR ── */
.field-switcher-bar {
  background: #2c3e50;
  padding: 8px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.field-switcher-bar__back { color: rgba(255,255,255,0.55); text-decoration: none; font-size: 12px; }
.field-switcher-bar__back:hover { color: #fff; }
.field-switcher-bar__sep { color: rgba(255,255,255,0.2); }
.field-switcher-bar__label { font-size: 11px; color: rgba(255,255,255,0.55); }
.field-switcher-bar__select {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 5px;
  padding: 5px 10px;
  font-size: 12px;
  color: #fff;
  cursor: pointer;
  outline: none;
}
.field-switcher-bar__select option { background: #2c3e50; color: #fff; }

/* ── JOURNAL SEARCH ── */
.journal-sidebar__search { padding: 6px 8px 4px; }
.journal-search-input {
  width: 100%;
  padding: 5px 10px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 11px;
  background: #f8f9fa;
  color: #495057;
  outline: none;
}
.journal-search-input:focus { border-color: #2c3e50; background: #fff; }
.journal-sidebar__no-results {
  font-size: 11px; color: #adb5bd;
  padding: 8px 10px; font-style: italic;
}
```

- [ ] **Step 2: Remove old .hero rules that conflict**

In `src/styles/app.css`, find and remove the existing lines that set `padding` and `text-align` on `.hero`, since the new `.hero__inner` handles layout. The old block:
```css
.hero {
  background: linear-gradient(135deg, #1a252f 0%, #2c3e50 60%, #34495e 100%);
  color: #fff;
  padding: 64px 48px 56px;
  text-align: center;
}
```
Replace it with:
```css
.hero {
  background: linear-gradient(135deg, #1a252f 0%, #2c3e50 60%, #34495e 100%);
  color: #fff;
  padding: 48px 48px 44px;
}
```

Also remove the old `.hero__sub` rule (it set `max-width` and `margin: 0 auto 32px`) — the new `.hero__sub` appended above replaces it. The old `.hero__title` rule can stay as-is (still valid); just remove `margin: 0 auto 16px` and `max-width` from it since text is left-aligned in the new layout. Update:
```css
.hero__title { color: #fff; margin-bottom: 14px; }
```

Remove the old `.hero__cta` and `.hero__cta-ghost` display rules that used `display: inline-block` — keep their styling but they'll now live inside `.hero__actions`. No changes needed there; they still work.

- [ ] **Step 3: Verify no CSS syntax errors**

Run:
```bash
npm run build 2>&1 | head -30
```
Expected: build succeeds (no CSS parse errors). If errors appear, check for missing closing braces in the appended block.

---

## Task 2: Create MetricStrip component

**Files:**
- Create: `src/components/MetricStrip.jsx`
- Create: `tests/MetricStrip.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `tests/MetricStrip.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import MetricStrip from '../src/components/MetricStrip'

describe('MetricStrip', () => {
  it('renders three metric items', () => {
    render(<MetricStrip />)
    expect(screen.getByText(/% only bar graphs/i)).toBeInTheDocument()
    expect(screen.getByText(/% bar and informative/i)).toBeInTheDocument()
    expect(screen.getByText(/% only informative/i)).toBeInTheDocument()
  })

  it('renders three color swatches', () => {
    const { container } = render(<MetricStrip />)
    expect(container.querySelectorAll('.metric-strip__swatch')).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- MetricStrip 2>&1 | tail -10
```
Expected: FAIL — `Cannot find module '../src/components/MetricStrip'`

- [ ] **Step 3: Create MetricStrip.jsx**

Create `src/components/MetricStrip.jsx`:

```jsx
const METRICS = [
  {
    color: '#c0392b',
    label: '% only bar graphs',
    desc: 'Papers using only bar graphs for continuous data, as detected by the Barzooka screening tool.',
  },
  {
    color: '#e8998d',
    label: '% bar and informative',
    desc: 'Papers using both bar and informative visualisation types for continuous data.',
  },
  {
    color: '#76b5b2',
    label: '% only informative',
    desc: 'Papers using only informative types (dot plots, violin plots, box plots) for continuous data.',
  },
]

export default function MetricStrip() {
  return (
    <div className="metric-strip">
      {METRICS.map(m => (
        <div key={m.label} className="metric-strip__item">
          <div className="metric-strip__swatch" style={{ background: m.color }} />
          <div>
            <div className="metric-strip__label">{m.label}</div>
            <div className="metric-strip__desc">{m.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- MetricStrip 2>&1 | tail -10
```
Expected: PASS — 2 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/MetricStrip.jsx tests/MetricStrip.test.jsx
git commit -m "feat: add MetricStrip component"
```

---

## Task 3: Create TopNav component

**Files:**
- Create: `src/components/TopNav.jsx`
- Create: `tests/TopNav.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `tests/TopNav.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TopNav from '../src/components/TopNav'

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('TopNav', () => {
  it('renders the app logo link', () => {
    renderWithRouter(<TopNav />)
    expect(screen.getByText(/Journal Policy Dashboard/i)).toBeInTheDocument()
  })

  it('renders the search input', () => {
    renderWithRouter(<TopNav />)
    expect(screen.getByPlaceholderText(/search fields/i)).toBeInTheDocument()
  })

  it('shows dropdown results when query matches a field', () => {
    renderWithRouter(<TopNav />)
    const input = screen.getByPlaceholderText(/search fields/i)
    fireEvent.change(input, { target: { value: 'cardio' } })
    expect(screen.getByText(/Cardiac/i)).toBeInTheDocument()
  })

  it('hides dropdown when query is cleared', () => {
    renderWithRouter(<TopNav />)
    const input = screen.getByPlaceholderText(/search fields/i)
    fireEvent.change(input, { target: { value: 'cardio' } })
    fireEvent.change(input, { target: { value: '' } })
    expect(screen.queryByText(/Cardiac/i)).not.toBeInTheDocument()
  })

  it('clears input and dropdown when Escape is pressed', () => {
    renderWithRouter(<TopNav />)
    const input = screen.getByPlaceholderText(/search fields/i)
    fireEvent.change(input, { target: { value: 'onco' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input.value).toBe('')
    expect(screen.queryByText(/Oncology/i)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- TopNav 2>&1 | tail -10
```
Expected: FAIL — `Cannot find module '../src/components/TopNav'`

- [ ] **Step 3: Create TopNav.jsx**

Create `src/components/TopNav.jsx`:

```jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FIELDS } from '../data/fields'

export default function TopNav() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const navigate = useNavigate()

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)
    if (q.trim().length < 2) { setResults([]); return }
    setResults(
      FIELDS.filter(f => f.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    )
  }

  function handleSelect(slug) {
    setQuery('')
    setResults([])
    navigate(`/field/${slug}`)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && results.length > 0) handleSelect(results[0].slug)
    if (e.key === 'Escape') { setQuery(''); setResults([]) }
  }

  return (
    <nav className="top-nav">
      <Link to="/" className="top-nav__logo">📊 Journal Policy Dashboard</Link>
      <div className="top-nav__search">
        <input
          className="top-nav__input"
          type="search"
          placeholder="Search fields…"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-label="Search research fields"
        />
        {results.length > 0 && (
          <ul className="top-nav__dropdown">
            {results.map(f => (
              <li
                key={f.slug}
                className="top-nav__dropdown-item"
                onClick={() => handleSelect(f.slug)}
              >
                <span>{f.icon}</span> {f.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- TopNav 2>&1 | tail -10
```
Expected: PASS — 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/TopNav.jsx tests/TopNav.test.jsx
git commit -m "feat: add TopNav with field search"
```

---

## Task 4: Wire TopNav into App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update App.jsx**

Replace the entire content of `src/App.jsx` with:

```jsx
import { Suspense, lazy } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import TopNav from './components/TopNav'

const Home = lazy(() => import('./pages/Home'))
const FieldPage = lazy(() => import('./pages/FieldPage'))

function PageShell({ children }) {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: '#6c757d' }}>Loading…</div>}>
      {children}
    </Suspense>
  )
}

export default function App() {
  return (
    <HashRouter>
      <TopNav />
      <Routes>
        <Route path="/" element={<PageShell><Home /></PageShell>} />
        <Route path="/field/:slug" element={<PageShell><FieldPage /></PageShell>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
```

- [ ] **Step 2: Run the full test suite**

```bash
npm test 2>&1 | tail -15
```
Expected: all existing tests still pass (TopNav + MetricStrip + prior tests)

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: mount TopNav above all routes"
```

---

## Task 5: Redesign Hero component

**Files:**
- Modify: `src/components/Hero.jsx`

- [ ] **Step 1: Rewrite Hero.jsx**

Replace the entire content of `src/components/Hero.jsx`:

```jsx
import { useNavigate } from 'react-router-dom'

export default function Hero() {
  const navigate = useNavigate()
  return (
    <div className="hero">
      <div className="hero__inner">
        <div className="hero__text">
          <div className="hero__eyebrow">Biomedical Research · 2008 – 2024</div>
          <h1 className="hero__title">
            Tracking the Shift from <em>Bar Graphs</em> to Informative Plots
          </h1>
          <p className="hero__sub">
            Bar charts that reduce continuous data to a mean and error bar are widely criticised for
            concealing distributional features. This dashboard tracks how{' '}
            <strong>journal editorial policies</strong> are driving the shift toward more informative
            visualisations across 213 journals and 12 biomedical research fields.
          </p>
          <p className="hero__preref">
            Pre-registered study protocol:{' '}
            <a href="https://osf.io/tcyxg" target="_blank" rel="noreferrer" className="hero__link">
              osf.io/tcyxg
            </a>
          </p>
          <div className="hero__actions">
            <button
              className="hero__cta"
              onClick={() => document.getElementById('field-grid')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore by Research Field
            </button>
            <button className="hero__cta-ghost" onClick={() => navigate('/field/all-fields')}>
              View All Fields →
            </button>
          </div>
        </div>
        <div className="hero__stats">
          <div className="hero__stat-card">
            <div className="hero__stat-num">213</div>
            <div className="hero__stat-lbl">Journals</div>
          </div>
          <div className="hero__stat-card">
            <div className="hero__stat-num">12</div>
            <div className="hero__stat-lbl">Research Fields</div>
          </div>
          <div className="hero__stat-card">
            <div className="hero__stat-num">16 yr</div>
            <div className="hero__stat-lbl">Time Span</div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm test 2>&1 | tail -10
```
Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/components/Hero.jsx
git commit -m "feat: redesign hero with two-column layout and stat cards"
```

---

## Task 6: Update Home.jsx

**Files:**
- Modify: `src/pages/Home.jsx`

- [ ] **Step 1: Rewrite Home.jsx**

Replace the entire content of `src/pages/Home.jsx`:

```jsx
import Hero from '../components/Hero'
import MetricStrip from '../components/MetricStrip'
import FieldGrid from '../components/FieldGrid'
import Accordion from '../components/Accordion'
import Footer from '../components/Footer'

const REFS = [
  'Weissgerber et al. (2015). Beyond bar and line graphs. PLOS Biology, 13(4), e1002128.',
  'Weissgerber et al. (2019). From static to interactive. PLOS Biology, 17(1), e1002484.',
  "Weissgerber et al. (2019). Reveal, don't conceal. Circulation, 140(18), 1506–1518.",
  'Riedel et al. (2022). Replacing bar graphs. Clinical Science, 136(15), 1139–1156.',
  'Riedel, Nachev, Schulz, Kazezian, Weissgerber. Barzooka. GitHub.',
  'Schulz et al. (2025). Do journal policies reduce the use of bar graphs? osf.io/tcyxg/overview',
]

export default function Home() {
  return (
    <>
      <Hero />
      <MetricStrip />
      <FieldGrid />
      <div className="section-wrap" style={{ marginTop: 24, paddingBottom: 0 }}>
        <Accordion title="References & Bibliography">
          <ul className="ref-list">
            {REFS.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </Accordion>
      </div>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm test 2>&1 | tail -10
```
Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/pages/Home.jsx
git commit -m "feat: update Home — MetricStrip replaces accordions, remove StatsStrip"
```

---

## Task 7: Create FieldSwitcherBar component

**Files:**
- Create: `src/components/FieldSwitcherBar.jsx`
- Create: `tests/FieldSwitcherBar.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `tests/FieldSwitcherBar.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { FIELDS } from '../src/data/fields'
import FieldSwitcherBar from '../src/components/FieldSwitcherBar'

function renderWithRouter(slug = 'oncology') {
  return render(
    <MemoryRouter initialEntries={[`/field/${slug}`]}>
      <Routes>
        <Route path="/field/:slug" element={<FieldSwitcherBar currentSlug={slug} />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('FieldSwitcherBar', () => {
  it('renders a back-to-home link', () => {
    renderWithRouter()
    expect(screen.getByText(/← Home/i)).toBeInTheDocument()
  })

  it('renders a select with all fields', () => {
    renderWithRouter()
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    FIELDS.forEach(f => {
      expect(screen.getByRole('option', { name: new RegExp(f.name, 'i') })).toBeInTheDocument()
    })
  })

  it('shows the current field as selected', () => {
    renderWithRouter('oncology')
    const select = screen.getByRole('combobox')
    expect(select.value).toBe('oncology')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- FieldSwitcherBar 2>&1 | tail -10
```
Expected: FAIL — `Cannot find module '../src/components/FieldSwitcherBar'`

- [ ] **Step 3: Create FieldSwitcherBar.jsx**

Create `src/components/FieldSwitcherBar.jsx`:

```jsx
import { Link, useNavigate } from 'react-router-dom'
import { FIELDS } from '../data/fields'

export default function FieldSwitcherBar({ currentSlug }) {
  const navigate = useNavigate()
  return (
    <div className="field-switcher-bar">
      <Link to="/" className="field-switcher-bar__back">← Home</Link>
      <span className="field-switcher-bar__sep">|</span>
      <label className="field-switcher-bar__label" htmlFor="field-select">Field:</label>
      <select
        id="field-select"
        className="field-switcher-bar__select"
        value={currentSlug}
        onChange={e => navigate(`/field/${e.target.value}`)}
      >
        {FIELDS.map(f => (
          <option key={f.slug} value={f.slug}>{f.icon} {f.name}</option>
        ))}
      </select>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- FieldSwitcherBar 2>&1 | tail -10
```
Expected: PASS — 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/FieldSwitcherBar.jsx tests/FieldSwitcherBar.test.jsx
git commit -m "feat: add FieldSwitcherBar for in-page field switching"
```

---

## Task 8: Add journal search to JournalSidebar

**Files:**
- Modify: `src/components/JournalSidebar.jsx`
- Create: `tests/JournalSidebar.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `tests/JournalSidebar.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import JournalSidebar from '../src/components/JournalSidebar'

const journals = [
  { id: 'j1', name: 'Cancer Cell', hasPolicy: true, policyYear: 2019 },
  { id: 'j2', name: 'Nature Cancer', hasPolicy: true, policyYear: 2020 },
  { id: 'j3', name: 'PLOS ONE', hasPolicy: false },
]

describe('JournalSidebar', () => {
  it('renders all journals when search is empty', () => {
    render(<JournalSidebar journals={journals} selectedId="__agg__" onSelect={() => {}} />)
    expect(screen.getByText('Cancer Cell')).toBeInTheDocument()
    expect(screen.getByText('Nature Cancer')).toBeInTheDocument()
    expect(screen.getByText('PLOS ONE')).toBeInTheDocument()
  })

  it('filters journals by search query (case-insensitive)', () => {
    render(<JournalSidebar journals={journals} selectedId="__agg__" onSelect={() => {}} />)
    const input = screen.getByPlaceholderText(/search journals/i)
    fireEvent.change(input, { target: { value: 'cancer' } })
    expect(screen.getByText('Cancer Cell')).toBeInTheDocument()
    expect(screen.getByText('Nature Cancer')).toBeInTheDocument()
    expect(screen.queryByText('PLOS ONE')).not.toBeInTheDocument()
  })

  it('shows no-results message when search matches nothing', () => {
    render(<JournalSidebar journals={journals} selectedId="__agg__" onSelect={() => {}} />)
    const input = screen.getByPlaceholderText(/search journals/i)
    fireEvent.change(input, { target: { value: 'zzz' } })
    expect(screen.getByText(/no journals match/i)).toBeInTheDocument()
  })

  it('calls onSelect with journal id when clicked', () => {
    const onSelect = vi.fn()
    render(<JournalSidebar journals={journals} selectedId="__agg__" onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Cancer Cell'))
    expect(onSelect).toHaveBeenCalledWith('j1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- JournalSidebar 2>&1 | tail -10
```
Expected: FAIL — search input not found (component doesn't have one yet)

- [ ] **Step 3: Update JournalSidebar.jsx**

Replace the entire content of `src/components/JournalSidebar.jsx`:

```jsx
import { useState } from 'react'

export default function JournalSidebar({ journals, selectedId, onSelect }) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? journals.filter(j => j.name.toLowerCase().includes(search.toLowerCase()))
    : journals

  return (
    <nav className="journal-sidebar">
      <div className="journal-sidebar__title">Journals</div>
      <div className="journal-sidebar__search">
        <input
          className="journal-search-input"
          type="search"
          placeholder="Search journals…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search journals"
        />
      </div>
      <div
        className={`journal-link${selectedId === '__agg__' ? ' active' : ''}`}
        onClick={() => onSelect('__agg__')}
      >
        <span>All Journals (aggregated)</span>
      </div>
      {filtered.map(j => (
        <div
          key={j.id}
          className={`journal-link${selectedId === j.id ? ' active' : ''}`}
          onClick={() => onSelect(j.id)}
        >
          <span>{j.name}</span>
          <span
            className={`policy-dot${j.hasPolicy ? '' : ' policy-dot--none'}`}
            title={j.hasPolicy ? `Policy ${j.policyYear}` : 'No policy'}
          />
        </div>
      ))}
      {filtered.length === 0 && search && (
        <div className="journal-sidebar__no-results">No journals match "{search}"</div>
      )}
      <div style={{ fontSize: 9, color: '#adb5bd', padding: '8px 10px 4px', display: 'flex', gap: 8 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#76b5b2', display: 'inline-block' }} />
          has policy
        </span>
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- JournalSidebar 2>&1 | tail -10
```
Expected: PASS — 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/JournalSidebar.jsx tests/JournalSidebar.test.jsx
git commit -m "feat: add journal search to sidebar"
```

---

## Task 9: Update FieldPage.jsx

**Files:**
- Modify: `src/pages/FieldPage.jsx`

- [ ] **Step 1: Replace breadcrumb + field-header with FieldSwitcherBar**

In `src/pages/FieldPage.jsx`:

1. Add the import at the top (after existing imports):
```jsx
import FieldSwitcherBar from '../components/FieldSwitcherBar'
```

2. Replace the breadcrumb block and field-header block:

Old code to remove:
```jsx
      {/* breadcrumb */}
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb__home">← Home</Link>
        <span className="breadcrumb__sep">/</span>
        <span>{field ? `${field.icon} ${field.name}` : slug}</span>
      </div>

      {/* field header */}
      {field && (
        <div className="field-header">
          <div className="field-header__icon">{field.icon}</div>
          <h2>{field.name}</h2>
        </div>
      )}
```

New code to add in its place:
```jsx
      <FieldSwitcherBar currentSlug={slug} />
```

3. Remove the `Link` import from react-router-dom since it's no longer used in this file. Change:
```jsx
import { useParams, Link } from 'react-router-dom'
```
to:
```jsx
import { useParams } from 'react-router-dom'
```

- [ ] **Step 2: Run full test suite**

```bash
npm test 2>&1 | tail -15
```
Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/pages/FieldPage.jsx
git commit -m "feat: replace breadcrumb with FieldSwitcherBar on field pages"
```

---

## Task 10: Verify build and smoke test

- [ ] **Step 1: Run full test suite one final time**

```bash
npm test 2>&1 | tail -20
```
Expected: all tests pass

- [ ] **Step 2: Build for production**

```bash
npm run build 2>&1 | tail -15
```
Expected: build succeeds, no errors

- [ ] **Step 3: Preview and smoke test**

```bash
npm run preview
```

Open the preview URL in a browser and verify:
- Top nav appears on home and field pages
- Hero shows two-column layout with stat cards
- Metric strip shows 3 colored items below the hero
- Clicking a field card navigates to field page
- Field page shows field-switcher dropdown (all 13 fields listed)
- Changing the dropdown navigates to the new field
- Journal sidebar has a search input that filters the list
- Searching "cancer" on oncology field shows only matching journals
- Empty search shows all journals
- Search with no matches shows "No journals match" message

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete app redesign — topnav, hero, metric strip, field switcher, journal search"
```
