import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, NavMenu, useModules } from '../App'
import { getTheme } from '../theme'
import { supabase } from '../supabase'
import ErrorBanner from '../components/ErrorBanner'
import AnimatedCard from '../components/AnimatedCard'
import AutoGrid from '../components/AutoGrid'
import { computeStreak } from '../lib/streak'
import { getGuestHistory } from '../lib/reviewStorage'
import { loadSavedActiveExam } from '../lib/activeExam'
import NotifyPermissionButton from '../components/NotifyPermissionButton'

const toolCards = [
  { emoji: '📅', title: 'Schedules', to: '/schedule', color: '#a78bfa' },
  { emoji: '🎯', title: 'Checklist', to: '/checklist', color: '#f59e0b' },
  { emoji: '💬', title: 'Anonymous Q&A', to: '/anon-questions', color: '#a78bfa' },
  { emoji: '🏆', title: 'Leaderboard', to: '/profile?tab=leaderboard', color: '#f59e0b' },
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

  const sectionTitle = (text) => (
    <h2 style={{
      color: c.sub,
      fontSize: 13, fontWeight: 700, letterSpacing: 2,
      marginBottom: 16, textTransform: 'uppercase'
    }}>{text}</h2>
  )

  return (
    <div style={{ padding: '24px 16px 100px' }}>
      {modulesError && <div className="page-container"><ErrorBanner /></div>}

      {/* Header */}
      <div style={{
        textAlign: 'center', padding: '30px 0 24px',
        opacity: titleVisible ? 1 : 0,
        transform: titleVisible ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.6s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={toggleTheme} style={{
              background: dark ? 'rgba(56,189,248,0.1)' : '#f1f5f9',
              color: dark ? '#38bdf8' : '#475569',
              border: `1px solid ${dark ? 'rgba(56,189,248,0.3)' : '#e2e8f0'}`,
              padding: '6px 14px', borderRadius: 10,
              cursor: 'pointer', fontSize: 16, fontWeight: 700
            }} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? '☀️' : '🌙'}</button>
            <NavMenu dark={dark} />
            <button onClick={() => navigate('/search')} aria-label="Search" style={{
              background: dark ? 'rgba(56,189,248,0.1)' : '#f1f5f9',
              color: dark ? '#38bdf8' : '#475569',
              border: `1px solid ${dark ? 'rgba(56,189,248,0.3)' : '#e2e8f0'}`,
              padding: '6px 14px', borderRadius: 10,
              cursor: 'pointer', fontSize: 16, fontWeight: 700
            }}>🔍</button>
          </div>

          {/* Profile Bar */}
          {user && profile ? (
            <div onClick={() => navigate('/profile')}
              role="button" tabIndex={0}
              onKeyDown={onActivateKeyDown(() => navigate('/profile'))}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: c.card,
                border: `1px solid ${c.border}`,
                borderRadius: 20, padding: '8px 16px', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#38bdf8'}
              onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0
              }}>
                {initialOf(profile.name)}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: c.text, fontSize: 13, fontWeight: 700 }}>
                  Dr. {profile.name}
                </div>
                <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700 }}>
                  ⭐ {profile.points} points
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => navigate('/auth')} style={{
              background: '#38bdf820', color: '#38bdf8',
              border: '1px solid #38bdf840',
              padding: '8px 16px', borderRadius: 20,
              cursor: 'pointer', fontSize: 13, fontWeight: 700
            }}>Sign In →</button>
          )}
        </div>

        <img src={dark ? '/icon-512.png' : '/icon-512-light.png'} alt="ZNU Future Doctors" style={{ width: 88, height: 88, marginBottom: 12, borderRadius: '50%', objectFit: 'cover', filter: dark ? 'drop-shadow(0 0 20px rgba(56,189,248,0.5))' : 'drop-shadow(0 2px 10px rgba(14,165,233,0.25))' }} />
        <h1 style={{
          fontSize: 28, fontWeight: 900,
          background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 8
        }}>ZNU Future Doctors</h1>
        <p style={{ color: c.sub, fontSize: 15 }}>
          Your Integrated Medical Study Platform
        </p>

        {streak > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
            background: '#f59e0b20', border: '1px solid #f59e0b40',
            borderRadius: 20, padding: '6px 16px', color: '#f59e0b', fontSize: 13, fontWeight: 700
          }}>
            🔥 {streak}-day study streak
          </div>
        )}
      </div>

      <div className="page-container">
        <NotifyPermissionButton dark={dark} label="🔔 Enable exam & deadline reminders" />
      </div>

      {/* Weekly summary — auto-computed from exam_history, no setup needed */}
      {weeklySummary && (
        <div className="page-container" style={{ marginBottom: 24 }}>
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ color: c.sub, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>
              📈 This Week
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: '#38bdf8', fontWeight: 900, fontSize: 20 }}>{weeklySummary.totalAttempted}</div>
                <div style={{ color: c.sub, fontSize: 11 }}>Questions</div>
              </div>
              <div>
                <div style={{ color: weeklySummary.accuracy >= 60 ? '#22c55e' : '#ef4444', fontWeight: 900, fontSize: 20 }}>{weeklySummary.accuracy}%</div>
                <div style={{ color: c.sub, fontSize: 11 }}>Accuracy</div>
              </div>
              {weeklySummary.topSubjectName && (
                <div>
                  <div style={{ color: '#a78bfa', fontWeight: 900, fontSize: 14 }}>{weeklySummary.topSubjectName}</div>
                  <div style={{ color: c.sub, fontSize: 11 }}>Most practiced</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Continue where you left off */}
      {pausedExam && (
        <div className="page-container" style={{ marginBottom: 24 }}>
          <div onClick={() => navigate('/mcq')}
            role="button" tabIndex={0}
            onKeyDown={onActivateKeyDown(() => navigate('/mcq'))}
            style={{
              background: '#e2725b20', border: '2px solid #e2725b60', borderRadius: 16,
              padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 12, transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#e2725b'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2725b60'}>
            <div>
              <div style={{ color: '#e2725b', fontWeight: 700, fontSize: 14 }}>⏸ Continue where you left off</div>
              <div style={{ color: c.sub, fontSize: 12, marginTop: 2 }}>
                {Object.keys(pausedExam.answers || {}).length}/{(pausedExam.quizQuestions || []).length} answered
              </div>
            </div>
            <div style={{ color: '#e2725b', fontSize: 20 }}>→</div>
          </div>
        </div>
      )}

      {/* Announcement */}
      {announcement && (
        <div className="page-container" style={{ marginBottom: 24 }}>
          <div style={{
            background: 'linear-gradient(135deg, #38bdf820, #818cf815)',
            border: '1px solid #38bdf840', borderRadius: 16,
            padding: '14px 20px', textAlign: 'center',
            color: c.text, fontSize: 14, fontWeight: 600, lineHeight: 1.6,
            whiteSpace: 'pre-wrap'
          }}>
            {announcement}
          </div>
        </div>
      )}

      {/* Active Modules */}
      {activeModules.length > 0 && (
        <div className="page-container" style={{ marginBottom: 32 }}>
          {sectionTitle('🟢 Active Modules')}
          <AutoGrid>
            {activeModules.map((mod, i) => (
              <AnimatedCard key={mod.id} delay={200 + i * 80} color={mod.color} dark={dark}
                onClick={() => navigate(`/module/${mod.id}`)}>
                <div style={{ fontSize: 'clamp(32px, 3.5vw, 52px)', marginBottom: 8 }}>{mod.icon}</div>
                <div style={{ color: c.text, fontSize: 'clamp(14px, 1.2vw, 17px)', fontWeight: 700, marginBottom: 8 }}>{mod.name}</div>
                <div style={{
                  display: 'inline-block', background: '#22c55e20', color: '#22c55e',
                  border: '1px solid #22c55e40', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
                }}>● Active</div>
              </AnimatedCard>
            ))}
          </AutoGrid>
        </div>
      )}

      {/* Tools */}
      <div className="page-container" style={{ marginBottom: 32 }}>
        {sectionTitle('🛠 Tools')}
        <AutoGrid>
          {toolCards.map((card, i) => (
            <AnimatedCard key={i} delay={400 + i * 80} color={card.color} dark={dark}
              onClick={() => navigate(card.to)}>
              <div style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: 8 }}>{card.emoji}</div>
              <div style={{ color: c.text, fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 700 }}>{card.title}</div>
            </AnimatedCard>
          ))}
        </AutoGrid>
      </div>

      {/* Completed Modules */}
      {completedModules.length > 0 && (
        <div className="page-container">
          {sectionTitle('✅ Completed Modules')}
          <AutoGrid>
            {completedModules.map((mod, i) => (
              <AnimatedCard key={mod.id} delay={i * 80} color='#475569' dark={dark}
                onClick={() => navigate(`/module/${mod.id}`)}>
                <div style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: 8, filter: 'grayscale(0.5)' }}>{mod.icon}</div>
                <div style={{ color: c.sub, fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 700, marginBottom: 8 }}>{mod.name}</div>
                <div style={{
                  display: 'inline-block', background: '#47556920', color: '#64748b',
                  border: '1px solid #47556940', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
                }}>✓ Completed</div>
              </AnimatedCard>
            ))}
          </AutoGrid>
        </div>
      )}
    </div>
  )
}
