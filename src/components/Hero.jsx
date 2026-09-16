import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import GlobalJournalSearch from './GlobalJournalSearch'
import { SITE_STATS } from '../data/siteStats'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function Hero() {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  const startAnimation = () => {
    const v = videoRef.current
    if (!v || prefersReducedMotion()) return
    v.currentTime = 0
    v.play().then(() => setPlaying(true)).catch(() => {})
  }
  const stopAnimation = () => {
    videoRef.current?.pause()
    setPlaying(false)
  }

  return (
    <div className="hero">
      <div
        className={`hero__logo${playing ? ' hero__logo--playing' : ''}`}
        onMouseEnter={startAnimation}
        onMouseLeave={stopAnimation}
      >
        <img src={`${import.meta.env.BASE_URL}icon-light.png`} alt="The Bar Graph Extinction logo" />
        <video
          ref={videoRef}
          className="hero__logo-video"
          src={`${import.meta.env.BASE_URL}logo-hover.mp4`}
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          onEnded={() => setPlaying(false)}
        />
      </div>
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
