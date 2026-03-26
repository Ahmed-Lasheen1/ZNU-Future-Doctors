import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav style={{
      background: '#1e293b',
      padding: '12px 20px',
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      borderBottom: '1px solid #334155',
      overflowX: 'auto'
    }}>
      <span style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '18px' }}>
        🏥 ZNU
      </span>
      <Link to="/" style={{ color: '#e2e8f0', textDecoration: 'none' }}>الرئيسية</Link>
      <Link to="/files" style={{ color: '#e2e8f0', textDecoration: 'none' }}>الملفات</Link>
      <Link to="/schedule" style={{ color: '#e2e8f0', textDecoration: 'none' }}>الجداول</Link>
      <Link to="/chatbot" style={{ color: '#e2e8f0', textDecoration: 'none' }}>المساعد</Link>
      <Link to="/admin" style={{ color: '#e2e8f0', textDecoration: 'none' }}>الأدمن</Link>
    </nav>
  )
}

export default Navbar
