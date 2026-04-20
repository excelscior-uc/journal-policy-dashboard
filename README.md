# Tracking the Shift from Bar Graphs to Informative Plots in Biomedical Journals

An interactive dashboard for tracking how data-visualisation practices in scientific publishing have evolved over time in biomedical journals — focusing on the use of bar graphs versus more informative alternatives across hundreds of journals and 12 research fields: 
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

> **Dashboard:** [website](https://teresacoliveira.github.io/journal-observatory-2)

---

## Overview

This repository generates a self-contained, single-file HTML dashboard from longitudinal journal-level data screened by [barzooka](https://github.com/quest-bih/barzooka) — an automated deep-learning tool that detects chart types in scientific PDF figures.

The dashboard lets you:

- Track the prevalence of **bar graphs** vs. **informative visualisations** (bar graphs with dots, box plots, dot plots, histograms or violin plots) year by year (2010–2025)
- Compare **policy journals** (those that adopted an editorial recommendation on figure types) against **non-policy journals**
- Explore trends at three levels: **global**, **per research field**, and **per journal**
- Visually assess whether editorial policies produce measurable changes in author behaviour

---

## How It Works

The script `generate_dashboard_from_csv_v8.py` reads a CSV file of journal-year-level statistics and outputs a fully self-contained HTML file (no server required). All charts are rendered with [Plotly](https://plotly.com/python/) and embedded as JSON inside the HTML.

```
Input:  bz_journal_year_percentages_YYYYMMDD_HHMMSS.csv
Output: dashboard_output/index_YYYYMMDD_HHMMSS.html
```

---

## Requirements

- Python 3.8+
- pandas
- plotly

Install dependencies:

```bash
pip install pandas plotly
```

---

## Usage

1. Clone this repository:

```bash
git clone https://github.com/teresacoliveira/journal-observatory-2.git
cd journal-observatory-2
```

2. Place your input CSV in the appropriate directory (or update `CSV_PATH` in the script):

```python
CSV_PATH = r"path/to/bz_journal_year_percentages_YYYYMMDD_HHMMSS.csv"
```

3. Run the generator:

```bash
python generate_dashboard_from_csv_v8.py
```

4. Open the output file in any modern browser:

```
dashboard_output/index_YYYYMMDD_HHMMSS.html
```

---

## Input Data Format

The input CSV must contain one row per journal per year, with the following key columns:

| Column | Description |
|---|---|
| `Journal_Name` | Full journal name |
| `JCR_Abbrev` | JCR abbreviated journal title (used as unique identifier) |
| `year` | Publication year |
| `Field` | Primary research field |
| `All_Fields` | All fields the journal belongs to |
| `policy` | `1` if the journal has an editorial visualisation policy, `0` otherwise |
| `policy_year` | Year the policy was adopted (if applicable) |
| `p_only_bar` | Proportion of articles using *only* bar graphs (0–1) |
| `p_only_inf` | Proportion of articles using *only* informative graphs (0–1) |
| `p_bar_and_inf` | Proportion of articles using *both* graph types (0–1) |
| `n_articles` | Total number of screened articles that year |
| `n_bar_or_informative` | Number of eligible articles containing relevant figures |

> Proportions in the CSV (0–1) are automatically scaled to percentages (0–100) by the script.

---

## Dashboard Features

**Navigation**  
Sidebar links to the **About** tab, a **GLOBAL** overview, and individual **Research Field** tabs.

**Aggregated charts**  
Each tab shows three side-by-side trend charts: *All journals*, *Policy journals*, and *Non-Policy journals*. The **Show charts** dropdown in the top bar filters which card types are visible.

**Individual journal charts**  
Each field tab lists per-journal trend charts. Use the **Find journal** search box to highlight and scroll to a specific card, the **Show journals** dropdown to filter by policy status, and the **Columns** slider to adjust the grid layout (1–6 columns). Cards can be **drag-and-dropped** to reorder.

**Global controls**  
**Show/hide all** toggle buttons in the top bar hide or show any metric across every chart simultaneously.

**Policy year markers**  
Per-journal charts show a single vertical line at the year of policy adoption. Aggregated charts show semi-transparent yellow bands whose width reflects the proportion of journals adopting a policy in a given year.

---

## Metrics

| Metric | Colour | Description |
|---|---|---|
| % only bar | Red `#c0392b` | Articles using only bar graphs for continuous data |
| % bar and informative | Salmon `#e8998d` | Articles using both bar and informative graphs |
| % only informative | Teal `#76b5b2` | Articles using only informative graphs |
| Policy adoption | Yellow `#fde624` | Vertical marker at the journal's policy adoption year |

---

## Background & Motivation

Bar graphs that reduce continuous data to a mean and error bar are widely criticised for concealing distributional features — bimodality, skewness, outliers — that are critical for interpreting and replicating results. Despite two decades of calls to replace them, bar charts remain the dominant format across many biomedical and life-science journals.

A growing number of journals have introduced **editorial policies** that explicitly encourage or require more informative alternatives. These policy adoptions create natural quasi-experiments: by comparing visualisation practices *before* and *after* a policy — and against journals that never adopted one — it is possible to estimate whether editorial recommendations produce measurable changes in author behaviour.

This dashboard provides exactly that view, enabling longitudinal tracking of thousands of articles across hundreds of journals, year by year.

The study protocol is publicly pre-registered at **[osf.io/tcyxg](https://osf.io/tcyxg/overview)**.

---

## Key References

- Weissgerber et al. (2015). *Beyond bar and line graphs: time for a new data presentation paradigm.* PLOS Biology. [doi:10.1371/journal.pbio.1002128](https://doi.org/10.1371/journal.pbio.1002128)
- Riedel et al. (2022). *Replacing bar graphs of continuous data with more informative graphics: are we making progress?* Clinical Science. [doi:10.1042/CS20220287](https://doi.org/10.1042/CS20220287)
- Riedel N, Nachev V, Schulz R, Kazezian V, Weissgerber T. *barzooka* — automated figure screening tool. [GitHub](https://github.com/quest-bih/barzooka)

---

## License

MIT

---

## Contact

Teresa Cunha-Oliveira — [@teresacoliveira](https://github.com/teresacoliveira)