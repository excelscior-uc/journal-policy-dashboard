import { Suspense, lazy } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import TopNav from './components/TopNav'

const Home = lazy(() => import('./pages/Home'))
const FieldPage = lazy(() => import('./pages/FieldPage'))

function PageShell({ children }) {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: '#6c757d' }}>Loading…</div>}>
      {children}
    </Suspense>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PageShell><Home /></PageShell>} />
        <Route path="/field/:slug" element={<><TopNav /><PageShell><FieldPage /></PageShell></>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
