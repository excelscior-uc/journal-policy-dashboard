# Tracking the Shift from Bar Graphs to Informative Plots in Biomedical Journals

Interactive dashboard tracking how data-visualisation practices in scientific publishing evolved 2010–2025 — bar graphs vs. more informative alternatives across **213 journals** and **12 biomedical research fields**:

- Cardiac & Cardiovascular Systems
- Clinical Neurology
- Endocrinology & Metabolism
- Genetics & Heredity
- Immunology
- Neurosciences
- Oncology
- Orthopedics
- Pharmacology & Pharmacy
- Physiology
- Rheumatology
- Urology & Nephrology

> **Pre-registration:** [osf.io/tcyxg](https://osf.io/tcyxg/overview)
>
> **Live dashboard:** [excelscior-uc.github.io/journal-policy-dashboard](https://excelscior-uc.github.io/journal-policy-dashboard/)

---

## Overview

Single-page React app (Vite + Recharts) visualising barzooka screening results and article metadata for 213 biomedical journals, 71 of which adopted an editorial figure-type policy.

The dashboard lets you:

- Track prevalence of **bar graphs** vs. **informative visualisations** (bars with dots, box plots, dot plots, histograms, violin plots) year by year (2010–2025)
- Compare **policy journals** (71 with an editorial recommendation on figure types) against **non-policy journals**
- Explore trends at three levels: **all fields**, **per research field**, and **per journal**
- Visually assess whether editorial policies produce measurable changes in author behaviour

Figure classification produced by [barzooka](https://github.com/quest-bih/barzooka) — automated deep-learning tool detecting chart types in scientific PDF figures.

---

## Tech Stack

- **React 19** + **react-router-dom 7** (HashRouter, lazy-loaded routes)
- **Vite 8** build with gzip compression plugin
- **Recharts 3** for trend charts
- **html-to-image** + **jszip** for client-side chart export
- **Vitest** + **@testing-library/react** + **jsdom** for unit tests
- **gh-pages** for deployment

Base path `/journal-policy-dashboard/` set in [vite.config.js](vite.config.js).

---

## Repository Layout

```
data/                                       # source aggregated CSV (one row per journal × year)
scripts/
  extract-data.js                           # CSV -> public/data/<field>.json (build-time)
  fetch-journal-names.mjs                   # resolves abbreviations to full titles via NLM/CrossRef
public/data/
  <field>.json (×12) + all-fields.json      # per-field payloads fetched by the app
  journal-names.json                        # abbrev -> full title map
src/
  App.jsx                                   # HashRouter; routes / and /field/:slug; TopNav on field pages
  pages/      Home.jsx, FieldPage.jsx
  components/ Hero, AboutDashboard, WhyPolicyMatters, WhatMetricsMean, FieldGrid,
              CollapsibleHomeSection, Footer,                 # Home page
              TopNav, GlobalJournalSearch, FilterBar, JournalSidebar,
              ChartCard, CompareModal, FeaturesIntroModal, Tooltip  # FieldPage
  data/       fields.js (field metadata + series config), journalIndex.js, journalNames.js
  hooks/      useVisible.js
  utils/      fieldDataCache.js             # in-memory field JSON cache + prefetch
tests/                                      # Vitest specs
```

---

## Requirements

- Node.js 20+
- npm

---

## Usage

```bash
npm install
```

| Script              | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| `npm run dev`       | Vite dev server                                        |
| `npm run build`     | Production build to `dist/`                            |
| `npm run preview`   | Serve the production build locally                     |
| `npm test`          | Run Vitest suite once                                  |
| `npm run test:watch`| Vitest in watch mode                                   |
| `npm run deploy`    | Build then publish `dist/` to `gh-pages` branch        |

### Rebuilding the per-field JSON payloads

Whenever [data/bz_journal_year_percentages_All_Fields.csv](data/bz_journal_year_percentages_All_Fields.csv) changes, regenerate the JSON files the app fetches:

```bash
node scripts/extract-data.js
```

Writes one file per field (e.g. `public/data/oncology.json`) plus `all-fields.json`. Schema matches what [src/pages/FieldPage.jsx](src/pages/FieldPage.jsx) and [src/components/ChartCard.jsx](src/components/ChartCard.jsx) expect.

### Refreshing full journal titles

```bash
node scripts/fetch-journal-names.mjs
```

Scans `public/data/*.json` for abbreviations and resolves them to full titles via NLM Catalog (E-utilities) with CrossRef fallback. Output: `public/data/journal-names.json`.

---

## Source Data

[data/bz_journal_year_percentages_All_Fields.csv](data/bz_journal_year_percentages_All_Fields.csv) — one row per journal × year (3,211 rows total, 213 journals × 2010–2025). Columns:

| Column                                                                                  | Description                                                                                      |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `Journal_Name`                                                                          | Formatted journal display name                                                                   |
| `JCR_Abbrev`                                                                            | WoS JCR abbreviation (unique journal identifier)                                                 |
| `year`                                                                                  | Publication year (2010–2025)                                                                     |
| `e_issn`                                                                                | Electronic ISSN                                                                                  |
| `Field`                                                                                 | Primary WoS research field                                                                       |
| `All_Fields`                                                                            | All WoS fields the journal belongs to                                                            |
| `policy`                                                                                | `1` if the journal has an editorial visualisation policy, else `0`                               |
| `policy_year`                                                                           | Year the policy was adopted (if applicable)                                                      |
| `n_articles`                                                                            | Count of screened articles that year                                                             |
| `n_bar_or_informative`                                                                  | Denominator for proportions (eligible articles)                                                  |
| `p_only_bar`                                                                            | Proportion of eligible articles using _only_ bar charts (0–1)                                    |
| `p_only_inf`                                                                            | Proportion of eligible articles using _only_ informative charts (0–1)                            |
| `p_bar_and_inf`                                                                         | Proportion of eligible articles using _both_ chart types (0–1)                                   |
| `p_bar`                                                                                 | Proportion of eligible articles using any bar chart (0–1)                                        |
| `p_informative`                                                                         | Proportion of eligible articles using any informative chart (0–1)                                |
| `p_eligible`                                                                            | Proportion of all screened articles that are eligible (`n_bar_or_informative / n_articles`)      |
| `sum_bar`, `sum_inf`, `sum_only_bar`, `sum_only_inf`, `sum_bar_and_inf`, `sum_eligible` | Article counts for each category                                                                 |

Proportions in the CSV (0–1) are scaled to percentages (0–100) by `extract-data.js` before serialisation.

---

## Dashboard Features

**Navigation.** [Home](src/pages/Home.jsx) lists all fields (with intro sections: about, why policy matters, what the metrics mean). Each field opens [FieldPage](src/pages/FieldPage.jsx) at `/field/:slug` via HashRouter. A [TopNav](src/components/TopNav.jsx) with global search sits on every field page.

**Aggregated and per-journal charts.** Each field page shows aggregated trend cards (all / policy / non-policy) and a grid of per-journal cards.

**Filtering and search.** [FilterBar](src/components/FilterBar.jsx) toggles metric visibility, toggles policy-year markers, and switches the policy filter (all / policy / non-policy). [JournalSidebar](src/components/JournalSidebar.jsx) and [GlobalJournalSearch](src/components/GlobalJournalSearch.jsx) find and scroll to specific journals.

**Compare.** Any card can be opened in a [CompareModal](src/components/CompareModal.jsx) to overlay two fields or journals on a single chart.

**Policy year markers.** Per-journal charts show a vertical line at the policy adoption year (toggleable). Aggregated charts show semi-transparent bands reflecting the share of journals adopting in each year.

**Responsive grid.** Column count adjustable; chart titles wrap/shrink with card width; ChartCard extends the year domain so policy markers near the axis remain visible.

**Export.** Individual cards can be exported as PNG images via the card menu (`html-to-image`).

---

## Metrics

| Metric                  | Series key              | Colour                |
| ----------------------- | ----------------------- | --------------------- |
| % only bar              | `pct_only_bar`          | Vermilion `#d55e00`   |
| % bar and informative   | `pct_bar_informative`   | Orange `#e69f00`      |
| % only informative      | `pct_only_informative`  | Blue `#0072b2`        |

Palette is Okabe–Ito (colourblind-safe). Defined in [src/data/fields.js](src/data/fields.js).

---

## Testing

```bash
npm test
```

Specs in [tests/](tests/) cover ChartCard rendering, FieldPage prefetch behaviour, navigation components (TopNav, JournalSidebar, FieldSwitcherBar), the MetricStrip, the `useVisible` IntersectionObserver hook, and the `extract-data.js` CSV parser.

---

## Deployment

```bash
npm run deploy
```

Builds and pushes `dist/` to the `gh-pages` branch. The site is served at the base path declared in [vite.config.js](vite.config.js).

---

## Background & Motivation

Bar graphs that reduce continuous data to a mean and error bar are widely criticised for concealing distributional features — bimodality, skewness, outliers — critical for interpreting and replicating results. Despite two decades of calls to replace them, bar charts remain dominant across many biomedical journals.

A growing number of journals introduced **editorial policies** explicitly encouraging or requiring more informative alternatives. These adoptions create natural quasi-experiments: comparing visualisation practices _before_ and _after_ a policy — and against journals that never adopted one — estimates whether editorial recommendations produce measurable changes in author behaviour.

This dashboard provides that view across hundreds of thousands of articles, 213 journals, year by year from 2010 to 2025.

Study protocol pre-registered at **[osf.io/tcyxg](https://osf.io/tcyxg/overview)**.

---

## Key References

- Weissgerber et al. (2015). _Beyond bar and line graphs: time for a new data presentation paradigm._ PLOS Biology. [doi:10.1371/journal.pbio.1002128](https://doi.org/10.1371/journal.pbio.1002128)
- Weissgerber et al. (2019). _From static to interactive: Transforming data visualization to improve transparency._ PLOS Biology. [doi:10.1371/journal.pbio.1002484](https://doi.org/10.1371/journal.pbio.1002484)
- Weissgerber et al. (2019). _Reveal, don't conceal: Transforming data visualization to improve transparency._ Circulation. [doi:10.1161/CIRCULATIONAHA.118.037777](https://doi.org/10.1161/CIRCULATIONAHA.118.037777)
- Riedel et al. (2022). _Replacing bar graphs of continuous data with more informative graphics: are we making progress?_ Clinical Science. [doi:10.1042/CS20220313](https://doi.org/10.1042/CS20220313)
- Schulz et al. (2025). _Do journal policies reduce the use of bar graphs?_ [osf.io/tcyxg](https://osf.io/tcyxg/overview)
- Riedel N, Nachev V, Schulz R, Kazezian V, Weissgerber T. _barzooka._ [GitHub](https://github.com/quest-bih/barzooka)

---

## License

[GNU General Public License v3.0 (GPLv3)](LICENSE)
