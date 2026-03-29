import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Checklist from './pages/Checklist'
import Schedule from './pages/Schedule'
import FilesPage from './pages/FilesPage'
import Admin from './pages/Admin'
import MCQ from './pages/MCQ'
import Summaries from './pages/Summaries'
import Footer from './components/Footer'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function SmartHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  if (location.pathname === '/') return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 18px',
      background: 'rgba(10, 15, 30, 0.95)',
      backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 1000,
      borderBottom: '1px solid rgba(56,189,248,0.2)',
    }}>
      <button onClick={() => navigate(-1)} style={navBtnStyle}>← Back</button>
      <span style={{ color: '#38bdf8', fontWeight: 900, fontSize: 16 }}>🏥 ZNU</span>
      <button onClick={() => navigate('/')} style={navBtnStyle}>🏠 Home</button>
    </div>
  )
}

const navBtnStyle = {
  background: 'rgba(56,189,248,0.1)',
  color: '#38bdf8',
  border: '1px solid rgba(56,189,248,0.3)',
  padding: '8px 16px',
  borderRadius: '12px',
  fontSize: '14px',
  fontWeight: '700',
  cursor: 'pointer'
}

export default function App() {
  return (
    <Router>
      <div style={{
        background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1a2e 50%, #0a1628 100%)',
        minHeight: '100vh',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Segoe UI', sans-serif"
      }}>
        <ScrollToTop />
        <SmartHeader />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/checklist" element={<Checklist />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/summaries" element={<Summaries />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/mcq" element={<MCQ />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  )
}
