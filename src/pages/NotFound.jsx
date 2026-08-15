import { useNavigate, useLocation } from 'react-router-dom'
import { getTheme } from '../theme'

export default function NotFound({ dark }) {
  const c = getTheme(dark)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="page-container" style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center'
    }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🧭</div>
      <h1 style={{ color: c.blue, fontSize: 22, marginBottom: 8 }}>Page not found</h1>
      <p style={{ color: c.sub, marginBottom: 8, fontSize: 14 }}>
        There's nothing at <code style={{ color: c.text }}>{location.pathname}</code>.
      </p>
      <p style={{ color: c.sub, marginBottom: 24, fontSize: 13 }}>
        It may have been moved, or the link might be outdated.
      </p>
      <button onClick={() => navigate('/')} style={{
        background: c.blue, color: '#0f172a', border: 'none',
        padding: '12px 24px', borderRadius: 10, cursor: 'pointer',
        fontWeight: 700, fontFamily: 'inherit', fontSize: 14
      }}>← Back to Home</button>
    </div>
  )
}
