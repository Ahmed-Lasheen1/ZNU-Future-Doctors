import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../App'

export default function Profile({ dark }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [tab, setTab] = useState('profile')
  const [loading, setLoading] = useState(true)

  const c = {
    card: dark ? 'linear-gradient(135deg, #1e293b, #0f2540)' : '#fff',
    border: dark ? '#1e3a5f' : '#e2e8f0',
    text: dark ? '#e2e8f0' : '#1e293b',
    sub: dark ? '#94a3b8' : '#64748b',
  }

  useEffect(() => {
    fetchData()
  }, [user])

  async function fetchData() {
    setLoading(true)
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data)
    }
    const { data: lb } = await supabase
      .from('profiles')
      .select('name, points, university_code')
      .order('points', { ascending: false })
      .limit(10)
    if (lb) setLeaderboard(lb)
    setLoading(false)
  }

  const medalColors = ['#f59e0b', '#94a3b8', '#cd7c2f']

  return (
    <div style={{ padding: '20px', maxWidth: 700, margin: '0 auto' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['profile', 'leaderboard'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px', borderRadius: 10, fontFamily: 'inherit',
            border: `2px solid ${tab === t ? '#38bdf8' : c.border}`,
            background: tab === t ? '#38bdf820' : 'transparent',
            color: tab === t ? '#38bdf8' : c.sub,
            cursor: 'pointer', fontWeight: 700, fontSize: 13
          }}>
            {t === 'profile' ? '👤 My Profile' : '🏆 Leaderboard'}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <>
          {!user ? (
            <div style={{
              background: c.card, border: `1px solid ${c.border}`,
              borderRadius: 20, padding: 40, textAlign: 'center'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
              <h3 style={{ color: '#38bdf8', marginBottom: 8 }}>Sign in to view your profile</h3>
              <p style={{ color: c.sub, marginBottom: 20, fontSize: 14 }}>
                Track your points and save your progress
              </p>
              <button onClick={() => navigate('/auth')} style={{
                background: '#38bdf8', color: '#0f172a', border: 'none',
                padding: '12px 24px', borderRadius: 10, cursor: 'pointer',
                fontWeight: 700, fontFamily: 'inherit'
              }}>Sign In</button>
            </div>
          ) : loading ? (
            <p style={{ color: c.sub, textAlign: 'center' }}>Loading...</p>
          ) : profile ? (
            <div>
              {/* Profile Card */}
              <div style={{
                background: 'linear-gradient(135deg, #1e3a5f, #0f2540)',
                border: '2px solid #38bdf840',
                borderRadius: 20, padding: 28, marginBottom: 16, textAlign: 'center'
              }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, fontWeight: 900, color: '#fff',
                  margin: '0 auto 16px'
                }}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <h2 style={{ color: '#38bdf8', fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
                  Dr. {profile.name}
                </h2>
                <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
                  ZNU Medical Student
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#f59e0b20', border: '1px solid #f59e0b40',
                  borderRadius: 20, padding: '8px 20px'
                }}>
                  <span style={{ fontSize: 20 }}>⭐</span>
                  <span style={{ color: '#f59e0b', fontWeight: 900, fontSize: 24 }}>{profile.points}</span>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>points</span>
                </div>
              </div>

              {/* Info */}
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
                <h3 style={{ color: '#38bdf8', marginBottom: 16, fontSize: 15 }}>📋 Account Info</h3>
                {[
                  { label: 'Full Name', value: `Dr. ${profile.name}` },
                  { label: 'University Code', value: profile.university_code },
                  { label: 'Email', value: user.email },
                  { label: 'University', value: 'Zagazig National University' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: i < 3 ? `1px solid ${c.border}` : 'none'
                  }}>
                    <span style={{ color: c.sub, fontSize: 13 }}>{item.label}</span>
                    <span style={{ color: c.text, fontSize: 13, fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>

              <button onClick={async () => { await signOut(); navigate('/') }} style={{
                width: '100%', padding: '12px',
                background: '#ef444420', border: '1px solid #ef444440',
                borderRadius: 10, cursor: 'pointer',
                color: '#ef4444', fontFamily: 'inherit',
                fontSize: 14, fontWeight: 700
              }}>
                Sign Out
              </button>
            </div>
          ) : null}
        </>
      )}

      {tab === 'leaderboard' && (
        <div>
          <h2 style={{ color: '#f59e0b', textAlign: 'center', marginBottom: 20 }}>
            🏆 Top 10 Students
          </h2>
          {leaderboard.length === 0 && (
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <p style={{ color: c.sub }}>No data yet 🚧</p>
            </div>
          )}
          {leaderboard.map((student, i) => (
            <div key={i} style={{
              background: i === 0
                ? 'linear-gradient(135deg, #f59e0b20, #f59e0b10)'
                : i === 1
                  ? 'linear-gradient(135deg, #94a3b820, #94a3b810)'
                  : i === 2
                    ? 'linear-gradient(135deg, #cd7c2f20, #cd7c2f10)'
                    : c.card,
              border: `2px solid ${i < 3 ? medalColors[i] + '40' : c.border}`,
              borderRadius: 16, padding: '16px 20px', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 16
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: i < 3 ? `${medalColors[i]}30` : '#1e3a5f',
                border: `2px solid ${i < 3 ? medalColors[i] : c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 16,
                color: i < 3 ? medalColors[i] : c.sub,
                flexShrink: 0
              }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: c.text, fontWeight: 700, fontSize: 15 }}>
                  Dr. {student.name}
                </div>
                <div style={{ color: c.sub, fontSize: 12 }}>
                  {student.university_code}
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#f59e0b20', borderRadius: 20, padding: '4px 12px'
              }}>
                <span style={{ fontSize: 14 }}>⭐</span>
                <span style={{ color: '#f59e0b', fontWeight: 900, fontSize: 16 }}>{student.points}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
