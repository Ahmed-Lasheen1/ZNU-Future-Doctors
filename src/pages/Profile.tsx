// src/pages/Profile.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth, useModules } from '../contexts'
import { getPulseTheme, pulseFonts, pulseType } from '../premiumTheme'
import { glassInput, glassPrimaryBtn, glassGhostBtn } from '../components/pulse/PulseUI'
import { containsProfanity } from '../lib/moderation'
import { useToast } from '../components/ToastProvider'
import LiquidGlassCard from '@/components/ui/liquid-glass-card'
import PulseBackground from '../components/pulse/PulseBackground'
import PulseGlassRow from '../components/pulse/PulseGlassRow'
import { getGuestHistory } from '../lib/reviewStorage'

// Small helper so a missing/blank name never crashes the avatar badge.
function initialOf(name?: string | null) {
  return name && name.trim() ? name.trim().charAt(0).toUpperCase() : '?'
}

interface Profile {
  id: string
  name: string
  points: number
  university_code?: string | null
}

interface HistoryRow {
  module_id?: string | null
  quiz_type: string
  total: number
  correct: number
  score: number
  time_sec?: number | null
  completed_at: string | number
}

interface ProfileModule {
  id: string
  name: string
  icon?: string | null
  color: string
}

function EditProfileForm({ profile, dark, onUpdated, onProfileRefresh }: {
  profile: Profile; dark: boolean; onUpdated: () => void; onProfileRefresh: () => void
}) {
  const pt = getPulseTheme(dark)
  const showToast = useToast() as (message: string, type?: 'success' | 'error') => void

  const [name, setName] = useState(profile.name || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const isSuccess = msg.includes('✅')
  const inStyle = { ...glassInput(pt, dark), padding: '13px 20px' }

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
    <div style={{ marginBottom: 22 }}>
      <LiquidGlassCard dark={dark} delay={0} style={{ padding: '20px 22px' }}>
        <h3 style={{ ...pulseType.sectionLabel, fontSize: 14, color: pt.cobalt, marginBottom: 16 }}>✏️ Edit Profile</h3>

        {msg && (
          <div style={{
            background: isSuccess ? 'rgba(74,222,128,0.12)' : 'rgba(239,107,87,0.12)',
            border: `1px solid ${isSuccess ? 'rgba(74,222,128,0.35)' : 'rgba(239,107,87,0.35)'}`,
            borderRadius: 12, padding: '10px 16px', marginBottom: 16,
            color: isSuccess ? pt.success : pt.danger, fontSize: 13, textAlign: 'center', fontWeight: 600
          }}>{msg}</div>
        )}

        <label style={{ ...pulseType.small, color: pt.textMuted, display: 'block', marginBottom: 6 }}>Full Name</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input value={name} onChange={e => setName(e.target.value)} style={{ ...inStyle, flex: 1, marginBottom: 0 }} />
          <button onClick={saveName} disabled={saving} style={{
            background: pt.cobalt, color: '#fff', border: 'none',
            padding: '0 20px', borderRadius: 999, cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontFamily: pulseFonts.body, fontSize: 13, whiteSpace: 'nowrap'
          }}>Save</button>
        </div>

        <label style={{ ...pulseType.small, color: pt.textMuted, display: 'block', marginBottom: 6 }}>Change Password</label>
        <input type="password" placeholder="New password (min 6 characters)"
          value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inStyle} />
        <input type="password" placeholder="Confirm new password"
          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && savePassword()}
          style={inStyle} />
        <button onClick={savePassword} disabled={saving} style={glassGhostBtn(pt, dark)}>
          {saving ? 'Saving...' : 'Update Password'}
        </button>
      </LiquidGlassCard>
    </div>
  )
}

export default function Profile({ dark }: { dark: boolean }) {
  const { user, signOut, fetchProfile } = useAuth() as {
    user: { id: string; email?: string } | null
    signOut: () => Promise<void>
    fetchProfile: (id: string) => Promise<void>
  }
  const { modules } = useModules() as { modules: ProfileModule[] }
  const navigate = useNavigate()
  const location = useLocation()
  const pt = getPulseTheme(dark)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [leaderboard, setLeaderboard] = useState<Profile[]>([])
  const [tab, setTab] = useState<'profile' | 'leaderboard' | 'history'>(() => {
    const params = new URLSearchParams(location.search)
    const t = params.get('tab')
    return t === 'leaderboard' || t === 'history' ? t : 'profile'
  })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => { fetchData() }, [user])
  useEffect(() => { if (tab === 'history') loadHistory() }, [tab, user])

  async function fetchData() {
    setLoading(true)
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data)
    }
    const { data: lb } = await supabase
      .from('profiles')
      .select('name, points')
      .order('points', { ascending: false })
      .limit(10)
    if (lb) setLeaderboard(lb as Profile[])
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
      setHistory((data || []) as HistoryRow[])
    } else {
      setHistory(getGuestHistory() as HistoryRow[])
    }
    setHistoryLoading(false)
  }

  const medalColors = [pt.amber, '#94a3b8', '#cd7c2f']
  const hoverTint = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PulseBackground />
      <div className="pulse-wide" style={{ position: 'relative', zIndex: 1, padding: '24px 20px 100px', fontFamily: pulseFonts.body, maxWidth: 700, margin: '0 auto' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['profile', 'leaderboard', 'history'] as const).map(t => {
            const active = tab === t
            return (
              <PulseGlassRow
                key={t} dark={dark} radius={999} active={active}
                activeTint={`${pt.cobalt}26`} hoverTint={hoverTint}
                onClick={() => setTab(t)} role="button" tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTab(t) } }}
                style={{ flex: 1, textAlign: 'center' }}
              >
                <div style={{ padding: '10px', ...pulseType.button, color: active ? pt.cobalt : pt.sub }}>
                  {t === 'profile' ? '👤 Profile' : t === 'leaderboard' ? '🏆 Leaderboard' : '🕘 History'}
                </div>
              </PulseGlassRow>
            )
          })}
        </div>

        {tab === 'profile' && (
          <>
            {!user ? (
              <LiquidGlassCard dark={dark} delay={0} style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
                <h3 style={{ ...pulseType.sectionTitle, color: pt.cobalt, marginBottom: 8 }}>Sign in to view your profile</h3>
                <p style={{ color: pt.sub, marginBottom: 20, fontSize: 14 }}>Track your points and save your progress</p>
                <button onClick={() => navigate('/auth')} style={{ ...glassPrimaryBtn(pt, dark, false), width: 'auto', padding: '12px 28px', margin: '0 auto' }}>
                  Sign In
                </button>
              </LiquidGlassCard>
            ) : loading ? (
              <p style={{ color: pt.sub, textAlign: 'center' }}>Loading...</p>
            ) : profile ? (
              <div>
                {/* Profile Card */}
                <div style={{ marginBottom: 16 }}>
                  <LiquidGlassCard dark={dark} delay={0} style={{ padding: '28px 24px', textAlign: 'center' }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${pt.cobalt}, ${pt.indigo})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 auto 16px'
                    }}>
                      {initialOf(profile.name)}
                    </div>
                    <h2 style={{ ...pulseType.sectionTitle, color: pt.cobalt, fontSize: 22, marginBottom: 4 }}>
                      Dr. {profile.name}
                    </h2>
                    <p style={{ color: pt.textMuted, fontSize: 13, marginBottom: 16 }}>ZNU Medical Student</p>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: `${pt.amber}20`, border: `1px solid ${pt.amber}40`,
                      borderRadius: 999, padding: '8px 20px'
                    }}>
                      <span style={{ fontSize: 20 }}>⭐</span>
                      <span style={{ color: pt.amber, fontWeight: 900, fontSize: 24 }}>{profile.points}</span>
                      <span style={{ color: pt.textMuted, fontSize: 13 }}>points</span>
                    </div>
                  </LiquidGlassCard>
                </div>

                {/* Info */}
                <div style={{ marginBottom: 16 }}>
                  <LiquidGlassCard dark={dark} delay={0} style={{ padding: '20px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h3 style={{ ...pulseType.sectionLabel, fontSize: 14, color: pt.cobalt }}>📋 Account Info</h3>
                      <button onClick={() => setEditing(!editing)} style={{
                        background: 'transparent', border: `1px solid ${pt.border}`,
                        borderRadius: 8, padding: '4px 12px', cursor: 'pointer',
                        color: pt.sub, fontFamily: pulseFonts.body, fontSize: 12, fontWeight: 700
                      }}>{editing ? 'Cancel' : '✏️ Edit'}</button>
                    </div>
                    {[
                      { label: 'Full Name', value: `Dr. ${profile.name}` },
                      { label: 'University Code', value: profile.university_code },
                      { label: 'Email', value: user.email },
                      { label: 'University', value: 'Zagazig National University' },
                    ].map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', padding: '10px 0',
                        borderBottom: i < 3 ? `1px solid ${pt.border}` : 'none'
                      }}>
                        <span style={{ color: pt.textMuted, fontSize: 13 }}>{item.label}</span>
                        <span style={{ color: pt.textPrimary, fontSize: 13, fontWeight: 600 }}>{item.value}</span>
                      </div>
                    ))}
                  </LiquidGlassCard>
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
                  width: '100%', padding: '14px',
                  background: 'rgba(239,107,87,0.14)', border: '1px solid rgba(239,107,87,0.35)',
                  borderRadius: 999, cursor: 'pointer',
                  color: pt.danger, fontFamily: pulseFonts.body, fontSize: 14, fontWeight: 700
                }}>
                  Sign Out
                </button>
              </div>
            ) : null}
          </>
        )}

        {tab === 'leaderboard' && (
          <div>
            <h2 style={{ ...pulseType.sectionTitle, color: pt.amber, textAlign: 'center', marginBottom: 20 }}>
              🏆 Top 10 Students
            </h2>
            {leaderboard.length === 0 && (
              <LiquidGlassCard dark={dark} delay={0} style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ color: pt.sub }}>No data yet 🚧</p>
              </LiquidGlassCard>
            )}
            {leaderboard.map((student, i) => {
              const isLast = i === leaderboard.length - 1
              return (
                <div key={i} style={{ marginBottom: isLast ? 0 : 10 }}>
                  <LiquidGlassCard dark={dark} delay={i * 60} style={{
                    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: i < 3 ? `${medalColors[i]}30` : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                      border: `2px solid ${i < 3 ? medalColors[i] : pt.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: 16, color: i < 3 ? medalColors[i] : pt.sub, flexShrink: 0
                    }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ ...pulseType.cardTitle, color: pt.textPrimary }}>Dr. {student.name}</div>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: `${pt.amber}20`, borderRadius: 999, padding: '4px 12px'
                    }}>
                      <span style={{ fontSize: 14 }}>⭐</span>
                      <span style={{ color: pt.amber, fontWeight: 900, fontSize: 16 }}>{student.points}</span>
                    </div>
                  </LiquidGlassCard>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'history' && (
          <div>
            <h2 style={{ ...pulseType.sectionTitle, color: '#e2725b', textAlign: 'center', marginBottom: 8 }}>
              🕘 Exam History
            </h2>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <PulseGlassRow dark={dark} radius={999} hoverTint={hoverTint} onClick={() => navigate('/review')}
                role="button" tabIndex={0} style={{ display: 'inline-block' }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/review') } }}>
                <div style={{ padding: '8px 18px', ...pulseType.small, fontWeight: 700, color: pt.sub }}>
                  📚 See my incorrect & flagged questions
                </div>
              </PulseGlassRow>
            </div>

            {!historyLoading && history.length > 0 && (() => {
              const totalAttempted = history.reduce((a, h) => a + h.total, 0)
              const totalCorrect = history.reduce((a, h) => a + h.correct, 0)
              const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : null
              if (accuracy === null) return null
              return (
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <span style={{ color: '#e2725b', fontWeight: 900, fontSize: 20 }}>🎯 {accuracy}%</span>
                  <span style={{ color: pt.sub, fontSize: 12, fontWeight: 600, marginLeft: 8 }}>
                    overall accuracy ({totalCorrect}/{totalAttempted})
                  </span>
                </div>
              )
            })()}

            {!user && (
              <div style={{ marginBottom: 16 }}>
                <LiquidGlassCard dark={dark} delay={0} style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <span style={{ color: pt.cobalt, fontSize: 13 }}>
                    💡 Showing history saved on this device only.{' '}
                    <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/auth')}>Sign in</span>{' '}
                    to keep it across devices.
                  </span>
                </LiquidGlassCard>
              </div>
            )}

            {historyLoading && <p style={{ color: pt.sub, textAlign: 'center' }}>Loading...</p>}

            {!historyLoading && history.length === 0 && (
              <LiquidGlassCard dark={dark} delay={0} style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ color: pt.sub }}>No exams attempted yet 📚</p>
              </LiquidGlassCard>
            )}

            {!historyLoading && history.map((h, i) => {
              const mod = modules.find(m => m.id === h.module_id)
              const isLast = i === history.length - 1
              return (
                <div key={i} style={{ marginBottom: isLast ? 0 : 10 }}>
                  <LiquidGlassCard dark={dark} delay={i * 50} style={{
                    padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12
                  }}>
                    <div>
                      <div style={{ ...pulseType.cardTitle, fontSize: 14, color: pt.textPrimary }}>
                        {mod ? `${mod.icon} ${mod.name}` : 'Module'} · {h.quiz_type === 'mock' ? '📝 Mock' : '🧪 Practice'}
                      </div>
                      <div style={{ ...pulseType.small, color: pt.textMuted, marginTop: 2 }}>
                        {new Date(h.completed_at).toLocaleDateString()} · {h.correct}/{h.total} correct
                        {h.time_sec ? ` · ${Math.floor(h.time_sec / 60)}m ${h.time_sec % 60}s` : ''}
                      </div>
                    </div>
                    <div style={{
                      background: h.score >= 60 ? 'rgba(74,222,128,0.16)' : 'rgba(239,107,87,0.16)',
                      color: h.score >= 60 ? pt.success : pt.danger,
                      borderRadius: 999, padding: '4px 14px', fontWeight: 900, fontSize: 14, flexShrink: 0
                    }}>{h.score}%</div>
                  </LiquidGlassCard>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
