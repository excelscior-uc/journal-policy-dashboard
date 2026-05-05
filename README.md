# Tracking the Shift from Bar Graphs to Informative Plots in Biomedical Journals

An interactive dashboard tracking how data-visualisation practices in scientific publishing have evolved over time — focusing on the use of bar graphs versus more informative alternatives across 213 journals and 12 biomedical research fields:

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

> **Dashboard:** [teresacoliveira.github.io/journal-observatory-2](https://teresacoliveira.github.io/journal-observatory-2)

---

## Overview

This repository processes barzooka screening results and article metadata for 213 biomedical journals and generates a self-contained, single-file HTML dashboard tracking visualisation trends from 2010 to 2025.

The dashboard lets you:

- Track the prevalence of **bar graphs** vs. **informative visualisations** (bars with dots, box plots, dot plots, histograms, violin plots) year by year (2010–2025)
- Compare **policy journals** (those that adopted an editorial recommendation on figure types) against **non-policy journals**
- Explore trends at three levels: **global**, **per research field**, and **per journal**
- Visually assess whether editorial policies produce measurable changes in author behaviour

Figure classification is performed by [barzooka](https://github.com/quest-bih/barzooka) — an automated deep-learning tool that detects chart types in scientific PDF figures.

---

## Pipeline

The analysis runs as three sequential Python scripts. Each script accepts file paths as command-line arguments with hardcoded defaults, so no script editing is required for routine re-runs.

```
step1_merge_bz_results.py
    → merged_bz_results_TIMESTAMP.csv            (571,744 rows)

step2_build_aggregated_dataset.py
    → bz_journal_year_percentages_All_Fields_TIMESTAMP.csv   (3,211 rows)
    → sankey_workflow_TIMESTAMP.html
    → diag_missing_issns_TIMESTAMP.csv           (if any unmatched ISSNs)
    → diag_unmatched_rows_TIMESTAMP.csv          (if any unmatched rows)

step3_generate_dashboard.py
    → dashboard_output/index_TIMESTAMP.html      (~3.6 MB, self-contained)
```

---

## Requirements

- Python 3.10+
- pandas
- plotly
- requests

Install dependencies:

```bash
pip install pandas plotly requests
```

---

## Usage

### Step 1 — Merge barzooka screening results

Reads all per-journal `*_bz_results.csv` files and merges them into a single CSV. Rows with no screening results are flagged (`has_no_results = 1`) but retained; they are filtered in step 2.

```bash
python step1_merge_bz_results.py \
    --input  path/to/bz_results_folder/ \
    --output path/to/output_dir/
```

### Step 2 — Build aggregated dataset

Filters article metadata, joins it with the BZ results, derives article-level chart-type flags, enriches with journal metadata, and aggregates to one row per journal × year. Also produces a Sankey diagram showing row counts and exclusion reasons at each processing stage.

```bash
python step2_build_aggregated_dataset.py \
    --bz      path/to/merged_bz_results_TIMESTAMP.csv \
    --meta    path/to/metadata_full.csv \
    --mapping path/to/Journal_names_mapping.csv \
    --output  path/to/output_dir/
```

Add `--no-crossref` to skip the Crossref API lookup for missing publication years (only ~18 rows are affected).

### Step 3 — Generate dashboard

Reads the aggregated CSV and writes a fully self-contained HTML dashboard.

```bash
python step3_generate_dashboard.py \
    --csv    path/to/bz_journal_year_percentages_All_Fields_TIMESTAMP.csv \
    --output dashboard_output/
```

Open the resulting `index_TIMESTAMP.html` in any modern browser — no server required.

---

## Input Data

### Barzooka screening results
213 per-journal CSV files named `<eissn>_bz_results.csv`. Each file contains one row per screened article with a `prediction` column holding a Python dictionary string of figure-type counts.

### Article metadata (`metadata_full.csv`)
PubMed metadata export covering all retrieved articles. Only rows where `is_in_main_folder == TRUE` are used. After deduplication on DOI and year filtering (2010–2025), approximately 570,410 rows remain.

### Journal mapping CSV
214 rows for 213 journals (one journal has two rows because it changed name and e-ISSN in 2021). Contains journal name, primary and all WoS research fields, editorial policy flag, policy adoption year, and JCR abbreviation.

---

## Aggregated CSV Format

The pipeline produces one row per journal per year. Key columns:

| Column | Description |
|---|---|
| `Journal_Name` | Formatted journal display name |
| `JCR_Abbrev` | WoS JCR abbreviation (unique journal identifier) |
| `year` | Publication year (2010–2025) |
| `e_issn` | Electronic ISSN (BZ-derived, from the screening filename) |
| `Field` | Primary WoS research field |
| `All_Fields` | All WoS fields the journal belongs to |
| `policy` | `1` if the journal has an editorial visualisation policy, `0` otherwise |
| `policy_year` | Year the policy was adopted (if applicable) |
| `n_articles` | Count of eligible articles that year |
| `n_bar_or_informative` | Denominator for proportions (= `n_articles` after eligibility filter) |
| `p_only_bar` | Proportion of eligible articles using *only* bar charts (0–1) |
| `p_only_inf` | Proportion of eligible articles using *only* informative charts (0–1) |
| `p_bar_and_inf` | Proportion of eligible articles using *both* chart types (0–1) |
| `p_bar` | Proportion using any bar chart (0–1) |
| `p_informative` | Proportion using any informative chart (0–1) |
| `p_eligible` | Proportion of all articles that are eligible (0–1) |
| `sum_bar`, `sum_inf`, `sum_only_bar`, `sum_only_inf`, `sum_bar_and_inf` | Article counts for each category |
| `Cardiac & Cardiovascular Systems` … `Urology & Nephrology` | Binary field indicators (12 columns) |

> Proportions in the CSV (0–1) are scaled to percentages (0–100) by the dashboard script before charting.

---

## Processing Stages and Record Counts

| Stage | Rows | Notes |
|---|---|---|
| BZ screening files (213 journals) | 571,744 | One row per screened article |
| metadata_full.csv (raw) | 622,085 | Full PubMed export |
| After `is_in_main_folder = TRUE` | 571,769 | In-scope articles only |
| After DOI deduplication | ~571,744 | First occurrence kept |
| After year filter (2010–2025) | 570,410 | 2026 records and missing years removed |
| After left join metadata + BZ | 570,410 | Metadata is left table |
| After removing no-results rows | 570,402 | Rows with all figure counts null/zero |
| After eligibility filter (`has_bar_or_inf = 1`) | 360,858 | Articles with ≥1 bar or informative chart |
| Aggregated (journal × year) | 3,211 | Final dashboard input |

A Sankey diagram of this flow (with actual row counts from each run) is written to `sankey_workflow_TIMESTAMP.html` by step 2.

---

## Article-Level Flags

Step 2 derives the following binary flags before aggregation:

| Flag | Definition |
|---|---|
| `has_bar` | `bar > 0` |
| `has_informative` | `max(bardot, box, dot, hist, violin) > 0` |
| `has_bar_or_inf` | `has_bar = 1 OR has_informative = 1` — defines the eligible article set |
| `only_bar` | `has_bar = 1 AND has_informative = 0` |
| `only_inf` | `has_informative = 1 AND has_bar = 0` |
| `bar_and_inf` | `has_bar = 1 AND has_informative = 1` |

---

## Dashboard Features

**Navigation**
Sidebar links to the **About** tab, a **Global** overview, and individual **Research Field** tabs.

**Aggregated charts**
Each tab shows three side-by-side trend charts: *All journals*, *Policy journals*, and *Non-Policy journals*. The **Show charts** dropdown in the top bar filters which card types are visible across the active tab.

**Individual journal charts**
Each field tab lists per-journal trend charts. Use the **Find journal** search box to highlight and scroll to a specific card, the **Show journals** dropdown to filter by policy status, and the **Columns** slider to adjust the grid layout (1–6 columns for journal cards; 1–3 for aggregated cards). Cards can be **drag-and-dropped** to reorder within their grid.

**Responsive title and axis scaling**
Chart titles wrap and shrink as cards narrow. In multi-column grids, the top margin is unified across all cards in each row so that y-axes remain vertically aligned. X-axis tick density adapts to card width (annual ticks at ≥500 px; biennial at ≥350 px; quinquennial below that). These updates fire on column-slider changes, panel switches, sidebar collapses, drag-and-drop reorders, and browser window resizes (via ResizeObserver with an 80 ms debounce).

**Global controls**
**Show/hide all** toggle buttons in the top bar hide or show any metric across every chart simultaneously.

**Policy year markers**
Per-journal charts show a single vertical yellow line at the year of policy adoption. Aggregated charts show semi-transparent yellow bands whose width reflects the proportion of journals adopting a policy in a given year.

**Collapsible About sections**
The About tab contains collapsible sections covering study background, metric definitions, navigation guidance, and a references list — all expandable/collapsible without page reload.

---

## Metrics

| Metric | Colour | Description |
|---|---|---|
| % only bar | Red `#c0392b` | Articles using only bar graphs for continuous data |
| % bar and informative | Salmon `#e8998d` | Articles using both bar and informative graphs |
| % only informative | Teal `#76b5b2` | Articles using only informative graphs |
| Policy adoption | Yellow `#fde624` | Vertical marker at the journal's policy adoption year |

---

## Key Design Decisions

**BZ-derived ISSN used for journal mapping.** The journal mapping join uses the ISSN extracted from the BZ filename rather than the PubMed metadata ISSN. One journal in the sample (*Transplantation and Cellular Therapy*, JID 114) changed its name and ISSN in 2021. Its BZ file was compiled under the new ISSN for all articles, so using the BZ filename ISSN correctly unifies pre- and post-2021 articles under the same journal row.

**No-results filter applied after the join.** Rows with no screening results (all figure-type counts null or zero, n = 8) are retained through step 1 and filtered in step 2 after the left join with metadata. This ensures the Sankey diagram can show accurate row counts at each distinct processing stage.

**Eligibility denominator.** Only articles containing at least one bar chart or informative chart (`has_bar_or_inf = 1`) are included in the analysis. The denominator for all proportion columns (`n_bar_or_informative`) is the count of these eligible articles per journal × year.

---

## Background & Motivation

Bar graphs that reduce continuous data to a mean and error bar are widely criticised for concealing distributional features — bimodality, skewness, outliers — that are critical for interpreting and replicating results. Despite two decades of calls to replace them, bar charts remain the dominant format across many biomedical journals.

A growing number of journals have introduced **editorial policies** that explicitly encourage or require more informative alternatives. These policy adoptions create natural quasi-experiments: by comparing visualisation practices *before* and *after* a policy — and against journals that never adopted one — it is possible to estimate whether editorial recommendations produce measurable changes in author behaviour.

This dashboard provides exactly that view, enabling longitudinal tracking of hundreds of thousands of articles across 213 journals, year by year from 2010 to 2025.

The study protocol is publicly pre-registered at **[osf.io/tcyxg](https://osf.io/tcyxg/overview)**.

---

## Key References

- Weissgerber et al. (2015). *Beyond bar and line graphs: time for a new data presentation paradigm.* PLOS Biology. [doi:10.1371/journal.pbio.1002128](https://doi.org/10.1371/journal.pbio.1002128)
- Weissgerber et al. (2019). *From static to interactive: Transforming data visualization to improve transparency.* PLOS Biology. [doi:10.1371/journal.pbio.1002484](https://doi.org/10.1371/journal.pbio.1002484)
- Weissgerber et al. (2019). *Reveal, don't conceal: Transforming data visualization to improve transparency.* Circulation. [doi:10.1161/CIRCULATIONAHA.118.037777](https://doi.org/10.1161/CIRCULATIONAHA.118.037777)
- Riedel et al. (2022). *Replacing bar graphs of continuous data with more informative graphics: are we making progress?* Clinical Science. [doi:10.1042/CS20220287](https://doi.org/10.1042/CS20220287)
- Riedel N, Nachev V, Schulz R, Kazezian V, Weissgerber T. *barzooka* — automated figure screening tool. [GitHub](https://github.com/quest-bih/barzooka)

---

## License

MIT

---

## Contact

Teresa Cunha-Oliveira — [@teresacoliveira](https://github.com/teresacoliveira)
