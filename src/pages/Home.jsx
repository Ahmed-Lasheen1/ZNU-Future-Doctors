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

// ── DESIGN TEST BUILD ───────────────────────────────────────────────
// This file applies the "editorial / creative-engineering" redesign
// brief to the Home page ONLY, as a test. Every other page is
// untouched. All existing data-fetching, auth, streak, weekly-summary,
// paused-exam, announcement and exam-reminder logic below is IDENTICAL
// to the previous Home.jsx — only markup/styling changed.

const toolLinks = [
  { title: 'Schedules', to: '/schedule' },
  { title: 'Checklist', to: '/checklist' },
  { title: 'Anonymous Q&A', to: '/anon-questions' },
  { title: 'Leaderboard', to: '/profile?tab=leaderboard' },
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

// ── The ZNU Pulse ────────────────────────────────────────────────────
// The recurring visual signature for the redesign: a single abstract
// waveform, not a literal ECG. It draws itself in once on mount and
// then holds still — it never loops, so it never competes for
// attention with the content around it. `pathLength="1000"` normalizes
// the path so the dash-offset math doesn't depend on exact geometry.
function ZnuPulse({ color, height = 56 }) {
  const [drawn, setDrawn] = useState(false)
  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduceMotion) { setDrawn(true); return }
    const t = setTimeout(() => setDrawn(true), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const d = "M0,32 C40,32 50,10 80,10 C110,10 115,54 145,54 C175,54 180,4 215,4 " +
    "C250,4 250,58 290,58 C320,58 330,28 360,28 L440,28 C460,28 465,44 485,44 " +
    "C505,44 508,14 530,14 C552,14 556,46 580,46 L1200,32"

  return (
    <svg viewBox="0 0 1200 64" width="100%" height={height} preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"
        pathLength="1000"
        style={{
          strokeDasharray: 1000,
          strokeDashoffset: drawn ? 0 : 1000,
          transition: reduceMotion ? 'none' : 'stroke-dashoffset 1.7s cubic-bezier(0.16, 1, 0.3, 1)'
        }} />
    </svg>
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

  // ── Local style helpers (kept inline, matching the codebase's
  // existing convention, so this stays a single drop-in file) ────────
  const accent = dark ? '#38bdf8' : '#0ea5e9'

  const sectionStyle = { padding: '44px 0' }

  const sectionLabel = (text) => (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: 3, color: c.sub,
      marginBottom: 22, textTransform: 'uppercase'
    }}>{text}</div>
  )

  const bigNumberStyle = {
    fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
    fontSize: 'clamp(34px, 5vw, 54px)', fontWeight: 700, color: c.text, lineHeight: 1
  }
  const smallCaptionStyle = { fontSize: 12, color: c.sub, marginTop: 6, fontWeight: 600 }

  const quietIconBtn = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: dark ? '#94a3b8' : '#64748b', fontSize: 16, padding: '6px 10px',
    fontFamily: 'inherit'
  }

  function moduleRow(mod, i, quiet) {
    const go = () => navigate(`/module/${mod.id}`)
    return (
      <div key={mod.id} role="button" tabIndex={0} onClick={go} onKeyDown={onActivateKeyDown(go)}
        onMouseEnter={e => { e.currentTarget.style.paddingLeft = '14px'; e.currentTarget.style.borderColor = quiet ? c.border : mod.color }}
        onMouseLeave={e => { e.currentTarget.style.paddingLeft = '0px'; e.currentTarget.style.borderColor = c.border }}
        style={{
          display: 'flex', alignItems: 'center', gap: 18,
          padding: '20px 0', borderTop: `1px solid ${c.border}`,
          cursor: 'pointer', outline: 'none',
          transition: 'padding-left 0.3s cubic-bezier(0.16,1,0.3,1), border-color 0.3s'
        }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: c.sub, width: 26, flexShrink: 0,
          fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif"
        }}>{String(i + 1).padStart(2, '0')}</span>
        <span style={{ fontSize: 20, flexShrink: 0, opacity: quiet ? 0.5 : 1 }}>{mod.icon}</span>
        <span style={{
          flex: 1, fontSize: 'clamp(15px, 1.8vw, 20px)', fontWeight: 700,
          color: quiet ? c.sub : c.text,
          fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
          textDecoration: quiet ? 'line-through' : 'none', textDecorationColor: c.border,
          minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>{mod.name}</span>
        {!quiet && (
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: mod.color, flexShrink: 0 }}>ACTIVE</span>
        )}
        <span style={{ color: c.sub, fontSize: 16, flexShrink: 0 }}>→</span>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 100 }}>

      {/* ── Utility bar ─────────────────────────────────────────── */}
      <div className="page-container" style={{ padding: '24px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <button onClick={toggleTheme} style={quietIconBtn}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? '☀' : '☾'}</button>
            <NavMenu dark={dark} />
            <button onClick={() => navigate('/search')} aria-label="Search" style={quietIconBtn}>⌕</button>
          </div>

          {user && profile ? (
            <div onClick={() => navigate('/profile')} role="button" tabIndex={0}
              onKeyDown={onActivateKeyDown(() => navigate('/profile'))}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <span style={{ fontSize: 12, color: c.text, fontWeight: 700, letterSpacing: 0.5 }}>
                DR. {(profile.name || '').toUpperCase()}
              </span>
              <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>★ {profile.points}</span>
            </div>
          ) : (
            <button onClick={() => navigate('/auth')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: c.text, fontWeight: 700, fontSize: 12, letterSpacing: 1,
              fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 4
            }}>SIGN IN</button>
          )}
        </div>
      </div>

      {modulesError && <div className="page-container" style={{ padding: '16px 16px 0' }}><ErrorBanner /></div>}

      {/* ── Hero ────────────────────────────────────────────────── */}
      <div className="page-container" style={{ padding: '52px 16px 0' }}>
        <div style={{
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'translateY(0)' : 'translateY(18px)',
          transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)'
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: c.sub, marginBottom: 20 }}>
            ZNU FUTURE DOCTORS{streak > 0 ? `  ·  ${streak}-DAY STREAK 🔥` : ''}
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
            fontSize: 'clamp(38px, 8.5vw, 92px)', lineHeight: 0.96,
            fontWeight: 700, letterSpacing: '-0.03em', color: c.text, margin: 0
          }}>
            YOUR MEDICAL<br />
            <span style={{ color: accent }}>JOURNEY,</span> MAPPED.
          </h1>
          <p style={{ color: c.sub, fontSize: 15, maxWidth: 460, marginTop: 22, lineHeight: 1.7 }}>
            {activeModules.length > 0
              ? `${activeModules.length} active module${activeModules.length === 1 ? '' : 's'} — every question, schedule and summary, in one place.`
              : 'Every question, schedule and summary, in one place.'}
          </p>
        </div>

        <div style={{ margin: '44px 0 4px' }}>
          <ZnuPulse color={accent} />
        </div>
      </div>

      {/* ── Where you are (weekly summary) ─────────────────────── */}
      {weeklySummary && (
        <section className="page-container" style={{ ...sectionStyle, padding: '44px 16px' }}>
          {sectionLabel('WHERE YOU ARE THIS WEEK')}
          <div style={{ display: 'flex', gap: 'clamp(28px, 6vw, 64px)', flexWrap: 'wrap', alignItems: 'baseline' }}>
            <div>
              <div style={bigNumberStyle}>{weeklySummary.totalAttempted}</div>
              <div style={smallCaptionStyle}>questions answered</div>
            </div>
            <div>
              <div style={{ ...bigNumberStyle, color: weeklySummary.accuracy >= 60 ? '#22c55e' : '#ef4444' }}>
                {weeklySummary.accuracy}%
              </div>
              <div style={smallCaptionStyle}>accuracy</div>
            </div>
            {weeklySummary.topSubjectName && (
              <div>
                <div style={{ ...bigNumberStyle, fontSize: 'clamp(18px, 2.6vw, 28px)' }}>{weeklySummary.topSubjectName}</div>
                <div style={smallCaptionStyle}>most practiced</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Continue (paused exam + announcement) ──────────────── */}
      {(pausedExam || announcement) && (
        <section className="page-container" style={{ ...sectionStyle, padding: '0 16px 44px' }}>
          {sectionLabel('KEEP GOING')}

          {pausedExam && (
            <div onClick={() => navigate('/mcq')} role="button" tabIndex={0}
              onKeyDown={onActivateKeyDown(() => navigate('/mcq'))}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 12, cursor: 'pointer', padding: '18px 0',
                borderTop: `1px solid ${c.border}`, borderBottom: announcement ? 'none' : `1px solid ${c.border}`
              }}>
              <div>
                <div style={{ color: c.text, fontWeight: 700, fontSize: 15 }}>Continue your paused exam</div>
                <div style={{ color: c.sub, fontSize: 12, marginTop: 4 }}>
                  {Object.keys(pausedExam.answers || {}).length}/{(pausedExam.quizQuestions || []).length} answered
                </div>
              </div>
              <span style={{ color: accent, fontSize: 18 }}>→</span>
            </div>
          )}

          {announcement && (
            <div style={{
              borderTop: `1px solid ${c.border}`,
              padding: '18px 0 4px', marginTop: pausedExam ? 0 : 0
            }}>
              <p style={{
                color: c.text, fontSize: 15, fontWeight: 500, lineHeight: 1.7,
                whiteSpace: 'pre-wrap', borderLeft: `2px solid ${accent}`, paddingLeft: 16
              }}>{announcement}</p>
            </div>
          )}
        </section>
      )}

      {/* ── Your modules ────────────────────────────────────────── */}
      {activeModules.length > 0 && (
        <section className="page-container" style={{ ...sectionStyle, padding: '0 16px 44px' }}>
          {sectionLabel('YOUR MODULES')}
          <div>
            {activeModules.map((mod, i) => moduleRow(mod, i, false))}
            <div style={{ borderTop: `1px solid ${c.border}` }} />
          </div>
        </section>
      )}

      {/* ── Tools ───────────────────────────────────────────────── */}
      <section className="page-container" style={{ ...sectionStyle, padding: '0 16px 44px' }}>
        {sectionLabel('TOOLS')}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 32px', marginBottom: 20 }}>
          {toolLinks.map((t, i) => (
            <button key={i} onClick={() => navigate(t.to)} style={{
              background: 'none', border: 'none', padding: '0 0 3px', cursor: 'pointer',
              fontSize: 15, fontWeight: 700, color: c.text, fontFamily: 'inherit',
              borderBottom: '2px solid transparent', transition: 'border-color 0.2s, color 0.2s'
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = c.text }}>
              {t.title}
            </button>
          ))}
        </div>
        <NotifyPermissionButton dark={dark} label="🔔 Enable exam & deadline reminders" />
      </section>

      {/* ── Completed modules ───────────────────────────────────── */}
      {completedModules.length > 0 && (
        <section className="page-container" style={{ ...sectionStyle, padding: '0 16px' }}>
          {sectionLabel('COMPLETED')}
          <div>
            {completedModules.map((mod, i) => moduleRow(mod, i, true))}
            <div style={{ borderTop: `1px solid ${c.border}` }} />
          </div>
        </section>
      )}
    </div>
  )
}
