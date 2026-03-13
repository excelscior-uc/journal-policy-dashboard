# Journal Observatory Dashboard

An interactive dashboard for exploring how data visualisation practices in scientific publishing have changed over time. It focuses on a simple but important question: **are researchers increasingly choosing more informative ways to display their data?**

---

## What This Dashboard Shows

For each Research Field tracked, you can follow two metrics year by year:

- 🟣 **% Bars** — the share of papers that include bar charts, a common but often criticised visualisation type that can obscure the underlying distribution of data.
- 🩵 **% Informative Graphs** — the share of papers using more informative alternatives — such as box plots, violin plots, or dot plots — that better represent individual data points and variability.

Chart titles include sample size information: aggregated plots show the number of journals and total articles analysed (e.g. _"Cardiology (n = 8 journals, 12,450 articles)"_), and per-journal plots show the total article count (e.g. _"Circulation (n = 1,847 articles)"_). Tooltips additionally show the number of articles analysed in each individual year.

### Policy Year Markers

- On **per-journal plots**, a solid vertical line marks the year that journal adopted an editorial recommendation on figure types.
- On **aggregated plots**, the policy marker is replaced by a set of semi-transparent vertical bands — one per year in which at least one journal in the field adopted a policy. Each band's **width is proportional to the percentage of journals** that adopted that year, so thicker bands indicate years of widespread adoption and thin bands mark isolated early or late movers.

---

## Research Fields Covered

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

---

## How to Navigate

The dashboard opens on the **About** tab, which shows the Global Aggregated Trend chart and a full description of the dashboard's features. Use the sidebar to switch between views:

- **GLOBAL** — global aggregated trend across all journals, plus individual aggregated trend charts for each Research Field side by side.
- **Per-field tabs** — one tab per Research Field, each showing an aggregated trend for that field followed by individual per-journal charts.

Within any per-field view you can:

- Adjust the **column slider** to display more or fewer journal charts side by side.
- Use the **journal search bar** to filter visible cards or jump directly to a specific journal.
- **Drag and drop** journal cards to reorder them within the grid (see below).

### Showing and Hiding Lines

Lines can be toggled in three ways:

1. **Click a legend entry** inside any chart to hide or show that line within that chart only. Double-clicking isolates a single line; double-clicking again restores all lines.
2. **Use the global toggle bar** (the row of buttons at the top of the page) to show or hide a line type — _% Bars_, _% Informative Graphs_, or _Policy adoption_ — **across every chart on the page simultaneously**.
3. The policy adoption layer on aggregated plots shares the same toggle as the policy line on per-journal plots, so a single button click controls both.

Legend boxes are semi-transparent so that data points beneath them remain visible.

### Drag-and-Drop Card Reordering

Each journal card has a narrow **⠿ grip strip along its left edge**. Drag it to move that card to any position within the grid — useful for placing two journals you want to compare side by side. The target card is highlighted as you drag so you can see exactly where it will land. Press **Escape** to cancel a drag in progress.

---

## Generating the Dashboard

The dashboard is produced as a single self-contained HTML file by running the Python script:

```bash
python generate_index_html_search_bar_about_cols1_v28b.py
```

### Requirements

- Python 3.10+
- `pandas`, `plotly`, `numpy`

### Input Data

The script expects the following CSV files in the configured `local_folder`:

| File | Description |
| ---- | ----------- |
| `journals_selected_<timestamp>.csv` | Selected journals and metadata |
| `field_selected_<timestamp>.csv` | Field list |
| `simulated_journal_data_<timestamp>.csv` | Per-journal yearly results, including `EligibleArticles` |
| `policy_df_<timestamp>.csv` | Policy year assignments per journal |

The results file must include an `EligibleArticles` column with the number of articles analysed per journal per year. Update the `latest_timestamp`, `latest_timestamp_results`, and `local_folder` variables at the top of the script to point to your data.

### Output

The script writes a timestamped HTML file to the `new_figures_<date>_v28b/` output directory:

```
new_figures_20260312_v28b/index_20260312_121648.html
```

---

## Technical Notes

- All Plotly figures are embedded inline — no external figure files are needed.
- Plotly is loaded once from CDN (`plotly-2.35.2.min.js`) and shared across all charts.
- The Global Aggregated Trend figure is rendered under two distinct div IDs (one for the About tab, one for the Global tab) from the same serialised JSON, so both tabs display it correctly.
- The global legend toggle uses `Plotly.restyle()` to update trace visibility across all plot elements on the page, matching traces by both `name` and `legendgroup`.
- The layout is fully responsive, with a CSS grid that the user can resize in-browser via the column slider.

### Adaptive Chart Titles

Chart titles in the grid scale dynamically to the available card width. As cards get narrower (more columns selected, or a smaller browser window), the title font size shrinks proportionally and long titles wrap onto multiple lines via `<br>` injection. In multi-column grids all cards in the same grid share the same top margin, keeping their y-axes horizontally aligned regardless of title length. Title layout is recalculated on panel switch, column change, window resize, and after drag-and-drop reorders. A `ResizeObserver` watches each grid container and single-plot wrapper so layout updates fire automatically on any size change.

### Adaptive X-Axis Tick Density

The x-axis year labels thin out automatically as cards get narrower, preventing the overlapping labels that occur at higher column counts:

| Card width | Tick interval | Font size |
| ---------- | ------------- | --------- |
| ≥ 500 px | Every year (dtick = 1) | 10 px |
| 350–499 px | Every 2 years (dtick = 2) | 9 px |
| < 350 px | Every 5 years (dtick = 5) | 8 px |

Tick density is recalculated alongside title layout, so it stays in sync on every panel switch, column change, window resize, and drag-and-drop reorder.

### Drag-and-Drop Implementation

Card reordering uses the **Pointer Events API** (`pointerdown` / `pointermove` / `pointerup`) rather than the HTML5 Drag-and-Drop API. This is intentional: setting `draggable="true"` on a parent element suppresses `mousemove` events inside it, which breaks Plotly's hover tooltips and legend interactions. The implementation instead:

- Attaches all listeners directly to the **drag handle element** (never to `document`), so Plotly's own event listeners are completely unaffected.
- Uses `handle.setPointerCapture()` so `pointermove` and `pointerup` continue firing on the handle even as the cursor moves over other cards.
- Shows a lightweight ghost `<div>` (an empty placeholder, not a clone of the card) that follows the cursor during the drag.
- Temporarily hides the ghost with `visibility: hidden` when calling `elementFromPoint()` to detect the drop target, preventing the ghost from intercepting the hit-test.
- Places the handle in a **14 px strip to the left of the chart area** (the card is a CSS flex row), so the handle never overlaps the Plotly canvas.
- Wires up new handles via a `MutationObserver`, eliminating timing races with asynchronously rendered Plotly figures.
