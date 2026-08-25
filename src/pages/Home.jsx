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

// Signature element — a full-bleed heartbeat trace behind the hero.
// The spike height is driven by the student's own streak (capped, so
// it stays a subtle "this is about you" touch rather than a gimmick),
// draws in once on load, then holds a slow, faint glow pulse. Every
// other element on the page stays quiet so this one has room to land.
function pulsePath(amp) {
  const mid = 90
  return `M0,${mid} L330,${mid} L352,${mid - amp * 0.22} L374,${mid + amp * 0.12} L396,${mid - amp} L418,${mid + amp * 0.45} L442,${mid} L480,${mid} L1000,${mid}`
}

function HeroPulse({ t, streak }) {
  const amp = Math.min(62, 24 + streak * 1.3)
  const d = pulsePath(amp)
  return (
    <div style={{
      position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100vw', height: '100%', overflow: 'hidden', pointerEvents: 'none'
    }} aria-hidden="true">
      <svg viewBox="0 0 1000 180" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="pulseFade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={t.accent} stopOpacity="0" />
            <stop offset="30%" stopColor={t.accent} stopOpacity="0.9" />
            <stop offset="70%" stopColor={t.accent} stopOpacity="0.9" />
            <stop offset="100%" stopColor={t.accent} stopOpacity="0" />
          </linearGradient>
          <filter id="pulseGlow" x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={d} fill="none" stroke="url(#pulseFade)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          filter="url(#pulseGlow)" pathLength="1" className="hero-pulse-draw" />
      </svg>
    </div>
  )
}

function Vital({ value, label, t, last }) {
  if (value === null || value === undefined) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontFamily: t.mono, fontSize: 22, fontWeight: 700, color: t.text, letterSpacing: '-0.02em' }}>{value}</span>
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: t.sub }}>{label}</span>
      </div>
      {!last && <span style={{ width: 4, height: 4, borderRadius: '50%', background: t.accent, opacity: 0.6 }} />}
    </div>
  )
}

function ModuleCard({ mod, t, muted, onClick }) {
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
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center',
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

  const vitals = [
    streak > 0 ? { value: `${streak}d`, label: 'Streak' } : null,
    user && profile ? { value: profile.points, label: 'Points' } : null,
    weeklySummary ? { value: `${weeklySummary.accuracy}%`, label: 'Week accuracy' } : null,
    weeklySummary ? { value: weeklySummary.totalAttempted, label: 'Week questions' } : null,
    weeklySummary?.topSubjectName ? { value: weeklySummary.topSubjectName, label: 'Most practiced' } : null,
  ].filter(Boolean)

  const sectionTitle = (text) => (
    <h2 style={{
      color: t.sub, fontFamily: t.mono, textAlign: 'center',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
      marginBottom: 16, textTransform: 'uppercase'
    }}>{text}</h2>
  )

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: t.body }}>
      <style>{`
        @keyframes hero-pulse-draw-in {
          0% { stroke-dashoffset: 1; opacity: 0.9; }
          70% { stroke-dashoffset: 0; opacity: 0.9; }
          100% { stroke-dashoffset: 0; opacity: 0.55; }
        }
        @keyframes hero-pulse-glow {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.95; }
        }
        .hero-pulse-draw {
          stroke-dasharray: 1;
          animation: hero-pulse-draw-in 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards,
                     hero-pulse-glow 3.4s ease-in-out 1.6s infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-pulse-draw { animation: none; stroke-dashoffset: 0; opacity: 0.6; }
        }
      `}</style>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', paddingTop: 28 }}>
        <HeroPulse t={t} streak={streak} />

        <div className="page-container" style={{ position: 'relative', padding: '0 16px' }}>
          {modulesError && <ErrorBanner />}

          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={toggleTheme} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} style={{
                background: t.bg, color: t.sub, border: `1px solid ${t.line}`,
                padding: '7px 12px', borderRadius: 9, cursor: 'pointer', fontSize: 15
              }}>{dark ? '☀️' : '🌙'}</button>
              <NavMenu dark={dark} />
              <button onClick={() => navigate('/search')} aria-label="Search" style={{
                background: t.bg, color: t.sub, border: `1px solid ${t.line}`,
                padding: '7px 12px', borderRadius: 9, cursor: 'pointer', fontSize: 15
              }}>🔍</button>
            </div>

            {user && profile ? (
              <div onClick={() => navigate('/profile')} role="button" tabIndex={0}
                onKeyDown={onActivateKeyDown(() => navigate('/profile'))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, background: t.bg,
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

          {/* Centered hero content, riding on top of the pulse trace */}
          <div style={{
            textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '18px 0 8px',
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'all 0.6s ease'
          }}>
            <img src={dark ? '/icon-512.png' : '/icon-512-light.png'} alt="ZNU Future Doctors"
              style={{
                width: 68, height: 68, borderRadius: '50%', objectFit: 'cover',
                border: `1px solid ${t.line}`, background: t.bg, marginBottom: 20
              }} />
            <h1 style={{
              fontFamily: t.display, fontSize: 'clamp(32px, 5.5vw, 54px)', fontWeight: 800,
              color: t.text, letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 12
            }}>
              ZNU Future Doctors
            </h1>
            <p style={{ color: t.sub, fontSize: 15, fontFamily: t.body, marginBottom: 30, maxWidth: 420 }}>
              Your integrated medical study platform
            </p>

            {vitals.length > 0 && (
              <div style={{
                display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
                padding: '18px 28px', borderRadius: 16,
                background: t.surface, border: `1px solid ${t.line}`
              }}>
                {vitals.map((v, i) => (
                  <Vital key={i} t={t} value={v.value} label={v.label} last={i === vitals.length - 1} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="page-container" style={{ padding: '40px 16px 100px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
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
            color: t.text, fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: t.body,
            textAlign: 'center'
          }}>
            {announcement}
          </div>
        )}

        {/* Active Modules */}
        {activeModules.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            {sectionTitle('Active modules')}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 200px))',
              gap: 12, justifyContent: 'center'
            }}>
              {activeModules.map(mod => (
                <ModuleCard key={mod.id} mod={mod} t={t} onClick={() => navigate(`/module/${mod.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* Tools */}
        <div style={{ marginBottom: 40 }}>
          {sectionTitle('Tools')}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {toolCards.map((card, i) => (
              <ToolChip key={i} card={card} t={t} navigate={navigate} />
            ))}
          </div>
        </div>

        {/* Completed Modules */}
        {completedModules.length > 0 && (
          <div>
            {sectionTitle('Completed modules')}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 200px))',
              gap: 12, justifyContent: 'center'
            }}>
              {completedModules.map(mod => (
                <ModuleCard key={mod.id} mod={mod} t={t} muted onClick={() => navigate(`/module/${mod.id}`)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
