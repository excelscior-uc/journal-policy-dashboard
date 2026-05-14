import { useNavigate } from 'react-router-dom'

export default function Hero() {
  const navigate = useNavigate()
  return (
    <div className="hero">
      <div className="hero__inner">
        <div className="hero__text">
          <div className="hero__eyebrow">Biomedical Research · 2008 – 2024</div>
          <h1 className="hero__title">
            Tracking the Shift from <em>Bar Graphs</em> to Informative Plots
          </h1>
          <p className="hero__sub">
            Bar charts that reduce continuous data to a mean and error bar are widely criticised for
            concealing distributional features. This dashboard tracks how{' '}
            <strong>journal editorial policies</strong> are driving the shift toward more informative
            visualisations across 213 journals and 12 biomedical research fields.
          </p>
          <p className="hero__preref">
            Pre-registered study protocol:{' '}
            <a href="https://osf.io/tcyxg" target="_blank" rel="noreferrer" className="hero__link">
              osf.io/tcyxg
            </a>
          </p>
          <div className="hero__actions">
            <button
              className="hero__cta"
              onClick={() => document.getElementById('field-grid')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore by Research Field
            </button>
            <button className="hero__cta-ghost" onClick={() => navigate('/field/all-fields')}>
              View All Fields →
            </button>
          </div>
        </div>
        <div className="hero__stats">
          <div className="hero__stat-card">
            <div className="hero__stat-num">213</div>
            <div className="hero__stat-lbl">Journals</div>
          </div>
          <div className="hero__stat-card">
            <div className="hero__stat-num">12</div>
            <div className="hero__stat-lbl">Research Fields</div>
          </div>
          <div className="hero__stat-card">
            <div className="hero__stat-num">16 yr</div>
            <div className="hero__stat-lbl">Time Span</div>
          </div>
        </div>
      </div>
    </div>
  )
}
