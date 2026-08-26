import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, NavMenu, useModules } from '../App'
import { getTheme } from '../theme'
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
  const c = getTheme(dark)
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { modules, modulesError } = useModules()
  const [titleVisible, setTitleVisible] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [streak, setStreak] = useState(0)
  const [pausedExam, setPausedExam] = useState(null)
  const [weeklySummary, setWeeklySummary] = useState(null)

  useEffect(() => {
    setTimeout(() => setTitleVisible(true), 100)
  }, [])

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

  // "Your Next Move" — a single, best-guess highlighted action. Paused
  // exam wins (most time-sensitive); otherwise the first active module.
  const nextMoveModule = activeModules[0] || null

  const pad2 = (n) => String(n).padStart(2, '0')

  const kickerStyle = {
    color: c.sub, fontSize: 11, fontWeight: 800, letterSpacing: 3,
    textTransform: 'uppercase', marginBottom: 14
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      {modulesError && <div className="page-container" style={{ paddingTop: 20 }}><ErrorBanner /></div>}

      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div className="page-container" style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{
            fontWeight: 900, fontSize: 15, letterSpacing: 1,
            color: dark ? '#e2e8f0' : '#1e293b'
          }}>
            ZNU<span style={{ color: '#38bdf8' }}>.</span>FD
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={toggleTheme} style={iconBtn(dark)} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? '☀️' : '🌙'}
            </button>
            <NavMenu dark={dark} />
            <button onClick={() => navigate('/search')} aria-label="Search" style={iconBtn(dark)}>🔍</button>

            {user && profile ? (
              <div onClick={() => navigate('/profile')}
                role="button" tabIndex={0}
                onKeyDown={onActivateKeyDown(() => navigate('/profile'))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  marginLeft: 4, padding: '4px 10px 4px 4px', borderRadius: 20,
                  border: `1px solid ${c.border}`
                }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0
                }}>{initialOf(profile.name)}</div>
                <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 800 }}>⭐ {profile.points}</span>
              </div>
            ) : (
              <button onClick={() => navigate('/auth')} style={{
                background: 'transparent', color: '#38bdf8', border: '1px solid #38bdf860',
                padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 800,
                marginLeft: 4
              }}>Sign In</button>
            )}
          </div>
        </div>
      </div>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div style={{
        opacity: titleVisible ? 1 : 0,
        transform: titleVisible ? 'translateY(0)' : 'translateY(-16px)',
        transition: 'all 0.7s ease',
      }}>
        <div className="page-container" style={{ padding: '48px 16px 8px' }}>
          <div style={kickerStyle}>ZNU FUTURE DOCTORS</div>
          <h1 style={{
            fontSize: 'clamp(40px, 8vw, 84px)', fontWeight: 900, lineHeight: 0.98,
            letterSpacing: -1.5, margin: 0, color: dark ? '#f1f5f9' : '#0f172a'
          }}>
            Your medical<br />
            journey,<br />
            <span style={{
              background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>mapped.</span>
          </h1>

          <div style={{ marginTop: 28, marginBottom: 8, maxWidth: 520 }}>
            <ZNUPulse color={dark ? '#38bdf8' : '#0ea5e9'} />
          </div>

          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            <span style={{ color: c.sub, fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
              {activeModules.length} ACTIVE MODULE{activeModules.length === 1 ? '' : 'S'}
            </span>
            {streak > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                color: '#f59e0b', fontSize: 12, fontWeight: 800
              }}>
                🔥 {streak}-DAY STREAK
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="page-container" style={{ padding: '4px 16px 0' }}>
        <NotifyPermissionButton dark={dark} label="🔔 Enable exam & deadline reminders" />
      </div>

      {announcement && (
        <div className="page-container" style={{ padding: '0 16px', marginBottom: 8 }}>
          <div style={{
            borderLeft: '3px solid #38bdf8', paddingLeft: 16,
            color: c.text, fontSize: 13, fontWeight: 600, lineHeight: 1.6,
            whiteSpace: 'pre-wrap'
          }}>
            {announcement}
          </div>
        </div>
      )}

      {/* ── YOUR MEDICAL MAP (active modules as chapters) ──────────── */}
      {activeModules.length > 0 && (
        <div className="page-container" style={{ padding: '56px 16px 8px' }}>
          <div style={kickerStyle}>Your Medical Map</div>
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
                  borderBottom: `1px solid ${c.border}`,
                  borderLeft: '3px solid transparent',
                  paddingLeft: 16, transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderLeftColor = mod.color; e.currentTarget.style.background = `${mod.color}08` }}
                onMouseLeave={e => { e.currentTarget.style.borderLeftColor = 'transparent'; e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900,
                  color: c.border, minWidth: 60, flexShrink: 0
                }}>{pad2(i + 1)}</div>

                <div style={{ fontSize: 26, flexShrink: 0 }}>{mod.icon}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'clamp(16px, 1.6vw, 22px)', fontWeight: 800,
                    color: mod.color, letterSpacing: -0.3
                  }}>{mod.name}</div>
                  <div style={{ color: c.sub, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginTop: 4 }}>
                    ● ACTIVE
                  </div>
                </div>

                <div style={{
                  color: mod.color, fontWeight: 800, fontSize: 13,
                  whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: 0.5
                }}>
                  CONTINUE →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── WHERE YOU ARE NOW (weekly summary, big numbers) ────────── */}
      {weeklySummary && (
        <div className="page-container" style={{ padding: '56px 16px 8px' }}>
          <div style={kickerStyle}>Where You Are Now</div>
          <div style={{ display: 'flex', gap: 'clamp(24px, 6vw, 64px)', flexWrap: 'wrap', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: 'clamp(44px, 7vw, 72px)', fontWeight: 900, color: dark ? '#f1f5f9' : '#0f172a', lineHeight: 1 }}>
                {weeklySummary.totalAttempted}
              </div>
              <div style={{ color: c.sub, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginTop: 6 }}>QUESTIONS THIS WEEK</div>
            </div>
            <div>
              <div style={{
                fontSize: 'clamp(44px, 7vw, 72px)', fontWeight: 900, lineHeight: 1,
                color: weeklySummary.accuracy >= 60 ? '#22c55e' : '#ef4444'
              }}>
                {weeklySummary.accuracy}%
              </div>
              <div style={{ color: c.sub, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginTop: 6 }}>ACCURACY</div>
            </div>
            {weeklySummary.topSubjectName && (
              <div>
                <div style={{ fontSize: 'clamp(20px, 2.4vw, 28px)', fontWeight: 800, color: '#a78bfa', lineHeight: 1.2 }}>
                  {weeklySummary.topSubjectName}
                </div>
                <div style={{ color: c.sub, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginTop: 6 }}>MOST PRACTICED</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── YOUR NEXT MOVE (single highlighted action) ─────────────── */}
      {(pausedExam || nextMoveModule) && (
        <div className="page-container" style={{ padding: '56px 16px 8px' }}>
          <div style={kickerStyle}>Your Next Move</div>

          {pausedExam ? (
            <div
              role="button" tabIndex={0}
              onClick={() => navigate('/mcq')}
              onKeyDown={onActivateKeyDown(() => navigate('/mcq'))}
              style={{
                background: dark ? 'linear-gradient(135deg, #7c2d1230, #7c2d1210)' : '#fff7ed',
                border: '2px solid #e2725b', borderRadius: 4,
                padding: '28px 24px', cursor: 'pointer', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap'
              }}>
              <div>
                <div style={{ color: '#e2725b', fontWeight: 900, fontSize: 'clamp(18px, 2vw, 24px)', marginBottom: 6 }}>
                  ⏸ CONTINUE WHERE YOU LEFT OFF
                </div>
                <div style={{ color: c.sub, fontSize: 13 }}>
                  {Object.keys(pausedExam.answers || {}).length}/{(pausedExam.quizQuestions || []).length} answered
                </div>
              </div>
              <div style={{ color: '#e2725b', fontSize: 28, fontWeight: 900 }}>→</div>
            </div>
          ) : nextMoveModule && (
            <div
              role="button" tabIndex={0}
              onClick={() => navigate(`/mcq?module=${nextMoveModule.id}`)}
              onKeyDown={onActivateKeyDown(() => navigate(`/mcq?module=${nextMoveModule.id}`))}
              style={{
                background: dark ? `${nextMoveModule.color}12` : `${nextMoveModule.color}0c`,
                border: `2px solid ${nextMoveModule.color}`, borderRadius: 4,
                padding: '28px 24px', cursor: 'pointer', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap'
              }}>
              <div>
                <div style={{ color: nextMoveModule.color, fontWeight: 900, fontSize: 'clamp(18px, 2vw, 24px)', marginBottom: 6 }}>
                  {nextMoveModule.icon} PRACTICE {nextMoveModule.name.toUpperCase()}
                </div>
                <div style={{ color: c.sub, fontSize: 13 }}>Pick up your MCQ bank right where it matters most</div>
              </div>
              <div style={{ color: nextMoveModule.color, fontSize: 28, fontWeight: 900 }}>→</div>
            </div>
          )}
        </div>
      )}

      {/* ── KEEP GOING (tools + completed modules) ─────────────────── */}
      <div className="page-container" style={{ padding: '56px 16px 8px' }}>
        <div style={kickerStyle}>Keep Going</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 28px', marginBottom: completedModules.length > 0 ? 40 : 0 }}>
          {toolCards.map((card, i) => (
            <div
              key={i} role="button" tabIndex={0}
              onClick={() => navigate(card.to)}
              onKeyDown={onActivateKeyDown(() => navigate(card.to))}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                padding: '10px 4px', borderBottom: '2px solid transparent'
              }}
              onMouseEnter={e => e.currentTarget.style.borderBottomColor = '#38bdf8'}
              onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}
            >
              <span style={{ fontSize: 18 }}>{card.emoji}</span>
              <span style={{ color: c.text, fontWeight: 700, fontSize: 14 }}>{card.title}</span>
            </div>
          ))}
        </div>

        {completedModules.length > 0 && (
          <div>
            <div style={{ color: c.sub, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
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
                    padding: '6px 0', opacity: 0.65
                  }}
                >
                  <span style={{ fontSize: 15, filter: 'grayscale(0.5)' }}>{mod.icon}</span>
                  <span style={{ color: c.sub, fontWeight: 600, fontSize: 13 }}>{mod.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const iconBtn = (dark) => ({
  background: dark ? 'rgba(56,189,248,0.1)' : '#f1f5f9',
  color: dark ? '#38bdf8' : '#475569',
  border: `1px solid ${dark ? 'rgba(56,189,248,0.3)' : '#e2e8f0'}`,
  padding: '6px 12px', borderRadius: 10,
  cursor: 'pointer', fontSize: 15, fontWeight: 700
})
