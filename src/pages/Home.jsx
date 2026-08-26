import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, NavMenu, useModules } from '../App'
import { getTheme } from '../theme'
import { getPulseTheme, pulseFont, pulseIconBtn, pulseEyebrow } from '../premiumTheme'
import { supabase } from '../supabase'
import ErrorBanner from '../components/ErrorBanner'
import EcgPulse from '../components/EcgPulse'
import { computeStreak } from '../lib/streak'
import { getGuestHistory } from '../lib/reviewStorage'
import { loadSavedActiveExam } from '../lib/activeExam'
import NotifyPermissionButton from '../components/NotifyPermissionButton'

// Exact same four tools, exact same order — Schedules, Checklist,
// Anonymous Q&A, Leaderboard. Only the visual treatment below changes.
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

// One row in the editorial Active/Completed Modules list — a quiet,
// numbered, chapter-like row instead of a rounded card grid. Keeps the
// exact same click behavior, keyboard activation, module data (name,
// icon, color, status) as the previous card version.
function ModuleRow({ index, mod, onClick, p, quiet }) {
  const [hovered, setHovered] = useState(false)
  const accent = quiet ? p.textFaint : mod.color

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onActivateKeyDown(onClick)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '18px 4px',
        borderBottom: `1px solid ${p.line}`,
        cursor: 'pointer',
        outline: 'none',
        transition: 'padding-left 0.25s ease',
        paddingLeft: hovered ? 10 : 4,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: hovered ? accent : p.textFaint,
          width: 28,
          flexShrink: 0,
          transition: 'color 0.2s ease',
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </div>

      <div style={{ fontSize: quiet ? 20 : 24, flexShrink: 0, filter: quiet ? 'grayscale(0.6)' : 'none', opacity: quiet ? 0.75 : 1 }}>
        {mod.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: quiet ? 16 : 19,
            fontWeight: 700,
            color: quiet ? p.textMuted : p.text,
            letterSpacing: '-0.01em',
          }}
        >
          {mod.name}
        </div>
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: mod.status === 'active' ? accent : p.textFaint,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {mod.status === 'active' ? (
          <>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, display: 'inline-block' }} />
            Active
          </>
        ) : (
          'Completed'
        )}
      </div>

      <div style={{ color: hovered ? accent : p.textFaint, fontSize: 16, transition: 'all 0.2s ease', transform: hovered ? 'translateX(2px)' : 'none' }}>
        →
      </div>
    </div>
  )
}

// One entry in the Tools section — compact and refined rather than a
// rounded pill/card, but still clearly a distinct, tappable target.
function ToolItem({ card, onClick, p }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onActivateKeyDown(onClick)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px 16px',
        border: `1px solid ${hovered ? p.lineStrong : p.line}`,
        borderRadius: 10,
        cursor: 'pointer',
        outline: 'none',
        background: hovered ? p.surfaceRaised : 'transparent',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ fontSize: 20, opacity: 0.9 }}>{card.emoji}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: p.text }}>{card.title}</div>
    </div>
  )
}

export default function Home({ dark, toggleTheme }) {
  const c = getTheme(dark)
  const p = getPulseTheme(dark)
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

  return (
    <div style={{ fontFamily: pulseFont, background: p.bg, minHeight: '100vh' }}>
      {modulesError && (
        <div className="page-container" style={{ padding: '16px 16px 0' }}>
          <ErrorBanner />
        </div>
      )}

      {/* ── Header / Hero ─────────────────────────────────────────── */}
      <header style={{ padding: '26px 16px 0' }}>
        <div className="page-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={toggleTheme} style={pulseIconBtn(p)} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? '☀️' : '🌙'}
            </button>
            <NavMenu dark={dark} />
            <button onClick={() => navigate('/search')} aria-label="Search" style={pulseIconBtn(p)}>🔍</button>
          </div>

          {user && profile ? (
            <div
              onClick={() => navigate('/profile')}
              role="button" tabIndex={0}
              onKeyDown={onActivateKeyDown(() => navigate('/profile'))}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', padding: '4px 4px 4px 4px',
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                border: `1px solid ${p.lineStrong}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: p.accent, flexShrink: 0
              }}>
                {initialOf(profile.name)}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: p.text, fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>Dr. {profile.name}</div>
                <div style={{ color: p.textFaint, fontSize: 11, fontWeight: 600 }}>{profile.points} pts</div>
              </div>
            </div>
          ) : (
            <button onClick={() => navigate('/auth')} style={{
              background: 'transparent', color: p.accent,
              border: `1px solid ${p.lineStrong}`, borderRadius: 8,
              padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              fontFamily: pulseFont,
            }}>Sign In →</button>
          )}
        </div>

        <div className="page-container" style={{
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'translateY(0)' : 'translateY(-14px)',
          transition: 'all 0.7s ease',
          paddingBottom: 6,
        }}>
          <div style={pulseEyebrow(p)}>FOR FUTURE DOCTORS</div>
          <h1 style={{
            fontSize: 'clamp(42px, 7.5vw, 76px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.0,
            color: p.text,
            margin: 0,
          }}>
            ZNU <span style={{ color: p.accent }}>PULSE</span>
          </h1>

          {streak > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 18,
              color: p.warn, fontSize: 13, fontWeight: 700,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.warn, display: 'inline-block' }} />
              {streak}-day study streak
            </div>
          )}
        </div>

        <div className="page-container" style={{ marginTop: 26 }}>
          <EcgPulse color={p.accent} height={92} />
        </div>

        <div className="page-container">
          <div style={{ borderTop: `1px solid ${p.line}`, marginTop: 18 }} />
        </div>
      </header>

      <div className="page-container" style={{ padding: '24px 16px 100px' }}>
        {/* ── Notification permission ───────────────────────────────── */}
        <div style={{ marginBottom: 8 }}>
          <NotifyPermissionButton dark={dark} label="🔔 Enable exam & deadline reminders" />
        </div>

        {/* ── Weekly summary — compact analytical readout ───────────── */}
        {weeklySummary && (
          <div style={{ margin: '28px 0', paddingTop: 4 }}>
            <div style={pulseEyebrow(p)}>This Week</div>
            <div style={{ display: 'flex', gap: 'clamp(28px, 6vw, 56px)', flexWrap: 'wrap', alignItems: 'baseline' }}>
              <div>
                <div style={{ fontSize: 34, fontWeight: 800, color: p.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {weeklySummary.totalAttempted}
                </div>
                <div style={{ color: p.textFaint, fontSize: 12, marginTop: 6, fontWeight: 600 }}>Questions attempted</div>
              </div>
              <div>
                <div style={{ fontSize: 34, fontWeight: 800, color: weeklySummary.accuracy >= 60 ? p.accent : p.danger, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {weeklySummary.accuracy}%
                </div>
                <div style={{ color: p.textFaint, fontSize: 12, marginTop: 6, fontWeight: 600 }}>Accuracy</div>
              </div>
              {weeklySummary.topSubjectName && (
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: p.text, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                    {weeklySummary.topSubjectName}
                  </div>
                  <div style={{ color: p.textFaint, fontSize: 12, marginTop: 6, fontWeight: 600 }}>Most practiced</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Continue where you left off ───────────────────────────── */}
        {pausedExam && (
          <div
            onClick={() => navigate('/mcq')}
            role="button" tabIndex={0}
            onKeyDown={onActivateKeyDown(() => navigate('/mcq'))}
            style={{
              margin: '28px 0', padding: '20px 22px',
              border: `1px solid ${p.lineStrong}`, borderLeft: `3px solid ${p.accent}`,
              borderRadius: 4, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = p.surfaceRaised}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div>
              <div style={{ color: p.text, fontWeight: 700, fontSize: 15 }}>Continue where you left off</div>
              <div style={{ color: p.textFaint, fontSize: 12, marginTop: 4, fontWeight: 600 }}>
                {Object.keys(pausedExam.answers || {}).length}/{(pausedExam.quizQuestions || []).length} answered
              </div>
            </div>
            <div style={{ color: p.accent, fontSize: 20 }}>→</div>
          </div>
        )}

        {/* ── Announcement — quiet notice, not a hero banner ────────── */}
        {announcement && (
          <div style={{
            margin: '28px 0', padding: '16px 20px',
            borderLeft: `2px solid ${p.accent}`,
            color: p.textMuted, fontSize: 14, fontWeight: 500, lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
          }}>
            {announcement}
          </div>
        )}

        {/* ── Active Modules — editorial chapter list ───────────────── */}
        {activeModules.length > 0 && (
          <div style={{ margin: '40px 0 8px' }}>
            <div style={pulseEyebrow(p)}>Active Modules</div>
            <div>
              {activeModules.map((mod, i) => (
                <ModuleRow key={mod.id} index={i} mod={mod} p={p} onClick={() => navigate(`/module/${mod.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* ── Tools — always shown, in this exact order ─────────────── */}
        <div style={{ margin: '40px 0 8px' }}>
          <div style={pulseEyebrow(p)}>Tools</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 10,
          }}>
            {toolCards.map((card, i) => (
              <ToolItem key={i} card={card} p={p} onClick={() => navigate(card.to)} />
            ))}
          </div>
        </div>

        {/* ── Completed Modules — quieter than Active ───────────────── */}
        {completedModules.length > 0 && (
          <div style={{ margin: '40px 0 0' }}>
            <div style={pulseEyebrow(p)}>Completed Modules</div>
            <div>
              {completedModules.map((mod, i) => (
                <ModuleRow key={mod.id} index={i} mod={mod} p={p} quiet onClick={() => navigate(`/module/${mod.id}`)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
