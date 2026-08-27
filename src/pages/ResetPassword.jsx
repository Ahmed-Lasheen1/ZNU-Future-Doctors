import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getPulseTheme, pulseFonts } from '../premiumTheme'
import { PulseFullScreen, glassPanel, glassInput, glassPrimaryBtn, glassGhostBtn } from '../components/pulse/PulseUI'

const LOGO_SRC = '/icon-192.png'

export default function ResetPassword({ dark }) {
  const pt = getPulseTheme(dark)
  const navigate = useNavigate()

  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(!!session)
      if (!session) setMsg('❌ This reset link is invalid or expired. Please request a new one.')
    })
  }, [])

  async function handleSubmit() {
    if (!password || password.length < 6) return setMsg('❌ Password must be at least 6 characters')
    if (password !== confirm) return setMsg('❌ Passwords do not match')

    setLoading(true)
    setMsg('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) { setMsg('❌ ' + error.message); return }
    setMsg('✅ Password updated! Redirecting...')
    setTimeout(() => navigate('/'), 1500)
  }

  return (
    <PulseFullScreen dark={dark}>
      <div style={glassPanel(pt, dark)}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{
            width: 60, height: 60, margin: '0 auto 10px', borderRadius: 16, overflow: 'hidden',
            background: pt.surfaceFlat, border: `1px solid ${pt.cobaltBorder}`
          }}>
            <img src={LOGO_SRC} alt="ZNU Pulse" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 22, color: pt.text }}>
            ZNU <span style={{ color: pt.cobalt }}>PULSE</span>
          </div>
          <p style={{ color: pt.sub, fontSize: 13, marginTop: 6 }}>Set a new password</p>
        </div>

        {msg && (
          <div style={{
            background: msg.includes('✅') ? `${pt.cobalt}18` : `${pt.danger}18`,
            border: `1px solid ${msg.includes('✅') ? pt.cobaltBorder : pt.danger + '55'}`,
            borderRadius: 12, padding: '10px 14px', marginBottom: 16,
            color: msg.includes('✅') ? pt.cobalt : pt.danger, fontSize: 13, textAlign: 'center'
          }}>{msg}</div>
        )}

        {ready ? (
          <>
            <input type="password" aria-label="New password" placeholder="New password (min 6 characters)"
              value={password} onChange={e => setPassword(e.target.value)} style={glassInput(pt, dark)} />
            <input type="password" aria-label="Confirm new password" placeholder="Confirm new password"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={glassInput(pt, dark)} />
            <button onClick={handleSubmit} disabled={loading} style={glassPrimaryBtn(pt, dark, loading)}>
              {loading ? 'Saving...' : 'Save New Password'}
            </button>
          </>
        ) : (
          <button onClick={() => navigate('/auth')} style={glassPrimaryBtn(pt, dark, false)}>← Back to Sign In</button>
        )}
      </div>
    </PulseFullScreen>
  )
}
