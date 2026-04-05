import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Auth({ dark }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  const card = {
    background: dark ? 'linear-gradient(135deg, #1e293b, #0f2540)' : '#fff',
    border: `1px solid ${dark ? '#1e3a5f' : '#e2e8f0'}`,
    borderRadius: 20, padding: 32,
    width: '90%', maxWidth: 400
  }

  const input = {
    width: '100%', padding: '12px', marginBottom: '12px',
    borderRadius: '10px', border: `1px solid ${dark ? '#1e3a5f' : '#e2e8f0'}`,
    background: dark ? '#0f172a' : '#f8fafc',
    color: dark ? '#fff' : '#1e293b',
    fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none'
  }

  async function handleSubmit() {
    if (!email || !password) return setMsg('Please fill all fields')
    setLoading(true)
    setMsg('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMsg('❌ ' + error.message)
      else { setMsg('✅ Account created! You can now sign in.'); setIsSignUp(false) }
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
      <div style={card}>
        <h2 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 8, fontSize: 22, fontWeight: 900 }}>
          🏥 ZNU Future Doctors
        </h2>
        <p style={{ color: dark ? '#94a3b8' : '#64748b', textAlign: 'center', marginBottom: 24, fontSize: 13 }}>
          {isSignUp ? 'Create an account to save your progress' : 'Sign in to sync your checklist'}
        </p>

        {msg && (
          <div style={{
            background: msg.includes('✅') ? '#22c55e20' : '#ef444420',
            border: `1px solid ${msg.includes('✅') ? '#22c55e40' : '#ef444440'}`,
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            color: msg.includes('✅') ? '#22c55e' : '#ef4444', fontSize: 13
          }}>{msg}</div>
        )}

        <input
          type="email" placeholder="Email address"
          value={email} onChange={e => setEmail(e.target.value)}
          style={input} />
        <input
          type="password" placeholder="Password"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={input} />

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
          background: 'transparent',
          border: `1px solid ${dark ? '#1e3a5f' : '#e2e8f0'}`,
          borderRadius: 10, cursor: 'pointer',
          color: dark ? '#94a3b8' : '#64748b',
          fontFamily: 'inherit', fontSize: 13
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
