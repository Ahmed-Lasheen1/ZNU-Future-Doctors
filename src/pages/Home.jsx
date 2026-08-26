import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, NavMenu, useModules } from '../App'
import { supabase } from '../supabase'
import ErrorBanner from '../components/ErrorBanner'
import { computeStreak } from '../lib/streak'
import { getGuestHistory } from '../lib/reviewStorage'
import { loadSavedActiveExam } from '../lib/activeExam'
import NotifyPermissionButton from '../components/NotifyPermissionButton'
import ZNUPulse from '../components/ZNUPulse'

const toolCards = [
  { emoji: '📅', title: 'Schedules', to: '/schedule' },
  { emoji: '🎯', title: 'Checklist', to: '/checklist' },
  { emoji: '💬', title: 'Anonymous Q&A', to: '/anon-questions' },
  { emoji: '🏆', title: 'Leaderboard', to: '/profile?tab=leaderboard' },
]

// ── Home-page-only color system ───────────────────────────────────────
// Deliberately separate from theme.js: this redesign is scoped to Home
// alone (per request) and specifically bans green/near-black/near-white,
// which the app-wide theme doesn't guarantee. Every other page keeps
// using theme.js untouched.
function homeTheme(dark) {
  return dark ? {
    canvas: '#18263A',
    surface: '#233650',
    surfaceRaised: '#263953',
    textStrong: '#E8EEF7',
    textSub: '#AEBBD0',
    border: '#33486A',
    cobalt: '#5B8DEF',
    indigo: '#9A90F0',
    terracotta: '#E2725B',
    amber: '#F0B84B',
  } : {
    canvas: '#E9EEF5',
    surface: '#F7F9FC',
    surfaceRaised: '#FFFFFF',
    textStrong: '#15243A',
    textSub: '#52637A',
    border: '#C7D2E3',
    cobalt: '#2F6FED',
    indigo: '#6C5FCF',
    terracotta: '#D9634B',
    amber: '#B9791F',
  }
}

// Small helper so a missing/blank name never crashes the avatar badge —
// falls back to a "?" instead of calling .charAt(0) on an empty string.
function initialOf(name) {
  return name && name.trim() ? name.trim().charAt(0).toUpperCase() : '?'
}

// Shared Enter/Space handler for the clickable-div pattern below —
// matches the existing checklist-row keyboard pattern in Checklist.jsx.
function onActivateKeyDown(handler) {
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handler()
    }
  }
}

export default function Home({ dark, toggleTheme }) {
  const t = homeTheme(dark)
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { modules, modulesError } = useModules()
  const [announcement, setAnnouncement] = useState('')
  const [streak, setStreak] = useState(0)
  const [pausedExam, setPausedExam] = useState(null)
  const [weeklySummary, setWeeklySummary] = useState(null)

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'home_announcement').single()
      .then(({ data }) => { if (data?.value) setAnnouncement(data.value) })
  }, [])

  // Study streak — consecutive days with at least one quiz attempt,
  // computed from exam_history (or the guest-local equivalent).
  useEffect(() => {
    async function loadStreak() {
      if (user) {
        const { data } = await supabase.from('exam_history').select('completed_at').eq('user_id', user.id)
        setStreak(computeStreak((data || []).map(r => r.completed_at)))
      } else {
        setStreak(computeStreak(getGuestHistory().map(r => r.completed_at)))
      }
    }
    loadStreak()
  }, [user])

  // "Continue where you left off" — a paused mock/practice exam saved
  // from MCQ.jsx. Clicking it just opens the MCQ page, which shows the
  // same resume banner and does the actual restoring.
  useEffect(() => {
    loadSavedActiveExam(user).then(setPausedExam)
  }, [user])

  // Weekly summary — a lightweight, auto-refreshing recap built purely
  // from exam_history (or its guest-local equivalent), so there's
  // nothing extra to maintain: questions attempted, accuracy, and the
  // most-practiced subject over the last 7 days.
  useEffect(() => {
    async function loadWeekly() {
      const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000
      let rows = []
      if (user) {
        const { data } = await supabase
          .from('exam_history')
          .select('total, correct, subject_id, completed_at')
          .eq('user_id', user.id)
          .gte('completed_at', new Date(weekAgoMs).toISOString())
        rows = data || []
      } else {
        rows = getGuestHistory().filter(h => h.completed_at >= weekAgoMs)
      }

      if (rows.length === 0) { setWeeklySummary(null); return }

      const totalAttempted = rows.reduce((a, h) => a + h.total, 0)
      const totalCorrect = rows.reduce((a, h) => a + h.correct, 0)
      const accuracy = totalAttempted > 0 ? Math.round((100 * totalCorrect) / totalAttempted) : 0

      const bySubject = {}
      rows.forEach(h => { if (h.subject_id) bySubject[h.subject_id] = (bySubject[h.subject_id] || 0) + h.total })
      const topSubjectId = Object.entries(bySubject).sort((a, b) => b[1] - a[1])[0]?.[0] || null

      let topSubjectName = null
      if (topSubjectId) {
        const { data: subData } = await supabase.from('subjects').select('name').eq('id', topSubjectId).single()
        topSubjectName = subData?.name || null
      }

      setWeeklySummary({ totalAttempted, accuracy, topSubjectName })
    }
    loadWeekly()
  }, [user])

  // Upcoming-exam reminder — fires a local notification (only if
  // permission was already granted, at most once per day) when an
  // admin-set exam date is 0-2 days away. This only triggers while the
  // app is actually open; a true always-on background push would need
  // separate push-server infrastructure.
  useEffect(() => {
    async function checkExamReminders() {
      if (!('Notification' in window) || Notification.permission !== 'granted') return
      const { data } = await supabase.from('schedules').select('title, date, module_id').eq('type', 'exam').not('date', 'is', null)
      if (!data || data.length === 0) return

      const today = new Date(); today.setHours(0, 0, 0, 0)
      const upcoming = data.filter(s => {
        const diffDays = Math.round((new Date(s.date) - today) / (24 * 60 * 60 * 1000))
        return diffDays >= 0 && diffDays <= 2
      })
      if (upcoming.length === 0) return

      const todayStr = today.toDateString()
      if (localStorage.getItem('exam_reminder_last_notify') === todayStr) return

      upcoming.forEach(s => {
        const mod = modules.find(m => m.id === s.module_id)
        new Notification('📝 Upcoming Exam', {
          body: `${mod ? mod.name + ' — ' : ''}${s.title} is coming up soon!`
        })
      })
      localStorage.setItem('exam_reminder_last_notify', todayStr)
    }
    checkExamReminders()
  }, [modules])

  const activeModules = modules.filter(m => m.status === 'active')
  const completedModules = modules.filter(m => m.status === 'completed')
  const showWeeklyReport = !!weeklySummary || streak > 0

  const pad2 = (n) => String(n).padStart(2, '0')

  const kickerStyle = {
    color: t.textSub, fontSize: 11, fontWeight: 800, letterSpacing: 3,
    textTransform: 'uppercase', marginBottom: 16
  }

  return (
    <div style={{ background: t.canvas, minHeight: '100vh', paddingBottom: 100 }}>

      {/* 1 — modules-loading error */}
      {modulesError && <div className="page-container" style={{ paddingTop: 20 }}><ErrorBanner /></div>}

      {/* 2 — compact header / ZNU PULSE brand area */}
      <div className="page-container" style={{ padding: '20px 16px 8px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12
        }}>
          {/* Brand mark: ECG + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ZNUPulse color={t.cobalt} />
            <div>
              <div style={{
                fontSize: 19, fontWeight: 900, letterSpacing: 1,
                color: t.textStrong, lineHeight: 1.1
              }}>
                ZNU <span style={{ color: t.cobalt }}>PULSE</span>
              </div>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 2,
                color: t.textSub, textTransform: 'uppercase', marginTop: 1
              }}>
                For Future Doctors
              </div>
            </div>
          </div>

          {/* Utility controls */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={toggleTheme} style={iconBtn(t)} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? '☀️' : '🌙'}
            </button>
            <NavMenu dark={dark} />
            <button onClick={() => navigate('/search')} aria-label="Search" style={iconBtn(t)}>🔍</button>

            {user && profile ? (
              <div onClick={() => navigate('/profile')}
                role="button" tabIndex={0}
                onKeyDown={onActivateKeyDown(() => navigate('/profile'))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  marginLeft: 4, padding: '4px 10px 4px 4px', borderRadius: 20,
                  border: `1px solid ${t.border}`, background: t.surface
                }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${t.cobalt}, ${t.indigo})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0
                }}>{initialOf(profile.name)}</div>
                <span style={{ color: t.amber, fontSize: 11, fontWeight: 800 }}>⭐ {profile.points}</span>
              </div>
            ) : (
              <button onClick={() => navigate('/auth')} style={{
                background: 'transparent', color: t.cobalt, border: `1px solid ${t.cobalt}80`,
                padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 800,
                marginLeft: 4
              }}>Sign In</button>
            )}
          </div>
        </div>
      </div>

      {/* 3 — notification permission control */}
      <div className="page-container" style={{ padding: '10px 16px 0' }}>
        <NotifyPermissionButton dark={dark} label="🔔 Enable exam & deadline reminders" />
      </div>

      {/* 4 — weekly report, including study streak */}
      {showWeeklyReport && (
        <div className="page-container" style={{ padding: '32px 16px 8px' }}>
          <div style={kickerStyle}>This Week</div>
          <div style={{
            background: t.surface, border: `1px solid ${t.border}`, borderRadius: 4,
            padding: '28px 24px', display: 'flex', flexWrap: 'wrap',
            alignItems: 'baseline', gap: 'clamp(24px, 6vw, 56px)'
          }}>
            {weeklySummary && (
              <div>
                <div style={{
                  fontSize: 'clamp(48px, 7vw, 76px)', fontWeight: 900, lineHeight: 1,
                  color: weeklySummary.accuracy >= 60 ? t.cobalt : t.terracotta
                }}>
                  {weeklySummary.accuracy}%
                </div>
                <div style={{ color: t.textSub, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginTop: 6 }}>
                  ACCURACY
                </div>
              </div>
            )}

            {weeklySummary && (
              <div>
                <div style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 800, color: t.textStrong, lineHeight: 1 }}>
                  {weeklySummary.totalAttempted}
                </div>
                <div style={{ color: t.textSub, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginTop: 6 }}>
                  QUESTIONS ATTEMPTED
                </div>
              </div>
            )}

            {weeklySummary?.topSubjectName && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.indigo, lineHeight: 1.3 }}>
                  {weeklySummary.topSubjectName}
                </div>
                <div style={{ color: t.textSub, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginTop: 6 }}>
                  MOST PRACTICED
                </div>
              </div>
            )}

            {streak > 0 && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: t.textStrong }}>
                  {streak}-day streak
                </div>
                <div style={{ color: t.textSub, fontSize: 11, fontWeight: 600, marginTop: 4 }}>
                  of continuous practice
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5 — resume paused exam */}
      {pausedExam && (
        <div className="page-container" style={{ padding: '32px 16px 8px' }}>
          <div
            role="button" tabIndex={0}
            onClick={() => navigate('/mcq')}
            onKeyDown={onActivateKeyDown(() => navigate('/mcq'))}
            style={{
              background: t.surface, border: `2px solid ${t.terracotta}`, borderRadius: 4,
              padding: '24px 24px', cursor: 'pointer', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap'
            }}>
            <div>
              <div style={{ color: t.terracotta, fontWeight: 900, fontSize: 'clamp(16px, 2vw, 20px)', marginBottom: 6 }}>
                ⏸ CONTINUE WHERE YOU LEFT OFF
              </div>
              <div style={{ color: t.textSub, fontSize: 13 }}>
                {Object.keys(pausedExam.answers || {}).length}/{(pausedExam.quizQuestions || []).length} answered
              </div>
            </div>
            <div style={{ color: t.terracotta, fontSize: 26, fontWeight: 900 }}>→</div>
          </div>
        </div>
      )}

      {/* 6 — admin announcement */}
      {announcement && (
        <div className="page-container" style={{ padding: '32px 16px 0' }}>
          <div style={{
            borderLeft: `3px solid ${t.cobalt}`, paddingLeft: 16,
            color: t.textStrong, fontSize: 13, fontWeight: 600, lineHeight: 1.6,
            whiteSpace: 'pre-wrap'
          }}>
            {announcement}
          </div>
        </div>
      )}

      {/* 7 — active modules */}
      {activeModules.length > 0 && (
        <div className="page-container" style={{ padding: '40px 16px 8px' }}>
          <div style={kickerStyle}>Active Modules</div>
          <div>
            {activeModules.map((mod, i) => (
              <div
                key={mod.id}
                role="button" tabIndex={0}
                onClick={() => navigate(`/module/${mod.id}`)}
                onKeyDown={onActivateKeyDown(() => navigate(`/module/${mod.id}`))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 20,
                  padding: '22px 4px', cursor: 'pointer',
                  borderBottom: `1px solid ${t.border}`,
                  borderLeft: '3px solid transparent',
                  paddingLeft: 16, transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderLeftColor = t.cobalt; e.currentTarget.style.background = t.surface }}
                onMouseLeave={e => { e.currentTarget.style.borderLeftColor = 'transparent'; e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900,
                  color: t.border, minWidth: 60, flexShrink: 0
                }}>{pad2(i + 1)}</div>

                <div style={{ fontSize: 26, flexShrink: 0 }}>{mod.icon}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'clamp(16px, 1.6vw, 22px)', fontWeight: 800,
                    color: t.textStrong, letterSpacing: -0.3
                  }}>{mod.name}</div>
                  <div style={{ color: t.cobalt, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginTop: 4 }}>
                    ● ACTIVE
                  </div>
                </div>

                <div style={{
                  color: t.cobalt, fontWeight: 800, fontSize: 13,
                  whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: 0.5
                }}>
                  CONTINUE →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8 — tools: Schedules, Checklist, Anonymous Q&A, Leaderboard */}
      <div className="page-container" style={{ padding: '40px 16px 8px' }}>
        <div style={kickerStyle}>Tools</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 28px' }}>
          {toolCards.map((card, i) => (
            <div
              key={i} role="button" tabIndex={0}
              onClick={() => navigate(card.to)}
              onKeyDown={onActivateKeyDown(() => navigate(card.to))}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                padding: '10px 4px', borderBottom: '2px solid transparent'
              }}
              onMouseEnter={e => e.currentTarget.style.borderBottomColor = t.cobalt}
              onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}
            >
              <span style={{ fontSize: 18 }}>{card.emoji}</span>
              <span style={{ color: t.textStrong, fontWeight: 700, fontSize: 14 }}>{card.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 9 — completed modules */}
      {completedModules.length > 0 && (
        <div className="page-container" style={{ padding: '32px 16px 0' }}>
          <div style={{ color: t.textSub, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
            ✓ COMPLETED MODULES
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
            {completedModules.map(mod => (
              <div
                key={mod.id} role="button" tabIndex={0}
                onClick={() => navigate(`/module/${mod.id}`)}
                onKeyDown={onActivateKeyDown(() => navigate(`/module/${mod.id}`))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  padding: '6px 0', opacity: 0.7
                }}
              >
                <span style={{ fontSize: 15, filter: 'grayscale(0.4)' }}>{mod.icon}</span>
                <span style={{ color: t.textSub, fontWeight: 600, fontSize: 13 }}>{mod.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10 — Footer is rendered globally in App.jsx, unchanged */}
    </div>
  )
}

const iconBtn = (t) => ({
  background: t.surface,
  color: t.cobalt,
  border: `1px solid ${t.border}`,
  padding: '6px 12px', borderRadius: 10,
  cursor: 'pointer', fontSize: 15, fontWeight: 700
})
