# Tracking the Shift from Bar Graphs to Informative Plots in Biomedical Journals

An interactive dashboard tracking data-visualisation practices across 213 biomedical journals and 12 research fields from 2010 to 2025.

> **Pre-registration:** [osf.io/tcyxg](https://osf.io/tcyxg/overview)
> **Live dashboard:** [teresacoliveira.github.io/journal-observatory-2](https://teresacoliveira.github.io/journal-observatory-2)

---

## Overview

Figure classification is performed by [barzooka](https://github.com/quest-bih/barzooka), an automated deep-learning tool that detects chart types in scientific PDF figures. The dashboard tracks two broad categories:

- **Bar charts** — the conventional mean-and-error bar format
- **Informative charts** — bars with dots, box plots, dot plots, histograms, or violin plots

It compares **policy journals** (71 journals that adopted an editorial recommendation on figure types) against **non-policy journals**, across three levels: global, per research field, and per journal.

Research fields covered: Cardiac & Cardiovascular Systems · Clinical Neurology · Endocrinology & Metabolism · Genetics & Heredity · Immunology · Neurosciences · Oncology · Orthopedics · Pharmacology & Pharmacy · Physiology · Rheumatology · Urology & Nephrology

---

## Files

| File                                         | Description                                                           |
| -------------------------------------------- | --------------------------------------------------------------------- |
| `bz_journal_year_percentages_All_Fields.csv` | Aggregated dataset — 3,211 rows, one per journal × year               |
| `step1_merge_bz_results.py`                  | Merges per-journal barzooka screening CSVs into a single file         |
| `step2_build_aggregated_dataset_v3.py`       | Filters metadata, joins BZ results, aggregates to journal × year      |
| `step3_generate_dashboard_v11.py`            | Reads the aggregated CSV and writes the self-contained HTML dashboard |

The dashboard (`index.html`) is generated from `step3_generate_dashboard_v10.py` using the aggregated CSV as input. Steps 1 and 2 require the raw barzooka screening files and full article metadata, which are not included here.

---

## Aggregated CSV format

3,211 rows · 22 columns · one row per journal × year (2010–2025)

| Column                                              | Description                                                                                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Journal_Name`                                      | Journal display name                                                                                                                                         |
| `year`                                              | Publication year                                                                                                                                             |
| `e_issn`                                            | Electronic ISSN (from barzooka screening filename)                                                                                                           |
| `JCR_Abbrev`                                        | WoS JCR abbreviation — unique journal identifier                                                                                                             |
| `Field`                                             | Primary WoS research field                                                                                                                                   |
| `All_Fields`                                        | All WoS fields the journal belongs to (semicolon-separated)                                                                                                  |
| `policy`                                            | `1` if the journal adopted an editorial visualisation policy, else `0`                                                                                       |
| `policy_year`                                       | Year of policy adoption (blank if no policy)                                                                                                                 |
| `n_articles`                                        | Total screened articles that year (before eligibility filter)                                                                                                |
| `n_bar_or_informative`                              | Number of articles containing at least one visualisation for continuous data detected by barzooka - `eligible articles` — denominator for proportion columns |
| `sum_bar` / `sum_inf`                               | Sum of eligible articles containing any bar / informative chart                                                                                              |
| `sum_only_bar` / `sum_only_inf` / `sum_bar_and_inf` | Mutually exclusive article sums                                                                                                                              |
| `sum_eligible`                                      | = `n_bar_or_informative` (sum of articles with ≥1 bar or informative chart)                                                                                  |
| `p_bar` / `p_informative`                           | Proportion of eligible articles with any bar / informative chart (0–1)                                                                                       |
| `p_only_bar` / `p_only_inf` / `p_bar_and_inf`       | Proportions for mutually exclusive categories (0–1)                                                                                                          |
| `p_eligible`                                        | Fraction of all screened articles that are eligible (0–1; not plotted in dashboard)                                                                          |

Proportions are stored as 0–1 in the CSV and scaled to 0–100 by the dashboard script before charting.

---

## Running the dashboard generator

### Requirements

Python 3.10+, pandas, plotly:

```bash
pip install pandas plotly
```

### Generate the dashboard

```bash
python step3_generate_dashboard_v10.py \
    --csv    bz_journal_year_percentages_All_Fields.csv \
    --output dashboard_output/
```

---

## Dashboard interaction guide

**Navigation** · Use the left sidebar to move between the About tab, the global All Research Fields overview, and individual field tabs.

**Show/hide all** · The toggle buttons in the top bar (% only bar, % bar and informative, % only informative, Policy adoption) hide or reveal the corresponding element across every chart on the page simultaneously.

**Show charts dropdown** · Filters aggregated chart cards to show All journals, Policy journals only, or Non-Policy journals only, across the active tab.

**Columns slider** · Each tab has sliders to adjust the grid layout: 1–3 columns for aggregated charts, 1–6 columns for individual journal charts.

**Find journal** · Type in the search box to dim non-matching cards; select from the autocomplete list to scroll directly to that journal's card.

**Show journals dropdown** · Filters the journal grid by policy status (All / Policy only / Non-Policy only).

**Drag-and-drop** · Grab any card by its left-edge handle to reorder it within its grid.

**Chart hover** · Hover over any data point to see year, metric value, eligible and total article counts, and (for journal charts) the policy year. Hover over a yellow policy band on aggregated charts to see the adoption year and the share of journals that adopted that year.

**Legend click** · Click a legend item to hide/show that line on that chart. Double-click to isolate it; double-click again to restore all lines.

**Zoom** · Box-select or lasso any chart area to zoom in. Double-click to reset.

---

## Pipeline overview

Steps 1 and 2 require raw barzooka screening files and full PubMed article metadata (not included here). The final aggregated CSV is provided directly so the dashboard can be regenerated without re-running the full pipeline.

```
step1_merge_bz_results.py        →  merged_bz_results_TIMESTAMP.csv
step2_build_aggregated_dataset_v3.py →  bz_journal_year_percentages_All_Fields_TIMESTAMP.csv
                                        sankey_workflow_TIMESTAMP.html
step3_generate_dashboard_v11.py  →  index_TIMESTAMP.html
```

| Stage                                           | Rows      | Notes                  |
| ----------------------------------------------- | --------- | ---------------------- |
| metadata_full.csv (raw)                         | 622,085   | Full PubMed export     |
| After `is_in_main_folder = TRUE`                | 571,769   | Downloaded articles    |
| After DOI deduplication                         | 571,744   | First occurrence kept  |
| After year filter (2010–2025)                   | 570,410   |                        |
| After left join with BZ results                 | 570,410   |                        |
| After removing no-result rows                   | 570,402   | All-NULL chart columns |
| After eligibility filter (`has_bar_or_inf = 1`) | 360,858   |                        |
| Aggregated (journal × year)                     | **3,211** | Dashboard input        |

---

## Key references

- Weissgerber et al. (2015). Beyond bar and line graphs. _PLOS Biology_. [doi:10.1371/journal.pbio.1002128](https://doi.org/10.1371/journal.pbio.1002128)
- Weissgerber et al. (2019). From static to interactive. _PLOS Biology_. [doi:10.1371/journal.pbio.1002484](https://doi.org/10.1371/journal.pbio.1002484)
- Riedel et al. (2022). Replacing bar graphs. _Clinical Science_. [doi:10.1042/CS20220287](https://doi.org/10.1042/CS20220287)
- Riedel N et al. _barzooka_ — automated figure screening tool. [GitHub](https://github.com/quest-bih/barzooka)
- Schulz et al. (2025). Do journal policies reduce the use of bar graphs? [osf.io/tcyxg](https://osf.io/tcyxg/overview)

---

## License

[GNU General Public License v3.0 (GPLv3)](LICENSE)

## Contact

Teresa Cunha-Oliveira — [@teresacoliveira](https://github.com/teresacoliveira)
