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

// ── The Pulse ──────────────────────────────────────────────────────
// The product's one visual signature. Instead of a "🔥 N-day streak"
// badge, the student's study rhythm is a literal, moving signal — it
// goes flat at zero (no heartbeat, be honest about it) and speeds up
// the longer the streak runs. Every animated page below should read
// as one continuous idea, not a decoration bolted onto a dashboard.
const PULSE_UNIT = 'M0,32 L90,32 L110,6 L132,58 L152,32 L400,32'
function Pulse({ streak, color }) {
  const flat = streak === 0
  const speed = flat ? 0 : Math.max(2.2, 6.5 - streak * 0.35)
  return (
    <div style={{ width: '100%', overflow: 'hidden', height: 56, position: 'relative' }} aria-hidden="true">
      <style>{`
        @keyframes znuPulseScroll { from { transform: translateX(0); } to { transform: translateX(-400px); } }
        @keyframes znuDotPulse { 0%, 100% { opacity: .45; transform: scale(1); } 50% { opacity: 1; transform: scale(1.6); } }
        @media (prefers-reduced-motion: reduce) {
          .znu-pulse-track, .znu-live-dot { animation: none !important; }
        }
      `}</style>
      <svg width="800" height="56" viewBox="0 0 800 56" style={{ position: 'absolute', left: 0, top: 0 }}>
        <g className="znu-pulse-track" style={{ animation: flat ? 'none' : `znuPulseScroll ${speed}s linear infinite` }}>
          <path d={flat ? 'M0,32 L800,32' : PULSE_UNIT} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity={flat ? 0.3 : 0.9} />
          <path d={flat ? 'M400,32 L1200,32' : PULSE_UNIT} transform="translate(400,0)" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity={flat ? 0.3 : 0.9} />
        </g>
      </svg>
    </div>
  )
}

function SectionLabel({ children, c }) {
  return (
    <div style={{ color: c.sub, fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 18 }}>
      {children}
    </div>
  )
}

function StatBlock({ value, label, color, small }) {
  return (
    <div>
      <div style={{ fontSize: small ? 'clamp(16px,2vw,20px)' : 'clamp(28px,4vw,44px)', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    </div>
  )
}

function ModuleRow({ mod, dark, c, onClick, muted }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      role="button" tabIndex={0}
      onClick={onClick}
      onKeyDown={onActivateKeyDown(onClick)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        padding: '20px 4px', cursor: 'pointer',
        borderBottom: `1px solid ${c.border}`,
        transition: 'padding-left 0.25s ease',
        paddingLeft: hover ? 12 : 4
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
        <span style={{ fontSize: 26, flexShrink: 0, filter: muted ? 'grayscale(0.6)' : 'none', opacity: muted ? 0.6 : 1 }}>{mod.icon}</span>
        <span style={{
          fontSize: 'clamp(18px, 2.4vw, 26px)', fontWeight: 800,
          color: hover ? mod.color : muted ? c.sub : c.text,
          transition: 'color 0.2s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>{mod.name}</span>
        {!muted && (
          <span className="znu-live-dot" style={{
            width: 7, height: 7, borderRadius: '50%', background: mod.color, flexShrink: 0,
            animation: 'znuDotPulse 2s ease-in-out infinite'
          }} />
        )}
      </div>
      <span style={{ color: hover ? mod.color : c.sub, fontSize: 20, transition: 'all 0.2s', transform: hover ? 'translateX(4px)' : 'none', flexShrink: 0 }}>→</span>
    </div>
  )
}

function ToolLink({ t, c, navigate }) {
  const [hover, setHover] = useState(false)
  return (
    <span
      role="button" tabIndex={0}
      onClick={() => navigate(t.to)}
      onKeyDown={onActivateKeyDown(() => navigate(t.to))}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer', fontSize: 15, fontWeight: 700,
        color: hover ? '#38bdf8' : c.text,
        borderBottom: `2px solid ${hover ? '#38bdf8' : 'transparent'}`,
        paddingBottom: 2, transition: 'all 0.2s', whiteSpace: 'nowrap'
      }}>
      {t.emoji} {t.title}
    </span>
  )
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
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    setTimeout(() => setTitleVisible(true), 100)
  }, [])

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'home_announcement').single()
      .then(({ data }) => { if (data?.value) setAnnouncement(data.value) })
  }, [])

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

  useEffect(() => {
    loadSavedActiveExam(user).then(setPausedExam)
  }, [user])

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

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      {modulesError && <div className="page-container"><ErrorBanner /></div>}

      {/* Top bar — minimal, no chrome */}
      <div className="page-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={toggleTheme} style={{
            background: 'transparent', color: dark ? '#38bdf8' : '#0ea5e9',
            border: 'none', padding: '6px 8px', cursor: 'pointer', fontSize: 16
          }} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? '☀️' : '🌙'}</button>
          <NavMenu dark={dark} />
          <button onClick={() => navigate('/search')} aria-label="Search" style={{
            background: 'transparent', color: dark ? '#38bdf8' : '#0ea5e9',
            border: 'none', padding: '6px 8px', cursor: 'pointer', fontSize: 16
          }}>🔍</button>
        </div>

        {user && profile ? (
          <span onClick={() => navigate('/profile')} role="button" tabIndex={0}
            onKeyDown={onActivateKeyDown(() => navigate('/profile'))}
            style={{ cursor: 'pointer', fontSize: 13, fontWeight: 700, color: c.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff'
            }}>{initialOf(profile.name)}</span>
            Dr. {profile.name} <span style={{ color: '#f59e0b' }}>· ⭐ {profile.points}</span>
          </span>
        ) : (
          <span onClick={() => navigate('/auth')} role="button" tabIndex={0}
            onKeyDown={onActivateKeyDown(() => navigate('/auth'))}
            style={{ cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>Sign in →</span>
        )}
      </div>

      {/* Editorial hero */}
      <div className="page-container" style={{
        opacity: titleVisible ? 1 : 0,
        transform: titleVisible ? 'translateY(0)' : 'translateY(-16px)',
        transition: 'all 0.6s ease', marginBottom: 8
      }}>
        <div style={{ fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: c.sub, marginBottom: 14 }}>
          Zagazig National University · Faculty of Medicine
        </div>
        <h1 style={{
          fontSize: 'clamp(42px, 9vw, 104px)', fontWeight: 900, lineHeight: 0.92,
          letterSpacing: '-0.03em', color: c.text, marginBottom: 4
        }}>
          Future<br />Doctors.
        </h1>

        <Pulse streak={streak} color={dark ? '#38bdf8' : '#0ea5e9'} />

        <div style={{ color: c.sub, fontSize: 14, fontWeight: 600, marginTop: 4 }}>
          {streak > 0 ? `${streak}-day study pulse — keep it going` : 'No pulse yet — answer one question today'}
        </div>
      </div>

      <div className="page-container">
        <NotifyPermissionButton dark={dark} label="🔔 Enable exam & deadline reminders" />
      </div>

      {/* Weekly numbers — no card, just typography */}
      {weeklySummary && (
        <div className="page-container" style={{
          display: 'flex', gap: 'clamp(24px,5vw,56px)', flexWrap: 'wrap', alignItems: 'flex-start',
          borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`,
          padding: '24px 0', margin: '32px auto'
        }}>
          <StatBlock value={weeklySummary.totalAttempted} label="Questions this week" color={c.blue} />
          <StatBlock value={`${weeklySummary.accuracy}%`} label="Accuracy" color={weeklySummary.accuracy >= 60 ? c.green : c.red} />
          {weeklySummary.topSubjectName && (
            <StatBlock value={weeklySummary.topSubjectName} label="Most practiced" color={c.purple} small />
          )}
        </div>
      )}

      {/* Continue paused exam */}
      {pausedExam && (
        <div className="page-container" onClick={() => navigate('/mcq')}
          role="button" tabIndex={0}
          onKeyDown={onActivateKeyDown(() => navigate('/mcq'))}
          style={{ cursor: 'pointer', margin: '32px auto', paddingBottom: 8 }}>
          <div style={{ fontSize: 'clamp(20px,3.2vw,30px)', fontWeight: 800, color: c.pink }}>
            Continue where the pulse left off →
          </div>
          <div style={{ color: c.sub, fontSize: 13, marginTop: 4 }}>
            {Object.keys(pausedExam.answers || {}).length}/{(pausedExam.quizQuestions || []).length} answered
          </div>
        </div>
      )}

      {/* Announcement — a line, not a banner */}
      {announcement && (
        <div className="page-container" style={{
          borderLeft: `3px solid ${c.blue}`, padding: '4px 0 4px 16px', margin: '32px auto',
          color: c.text, fontSize: 14, fontWeight: 600, lineHeight: 1.6, whiteSpace: 'pre-wrap'
        }}>
          {announcement}
        </div>
      )}

      {/* Active Modules — editorial list, not a grid of cards */}
      {activeModules.length > 0 && (
        <div className="page-container" style={{ margin: '56px auto' }}>
          <SectionLabel c={c}>Active modules</SectionLabel>
          <div>
            {activeModules.map(mod => (
              <ModuleRow key={mod.id} mod={mod} dark={dark} c={c} onClick={() => navigate(`/module/${mod.id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* Tools — plain text links */}
      <div className="page-container" style={{ margin: '56px auto' }}>
        <SectionLabel c={c}>Tools</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 28px' }}>
          {toolCards.map(t => <ToolLink key={t.to} t={t} c={c} navigate={navigate} />)}
        </div>
      </div>

      {/* Completed modules — collapsed by default */}
      {completedModules.length > 0 && (
        <div className="page-container" style={{ margin: '56px auto' }}>
          <div
            role="button" tabIndex={0}
            onClick={() => setShowCompleted(v => !v)}
            onKeyDown={onActivateKeyDown(() => setShowCompleted(v => !v))}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: showCompleted ? 18 : 0 }}>
            <SectionLabel c={c}>
              {completedModules.length} completed module{completedModules.length === 1 ? '' : 's'}
            </SectionLabel>
            <span style={{ color: c.sub, fontSize: 12, transform: showCompleted ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          </div>
          {showCompleted && completedModules.map(mod => (
            <ModuleRow key={mod.id} mod={mod} dark={dark} c={c} muted onClick={() => navigate(`/module/${mod.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
