import { Link } from 'react-router-dom'
import GlobalJournalSearch from './GlobalJournalSearch'

export default function TopNav() {
  return (
    <nav className="top-nav">
      <Link to="/" className="top-nav__logo">Journal Policy Dashboard</Link>
      <div id="nav-filter-slot" className="top-nav__filter-slot" />
      <GlobalJournalSearch />
      <button
        type="button"
        className="top-nav__info"
        aria-label="What you can do on this page"
        title="What you can do on this page"
        onClick={() => window.dispatchEvent(new CustomEvent('open-features-intro'))}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="8" />
          <line x1="10" y1="9" x2="10" y2="14" />
          <circle cx="10" cy="6" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      </button>
    </nav>
  )
}
