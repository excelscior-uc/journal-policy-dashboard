export const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="14" height="14" rx="1.5" />
        <line x1="8" y1="3" x2="8" y2="17" />
      </svg>
    ),
    title: 'The sidebar',
    desc: 'The left panel is your main way to load charts. It lists every journal, or every research field on the overview page. Click any entry to open its charts.',
    extra: (
      <div className="intro-states">
        <div className="intro-states__group">
          <span className="intro-states__caption">Journals bar: data visualisation policy</span>
          <div className="intro-states__row">
            <span className="intro-chip intro-chip--off">
              <span className="intro-chip__swatch" style={{ background: '#0072b2' }} />
              with policy
            </span>
            <span className="intro-chip intro-chip--off">
              <span className="intro-chip__swatch" style={{ background: '#d55e00' }} />
              no policy
            </span>
          </div>
        </div>
        <div className="intro-states__group">
          <span className="intro-states__caption">Articles bar: eligibility for the metric</span>
          <div className="intro-states__row">
            <span className="intro-chip intro-chip--off">
              <span className="intro-chip__swatch" style={{ background: '#009e73' }} />
              eligible
            </span>
            <span className="intro-chip intro-chip--off">
              <span className="intro-chip__swatch" style={{ background: '#cbd5e1' }} />
              not eligible
            </span>
          </div>
        </div>
        <div className="intro-states__group">
          <span className="intro-states__caption">Policy badge</span>
          <div className="intro-states__row">
            <span className="policy-badge policy-badge--legend">Policy 2021</span>
            <span className="intro-states__caption intro-states__caption--soft">
              marks the journals that adopted a policy, and the year.
            </span>
          </div>
        </div>
        <div className="intro-states__group">
          <span className="intro-states__caption">Switch fields</span>
          <div className="intro-states__row">
            <span className="intro-chip intro-chip--off">▼ chevron</span>
            <span className="intro-states__caption intro-states__caption--soft">
              next to the field name jumps to another research field.
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="9" r="6" /><line x1="13.5" y1="13.5" x2="17" y2="17" />
      </svg>
    ),
    title: 'Search journals & fields',
    desc: 'Find any journal or research field fast using the search box to jump straight to its charts.',
    extra: (
      <div className="intro-states">
        <div className="intro-states__caption">Type a name to filter the list:</div>
        <div style={{ maxWidth: 280 }}>
          <div className="journal-sidebar__search">
            <input className="journal-search-input" type="search" value="neuro" readOnly aria-hidden tabIndex={-1} />
          </div>
          <div className="journal-link">
            <div className="journal-link__body">
              <span className="journal-link__name">Nature Neuroscience</span>
            </div>
            <span className="policy-badge">Policy 2019</span>
          </div>
          <div className="journal-link">
            <div className="journal-link__body">
              <span className="journal-link__name">Neuron</span>
            </div>
          </div>
          <div className="journal-link">
            <div className="journal-link__body">
              <span className="journal-link__name">Journal of Neuroscience</span>
            </div>
            <span className="policy-badge">Policy 2021</span>
          </div>
          <div className="journal-link">
            <div className="journal-link__body">
              <span className="journal-link__name">Nature Reviews Neuroscience</span>
            </div>
          </div>
          <div className="journal-link" style={{ marginBottom: 0 }}>
            <div className="journal-link__body">
              <span className="journal-link__name">Neuropharmacology</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="14" height="6" rx="1.5" />
        <rect x="3" y="11" width="4" height="6" rx="1.5" />
        <rect x="8" y="11" width="4" height="6" rx="1.5" />
        <rect x="13" y="11" width="4" height="6" rx="1.5" />
      </svg>
    ),
    title: 'Adjustable chart layout',
    desc: 'Switch the layout between one, two, or three charts per row to focus in or scan more at a glance.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="17" y2="6" /><circle cx="8" cy="6" r="2" fill="#fff" />
        <line x1="3" y1="12" x2="17" y2="12" /><circle cx="13" cy="12" r="2" fill="#fff" />
      </svg>
    ),
    title: 'Filter & show/hide lines',
    desc: 'Use the top bar to toggle which metrics appear, hide/show policy markers, and filter journals by policy status.',
    extra: (
      <div className="intro-states">
        <div className="intro-states__group">
          <span className="intro-states__caption">Show: click a metric to toggle its line</span>
          <div className="intro-states__row">
            <span className="intro-chip intro-chip--on">
              <span className="intro-chip__swatch" style={{ background: '#d55e00' }} />
              % only bar
            </span>
            <span className="intro-states__tag intro-states__tag--on">shown</span>
            <span className="intro-chip intro-chip--off">
              <span className="intro-chip__swatch" style={{ background: '#0072b2' }} />
              % only informative
            </span>
            <span className="intro-states__tag intro-states__tag--off">hidden</span>
          </div>
        </div>
        <div className="intro-states__group">
          <span className="intro-states__caption">Journals: pick which journals feed the charts</span>
          <div className="intro-seg">
            <span className="intro-seg__btn intro-seg__btn--on">All</span>
            <span className="intro-seg__btn">Policy</span>
            <span className="intro-seg__btn">Non-Policy</span>
          </div>
          <span className="intro-states__caption intro-states__caption--soft">
            The highlighted option is active. All shows every journal, Policy / Non-Policy narrow it down.
          </span>
        </div>
      </div>
    ),
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3l13 6.5-5.5 1.7L10 18 5 3z" />
      </svg>
    ),
    title: 'Hover for exact numbers',
    desc: 'Point at any year on a line to open a tooltip. It shows that year’s value for each visible metric, the total and included article counts, and — on policy years — how many journals had adopted the policy.',
    extra: (
      <div className="intro-states">
        <div className="intro-states__caption">A tooltip looks like this:</div>
        <div style={{
          background: '#fefce8',
          border: '1px solid #fef08a',
          borderRadius: 6,
          padding: '6px 10px',
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1.6,
          maxWidth: 300,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 2, color: '#713f12' }}>2021</div>
          <div style={{ color: '#d55e00' }}>% only bar : 42.0%</div>
          <div style={{ color: '#0072b2' }}>% only informative : 31.5%</div>
          <div style={{ marginTop: 4, borderTop: '1px solid #fef08a', paddingTop: 3, color: '#713f12', fontWeight: 600 }}>
            <div>Total articles: 1,240</div>
            <div>Included articles: 980 (79.0%)</div>
          </div>
          <div style={{ marginTop: 4, borderTop: '1px solid #fef08a', paddingTop: 3, color: '#6d5f00', fontWeight: 700 }}>
            Policy adopted: 8 journals of 71 (11%)
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="7" height="16" rx="1.5" />
        <rect x="14" y="4" width="7" height="16" rx="1.5" />
        <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="2 2" />
      </svg>
    ),
    title: 'Compare graphs',
    desc: 'Open any chart’s menu and pick Compare to overlay up to two journals or fields on one chart.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <circle cx="4" cy="10" r="1.8" /><circle cx="10" cy="10" r="1.8" /><circle cx="16" cy="10" r="1.8" />
      </svg>
    ),
    title: 'Copy or download as PNG',
    desc: 'Open the three-dots menu on any chart to copy it to your clipboard or download it as a PNG.',
    extra: (
      <div className="intro-states">
        <div className="intro-states__caption">Open the three-dots menu on a chart:</div>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
          <span className="chart-card__menu-btn" style={{ color: '#adb5bd', padding: '2px 4px' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <circle cx="3" cy="9" r="2" />
              <circle cx="9" cy="9" r="2" />
              <circle cx="15" cy="9" r="2" />
            </svg>
          </span>
          <div className="chart-card__menu-dropdown" style={{ position: 'static', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <span className="chart-card__menu-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy as PNG
            </span>
            <span className="chart-card__menu-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download as PNG
            </span>
          </div>
        </div>
      </div>
    ),
  },
]
