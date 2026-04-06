import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Auth({ dark }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  const c = {
    card: dark ? 'linear-gradient(135deg, #1e293b, #0f2540)' : '#fff',
    border: dark ? '#1e3a5f' : '#e2e8f0',
    text: dark ? '#fff' : '#1e293b',
    sub: dark ? '#94a3b8' : '#64748b',
    input: dark ? '#0f172a' : '#f8fafc',
  }

  const inStyle = {
    width: '100%', padding: '12px', marginBottom: '12px',
    borderRadius: '10px', border: `1px solid ${c.border}`,
    background: c.input, color: c.text,
    fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none'
  }

  function extractCode(email) {
    return email.split('@')[0]
  }

  async function handleSubmit() {
    if (!email || !password) return setMsg('Please fill all fields')
    if (isSignUp && !name) return setMsg('Please enter your name')
    if (isSignUp && !email.includes('@med.znu.edu.eg')) {
      return setMsg('❌ Please use your ZNU email (@med.znu.edu.eg)')
    }
    setLoading(true)
    setMsg('')

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setMsg('❌ ' + error.message); setLoading(false); return }
      if (data.user) {
        await supabase.from('profiles').insert([{
          id: data.user.id,
          name: name.trim(),
          university_code: extractCode(email),
          points: 0
        }])
        setMsg('✅ Account created! You can now sign in.')
        setIsSignUp(false)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMsg('❌ ' + error.message)
      else navigate('/')
    }
    setLoading(false)
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
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏥</div>
          <h2 style={{ color: '#38bdf8', fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
            ZNU Future Doctors
          </h2>
          <p style={{ color: c.sub, fontSize: 13 }}>
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        {msg && (
          <div style={{
            background: msg.includes('✅') ? '#22c55e20' : '#ef444420',
            border: `1px solid ${msg.includes('✅') ? '#22c55e40' : '#ef444440'}`,
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            color: msg.includes('✅') ? '#22c55e' : '#ef4444', fontSize: 13
          }}>{msg}</div>
        )}

        {isSignUp && (
          <input
            placeholder="Your name (e.g. Ahmed Lasheen)"
            value={name} onChange={e => setName(e.target.value)}
            style={inStyle} />
        )}

        <input
          type="email"
          placeholder={isSignUp ? "ZNU Email (@med.znu.edu.eg)" : "Email address"}
          value={email} onChange={e => setEmail(e.target.value)}
          style={inStyle} />

        <input
          type="password" placeholder="Password (min 6 characters)"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={inStyle} />

        {isSignUp && email.includes('@med.znu.edu.eg') && (
          <div style={{
            background: '#38bdf820', border: '1px solid #38bdf840',
            borderRadius: 10, padding: '8px 12px', marginBottom: 12,
            color: '#38bdf8', fontSize: 12
          }}>
            🎓 University Code: <strong>{extractCode(email)}</strong>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', padding: '12px', background: '#38bdf8',
          border: 'none', borderRadius: 10, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          color: '#0f172a', fontFamily: 'inherit', fontSize: 14,
          opacity: loading ? 0.7 : 1, marginBottom: 12
        }}>
          {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>

        <button onClick={() => { setIsSignUp(!isSignUp); setMsg('') }} style={{
          width: '100%', padding: '10px',
          background: 'transparent', border: `1px solid ${c.border}`,
          borderRadius: 10, cursor: 'pointer',
          color: c.sub, fontFamily: 'inherit', fontSize: 13
        }}>
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>

        <button onClick={() => navigate('/')} style={{
          width: '100%', padding: '10px', marginTop: 8,
          background: 'transparent', border: 'none',
          cursor: 'pointer', color: dark ? '#475569' : '#94a3b8',
          fontFamily: 'inherit', fontSize: 12
        }}>
          Continue without account →
        </button>
      </div>
    </div>
  )
}
