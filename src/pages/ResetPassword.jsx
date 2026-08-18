import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getTheme, inputStyle } from '../theme'

export default function ResetPassword({ dark }) {
  const c = getTheme(dark)
  const inStyle = inputStyle(c)
  const navigate = useNavigate()

  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    // When the user clicks the link in their email, Supabase redirects here
    // with a temporary recovery session. Give the client a moment to read
    // it from the URL.
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
    <div style={{
      minHeight: '80vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: c.card, border: `1px solid ${c.border}`,
        borderRadius: 20, padding: 32, width: '90%', maxWidth: 400
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div>
          <h2 style={{ color: '#38bdf8', fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
            Set a New Password
          </h2>
        </div>

        {msg && (
          <div style={{
            background: msg.includes('✅') ? '#22c55e20' : '#ef444420',
            border: `1px solid ${msg.includes('✅') ? '#22c55e40' : '#ef444440'}`,
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            color: msg.includes('✅') ? '#22c55e' : '#ef4444', fontSize: 13
          }}>{msg}</div>
        )}

        {ready && (
          <>
            <input
              type="password" aria-label="New password" placeholder="New password (min 6 characters)"
              value={password} onChange={e => setPassword(e.target.value)}
              style={inStyle} />
            <input
              type="password" aria-label="Confirm new password" placeholder="Confirm new password"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={inStyle} />
            <button onClick={handleSubmit} disabled={loading} style={{
              width: '100%', padding: '12px', background: '#38bdf8',
              border: 'none', borderRadius: 10, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              color: '#0f172a', fontFamily: 'inherit', fontSize: 14,
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Saving...' : 'Save New Password'}
            </button>
          </>
        )}

        {!ready && (
          <button onClick={() => navigate('/auth')} style={{
            width: '100%', padding: '12px', background: '#38bdf8',
            border: 'none', borderRadius: 10, fontWeight: 700,
            cursor: 'pointer', color: '#0f172a', fontFamily: 'inherit', fontSize: 14
          }}>← Back to Sign In</button>
        )}
      </div>
    </div>
  )
}
