import { Link } from 'react-router-dom'

export default function TopNav() {
  return (
    <nav className="top-nav">
      <Link to="/" className="top-nav__logo">Journal Policy Dashboard</Link>
      <div id="nav-filter-slot" className="top-nav__filter-slot" />
    </nav>
  )
}
