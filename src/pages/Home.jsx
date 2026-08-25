import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, NavMenu, useModules } from '../App'
import { supabase } from '../supabase'
import ErrorBanner from '../components/ErrorBanner'
import { computeStreak } from '../lib/streak'
import { getGuestHistory } from '../lib/reviewStorage'
import { loadSavedActiveExam } from '../lib/activeExam'
import NotifyPermissionButton from '../components/NotifyPermissionButton'

// ── Redesign preview: local tokens ──────────────────────────────────
// Flat surfaces + hairline borders + one deliberate accent, instead of
// gradients and colored borders everywhere. Scoped to this page for
// now — once approved, these move into theme.js for a full rollout.
function tokens(dark) {
  return {
    bg: dark ? '#0B0F14' : '#F6F7F9',
    surface: dark ? '#121821' : '#FFFFFF',
    line: dark ? '#1E2733' : '#E3E7EC',
    lineStrong: dark ? '#2A3644' : '#CBD3DC',
    text: dark ? '#E7ECF2' : '#141A21',
    sub: dark ? '#8996A6' : '#64748B',
    accent: '#F2A73B',
    accentSoft: dark ? '#F2A73B22' : '#F2A73B18',
    display: "'Manrope', 'Segoe UI', sans-serif",
    body: "'Inter', 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  }
}

const toolCards = [
  { emoji: '📅', title: 'Schedules', to: '/schedule' },
  { emoji: '🎯', title: 'Checklist', to: '/checklist' },
  { emoji: '💬', title: 'Anonymous Q&A', to: '/anon-questions' },
  { emoji: '🏆', title: 'Leaderboard', to: '/profile?tab=leaderboard' },
]

function initialOf(name) {
  return name && name.trim() ? name.trim().charAt(0).toUpperCase() : '?'
}

function onActivateKeyDown(handler) {
  return (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handler()
    }
  }
}

// Signature element — a single continuous heartbeat trace. The one
// place this page spends its "boldness"; everything else stays quiet.
function PulseLine({ t }) {
  return (
    <svg viewBox="0 0 600 32" preserveAspectRatio="none" style={{ width: '100%', height: 24, display: 'block' }} aria-hidden="true">
      <path
        d="M0,16 L138,16 L158,16 L170,2 L182,30 L194,10 L204,16 L226,16 L600,16"
        fill="none" stroke={t.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        className="pulse-trace" pathLength="1"
      />
    </svg>
  )
}

function Vital({ value, label, t }) {
  if (value === null || value === undefined) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontFamily: t.mono, fontSize: 21, fontWeight: 700, color: t.text, letterSpacing: '-0.02em' }}>{value}</span>
      <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: t.sub }}>{label}</span>
    </div>
  )
}

function ModuleCard({ mod, t, dark, muted, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={onClick} role="button" tabIndex={0}
      onKeyDown={onActivateKeyDown(onClick)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: t.surface,
        border: `1px solid ${hover ? t.accent : t.line}`,
        borderRadius: 14, padding: '20px 18px', cursor: 'pointer',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.18s ease, border-color 0.18s ease',
        display: 'flex', flexDirection: 'column', gap: 10,
        opacity: muted ? 0.6 : 1
      }}>
      <span style={{ fontSize: 28, filter: muted ? 'grayscale(0.6)' : 'none' }}>{mod.icon}</span>
      <div style={{ fontFamily: t.display, fontWeight: 700, fontSize: 15, color: t.text }}>{mod.name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: muted ? t.sub : '#22c55e', flexShrink: 0
        }} />
        <span style={{ fontFamily: t.mono, fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.sub }}>
          {muted ? 'Completed' : 'Active'}
        </span>
      </div>
    </div>
  )
}

function ToolChip({ card, t, navigate }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={() => navigate(card.to)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'transparent', border: `1px solid ${hover ? t.accent : t.line}`,
        borderRadius: 10, padding: '10px 16px', cursor: 'pointer',
        color: hover ? t.accent : t.text, fontFamily: t.body,
        fontSize: 13, fontWeight: 600, transition: 'all 0.15s ease'
      }}>
      <span style={{ fontSize: 15 }}>{card.emoji}</span>
      {card.title}
    </button>
  )
}

export default function Home({ dark, toggleTheme }) {
  const t = tokens(dark)
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
  // from exam_history (or its guest-local equivalent): questions
  // attempted, accuracy, and the most-practiced subject over 7 days.
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
  // admin-set exam date is 0-2 days away.
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
      color: t.sub, fontFamily: t.mono,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
      marginBottom: 14, textTransform: 'uppercase'
    }}>{text}</h2>
  )

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: t.body }}>
      <style>{`
        @keyframes pulse-draw {
          0% { stroke-dashoffset: 1; }
          45%, 100% { stroke-dashoffset: 0; }
        }
        .pulse-trace {
          stroke-dasharray: 1;
          animation: pulse-draw 2.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-trace { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>

      <div style={{ padding: '24px 16px 100px' }}>
        {modulesError && <div className="page-container"><ErrorBanner /></div>}

        <div className="page-container" style={{
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 0.5s ease'
        }}>
          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingTop: 4 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={toggleTheme} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} style={{
                background: 'transparent', color: t.sub, border: `1px solid ${t.line}`,
                padding: '7px 12px', borderRadius: 9, cursor: 'pointer', fontSize: 15
              }}>{dark ? '☀️' : '🌙'}</button>
              <NavMenu dark={dark} />
              <button onClick={() => navigate('/search')} aria-label="Search" style={{
                background: 'transparent', color: t.sub, border: `1px solid ${t.line}`,
                padding: '7px 12px', borderRadius: 9, cursor: 'pointer', fontSize: 15
              }}>🔍</button>
            </div>

            {user && profile ? (
              <div onClick={() => navigate('/profile')} role="button" tabIndex={0}
                onKeyDown={onActivateKeyDown(() => navigate('/profile'))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  border: `1px solid ${t.line}`, borderRadius: 20, padding: '6px 14px 6px 6px', cursor: 'pointer'
                }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: t.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: t.display, fontSize: 12, fontWeight: 800, color: '#141A21'
                }}>{initialOf(profile.name)}</div>
                <span style={{ color: t.text, fontSize: 13, fontWeight: 600, fontFamily: t.body }}>Dr. {profile.name}</span>
              </div>
            ) : (
              <button onClick={() => navigate('/auth')} style={{
                background: t.accent, color: '#141A21', border: 'none',
                padding: '8px 16px', borderRadius: 20, cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: t.body
              }}>Sign In →</button>
            )}
          </div>

          {/* Hero */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <img src={dark ? '/icon-512.png' : '/icon-512-light.png'} alt="ZNU Future Doctors"
                style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${t.line}` }} />
              <div>
                <h1 style={{ fontFamily: t.display, fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.01em' }}>
                  ZNU Future Doctors
                </h1>
                <p style={{ color: t.sub, fontSize: 13.5, fontFamily: t.body }}>Your integrated medical study platform</p>
              </div>
            </div>
            <PulseLine t={t} />
          </div>

          {/* Vitals readout */}
          {(streak > 0 || weeklySummary || (user && profile)) && (
            <div style={{
              display: 'flex', gap: 28, flexWrap: 'wrap',
              padding: '18px 4px', marginBottom: 28,
              borderTop: `1px solid ${t.line}`, borderBottom: `1px solid ${t.line}`
            }}>
              <Vital t={t} value={streak > 0 ? `${streak}d` : null} label="Streak" />
              {user && profile && <Vital t={t} value={profile.points} label="Points" />}
              {weeklySummary && <Vital t={t} value={`${weeklySummary.accuracy}%`} label="Week accuracy" />}
              {weeklySummary && <Vital t={t} value={weeklySummary.totalAttempted} label="Week questions" />}
              {weeklySummary?.topSubjectName && <Vital t={t} value={weeklySummary.topSubjectName} label="Most practiced" />}
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <NotifyPermissionButton dark={dark} label="🔔 Enable exam & deadline reminders" />
          </div>

          {/* Continue where you left off */}
          {pausedExam && (
            <div onClick={() => navigate('/mcq')} role="button" tabIndex={0}
              onKeyDown={onActivateKeyDown(() => navigate('/mcq'))}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                borderLeft: `3px solid ${t.accent}`, background: t.surface,
                borderRadius: '0 10px 10px 0', padding: '14px 18px', marginBottom: 14, cursor: 'pointer'
              }}>
              <div>
                <div style={{ color: t.text, fontWeight: 700, fontSize: 13.5, fontFamily: t.body }}>Continue where you left off</div>
                <div style={{ color: t.sub, fontSize: 12, marginTop: 2, fontFamily: t.mono }}>
                  {Object.keys(pausedExam.answers || {}).length}/{(pausedExam.quizQuestions || []).length} answered
                </div>
              </div>
              <span style={{ color: t.accent, fontSize: 18 }}>→</span>
            </div>
          )}

          {/* Announcement */}
          {announcement && (
            <div style={{
              borderLeft: `3px solid ${t.accent}`, background: t.surface,
              borderRadius: '0 10px 10px 0', padding: '14px 18px', marginBottom: 28,
              color: t.text, fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: t.body
            }}>
              {announcement}
            </div>
          )}

          {/* Active Modules */}
          {activeModules.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              {sectionTitle('Active modules')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {activeModules.map(mod => (
                  <ModuleCard key={mod.id} mod={mod} t={t} dark={dark} onClick={() => navigate(`/module/${mod.id}`)} />
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          <div style={{ marginBottom: 36 }}>
            {sectionTitle('Tools')}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {toolCards.map((card, i) => (
                <ToolChip key={i} card={card} t={t} navigate={navigate} />
              ))}
            </div>
          </div>

          {/* Completed Modules */}
          {completedModules.length > 0 && (
            <div>
              {sectionTitle('Completed modules')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {completedModules.map(mod => (
                  <ModuleCard key={mod.id} mod={mod} t={t} dark={dark} muted onClick={() => navigate(`/module/${mod.id}`)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
