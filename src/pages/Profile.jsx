import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth, useModules } from '../App'
import { getTheme, inputStyle } from '../theme'
import { containsProfanity } from '../lib/moderation'
import InlineMessage from '../components/InlineMessage'
import { useToast } from '../components/ToastProvider'
import { getGuestHistory } from '../lib/reviewStorage'

// Small helper so a missing/blank name never crashes the avatar badge —
// falls back to a "?" instead of calling .charAt(0) on an empty string.
function initialOf(name) {
  return name && name.trim() ? name.trim().charAt(0).toUpperCase() : '?'
}

function EditProfileForm({ profile, dark, onUpdated, onProfileRefresh }) {
  const c = getTheme(dark)
  const inStyle = inputStyle(c)
  const showToast = useToast()

  const [name, setName] = useState(profile.name || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function saveName() {
    if (!name.trim()) return setMsg('❌ Name cannot be empty')
    if (containsProfanity(name)) return setMsg('❌ Please choose an appropriate name — it contains inappropriate words')
    setSaving(true)
    setMsg('')
    const { error } = await supabase.from('profiles').update({ name: name.trim() }).eq('id', profile.id)
    setSaving(false)
    if (error) { setMsg('❌ ' + error.message); return }
    setMsg('✅ Name updated!')
    showToast('✅ Name updated')
    // Refresh both this page's local copy AND the shared AuthContext
    // profile — without the second call, the header and Home page kept
    // showing the old name until the user signed out and back in.
    onUpdated()
    onProfileRefresh()
  }

  async function savePassword() {
    if (!newPassword || newPassword.length < 6) return setMsg('❌ Password must be at least 6 characters')
    if (newPassword !== confirmPassword) return setMsg('❌ Passwords do not match')
    setSaving(true)
    setMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    if (error) { setMsg('❌ ' + error.message); return }
    setMsg('✅ Password updated!')
    showToast('✅ Password updated')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <h3 style={{ color: '#38bdf8', marginBottom: 16, fontSize: 15 }}>✏️ Edit Profile</h3>

      <InlineMessage message={msg} />

      <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Full Name</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input value={name} onChange={e => setName(e.target.value)} style={{ ...inStyle, marginBottom: 0, flex: 1 }} />
        <button onClick={saveName} disabled={saving} style={{
          background: '#38bdf8', color: '#0f172a', border: 'none',
          padding: '0 16px', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer',
          fontWeight: 700, fontFamily: 'inherit', fontSize: 13, whiteSpace: 'nowrap'
        }}>Save</button>
      </div>

      <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Change Password</label>
      <input type="password" placeholder="New password (min 6 characters)"
        value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inStyle} />
      <input type="password" placeholder="Confirm new password"
        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && savePassword()}
        style={inStyle} />
      <button onClick={savePassword} disabled={saving} style={{
        width: '100%', padding: '10px', background: 'transparent',
        border: `1px solid ${c.border}`, borderRadius: 10,
        cursor: saving ? 'not-allowed' : 'pointer',
        color: c.text, fontFamily: 'inherit', fontSize: 13, fontWeight: 700
      }}>{saving ? 'Saving...' : 'Update Password'}</button>
    </div>
  )
}

export default function Profile({ dark }) {
  const { user, signOut, fetchProfile } = useAuth()
  const { modules } = useModules()
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [tab, setTab] = useState(() => {
    const params = new URLSearchParams(location.search)
    const t = params.get('tab')
    return t === 'leaderboard' || t === 'history' ? t : 'profile'
  })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const c = getTheme(dark)

  useEffect(() => {
    fetchData()
  }, [user])

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab, user])

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

  async function loadHistory() {
    setHistoryLoading(true)
    if (user) {
      const { data } = await supabase
        .from('exam_history')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(50)
      setHistory(data || [])
    } else {
      // Guest: same idea, just read from this device's localStorage
      // instead of Supabase (see src/lib/reviewStorage.js).
      setHistory(getGuestHistory())
    }
    setHistoryLoading(false)
  }

  const medalColors = ['#f59e0b', '#94a3b8', '#cd7c2f']

  return (
    <div style={{ padding: '20px', maxWidth: 700, margin: '0 auto' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['profile', 'leaderboard', 'history'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px', borderRadius: 10, fontFamily: 'inherit',
            border: `2px solid ${tab === t ? '#38bdf8' : c.border}`,
            background: tab === t ? '#38bdf820' : 'transparent',
            color: tab === t ? '#38bdf8' : c.sub,
            cursor: 'pointer', fontWeight: 700, fontSize: 13
          }}>
            {t === 'profile' ? '👤 Profile' : t === 'leaderboard' ? '🏆 Leaderboard' : '🕘 History'}
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
                  {initialOf(profile.name)}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ color: '#38bdf8', fontSize: 15 }}>📋 Account Info</h3>
                  <button onClick={() => setEditing(!editing)} style={{
                    background: 'transparent', border: `1px solid ${c.border}`,
                    borderRadius: 8, padding: '4px 12px', cursor: 'pointer',
                    color: c.sub, fontFamily: 'inherit', fontSize: 12, fontWeight: 700
                  }}>{editing ? 'Cancel' : '✏️ Edit'}</button>
                </div>
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

              {editing && (
                <EditProfileForm
                  profile={profile}
                  dark={dark}
                  onUpdated={fetchData}
                  onProfileRefresh={() => fetchProfile(user.id)}
                />
              )}

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

      {tab === 'history' && (
        <div>
          <h2 style={{ color: '#f472b6', textAlign: 'center', marginBottom: 8 }}>
            🕘 Exam History
          </h2>

          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <button onClick={() => navigate('/review')} style={{
              background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 20,
              padding: '6px 16px', color: c.sub, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700
            }}>📚 See my incorrect & flagged questions</button>
          </div>

          {!historyLoading && history.length > 0 && (() => {
            const totalAttempted = history.reduce((a, h) => a + h.total, 0)
            const totalCorrect = history.reduce((a, h) => a + h.correct, 0)
            const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : null
            if (accuracy === null) return null
            return (
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <span style={{ color: '#f472b6', fontWeight: 900, fontSize: 20 }}>🎯 {accuracy}%</span>
                <span style={{ color: c.sub, fontSize: 12, fontWeight: 600, marginLeft: 8 }}>
                  overall accuracy ({totalCorrect}/{totalAttempted})
                </span>
              </div>
            )
          })()}

          {!user && (
            <div style={{
              background: '#38bdf820', border: '1px solid #38bdf840', borderRadius: 12,
              padding: '10px 16px', marginBottom: 16, textAlign: 'center', fontSize: 13, color: '#38bdf8'
            }}>
              💡 Showing history saved on this device only.{' '}
              <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/auth')}>Sign in</span>{' '}
              to keep it across devices.
            </div>
          )}

          {historyLoading && <p style={{ color: c.sub, textAlign: 'center' }}>Loading...</p>}

          {!historyLoading && history.length === 0 && (
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <p style={{ color: c.sub }}>No exams attempted yet 📚</p>
            </div>
          )}

          {!historyLoading && history.map((h, i) => {
            const mod = modules.find(m => m.id === h.module_id)
            const completedAt = h.completed_at
            return (
              <div key={i} style={{
                background: c.card, border: `1px solid ${c.border}`, borderRadius: 14,
                padding: '14px 18px', marginBottom: 10, display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', gap: 12
              }}>
                <div>
                  <div style={{ color: c.text, fontWeight: 700, fontSize: 14 }}>
                    {mod ? `${mod.icon} ${mod.name}` : 'Module'} · {h.quiz_type === 'mock' ? '📝 Mock' : '🧪 Practice'}
                  </div>
                  <div style={{ color: c.sub, fontSize: 12, marginTop: 2 }}>
                    {new Date(completedAt).toLocaleDateString()} · {h.correct}/{h.total} correct
                    {h.time_sec ? ` · ${Math.floor(h.time_sec / 60)}m ${h.time_sec % 60}s` : ''}
                  </div>
                </div>
                <div style={{
                  background: h.score >= 60 ? '#22c55e20' : '#ef444420',
                  color: h.score >= 60 ? '#22c55e' : '#ef4444',
                  borderRadius: 20, padding: '4px 14px', fontWeight: 900, fontSize: 14, flexShrink: 0
                }}>{h.score}%</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
