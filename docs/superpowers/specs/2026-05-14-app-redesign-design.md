# App Redesign — Design Spec
Date: 2026-05-14

## Overview

Full UI redesign of the Journal Policy Dashboard. Goals: user-friendly, intuitive navigation, informative home screen, in-page field switching, and journal search on field pages.

No data model changes. No routing changes. Visual and interaction layer only.

---

## 1. Global Nav

A persistent top navbar appears on all pages:
- Left: app logo/name "📊 Journal Policy Dashboard"
- Right: global search input (searches journals and fields; opens results inline or navigates to matching field/journal)
- Dark background (`#1a252f`), white text

---

## 2. Home Page

### Hero Section (replaces current minimal hero)
Dark gradient background (`#1a252f` → `#2c3e50`). Two-column layout:
- **Left column:** eyebrow label, large title ("Tracking the Shift from Bar Graphs to Informative Plots"), 2-3 sentence description of the research purpose and what the dashboard tracks, link to osf.io/tcyxg pre-registration.
- **Right column:** three stat cards stacked vertically — 213 Journals, 12 Fields, 16yr Timespan — with teal accent numbers on dark translucent backgrounds.

### Metric Legend Strip
White bar below the hero. Three items side-by-side, each with a colored swatch (bar), bold label, and short description:
- Red (`#c0392b`) — % only bar graphs
- Salmon (`#e8998d`) — % bar + informative
- Teal (`#76b5b2`) — % only informative

Replaces the accordion "What the Metrics Mean" — always visible, no click required.

### Field Grid
Unchanged from current: 4-column grid of emoji + name cards, each linking to `/field/:slug`. Label above: "Browse by Research Field".

### Removed from Home
- The "Why Journal Policy Matters" accordion (content folded into hero description)
- "What the Metrics Mean" accordion (replaced by always-visible metric strip)
- References accordion (kept in Home, collapsed by default, `defaultOpen` removed)

---

## 3. Field Page

### Field Switcher Bar
A sub-header bar between the global nav and the filter bar. Contains:
- "← Home" back link (left)
- "Field:" label + a `<select>` dropdown listing all 12 fields + "All Fields" (populated from `FIELDS` in `data/fields.js`)
- Changing the dropdown navigates to the selected field's route (`/field/:slug`) immediately

### Journal Search (Sidebar)
A search input at the top of the existing `JournalSidebar` component, above the journal list:
- Placeholder: "Search journals…"
- Filters the sidebar journal list in real-time (client-side, case-insensitive substring match on journal name)
- Does not affect chart display until user clicks a journal
- Shows count: "X journals" updates as search filters

### Filter Bar
Unchanged from current (series toggles + policy segmented switch).

### Chart Area
Unchanged from current.

---

## 4. CSS Changes

- Add `.top-nav` styles for the persistent navbar
- Add `.field-switcher-bar` styles for the sub-header on field pages
- Add `.journal-search` input styles inside the sidebar
- Update `.hero` to support two-column flex layout
- Add `.hero__stats` column styles
- Add `.metric-strip` for the always-visible legend bar
- Remove accordion-specific styles that are no longer needed on home (keep accordion component, used for References)

---

## 5. Component Changes

| Component | Change |
|-----------|--------|
| `Hero.jsx` | Rewrite: two-column layout, add description text, stat cards |
| `Home.jsx` | Remove "Why Journal Policy Matters" accordion; replace "What the Metrics Mean" accordion with `<MetricStrip>` inline component |
| `App.jsx` | Wrap all routes in a shared `<TopNav>` layout component |
| `FilterBar.jsx` | No change |
| `JournalSidebar.jsx` | Add search input at top; filter `journals` list by search query |
| `FieldPage.jsx` | Add `<FieldSwitcherBar>` between nav and filter bar |
| **New: `TopNav.jsx`** | Global navbar with logo + global search input |
| **New: `FieldSwitcherBar.jsx`** | Sub-header with back link + field dropdown |
| **New: `MetricStrip.jsx`** | Always-visible metric legend (3 swatches + labels + descriptions) |

---

## 6. Global Search Behavior

Search input in `TopNav` accepts text. On Enter or selecting a result:
- If query matches a field name → navigate to `/field/:slug`
- If query matches a journal name → navigate to that journal's field page with the journal pre-selected

Implementation: simple client-side filter over `FIELDS` array and a flat list of all journals derived from field data. No external search service.

---

## Out of Scope

- Dark mode
- New chart types
- Data changes
- Mobile/responsive redesign (maintain current behavior)
- Animations beyond existing CSS transitions
