import { useNavigate } from 'react-router-dom'

export default function Hero() {
  const navigate = useNavigate()
  return (
    <div className="hero">
      <div className="hero__eyebrow">Biomedical Research · 2008 – 2024</div>
      <h1 className="hero__title">
        Tracking the Shift from <em>Bar Graphs</em> to Informative Plots
      </h1>
      <p className="hero__sub">
        How journal policies are transforming the visualization of continuous data
        across 12 biomedical research fields.
      </p>
      <button className="hero__cta" onClick={() => {
        document.getElementById('field-grid')?.scrollIntoView({ behavior: 'smooth' })
      }}>
        Explore by Research Field
      </button>
      <button className="hero__cta-ghost" onClick={() => navigate('/field/all-fields')}>
        View All Fields →
      </button>
    </div>
  )
}
