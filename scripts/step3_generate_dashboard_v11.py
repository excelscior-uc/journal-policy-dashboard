"""
step3_generate_dashboard.py
----------------------------
Reads the aggregated journal × year CSV produced by step 2 and writes a fully
self-contained, single-file HTML dashboard powered by Plotly.js.

The output file requires no web server and no internet connection to view — open
it in any modern browser. For GitHub Pages deployment, rename the output file
to index.html and commit it to the repository root or the /docs folder.

Pipeline position
-----------------
    step1_merge_bz_results.py        →  merged_bz_results_TIMESTAMP.csv
    step2_build_aggregated_dataset.py →  bz_journal_year_percentages_All_Fields_TIMESTAMP.csv
                                        sankey_workflow_TIMESTAMP.html
    step3_generate_dashboard.py       →  index_TIMESTAMP.html


The html can be served as a static file — no server configuration needed.
The dashboard loads Plotly.js from the Plotly CDN on first visit. Subsequent
visits use the browser cache; the rest of the file is self-contained HTML/JS.

Performance notes
-------------------------------
- Plotly.js (~3.5 MB minified) is loaded from cdn.plot.ly with a specific
  version pin (plotly-2.35.2.min.js) so the browser can cache it indefinitely.
- All chart data is inlined as JSON inside the HTML. The resulting file is
  typically 3–5 MB and loads in 2–5 seconds on a standard connection.
- GitHub Pages compresses static files with gzip automatically, which reduces
  transfer size by roughly 70 % for JSON-heavy HTML.
- Panels are rendered lazily: charts in inactive tabs are not re-laid-out until
  the tab is first opened, so initial paint is fast regardless of file size.

Usage
-----
    python step3_generate_dashboard.py \\
        --csv    input_data/bz_journal_year_percentages_All_Fields_TIMESTAMP.csv \\
        --output dashboard_output/

Dashboard interaction guide
---------------------------
Navigation
    Use the left sidebar to move between tabs:
      • About             — study background, metric definitions, and a global
                            aggregated overview chart
      • All Research Fields — global trend charts followed by one aggregated
                              chart per field (All / Policy / Non-Policy)
      • <Field name>      — aggregated field trends plus individual journal charts
                            for every journal in that field

Global Show/hide bar (top toolbar)
    Three coloured toggle buttons — "% only bar", "% bar and informative",
    "% only informative" — hide or reveal the corresponding metric line across
    every chart on the page simultaneously. A fourth button toggles the yellow
    policy-year marker lines. Buttons appear crossed-out when hidden.

Show charts dropdown (top toolbar)
    Filters the aggregated chart cards (All / Policy journals / Non-Policy
    journals) across the currently active tab:
      • All (Policy + Non-Policy) — shows all three cards
      • Policy journals only       — hides Non-Policy card
      • Non-Policy journals only   — hides Policy card

Per-field: Columns slider
    Each field tab has two Columns sliders:
      • Upper slider (1–3) — controls the number of columns in the aggregated
        trend grid (All / Policy / Non-Policy charts)
      • Lower slider (1–6) — controls the number of columns in the individual
        journal grid

Per-field: Find journal
    Start typing a journal name in the search box; matching cards are
    highlighted and the rest are dimmed. Press Enter or select a name from the
    autocomplete list to scroll directly to that card and briefly flash its
    border. Click ✕ to clear the search.

Per-field: Show journals dropdown
    Filters the journal card grid by policy status:
      • All               — shows every journal in the field
      • Policy only       — shows only journals that have adopted an editorial
                            visualisation policy
      • Non-Policy only   — shows journals without such a policy

Drag-and-drop reordering
    Any chart card can be grabbed by its drag handle (the dotted vertical bar
    on the left edge) and dragged to a new position within the same grid. This
    lets you place the most relevant journals side by side for comparison.
    The order resets when you navigate away and return to the tab.

Chart interactivity (Plotly)
    • Hover over any data point to see year, metric value, eligible article
      count, total article count, and (for journal charts) the policy year.
    • Click a legend item to hide/show that metric line for that chart only.
    • Double-click a legend item to isolate it (hide all others); double-click
      again to restore all lines.
    • Box-select or lasso on any chart to zoom in; double-click to reset zoom.
    • Hover over a yellow policy-year band on an aggregated chart to see the
      year and the percentage of journals that adopted the policy that year.

Collapsible sections (About tab)
    Click any section header (▾/▸) to collapse or expand its content. All
    sections are expanded by default.
"""

import argparse
import pandas as pd
import plotly.graph_objects as go
import os
from datetime import datetime

# ── Default paths (override with --csv / --output on the command line) ────────
DEFAULT_CSV        = "input_data/bz_journal_year_percentages_All_Fields.csv"
DEFAULT_OUTPUT_DIR = "dashboard_output"

DEFAULT_COLS     = 3
DEFAULT_AGG_COLS = 3

# ── Data loading ──────────────────────────────────────────────────────────────
def load_data(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    df.columns = df.columns.str.strip()
    df.rename(columns={df.columns[0]: "journal_name"}, inplace=True)

    for col in ["year", "p_bar", "p_informative", "p_only_bar", "p_only_inf",
                "p_bar_and_inf", "p_eligible", "policy", "policy_year",
                "n_bar_or_informative", "sum_eligible", "n_articles"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    for col in ["p_bar", "p_informative", "p_only_bar", "p_only_inf", "p_bar_and_inf"]:
        if col in df.columns:
            df[col] = df[col] * 100

    # p_eligible is already a proportion (0–1); convert to percentage for display
    if "p_eligible" in df.columns:
        df["p_eligible"] = df["p_eligible"] * 100

    df = df[(df["year"] >= 2010) & (df["year"] <= 2025)].copy()
    df["EligibleArticles"] = df.get(
        "n_bar_or_informative", df.get("n_articles", 0)
    ).fillna(0)
    df["TotalArticles"] = df["n_articles"].fillna(0) if "n_articles" in df.columns else df["EligibleArticles"]
    return df


# ── Metrics and colours ───────────────────────────────────────────────────────
METRICS = {
    "p_only_bar":    {"label": "% only bar",            "color": "#c0392b"},
    "p_bar_and_inf": {"label": "% bar and informative", "color": "#e8998d"},
    "p_only_inf":    {"label": "% only informative",    "color": "#76b5b2"},
}
COLOR_POLICY    = "#fde624"
XAXIS_RANGE     = [2009, 2026]
# Bottom margin — standard size now that footer is part of the x-axis title
FOOTER_MARGIN_B = 68   # px — ticks + 2-line x-axis title


# ── Helpers ───────────────────────────────────────────────────────────────────
def _safe_id(text):
    return (text.replace(" ", "_").replace("-", "_").replace("(", "")
                .replace(")", "").replace("&", "and").replace(".", "_")
                .replace("/", "_").replace(";", "").replace(",", ""))


def _apply_axes(fig, footer_text=""):
    """Apply standard axis formatting.
    If footer_text is provided it is embedded as a second line of the x-axis
    title in smaller grey text — guaranteed visible, never clipped.
    """
    if footer_text:
        xtitle = (
            f"Year<br>"
            f"<span style='font-size:8.5px;color:#6c757d;font-weight:normal;'>"
            f"{footer_text}</span>"
        )
    else:
        xtitle = "Year"
    fig.update_yaxes(range=[0, 100], title="% Papers", title_standoff=0,
                     tickformat=".0f", ticksuffix="%")
    fig.update_xaxes(range=XAXIS_RANGE, dtick=1, title=xtitle,
                     title_standoff=4, tickangle=-45)


def _fig_to_div(fig, div_id):
    fig_json = fig.to_json()
    return (
        f'<div id="{div_id}" style="width:100%;height:100%;"></div>\n'
        f"<script>\n(function(){{\n"
        f"  var spec = {fig_json};\n"
        f'  Plotly.newPlot("{div_id}", spec.data, spec.layout, '
        f"{{responsive:true, displayModeBar:false}});\n"
        f"}})();\n</script>"
    )


MAX_POLICY_LINE_WIDTH = 18
MIN_POLICY_LINE_WIDTH = 1


def _policy_year_distribution(abbrevs, abbrev_to_policy_year):
    total  = len(abbrevs)
    counts = {}
    for a in abbrevs:
        py = abbrev_to_policy_year.get(a)
        if py is not None:
            counts[py] = counts.get(py, 0) + 1
    return {yr: cnt / total for yr, cnt in counts.items()} if total else {}


def _add_policy_vlines(fig, abbrevs, abbrev_to_policy_year,
                       xaxis="x", yaxis="y",
                       show_in_legend=True, legend_label="Policy adoption"):
    dist     = _policy_year_distribution(abbrevs, abbrev_to_policy_year)
    existing = list(fig.data)
    fig.data = []
    first    = True
    for yr in sorted(dist):
        frac  = dist[yr]
        width = max(MIN_POLICY_LINE_WIDTH, MAX_POLICY_LINE_WIDTH * frac)
        pct   = frac * 100
        fig.add_trace(go.Scatter(
            x=[yr, yr], y=[0, 120], mode="lines",
            line=dict(color="rgba(253,231,37,0.55)", width=width),
            xaxis=xaxis, yaxis=yaxis,
            legendgroup="policy_vlines",
            name=legend_label,
            showlegend=show_in_legend if first else False,
            hovertemplate=(
                f"Policy year: {yr}<br>{pct:.0f}% of journals adopted"
                "<extra></extra>"
            ),
        ))
        first = False
    for t in existing:
        fig.add_trace(t)


def _build_agg_fig(df_in, title_str, abbrevs, abbrev_to_policy_year):
    if df_in.empty:
        fig = go.Figure()
        fig.update_layout(
            title=dict(text=title_str + " — no data", font=dict(size=13),
                       x=0.5, xanchor="center", xref="paper"),
            paper_bgcolor="white", plot_bgcolor="#fafafa",
            margin=dict(l=55, r=20, t=36, b=FOOTER_MARGIN_B),
        )
        _apply_axes(fig)
        return fig

    agg_dict = {m: "mean" for m in METRICS}
    agg_dict["EligibleArticles"] = "sum"
    agg_dict["TotalArticles"] = "sum"
    agg = df_in.groupby("year", as_index=False).agg(agg_dict)

    n_journals = df_in["JCR_Abbrev"].nunique()
    total_eligible = int(df_in["EligibleArticles"].sum())
    total_articles = int(df_in["TotalArticles"].sum())
    pct_eligible_overall = (total_eligible / total_articles * 100) if total_articles > 0 else 0

    # Footer text: article counts & % eligible — placed as an annotation below x-axis
    footer_text = (
        f"n\u202f=\u202f{total_eligible:,} eligible articles; "
        f"{pct_eligible_overall:.1f}% of total | {n_journals} journals"
    )

    # Title is now just the scope label (no stats)
    fig = go.Figure()
    for col, info in METRICS.items():
        customdata = list(zip(
            agg["EligibleArticles"].astype(int),
            agg["TotalArticles"].astype(int),
        ))
        fig.add_trace(go.Scatter(
            x=agg["year"], y=agg[col],
            name=info["label"], mode="lines+markers",
            line=dict(color=info["color"], width=2), marker=dict(size=5),
            customdata=customdata,
            hovertemplate=(
                f"<b>{title_str.split('<br>')[0]}</b><br>"
                f"Journals: {n_journals}<br>"
                "Year: %{x}<br>"
                f"{info['label']}: %{{y:.1f}}%<br>"
                "Eligible articles: %{customdata[0]:,}<br>"
                "Total articles: %{customdata[1]:,}<extra></extra>"
            ),
        ))

    _add_policy_vlines(fig, abbrevs, abbrev_to_policy_year,
                       legend_label="Policy adoption")
    _apply_axes(fig, footer_text=footer_text)
    fig.update_layout(
        autosize=True, width=None, height=None,
        title=dict(text=title_str, font=dict(size=13),
                   x=0.5, xanchor="center", xref="paper", pad=dict(b=0)),
        legend=dict(
            x=0.01, y=0.99, xanchor="left", yanchor="top",
            bgcolor="rgba(255,255,255,0.8)", font=dict(size=9),
            tracegroupgap=0, itemsizing="constant", itemwidth=30,
            entrywidthmode="fraction", entrywidth=0.48,
        ),
        margin=dict(l=55, r=20, t=36, b=FOOTER_MARGIN_B),
        paper_bgcolor="white", plot_bgcolor="#fafafa",
    )
    return fig


def _build_three_agg_figs(df_scope, label_prefix, all_abbrevs,
                           div_id_prefix, abbrev_to_policy_flag,
                           abbrev_to_policy_year):
    policy_abbrevs    = [a for a in all_abbrevs if abbrev_to_policy_flag.get(a, 0) == 1]
    nonpolicy_abbrevs = [a for a in all_abbrevs if abbrev_to_policy_flag.get(a, 0) == 0]

    n_all = df_scope["JCR_Abbrev"].nunique()
    n_pol = df_scope[df_scope["policy"] == 1]["JCR_Abbrev"].nunique()
    n_npo = df_scope[df_scope["policy"] == 0]["JCR_Abbrev"].nunique()
    tot_all = int(df_scope["EligibleArticles"].sum())
    tot_pol = int(df_scope[df_scope["policy"] == 1]["EligibleArticles"].sum())
    tot_npo = int(df_scope[df_scope["policy"] == 0]["EligibleArticles"].sum())

    specs = [
        (df_scope,
         f"{label_prefix} — All journals",
         all_abbrevs, f"{div_id_prefix}_all", "all"),
        (df_scope[df_scope["policy"] == 1],
         f"{label_prefix} — Policy journals",
         policy_abbrevs, f"{div_id_prefix}_pol", "1"),
        (df_scope[df_scope["policy"] == 0],
         f"{label_prefix} — Non-Policy journals",
         nonpolicy_abbrevs, f"{div_id_prefix}_npo", "0"),
    ]

    cards = []
    for df_sub, title, abbrevs_vlines, did, policy_attr in specs:
        fig  = _build_agg_fig(df_sub, title, abbrevs_vlines, abbrev_to_policy_year)
        html = _fig_to_div(fig, did)
        cards.append(
            f'<div class="plot-card agg-card" data-agg-policy="{policy_attr}">'
            f'<div class="drag-handle" title="Drag to reorder">⠿</div>'
            f"{html}</div>"
        )
    return "\n".join(cards)


def _build_journal_fig(abbrev, df_raw, abbrev_to_policy_year,
                       abbrev_to_journal_name):
    df_j         = df_raw[df_raw["JCR_Abbrev"] == abbrev].copy()
    journal_name = abbrev_to_journal_name.get(abbrev, abbrev)
    py           = abbrev_to_policy_year.get(abbrev)
    py_str       = str(py) if py is not None else "N/A"
    total_eligible = int(df_j["EligibleArticles"].sum())
    total_articles = int(df_j["TotalArticles"].sum())
    pct_eligible_overall = (total_eligible / total_articles * 100) if total_articles > 0 else 0

    agg_dict = {m: "mean" for m in METRICS}
    agg_dict["EligibleArticles"] = "sum"
    agg_dict["TotalArticles"] = "sum"
    agg = df_j.groupby("year", as_index=False).agg(agg_dict)

    # Footer: article counts + % eligible
    footer_text = (
        f"n\u202f=\u202f{total_eligible:,} eligible articles; "
        f"{pct_eligible_overall:.1f}% of total"
        + (f" | Policy: {py}" if py is not None else "")
    )

    fig = go.Figure()
    if py is not None:
        fig.add_trace(go.Scatter(
            x=[py, py], y=[0, 120], mode="lines",
            line=dict(color=COLOR_POLICY, width=5),
            legendgroup="policy_vlines", name="Policy adoption", showlegend=True,
            hovertemplate=f"Policy year: {py}<extra></extra>",
        ))
    for col, info in METRICS.items():
        customdata = list(zip(
            agg["EligibleArticles"].astype(int),
            agg["TotalArticles"].astype(int),
        ))
        fig.add_trace(go.Scatter(
            x=agg["year"], y=agg[col],
            name=info["label"], mode="lines+markers",
            line=dict(color=info["color"], width=2), marker=dict(size=5),
            customdata=customdata,
            hovertemplate=(
                f"<b>{journal_name}</b><br>JCR: {abbrev}<br>"
                "Year: %{x}<br>"
                f"{info['label']}: %{{y:.1f}}%<br>"
                "Eligible articles: %{customdata[0]:,}<br>"
                "Total articles: %{customdata[1]:,}<br>"
                f"Policy Year: {py_str}<extra></extra>"
            ),
        ))

    _apply_axes(fig, footer_text=footer_text)
    fig.update_layout(
        autosize=True,
        # Title: journal name only
        title=dict(
            text=journal_name,
            font=dict(size=13), x=0.5, xanchor="center",
            xref="paper", pad=dict(b=0)),
        legend=dict(
            x=0.01, y=0.99, xanchor="left", yanchor="top",
            bgcolor="rgba(255,255,255,0.8)", font=dict(size=9),
            tracegroupgap=0, itemsizing="constant", itemwidth=30,
            entrywidthmode="fraction", entrywidth=0.48,
        ),
        margin=dict(l=55, r=20, t=36, b=FOOTER_MARGIN_B),
        paper_bgcolor="white", plot_bgcolor="#fafafa",
    )
    return fig


def _build_field_journal_divs(field, df_raw, abbrev_to_policy_year,
                               abbrev_to_journal_name, abbrev_to_policy_flag):
    mask    = df_raw["All_Fields"].fillna("").str.contains(field, regex=False)
    abbrevs = sorted(df_raw.loc[mask, "JCR_Abbrev"].dropna().unique().tolist())
    result  = []
    for abbrev in abbrevs:
        if df_raw[df_raw["JCR_Abbrev"] == abbrev].empty:
            continue
        fig    = _build_journal_fig(abbrev, df_raw, abbrev_to_policy_year,
                                    abbrev_to_journal_name)
        div_id = f"jplot_{_safe_id(field)}_{_safe_id(abbrev)}"
        jname  = abbrev_to_journal_name.get(abbrev, abbrev)
        pflag  = abbrev_to_policy_flag.get(abbrev, 0)
        result.append((div_id, jname, pflag, _fig_to_div(fig, div_id)))
    return result


# ── About panel (unchanged) ───────────────────────────────────────────────────
def _build_about_panel(about_agg_all_div, about_agg_pol_div, about_agg_npo_div,
                        field_list, default_agg_cols=3):
    fields_html = "".join(
        f'<li style="margin-bottom:3px;">{f}</li>' for f in sorted(field_list)
    )
    metric_swatches = "".join(
        f'''<div style="display:flex;align-items:flex-start;gap:14px;
                        background:#fff;border:1px solid #dee2e6;border-radius:6px;
                        padding:14px 16px;margin-bottom:8px;">
              <div style="flex-shrink:0;width:28px;height:4px;background:{info['color']};
                          border-radius:2px;margin-top:10px;"></div>
              <div>
                <p style="font-size:0.93rem;font-weight:600;color:{info['color']};margin:0 0 3px;">
                  {info['label']}</p>
                <p style="font-size:0.88rem;color:#495057;line-height:1.6;margin:0;">
                  Percentage of eligible papers (papers containing bar or informative graphs) in that year using this visualisation type
                  for continuous data, as detected by the barzooka screening tool.
                </p>
              </div>
            </div>'''
        for info in METRICS.values()
    )
    return f"""
<div id="panel-about" class="tab-panel active">
  <div class="collapsible-section">
    <button class="collapsible-toggle active" onclick="toggleSection(this)">
      <span class="collapsible-icon">▾</span>Global Aggregated Trend
    </button>
    <div class="collapsible-body">
      <div class="col-control">
        <label>Columns:</label>
        <input type="range" min="1" max="3" value="{default_agg_cols}" step="1"
               oninput="setGrid('aggrid-about',this.value,'agglbl-about')" />
        <span id="agglbl-about" class="col-label">{default_agg_cols}</span>
      </div>
      <div class="plot-grid agg-grid" id="aggrid-about"
           style="grid-template-columns:repeat({default_agg_cols},1fr);margin-bottom:8px;">
        <div class="plot-card agg-card" data-agg-policy="all">
          <div class="drag-handle" title="Drag to reorder">⠿</div>
          {about_agg_all_div}
        </div>
        <div class="plot-card agg-card" data-agg-policy="1">
          <div class="drag-handle" title="Drag to reorder">⠿</div>
          {about_agg_pol_div}
        </div>
        <div class="plot-card agg-card" data-agg-policy="0">
          <div class="drag-handle" title="Drag to reorder">⠿</div>
          {about_agg_npo_div}
        </div>
      </div>
    </div>
  </div>
  <div style="max-width:820px;margin:0 auto;padding:0 0 48px;">
    <div class="collapsible-section">
      <button class="collapsible-toggle active" onclick="toggleSection(this)">
        <span class="collapsible-icon">▾</span>About this Dashboard
      </button>
      <div class="collapsible-body">
        <p style="margin-bottom:1.1em;line-height:1.7;font-size:1rem;">
          This dashboard tracks how data-visualisation practices in scientific publishing
          have evolved over time, focusing on the use of bar charts versus more informative
          alternatives. Visualisation types are classified by <strong>barzooka</strong>, an
          automated deep-learning tool that screens PDF figures.
        </p>
        <ul style="margin:0 0 1.1em 1.6em;font-size:0.97rem;color:#495057;line-height:1.9;">
          <li><strong>Bar charts</strong> — the conventional mean-and-error bar format</li>
          <li><strong>Informative charts</strong> — bars with dots, box plots, dot plots,
              histograms, or violin plots</li>
        </ul>
        <div style="text-align:center;margin:0 0 1.4em;">
          <img src="https://raw.githubusercontent.com/teresacoliveira/journal-observatory-2/master/bz_graphs_for_continuous_data.png"
               alt="Examples of bar charts and informative chart alternatives classified by barzooka"
               style="max-width:100%;height:auto;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.10);" />
        </div>
        <p style="margin-bottom:1.4em;line-height:1.7;font-size:1rem;">
          Data are organised across <strong>{len(field_list)} Research Fields</strong>:
        </p>
        <ul style="margin:0 0 1.6em 1.4em;font-size:0.93rem;color:#495057;line-height:1.8;">
          {fields_html}
        </ul>
      </div>
    </div>
    <div class="collapsible-section">
      <button class="collapsible-toggle active" onclick="toggleSection(this)">
        <span class="collapsible-icon">▾</span>Why Journal Policy Matters
      </button>
      <div class="collapsible-body">
        <p style="margin-bottom:1em;line-height:1.7;font-size:1rem;">
          Bar charts that reduce continuous data to a mean and error bar are widely
          criticised for concealing distributional features. A growing number of journals
          have introduced <strong>editorial policies</strong> that encourage or require
          more informative alternatives, creating natural quasi-experiments. The
          pre-registered study protocol is at
          <a href="https://osf.io/tcyxg/overview" target="_blank"
             style="color:#2c3e50;font-weight:600;">osf.io/tcyxg</a>.
        </p>
      </div>
    </div>
    <div class="collapsible-section">
      <button class="collapsible-toggle active" onclick="toggleSection(this)">
        <span class="collapsible-icon">▾</span>What the Metrics Mean
      </button>
      <div class="collapsible-body">
        {metric_swatches}
      </div>
    </div>
    <div class="collapsible-section">
      <button class="collapsible-toggle" onclick="toggleSection(this)">
        <span class="collapsible-icon">▸</span>How to Use This Dashboard
      </button>
      <div class="collapsible-body" style="display:none;">
        <p style="font-size:0.88rem;color:#6c757d;margin:0 0 14px;line-height:1.6;">
          A quick reference for every interactive control in the dashboard.
        </p>
        <div class="guide-grid">

          <div class="guide-card">
            <div class="guide-card-header">
              <div class="guide-icon">☰</div>
              <p class="guide-card-title">Sidebar navigation</p>
            </div>
            <p class="guide-card-body">
              Click any link in the left sidebar to switch between panels.
              <ul>
                <li><span class="ui-chip">ℹ About</span> — study background, metrics, and this guide</li>
                <li><span class="ui-chip">All Research Fields</span> — global overview and one aggregated chart per field</li>
                <li><span class="ui-chip">&lt;Field name&gt;</span> — aggregated field trend plus individual journal charts</li>
              </ul>
            </p>
          </div>

          <div class="guide-card">
            <div class="guide-card-header">
              <div class="guide-icon">👁</div>
              <p class="guide-card-title">Show / hide all (top bar)</p>
            </div>
            <p class="guide-card-body">
              The toggle buttons in the top toolbar hide or reveal a metric across
              <em>every</em> chart on the page at once. A strikethrough means the
              metric is currently hidden. Tap again to restore it.
              <ul>
                <li><span class="swatch-inline" style="background:#c0392b;"></span>
                    <strong>% only bar</strong> — articles with bar charts only</li>
                <li><span class="swatch-inline" style="background:#e8998d;"></span>
                    <strong>% bar and informative</strong> — both types present</li>
                <li><span class="swatch-inline" style="background:#76b5b2;"></span>
                    <strong>% only informative</strong> — informative charts only</li>
                <li><span class="swatch-inline" style="background:rgba(253,231,37,0.8);border:1px solid #b8a000;"></span>
                    <strong>Policy adoption</strong> — vertical policy-year marker</li>
              </ul>
            </p>
          </div>

          <div class="guide-card">
            <div class="guide-card-header">
              <div class="guide-icon">⊞</div>
              <p class="guide-card-title">Show charts (top bar)</p>
            </div>
            <p class="guide-card-body">
              The <span class="ui-chip">Show charts</span> dropdown in the top bar
              filters the aggregated chart cards across the active tab:
              <ul>
                <li><strong>All</strong> — shows All journals, Policy, and Non-Policy cards</li>
                <li><strong>Policy journals only</strong> — hides the Non-Policy card</li>
                <li><strong>Non-Policy journals only</strong> — hides the Policy card</li>
              </ul>
              The selection applies to the currently visible tab; switching tabs
              re-applies the same filter automatically.
            </p>
          </div>

          <div class="guide-card">
            <div class="guide-card-header">
              <div class="guide-icon">⇔</div>
              <p class="guide-card-title">Columns slider</p>
            </div>
            <p class="guide-card-body">
              Each panel has one or two <span class="ui-chip">Columns</span> sliders
              that adjust the number of grid columns:
              <ul>
                <li><strong>1–3 columns</strong> — for aggregated trend cards
                    (All / Policy / Non-Policy)</li>
                <li><strong>1–6 columns</strong> — for individual journal cards</li>
              </ul>
              Titles and x-axis tick spacing adapt automatically as cards narrow.
              In multi-column grids, all y-axes are aligned to the same height.
            </p>
          </div>

          <div class="guide-card">
            <div class="guide-card-header">
              <div class="guide-icon">🔍</div>
              <p class="guide-card-title">Find journal</p>
            </div>
            <p class="guide-card-body">
              Type in the <span class="ui-chip">Find journal</span> box on any
              field tab to filter journal cards:
              <ul>
                <li>Matching cards remain fully visible; others are dimmed.</li>
                <li>Select a name from the autocomplete list (or press
                    <span class="kbd">Enter</span>) to scroll directly to that card
                    and briefly highlight its border.</li>
                <li>Click <span class="kbd">✕</span> to clear the search and
                    restore all cards.</li>
              </ul>
            </p>
          </div>

          <div class="guide-card">
            <div class="guide-card-header">
              <div class="guide-icon">⚙</div>
              <p class="guide-card-title">Show journals filter</p>
            </div>
            <p class="guide-card-body">
              The <span class="ui-chip">Show journals</span> dropdown on each field
              tab filters the journal card grid by policy status:
              <ul>
                <li><strong>All</strong> — every journal in the field</li>
                <li><strong>Policy only</strong> — journals with an editorial
                    visualisation policy</li>
                <li><strong>Non-Policy only</strong> — journals without such a policy</li>
              </ul>
              The search box and policy filter work together — both are applied
              simultaneously.
            </p>
          </div>

          <div class="guide-card">
            <div class="guide-card-header">
              <div class="guide-icon">⠿</div>
              <p class="guide-card-title">Drag-and-drop reordering</p>
            </div>
            <p class="guide-card-body">
              Grab any chart card by the dotted vertical bar on its left edge
              and drag it to a new position within the same grid. This lets you
              place journals side by side for direct comparison. The order resets
              when you navigate away from the tab.
            </p>
          </div>

          <div class="guide-card">
            <div class="guide-card-header">
              <div class="guide-icon">📊</div>
              <p class="guide-card-title">Chart interaction (Plotly)</p>
            </div>
            <p class="guide-card-body">
              All charts are interactive:
              <ul>
                <li><strong>Hover</strong> over a data point — see year, value,
                    eligible and total article counts, and policy year (journal charts).</li>
                <li><strong>Click</strong> a legend item — hide/show that line on
                    that chart only.</li>
                <li><strong>Double-click</strong> a legend item — isolate it
                    (hide all others); double-click again to restore.</li>
                <li><strong>Box-select or lasso</strong> a chart area to zoom in;
                    <strong>double-click</strong> the plot to reset zoom.</li>
                <li><strong>Hover over a yellow band</strong> on aggregated charts —
                    see the policy year and the share of journals that adopted it
                    that year.</li>
              </ul>
            </p>
          </div>

          <div class="guide-card">
            <div class="guide-card-header">
              <div class="guide-icon">▾</div>
              <p class="guide-card-title">Collapsible sections</p>
            </div>
            <p class="guide-card-body">
              Click any section header (marked <span class="kbd">▾</span> or
              <span class="kbd">▸</span>) to collapse or expand its content. All
              sections on the About tab start expanded. Sections within field tabs
              are always open.
            </p>
          </div>

        </div>
      </div>
    </div>
    <div class="collapsible-section">
      <button class="collapsible-toggle" onclick="toggleSection(this)">
        <span class="collapsible-icon">▸</span>References &amp; Bibliography
      </button>
      <div class="collapsible-body" style="display:none;">
        <ol style="margin:0 0 1.4em 1.6em;font-size:0.88rem;color:#495057;line-height:1.9;">
          <li>Weissgerber et al. (2015). Beyond bar and line graphs. PLOS Biology, 13(4), e1002128.</li>
          <li>Weissgerber et al. (2019). From static to interactive. PLOS Biology, 17(1), e1002484.</li>
          <li>Weissgerber et al. (2019). Reveal, don&#39;t conceal. Circulation, 140(18), 1506–1518.</li>
          <li>Riedel et al. (2022). Replacing bar graphs. Clinical Science, 136(15), 1139–1156.</li>
          <li>Riedel, Nachev, Schulz, Kazezian, Weissgerber. Barzooka.
              <a href="https://github.com/quest-bih/barzooka" target="_blank"
                 style="color:#2c3e50;">GitHub</a></li>
          <li>Schulz et al. (2025). Do journal policies reduce the use of bar graphs for visualizing continuous data? An observational study.: <a href="https://osf.io/tcyxg/overview" target="_blank"
              style="color:#2c3e50;">osf.io/tcyxg/overview</a></li>
        </ol>
      </div>
    </div>
  </div>
</div>"""


# ── Full dashboard builder ────────────────────────────────────────────────────
def generate_dashboard_html(csv_path: str,
                             default_cols=DEFAULT_COLS,
                             default_agg_cols=DEFAULT_AGG_COLS) -> str:

    df_raw = load_data(csv_path)

    field_list = sorted(df_raw["Field"].dropna().unique().tolist())

    policy_rows          = df_raw[df_raw["policy"] == 1][["JCR_Abbrev", "policy_year"]].dropna()
    abbrev_to_policy_year = (policy_rows.drop_duplicates("JCR_Abbrev")
                             .set_index("JCR_Abbrev")["policy_year"].astype(int).to_dict())
    abbrev_to_journal_name = (df_raw[["JCR_Abbrev", "journal_name"]]
                              .drop_duplicates("JCR_Abbrev")
                              .set_index("JCR_Abbrev")["journal_name"].to_dict())
    abbrev_to_policy_flag  = (df_raw[["JCR_Abbrev", "policy"]].dropna()
                              .groupby("JCR_Abbrev")["policy"]
                              .agg(lambda s: int(s.mode().iloc[0])).to_dict())

    def journals_for_field(field):
        mask = df_raw["All_Fields"].fillna("").str.contains(field, regex=False)
        return sorted(df_raw.loc[mask, "JCR_Abbrev"].dropna().unique().tolist())

    print("  Building global aggregated figure…")
    all_abbrevs     = df_raw["JCR_Abbrev"].dropna().unique().tolist()
    policy_abbrevs  = [a for a in all_abbrevs if abbrev_to_policy_flag.get(a, 0) == 1]
    npo_abbrevs     = [a for a in all_abbrevs if abbrev_to_policy_flag.get(a, 0) == 0]

    n_all   = df_raw["JCR_Abbrev"].nunique()
    n_pol   = df_raw[df_raw["policy"] == 1]["JCR_Abbrev"].nunique()
    n_npo   = df_raw[df_raw["policy"] == 0]["JCR_Abbrev"].nunique()
    tot_all = int(df_raw["EligibleArticles"].sum())
    tot_pol = int(df_raw[df_raw["policy"] == 1]["EligibleArticles"].sum())
    tot_npo = int(df_raw[df_raw["policy"] == 0]["EligibleArticles"].sum())

    tot_total_all = int(df_raw["TotalArticles"].sum())
    tot_total_pol = int(df_raw[df_raw["policy"] == 1]["TotalArticles"].sum())
    tot_total_npo = int(df_raw[df_raw["policy"] == 0]["TotalArticles"].sum())

    about_agg_all_div = _fig_to_div(
        _build_agg_fig(df_raw,
                       "Global — All journals",
                       all_abbrevs, abbrev_to_policy_year),
        "plot_about_agg_all")
    about_agg_pol_div = _fig_to_div(
        _build_agg_fig(df_raw[df_raw["policy"] == 1],
                       "Global — Policy journals",
                       policy_abbrevs, abbrev_to_policy_year),
        "plot_about_agg_pol")
    about_agg_npo_div = _fig_to_div(
        _build_agg_fig(df_raw[df_raw["policy"] == 0],
                       "Global — Non-Policy journals",
                       npo_abbrevs, abbrev_to_policy_year),
        "plot_about_agg_npo")

    global_agg_json = _build_agg_fig(
        df_raw,
        "Global Aggregated Trend — All journals",
        all_abbrevs, abbrev_to_policy_year).to_json()

    def _inline_div(json_str, div_id):
        return (f'<div id="{div_id}" style="width:100%;height:100%;"></div>\n'
                f"<script>(function(){{ var spec={json_str}; "
                f'Plotly.newPlot("{div_id}",spec.data,spec.layout,'
                f"{{responsive:true,displayModeBar:false}}); }})();</script>")

    about_agg_pol_div_global = _fig_to_div(
        _build_agg_fig(df_raw[df_raw["policy"] == 1],
                       "Global — Policy journals",
                       policy_abbrevs, abbrev_to_policy_year),
        "plot_global_agg_pol")
    about_agg_npo_div_global = _fig_to_div(
        _build_agg_fig(df_raw[df_raw["policy"] == 0],
                       "Global — Non-Policy journals",
                       npo_abbrevs, abbrev_to_policy_year),
        "plot_global_agg_npo")
    global_agg_global = _inline_div(global_agg_json, "plot_global_agg_global")

    print("  Building global 3-chart aggregated grids per field…")
    global_field_cards_html = ""
    for field in field_list:
        abbrevs  = journals_for_field(field)
        df_scope = df_raw[df_raw["JCR_Abbrev"].isin(abbrevs)].copy()
        prefix   = _safe_id(field)
        global_field_cards_html += _build_three_agg_figs(
            df_scope, field, abbrevs, f"plot_gfagg_{prefix}",
            abbrev_to_policy_flag, abbrev_to_policy_year) + "\n"

    print("  Building per-field panels…")
    field_panels_html = []
    for field in field_list:
        print(f"    [{field}]")
        fid      = _safe_id(field)
        abbrevs  = journals_for_field(field)
        df_scope = df_raw[df_raw["JCR_Abbrev"].isin(abbrevs)].copy()

        field_agg_cards = _build_three_agg_figs(
            df_scope, field, abbrevs, f"plot_fagg_{fid}",
            abbrev_to_policy_flag, abbrev_to_policy_year)

        journal_items = _build_field_journal_divs(
            field, df_raw, abbrev_to_policy_year,
            abbrev_to_journal_name, abbrev_to_policy_flag)

        datalist_opts = "\n".join(
            f'    <option value="{jname.replace(chr(34), chr(39))}"></option>'
            for _, jname, _, _ in sorted(journal_items, key=lambda t: t[1])
        )
        journal_cards = "\n".join(
            f'<div class="plot-card" '
            f'data-journal-name="{jname.replace(chr(34), "&quot;")}" '
            f'data-policy="{pflag}">'
            f'<div class="drag-handle" title="Drag to reorder">⠿</div>'
            f"{html}</div>"
            for _, jname, pflag, html in journal_items
        ) or "<p>No journal data available.</p>"

        search_bar = f"""
    <div class="journal-search-bar">
      <label for="inp-{fid}">Find journal:</label>
      <div class="journal-search-wrap">
        <input id="inp-{fid}" type="text" list="dl-{fid}"
               placeholder="Type to search…"
               oninput="filterJournalCard(this.value,'grid-{fid}')"
               onchange="scrollToJournalCard(this.value,'grid-{fid}')"
               autocomplete="off" />
        <button class="search-clear-btn"
                onclick="clearJournalSearch('inp-{fid}','grid-{fid}','sel-{fid}')"
                title="Clear search">✕</button>
      </div>
      <datalist id="dl-{fid}">{datalist_opts}</datalist>
    </div>
    <div class="policy-filter-bar">
      <label for="sel-{fid}">Show journals:</label>
      <select id="sel-{fid}" class="policy-select"
              onchange="filterPolicyCards(this.value,'grid-{fid}','inp-{fid}')">
        <option value="all">All</option>
        <option value="1">Policy only</option>
        <option value="0">Non-Policy only</option>
      </select>
    </div>""" if journal_items else ""

        field_panels_html.append(f"""
<div id="panel-{fid}" class="tab-panel">
  <h2 class="section-title">Aggregated Trends — {field}</h2>
  <div class="col-control">
    <label>Columns:</label>
    <input type="range" min="1" max="3" value="{default_agg_cols}" step="1"
           oninput="setGrid('aggrid-{fid}',this.value,'agglbl-{fid}')" />
    <span id="agglbl-{fid}" class="col-label">{default_agg_cols}</span>
  </div>
  <div class="plot-grid agg-grid" id="aggrid-{fid}"
       style="grid-template-columns:repeat({default_agg_cols},1fr);">
    {field_agg_cards}
  </div>
  <h2 class="section-title">Individual Journal Trends — {field}</h2>
  <div class="facet-toolbar">
    <div class="col-control">
      <label>Columns:</label>
      <input type="range" min="1" max="6" value="{default_cols}" step="1"
             oninput="setGrid('grid-{fid}',this.value,'lbl-{fid}')" />
      <span id="lbl-{fid}" class="col-label">{default_cols}</span>
    </div>
    {search_bar}
  </div>
  <div class="plot-grid" id="grid-{fid}"
       style="grid-template-columns:repeat({default_cols},1fr);">
    {journal_cards}
  </div>
</div>""")

    nav_fields = "\n".join(
        f'<a class="nav-link" href="#" data-panel="panel-{_safe_id(f)}" '
        f'onclick="return showPanel(this)">{f}</a>'
        for f in field_list
    )

    global_panel = f"""
<div id="panel-global" class="tab-panel">
  <h2 class="section-title">Global Aggregated Trend</h2>
  <div class="col-control">
    <label>Columns:</label>
    <input type="range" min="1" max="3" value="{default_agg_cols}" step="1"
           oninput="setGrid('aggrid-global-top',this.value,'agglbl-global-top')" />
    <span id="agglbl-global-top" class="col-label">{default_agg_cols}</span>
  </div>
  <div class="plot-grid agg-grid" id="aggrid-global-top"
       style="grid-template-columns:repeat({default_agg_cols},1fr);margin-bottom:12px;">
    <div class="plot-card agg-card" data-agg-policy="all">
      <div class="drag-handle" title="Drag to reorder">⠿</div>
      {global_agg_global}
    </div>
    <div class="plot-card agg-card" data-agg-policy="1">
      <div class="drag-handle" title="Drag to reorder">⠿</div>
      {about_agg_pol_div_global}
    </div>
    <div class="plot-card agg-card" data-agg-policy="0">
      <div class="drag-handle" title="Drag to reorder">⠿</div>
      {about_agg_npo_div_global}
    </div>
  </div>
  <h2 class="section-title">Aggregated Trends by Research Field</h2>
  <div class="col-control">
    <label>Columns:</label>
    <input type="range" min="1" max="3" value="{default_agg_cols}" step="1"
           oninput="setGrid('aggrid-global',this.value,'agglbl-global')" />
    <span id="agglbl-global" class="col-label">{default_agg_cols}</span>
  </div>
  <div class="plot-grid agg-grid" id="aggrid-global"
       style="grid-template-columns:repeat({default_agg_cols},1fr);">
    {global_field_cards_html}
  </div>
</div>"""

    about_panel = _build_about_panel(
        about_agg_all_div, about_agg_pol_div, about_agg_npo_div,
        field_list, default_agg_cols)

    gtoggle_buttons = "\n".join(
        f'  <button class="gtoggle-btn" id="gtoggle-{_safe_id(info["label"])}" '
        f'onclick="globalToggle(\'gtoggle-{_safe_id(info["label"])}\',\'{info["label"]}\')">'
        f'<span class="gtoggle-swatch" style="background:{info["color"]};"></span>'
        f'{info["label"]}</button>'
        for info in METRICS.values()
    )
    gtoggle_buttons += (
        '\n  <button class="gtoggle-btn" id="gtoggle-policy" '
        'onclick="globalToggle(\'gtoggle-policy\',\'policy_vlines\')">'
        '<span class="gtoggle-swatch" style="background:rgba(253,231,37,0.7);'
        'border:1px solid #b8a000;"></span>Policy adoption</button>'
    )
    all_field_panels = "\n".join(field_panels_html)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tracking the Shift from Bar Graphs to Informative Plots in Biomedical Journals</title>
  <!-- Open Graph / social preview tags -->
  <meta property="og:title" content="Tracking the Shift from Bar Graphs to Informative Plots in Biomedical Journals" />
  <meta property="og:description" content="Interactive dashboard tracking data-visualisation practices across 213 biomedical journals from 2010 to 2025." />
  <meta property="og:type" content="website" />
  <!-- Preconnect to CDN so the Plotly script download starts immediately -->
  <link rel="preconnect" href="https://cdn.plot.ly" />
  <!-- Plotly loaded with a version-pinned URL so browsers can cache it indefinitely.
       crossorigin="anonymous" enables the browser to reuse a cached copy across origins. -->
  <script src="https://cdn.plot.ly/plotly-2.35.2.min.js" crossorigin="anonymous"></script>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: 'Segoe UI', system-ui, sans-serif; background: #f8f9fa; color: #212529;
            display: flex; flex-direction: column; height: 100vh; overflow: hidden; }}
    header {{ background: #2c3e50; color: #fff; padding: 14px 24px 10px; flex-shrink: 0; }}
    header h1 {{ font-size: 1.5rem; font-weight: 700; line-height: 1.2; }}
    header p  {{ font-size: 0.95rem; opacity: 0.8; margin-top: 3px; }}
    .body-row {{ display: flex; flex: 1; overflow: hidden; }}
    nav.sidebar {{ width: 230px; min-width: 160px; background: #fff;
                   border-right: 1px solid #dee2e6; padding: 14px 8px;
                   overflow-y: auto; flex-shrink: 0; }}
    .sidebar-heading {{ font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.09em;
                        color: #adb5bd; padding: 0 8px 8px; }}
    .nav-link {{ display: block; padding: 7px 12px; margin-bottom: 2px; border-radius: 5px;
                 color: #495057; text-decoration: none; font-size: 0.82rem; cursor: pointer;
                 transition: background 0.15s, color 0.15s; }}
    .nav-link:hover  {{ background: #e9ecef; color: #212529; }}
    .nav-link.active {{ background: #2c3e50; color: #fff; font-weight: 600; }}
    .global-toggle-bar {{ display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
                           padding: 7px 24px; background: #f1f3f5;
                           border-bottom: 1px solid #dee2e6;
                           font-size: 0.8rem; color: #495057; flex-shrink: 0; }}
    .global-toggle-bar > span {{ font-weight: 600; color: #2c3e50; margin-right: 4px; }}
    .gtoggle-btn {{ display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px;
                    border-radius: 14px; border: 1px solid #ced4da; background: #fff;
                    cursor: pointer; font-size: 0.78rem; color: #495057;
                    transition: background 0.15s, color 0.15s, border-color 0.15s;
                    user-select: none; }}
    .gtoggle-btn:hover {{ background: #e9ecef; }}
    .gtoggle-btn.hidden {{ background: #dee2e6; color: #6c757d; border-color: #adb5bd;
                           text-decoration: line-through; }}
    .gtoggle-swatch {{ width: 14px; height: 4px; border-radius: 2px; flex-shrink: 0; }}
    .policy-chart-filter {{ display: inline-flex; align-items: center; gap: 6px;
                             margin-left: 12px; padding-left: 12px;
                             border-left: 1px solid #ced4da; }}
    .policy-chart-filter label {{ font-weight: 600; color: #2c3e50; white-space: nowrap;
                                   font-size: 0.8rem; }}
    .policy-chart-filter select {{ padding: 3px 22px 3px 8px; border: 1px solid #ced4da;
                                    border-radius: 14px; font-size: 0.78rem; color: #495057;
                                    background: #fff; outline: none; cursor: pointer;
                                    appearance: none; }}
    main {{ flex: 1; overflow-y: auto; padding: 20px 24px; }}
    .tab-panel        {{ display: none; }}
    .tab-panel.active {{ display: block; }}
    .section-title {{ font-size: 1.05rem; font-weight: 600; color: #2c3e50;
                      margin: 22px 0 8px; padding-bottom: 5px;
                      border-bottom: 2px solid #dee2e6; }}
    .section-title:first-child {{ margin-top: 0; }}
    .collapsible-section {{ margin-bottom: 14px; }}
    .collapsible-toggle {{ width: 100%; text-align: left; background: none; border: none;
                           border-bottom: 2px solid #dee2e6; padding: 10px 4px 7px;
                           font-size: 1.05rem; font-weight: 600; color: #2c3e50;
                           cursor: pointer; display: flex; align-items: center; gap: 8px;
                           transition: color 0.15s; margin-top: 18px; }}
    .collapsible-toggle:first-child {{ margin-top: 0; }}
    .collapsible-toggle:hover {{ color: #1a252f; }}
    .collapsible-icon {{ font-size: 0.85em; display: inline-block; min-width: 12px;
                         transition: transform 0.18s; }}
    .collapsible-body {{ padding: 14px 4px 6px; }}
    .facet-toolbar {{ display: flex; align-items: center; flex-wrap: wrap;
                      gap: 16px; margin: 10px 0 10px; }}
    .journal-search-bar {{ display: flex; align-items: center; gap: 8px;
                           font-size: 0.85rem; color: #495057; }}
    .journal-search-wrap {{ position: relative; display: flex; align-items: center; }}
    .journal-search-bar input[type=text] {{ width: 240px; padding: 5px 28px 5px 10px;
                                            border: 1px solid #ced4da; border-radius: 5px;
                                            font-size: 0.85rem; color: #212529;
                                            background: #fff; outline: none; }}
    .search-clear-btn {{ position: absolute; right: 6px; background: none; border: none;
                         cursor: pointer; font-size: 0.75rem; color: #adb5bd;
                         padding: 0 2px; line-height: 1; }}
    .policy-filter-bar {{ display: flex; align-items: center; gap: 8px;
                          font-size: 0.85rem; color: #495057; }}
    .policy-select {{ padding: 5px 28px 5px 10px; border: 1px solid #ced4da;
                      border-radius: 5px; font-size: 0.85rem; color: #212529;
                      background: #fff; outline: none; cursor: pointer; appearance: none; }}
    @keyframes card-flash {{
      0%   {{ box-shadow: 0 0 0 3px #2c3e50, 0 0 18px 4px rgba(44,62,80,0.35); }}
      60%  {{ box-shadow: 0 0 0 3px #2c3e50, 0 0 18px 4px rgba(44,62,80,0.35); }}
      100% {{ box-shadow: none; }}
    }}
    .plot-card.highlighted {{ animation: card-flash 1.6s ease forwards;
                               border-color: #2c3e50 !important; }}
    .plot-card.dimmed   {{ opacity: 0.25; transition: opacity 0.2s; }}
    .plot-card.filtered {{ display: none; }}
    .col-control {{ display: flex; align-items: center; gap: 10px;
                    margin: 10px 0 8px; font-size: 0.85rem; color: #495057; }}
    .col-control input[type=range] {{ width: 130px; accent-color: #2c3e50; }}
    .col-label {{ font-weight: 700; color: #2c3e50; min-width: 1.5ch; }}
    .plot-grid {{ display: grid; gap: 12px; margin-bottom: 20px; }}
    .agg-card {{ height: 380px; }}
    .plot-card {{ display: flex; flex-direction: row; background: #fff;
                  border: 1px solid #dee2e6; border-radius: 6px;
                  overflow: hidden; min-width: 0; height: 420px; }}
    .drag-handle {{ flex-shrink: 0; width: 14px; display: flex; align-items: center;
                    justify-content: center; background: #f8f9fa;
                    border-right: 1px solid #dee2e6; color: #ced4da; font-size: 11px;
                    cursor: grab; user-select: none; writing-mode: vertical-rl;
                    letter-spacing: 2px; }}
    .drag-handle:hover  {{ background: #e9ecef; color: #6c757d; }}
    .drag-handle:active {{ cursor: grabbing; background: #dee2e6; }}
    .plot-card > div:not(.drag-handle) {{ flex: 1; min-width: 0; height: 100%; }}
    .plot-card > div:not(.drag-handle) > div {{ width: 100% !important; height: 100% !important; }}
    .plot-card.drag-over {{ border: 2px solid #2c3e50;
                            box-shadow: 0 0 0 3px rgba(44,62,80,0.18); }}
    @media (max-width: 680px) {{
      body {{ height: auto; overflow: auto; }}
      .body-row {{ flex-direction: column; overflow: visible; }}
      main {{ overflow: visible; }}
      nav.sidebar {{ width: 100%; border-right: none; border-bottom: 1px solid #dee2e6;
                     display: flex; flex-wrap: wrap; gap: 3px; padding: 8px; }}
      .sidebar-heading {{ display: none; }}
      .nav-link {{ padding: 5px 10px; font-size: 0.78rem; }}
    }}
    footer {{ flex-shrink: 0; background: #fff; border-top: 1px solid #dee2e6;
              font-size: 0.8rem; color: #6c757d; }}
    .footer-toggle {{ display: flex; align-items: center; gap: 8px; padding: 5px 16px;
                      cursor: pointer; user-select: none; background: none; border: none;
                      font-size: 0.78rem; color: #6c757d; width: 100%; text-align: left; }}
    .footer-body {{ padding: 8px 16px 10px; display: flex; align-items: center;
                    justify-content: center; }}
    .footer-body img {{ max-height: 48px; max-width: 100%; object-fit: contain; }}
    /* ── Interaction guide styles ─────────────────────────────────────────── */
    .guide-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 10px;
      margin-bottom: 6px;
    }}
    .guide-card {{
      background: #fff;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 14px 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }}
    .guide-card-header {{
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 2px;
    }}
    .guide-icon {{
      flex-shrink: 0;
      width: 32px; height: 32px;
      border-radius: 8px;
      background: #2c3e50;
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem;
    }}
    .guide-card-title {{
      font-size: 0.9rem;
      font-weight: 700;
      color: #2c3e50;
      margin: 0;
    }}
    .guide-card-body {{
      font-size: 0.84rem;
      color: #495057;
      line-height: 1.65;
      margin: 0;
    }}
    .guide-card-body ul {{
      margin: 4px 0 0 1.1em;
      padding: 0;
    }}
    .guide-card-body li {{
      margin-bottom: 2px;
    }}
    .kbd {{
      display: inline-block;
      padding: 1px 6px;
      font-size: 0.77rem;
      font-family: 'Consolas', 'SF Mono', monospace;
      color: #2c3e50;
      background: #f1f3f5;
      border: 1px solid #ced4da;
      border-bottom-width: 2px;
      border-radius: 4px;
      line-height: 1.5;
      white-space: nowrap;
    }}
    .ui-chip {{
      display: inline-block;
      padding: 1px 7px;
      font-size: 0.77rem;
      color: #2c3e50;
      background: #e9ecef;
      border: 1px solid #ced4da;
      border-radius: 10px;
      line-height: 1.6;
      white-space: nowrap;
      font-weight: 600;
    }}
    .swatch-inline {{
      display: inline-block;
      width: 20px; height: 4px;
      border-radius: 2px;
      vertical-align: middle;
      margin: 0 2px;
    }}
    /* Loading overlay — visible until all Plotly charts have been initialised */
    #loading-overlay {{
      position: fixed; inset: 0; z-index: 9999;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 18px;
      background: #f8f9fa;
      transition: opacity 0.4s ease;
    }}
    #loading-overlay.hidden {{ opacity: 0; pointer-events: none; }}
    .loading-spinner {{
      width: 44px; height: 44px; border-radius: 50%;
      border: 4px solid #dee2e6; border-top-color: #2c3e50;
      animation: spin 0.9s linear infinite;
    }}
    @keyframes spin {{ to {{ transform: rotate(360deg); }} }}
    .loading-text {{
      font-size: 0.95rem; color: #495057; font-family: 'Segoe UI', system-ui, sans-serif;
    }}
    .loading-sub {{
      font-size: 0.8rem; color: #adb5bd; font-family: 'Segoe UI', system-ui, sans-serif;
    }}
  </style>
</head>
<body>
<!-- Loading overlay — removed by JS once the first panel's charts are ready -->
<div id="loading-overlay">
  <div class="loading-spinner"></div>
  <div class="loading-text">Loading dashboard…</div>
  <div class="loading-sub">Initialising charts — this takes a few seconds on first load</div>
</div>
<header>
  <h1>Tracking the Shift from Bar Graphs to Informative Plots in Biomedical Journals</h1>
  <p>Impact of Journal Policies on the Visualization of Continuous Data</p>
</header>
<div class="global-toggle-bar">
  <span>Show/hide all:</span>
{gtoggle_buttons}
  <div class="policy-chart-filter">
    <label for="global-chart-policy-sel">Show charts:</label>
    <select id="global-chart-policy-sel" onchange="filterAggCardsByPolicy(this.value)">
      <option value="all">All (Policy + Non-Policy)</option>
      <option value="1">Policy journals only</option>
      <option value="0">Non-Policy journals only</option>
    </select>
  </div>
</div>
<div class="body-row">
  <nav class="sidebar">
    <a class="nav-link nav-link-about active" href="#" data-panel="panel-about"
       onclick="return showPanel(this)">ℹ About</a>
    <div class="sidebar-heading">Research Fields</div>
    <a class="nav-link" href="#" data-panel="panel-global"
       onclick="return showPanel(this)">All Research Fields</a>
    {nav_fields}
  </nav>
  <main id="main-content">
    {about_panel}
    {global_panel}
    {all_field_panels}
  </main>
</div>
<footer>
  <button class="footer-toggle" onclick="toggleFooter(this)">
    <span class="footer-icon" id="footer-icon">▾</span>
    Funded by / Logos
  </button>
  <div class="footer-body" id="footer-body">
    <img src="https://raw.githubusercontent.com/teresacoliveira/journal-observatory-2/master/logos_gs.png"
         alt="Partner logos"
         onerror="this.style.display='none';" />
  </div>
</footer>
<script>
  var _globalVis = {{}};
  function globalToggle(btnId, traceName) {{
    var btn = document.getElementById(btnId);
    var newVisible = btn.classList.contains('hidden');
    _globalVis[traceName] = newVisible;
    btn.classList.toggle('hidden', !newVisible);
    var val = newVisible ? true : 'legendonly';
    document.querySelectorAll('[id^="plot_"],[id^="jplot_"]').forEach(function(el) {{
      if (!el.id || !el.data) return;
      var idxs = [];
      el.data.forEach(function(t, i) {{
        if (t.name === traceName || t.legendgroup === traceName) idxs.push(i);
      }});
      if (idxs.length) Plotly.restyle(el.id, {{visible: val}}, idxs);
    }});
  }}
  var ALL_PLOT_SEL = '[id^="jplot_"],[id^="plot_gfagg_"],[id^="plot_fagg_"],[id^="plot_global_agg_"],[id^="plot_about_"],[id^="plot_global_"]';
  function filterAggCardsByPolicy(policyVal) {{
    var activePanel = document.querySelector('.tab-panel.active');
    if (!activePanel) return;
    activePanel.querySelectorAll('.plot-card[data-agg-policy]').forEach(function(card) {{
      var ap = card.getAttribute('data-agg-policy');
      var show = (policyVal === 'all') || (ap === 'all') || (ap === policyVal);
      card.classList.toggle('filtered', !show);
    }});
  }}

  // ── Title / margin auto-sizing ─────────────────────────────────────────────
  // Titles are wrapped and font-size reduced as cards shrink.
  // When multiple cards share a grid row, margin.t AND margin.b are unified
  // so that all y-axes start at the same position regardless of title length,
  // and footer annotations always appear at the same vertical offset.
  // x-axis tick density and font size are adjusted based on card pixel width
  // so labels remain legible at any column count.
  function _computeTitleLayout(el, charsPerLineCap) {{
    var cardWidth = el.offsetWidth;
    if (!cardWidth) return null;
    if (!el._origTitleText) el._origTitleText = (el.layout.title && el.layout.title.text) || '';
    if (!el._baseTitleSize) el._baseTitleSize = parseFloat(
      (el.layout.title && el.layout.title.font && el.layout.title.font.size) || 13);
    if (!el._marginL) {{
      el._marginL = parseFloat((el.layout.margin && el.layout.margin.l) || 55);
      el._marginR = parseFloat((el.layout.margin && el.layout.margin.r) || 20);
      el._marginB = parseFloat((el.layout.margin && el.layout.margin.b) || 78);
    }}
    var scaledSize = Math.min(el._baseTitleSize,
      Math.max(9, Math.round(el._baseTitleSize * cardWidth / 700)));
    var innerWidth  = Math.max(60, cardWidth - el._marginL - el._marginR);
    var charsPerLine = charsPerLineCap !== undefined
      ? charsPerLineCap
      : Math.max(8, Math.floor(innerWidth * 0.9 / (scaledSize * 0.52)));
    var wrappedLines = [];
    el._origTitleText.split(/<br\\s*\\/?>/i).forEach(function(seg) {{
      var line = '';
      seg.split(' ').forEach(function(word) {{
        var test = line ? line + ' ' + word : word;
        if (test.length > charsPerLine && line) {{ wrappedLines.push(line); line = word; }}
        else line = test;
      }});
      if (line) wrappedLines.push(line);
    }});
    var numLines   = wrappedLines.length;
    var lineHeight = Math.round(scaledSize * 1.35);
    return {{ scaledSize: scaledSize, numLines: numLines,
              wrappedText: wrappedLines.join('<br>'),
              lineHeight: lineHeight, newMarginT: numLines * lineHeight + 8,
              baseMarginB: el._marginB,
              charsPerLine: charsPerLine }};
  }}

  // Returns x-axis tick spacing and label font size suited to the card width.
  function _xAxisParams(cardWidth) {{
    if (cardWidth >= 500) return {{ dtick: 1, tickfont_size: 10 }};
    if (cardWidth >= 350) return {{ dtick: 2, tickfont_size: 9  }};
    return                       {{ dtick: 5, tickfont_size: 8  }};
  }}

  // Apply x-axis tick params to a single plot div.
  function _applyXAxis(el) {{
    if (!el || !el.id || !el.data) return;
    var card  = el.closest ? el.closest('.plot-card') : null;
    var width = card ? card.offsetWidth : el.offsetWidth;
    if (!width) return;
    var p = _xAxisParams(width);
    Plotly.relayout(el.id, {{'xaxis.dtick': p.dtick, 'xaxis.tickfont.size': p.tickfont_size}});
  }}

  // Update title wrapping + margins for a single plot div (1-column grids
  // or single-plot wrappers where no cross-card alignment is needed).
  function _updatePlotTitle(el) {{
    if (!el || !el.layout) return;
    var info = _computeTitleLayout(el);
    if (!info) return;
    Plotly.relayout(el.id, {{'title.text': info.wrappedText,
      'title.font.size': info.scaledSize,
      'margin.t': info.newMarginT,
      'margin.b': info.baseMarginB}});
  }}

  // Update titles for every plot in a grid, keeping y-axes aligned.
  // In multi-column grids, margin.t is unified (tallest title wins) and
  // margin.b is unified (max of all cards) so that footer annotations sit
  // at the same height in every card of the same row.
  function _updateGridTitles(grid) {{
    if (!grid) return;
    var plotDivs = [];
    grid.querySelectorAll(ALL_PLOT_SEL).forEach(function(el) {{
      if (el.id && el.data) plotDivs.push(el);
    }});
    if (!plotDivs.length) return;
    var cols = 1;
    try {{
      cols = window.getComputedStyle(grid).gridTemplateColumns.trim().split(/\\s+/).length;
    }} catch(e) {{}}
    if (cols <= 1) {{
      // Single column — no cross-card alignment needed; update each independently
      plotDivs.forEach(function(el) {{ _updatePlotTitle(el); _applyXAxis(el); }});
      return;
    }}
    // Multi-column — compute layouts, find tallest title and largest bottom margin,
    // then apply unified margin.t and margin.b to all cards so axes align perfectly.
    var infos = plotDivs.map(function(el) {{ return _computeTitleLayout(el); }});
    var maxLines = 1, refLH = 0, maxMarginB = 78;
    infos.forEach(function(i) {{
      if (i && i.numLines > maxLines) maxLines = i.numLines;
      if (i && !refLH) refLH = i.lineHeight;
      if (i && i.baseMarginB > maxMarginB) maxMarginB = i.baseMarginB;
    }});
    var unifiedMarginT = maxLines * refLH + 8;
    plotDivs.forEach(function(el, i) {{
      var info = infos[i];
      if (!info) return;
      Plotly.relayout(el.id, {{'title.text': info.wrappedText,
        'title.font.size': info.scaledSize,
        'margin.t': unifiedMarginT,
        'margin.b': maxMarginB}});
      _applyXAxis(el);
    }});
  }}

  // Update all grids and single-plot wrappers within a tab panel.
  function _updateAllTitlesInPanel(panel) {{
    var seen = new Set();
    panel.querySelectorAll('.plot-grid').forEach(function(g) {{
      if (!seen.has(g)) {{ seen.add(g); _updateGridTitles(g); }}
    }});
    panel.querySelectorAll('.single-plot-wrap').forEach(function(w) {{
      var el = w.querySelector(ALL_PLOT_SEL);
      if (el && el.id && el.data) _updatePlotTitle(el);
    }});
  }}

  // ── ResizeObserver — re-fire title/axis updates on element resize ──────────
  // Watches every .plot-grid and .single-plot-wrap; debounced 80 ms.
  // Also listens to the window resize event as a fallback for browsers
  // that do not support ResizeObserver.
  (function() {{
    if (!window.ResizeObserver) return;
    var _timers = new WeakMap();
    var ro = new ResizeObserver(function(entries) {{
      entries.forEach(function(entry) {{
        var t = entry.target;
        if (_timers.has(t)) clearTimeout(_timers.get(t));
        _timers.set(t, setTimeout(function() {{
          if (t.classList.contains('plot-grid')) _updateGridTitles(t);
          else {{
            var el = t.querySelector(ALL_PLOT_SEL);
            if (el && el.id && el.data) _updatePlotTitle(el);
          }}
        }}, 80));
      }});
    }});
    function observeAll() {{
      document.querySelectorAll('.plot-grid,.single-plot-wrap').forEach(function(el) {{
        ro.observe(el);
      }});
    }}
    document.addEventListener('DOMContentLoaded', observeAll);
    setTimeout(observeAll, 1500);
    var _wt;
    window.addEventListener('resize', function() {{
      clearTimeout(_wt);
      _wt = setTimeout(function() {{
        document.querySelectorAll('.tab-panel.active').forEach(function(p) {{
          _updateAllTitlesInPanel(p);
        }});
      }}, 150);
    }});
  }})();

  function toggleSection(btn) {{
    var body = btn.nextElementSibling;
    var icon = btn.querySelector('.collapsible-icon');
    var isOpen = btn.classList.contains('active');
    if (isOpen) {{
      body.style.display = 'none';
      btn.classList.remove('active');
      if (icon) icon.textContent = '▸';
    }} else {{
      body.style.display = '';
      btn.classList.add('active');
      if (icon) icon.textContent = '▾';
      setTimeout(function() {{
        body.querySelectorAll('[id^="plot_"],[id^="jplot_"]').forEach(function(el) {{
          if (el.id && el.data) Plotly.relayout(el.id, {{autosize: true}});
        }});
        body.querySelectorAll('.plot-grid').forEach(function(g) {{ _updateGridTitles(g); }});
        body.querySelectorAll('.single-plot-wrap').forEach(function(w) {{
          var el = w.querySelector(ALL_PLOT_SEL);
          if (el && el.id && el.data) _updatePlotTitle(el);
        }});
      }}, 120);
    }}
  }}
  function showPanel(link) {{
    document.querySelectorAll('.nav-link').forEach(function(el) {{ el.classList.remove('active'); }});
    document.querySelectorAll('.tab-panel').forEach(function(el) {{ el.classList.remove('active'); }});
    link.classList.add('active');
    var panel = document.getElementById(link.getAttribute('data-panel'));
    if (panel) {{
      panel.classList.add('active');
      document.getElementById('main-content').scrollTop = 0;
      panel.querySelectorAll('[id^="plot_"],[id^="jplot_"]').forEach(function(el) {{
        if (el.id && el.data) Plotly.relayout(el.id, {{autosize: true}});
      }});
      // Re-apply global chart-policy filter to newly visible panel
      var policyVal = document.getElementById('global-chart-policy-sel').value;
      panel.querySelectorAll('.plot-card[data-agg-policy]').forEach(function(card) {{
        var ap = card.getAttribute('data-agg-policy');
        var show = (policyVal === 'all') || (ap === 'all') || (ap === policyVal);
        card.classList.toggle('filtered', !show);
      }});
      setTimeout(function() {{ _updateAllTitlesInPanel(panel); }}, 120);
    }}
    return false;
  }}
  function setGrid(gridId, n, lblId) {{
    var grid = document.getElementById(gridId);
    if (!grid) return;
    grid.style.gridTemplateColumns = 'repeat(' + n + ', 1fr)';
    document.getElementById(lblId).textContent = n;
    grid.querySelectorAll('[id^="jplot_"],[id^="plot_gfagg_"],[id^="plot_fagg_"],[id^="plot_about_"],[id^="plot_global_"]')
        .forEach(function(el) {{ if (el.id) Plotly.relayout(el.id, {{autosize: true}}); }});
    setTimeout(function() {{ _updateGridTitles(grid); }}, 120);
  }}
  function filterJournalCard(query, gridId) {{
    var q = query.trim().toLowerCase();
    var grid = document.getElementById(gridId);
    if (!grid) return;
    var selId = gridId.replace('grid-', 'sel-');
    var sel   = document.getElementById(selId);
    var pf    = sel ? sel.value : 'all';
    grid.querySelectorAll('.plot-card').forEach(function(card) {{
      var name     = (card.getAttribute('data-journal-name') || '').toLowerCase();
      var policy   = card.getAttribute('data-policy');
      var policyOk = (pf === 'all') || (policy === pf);
      var textOk   = (q === '' || name.includes(q));
      card.classList.toggle('filtered', !policyOk);
      if (policyOk) card.classList.toggle('dimmed', !textOk);
      else          card.classList.remove('dimmed');
    }});
  }}
  function filterPolicyCards(policyVal, gridId, inputId) {{
    var inp  = document.getElementById(inputId);
    var q    = inp ? inp.value.trim().toLowerCase() : '';
    var grid = document.getElementById(gridId);
    if (!grid) return;
    grid.querySelectorAll('.plot-card').forEach(function(card) {{
      var name     = (card.getAttribute('data-journal-name') || '').toLowerCase();
      var policy   = card.getAttribute('data-policy');
      var policyOk = (policyVal === 'all') || (policy === policyVal);
      var textOk   = (q === '' || name.includes(q));
      card.classList.toggle('filtered', !policyOk);
      if (policyOk) card.classList.toggle('dimmed', !textOk);
      else          card.classList.remove('dimmed');
    }});
  }}
  function scrollToJournalCard(value, gridId) {{
    var v = value.trim().toLowerCase();
    if (!v) return;
    var grid = document.getElementById(gridId);
    if (!grid) return;
    grid.querySelectorAll('.plot-card.highlighted').forEach(function(c) {{ c.classList.remove('highlighted'); }});
    grid.querySelectorAll('.plot-card.dimmed').forEach(function(c) {{ c.classList.remove('dimmed'); }});
    var matched = null;
    grid.querySelectorAll('.plot-card').forEach(function(card) {{
      if ((card.getAttribute('data-journal-name') || '').toLowerCase() === v) matched = card;
    }});
    if (matched) {{
      matched.scrollIntoView({{behavior: 'smooth', block: 'center'}});
      matched.classList.add('highlighted');
      matched.addEventListener('animationend', function() {{
        matched.classList.remove('highlighted');
      }}, {{once: true}});
    }}
  }}
  function clearJournalSearch(inputId, gridId, selId) {{
    var inp = document.getElementById(inputId);
    if (inp) inp.value = '';
    var sel = document.getElementById(selId);
    filterPolicyCards(sel ? sel.value : 'all', gridId, inputId);
  }}
  (function() {{
    var _dc = null, _g = null, _ov = null, _ox = 0, _oy = 0;
    function _ghost(card, cx, cy) {{
      var r = card.getBoundingClientRect();
      var g = document.createElement('div');
      g.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;'
        + 'left:' + r.left + 'px;top:' + r.top + 'px;'
        + 'width:' + r.width + 'px;height:' + r.height + 'px;'
        + 'background:rgba(44,62,80,0.08);border:2px dashed #2c3e50;'
        + 'border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,0.12);';
      document.body.appendChild(g);
      _ox = cx - r.left; _oy = cy - r.top; return g;
    }}
    function _rmGhost() {{ if (_g && _g.parentNode) _g.parentNode.removeChild(_g); _g = null; }}
    function _cardUnder(cx, cy) {{
      if (!_g) return null;
      _g.style.visibility = 'hidden';
      var el = document.elementFromPoint(cx, cy);
      _g.style.visibility = '';
      var c = el && el.closest('.plot-card');
      return (!c || c === _dc || !_dc || c.parentNode !== _dc.parentNode) ? null : c;
    }}
    function _clearOv() {{ if (_ov) {{ _ov.classList.remove('drag-over'); _ov = null; }} }}
    function _clean()   {{ _clearOv(); _rmGhost(); _dc = null; }}
    function _initH(h) {{
      if (h._di) return; h._di = true;
      h.addEventListener('pointerdown', function(e) {{
        e.stopPropagation(); e.preventDefault();
        var card = h.closest('.plot-card'); if (!card) return;
        _dc = card; _g = _ghost(card, e.clientX, e.clientY);
        h.setPointerCapture(e.pointerId);
      }});
      h.addEventListener('pointermove', function(e) {{
        if (!_dc || !_g) return;
        _g.style.left = (e.clientX - _ox) + 'px';
        _g.style.top  = (e.clientY - _oy) + 'px';
        var t = _cardUnder(e.clientX, e.clientY);
        if (_ov !== t) {{ _clearOv(); if (t) {{ t.classList.add('drag-over'); _ov = t; }} }}
      }});
      h.addEventListener('pointerup', function(e) {{
        if (!_dc) return;
        var src = _dc, tgt = _cardUnder(e.clientX, e.clientY); _clean();
        if (tgt && src.parentNode === tgt.parentNode) {{
          var g = tgt.parentNode, cs = Array.from(g.children);
          g.insertBefore(src, cs.indexOf(src) < cs.indexOf(tgt) ? tgt.nextSibling : tgt);
          setTimeout(function() {{
            g.querySelectorAll(ALL_PLOT_SEL).forEach(function(el) {{
              if (el.id && el.data) Plotly.relayout(el.id, {{autosize: true}});
            }});
            setTimeout(function() {{ _updateGridTitles(g); }}, 80);
          }}, 50);
        }}
      }});
      h.addEventListener('pointercancel', function() {{ _clean(); }});
    }}
    function _initAll() {{ document.querySelectorAll('.drag-handle').forEach(_initH); }}
    document.addEventListener('DOMContentLoaded', _initAll);
  }})();
  function toggleFooter(btn) {{
    var body = document.getElementById('footer-body');
    var icon = document.getElementById('footer-icon');
    if (!body) return;
    var isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : '';
    if (icon) icon.textContent = isOpen ? '▸' : '▾';
  }}
  // ── Loading overlay dismissal ─────────────────────────────────────────────
  // Wait for the DOM to be fully parsed, then give Plotly a short ramp-up
  // window (300 ms is enough for the About panel charts to initialise) before
  // fading out the overlay. The overlay stays long enough to mask any layout
  // jitter on first render, but disappears quickly enough not to feel sluggish.
  (function() {{
    function _dismiss() {{
      var ov = document.getElementById('loading-overlay');
      if (!ov) return;
      ov.classList.add('hidden');
      // Remove from DOM after transition so it doesn't trap pointer events
      ov.addEventListener('transitionend', function() {{ ov.remove(); }}, {{once: true}});
    }}
    if (document.readyState === 'loading') {{
      document.addEventListener('DOMContentLoaded', function() {{ setTimeout(_dismiss, 350); }});
    }} else {{
      setTimeout(_dismiss, 350);
    }}
  }})();
</script>
</body>
</html>"""


def main():
    parser = argparse.ArgumentParser(
        description="Generate the self-contained HTML dashboard from the aggregated CSV."
    )
    parser.add_argument("--csv",    default=DEFAULT_CSV,
                        help="Path to bz_journal_year_percentages_All_Fields CSV")
    parser.add_argument("--output", default=DEFAULT_OUTPUT_DIR,
                        help="Output directory for the HTML file")
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)
    run_ts   = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = os.path.join(args.output, f"index_{run_ts}.html")

    print("Generating dashboard…")
    html = generate_dashboard_html(args.csv)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)

    size_kb = os.path.getsize(out_path) / 1024
    print(f"\nDone!  {out_path}  ({size_kb:.0f} KB)")
    print(
        "\nTo publish on GitHub Pages:\n"
        f"  1. Rename the output file to index.html\n"
        f"  2. Commit and push it to the branch/folder set as your Pages source\n"
        f"  3. GitHub will serve it as a static file — no server config needed\n"
        f"  (GitHub Pages gzip-compresses the file automatically, reducing "
        f"transfer size by ~70 %)"
    )


if __name__ == "__main__":
    main()
