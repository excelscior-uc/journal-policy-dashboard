import { Link } from 'react-router-dom'
import GlobalJournalSearch from './GlobalJournalSearch'
import { SITE_STATS } from '../data/siteStats'

export default function Hero() {
  return (
    <div className="hero">
      <div className="hero__inner">
        <div className="hero__text">
<h1 className="hero__title">
            The <em className="hero__title-bar">Bar Graph</em> Extinction Dashboard: Tracking the Shift to More <em className="hero__title-informative">Informative Plots</em>
          </h1>
          <p className="hero__subtitle">
            Impact of Journal Policies on the Visualization of Continuous Data
          </p>
          <p className="hero__sub">
            Bar charts that reduce continuous data to a mean and error bar are widely criticised for
            concealing distributional features. This dashboard tracks how{' '}
            <strong>journal editorial policies</strong> are driving the shift toward more informative
            visualisations across {SITE_STATS.totalJournals} journals and {SITE_STATS.fieldCount} biomedical research fields.{' '}
            Pre-registered study protocol:{' '}
            <a href="https://osf.io/tcyxg" target="_blank" rel="noreferrer" className="hero__link">
              osf.io/tcyxg
            </a>
          </p>
          <div className="hero__actions">
            <Link className="hero__cta" to="/field/all-fields">
              Explore the Dashboard
            </Link>
            <span className="hero__or" aria-hidden="true">or</span>
            <div className="hero__search">
              <GlobalJournalSearch />
            </div>
          </div>
        </div>
        <div className="hero__stats">
          <div className="hero__stat-card">
            <div className="hero__stat-num">{SITE_STATS.totalJournals}</div>
            <div className="hero__stat-lbl">Journals</div>
          </div>
          <div className="hero__stat-card">
            <div className="hero__stat-num">{SITE_STATS.fieldCount}</div>
            <div className="hero__stat-lbl">Research Fields</div>
          </div>
          <div className="hero__stat-card">
            <div className="hero__stat-num">{SITE_STATS.yearSpan} yr</div>
            <div className="hero__stat-lbl">Time Span</div>
          </div>
        </div>
      </div>
    </div>
  )
}
