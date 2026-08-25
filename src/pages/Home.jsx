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

// Display face used only for the hero title and section dividers on
// this page — a deliberate step away from the body font (Segoe UI,
// used everywhere else) so the header reads as designed rather than
// just "the same text, bigger." Loaded once in index.css.
const DISPLAY_FONT = "'Space Grotesk', 'Segoe UI', sans-serif"

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

// Faint drifting dot-grid, contained inside the hero panel only — the
// "instrument panel" backdrop. Pure decoration layer: pointer-events
// are off and it sits behind everything via z-index.
function HudGridBackdrop() {
  return (
    <div aria-hidden="true" style={{
      position: 'absolute', inset: 0, zIndex: 0,
      backgroundImage: 'radial-gradient(rgba(56,189,248,0.35) 1px, transparent 1.5px)',
      backgroundSize: '24px 24px',
      opacity: 0.5,
      animation: 'hud-grid-drift 22s linear infinite',
      maskImage: 'radial-gradient(ellipse 80% 80% at 50% 20%, black 40%, transparent 90%)',
      WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 20%, black 40%, transparent 90%)',
    }} />
  )
}

// Four L-shaped marks framing the hero panel — a control-room / viewfinder
// motif that reinforces "instrument panel" without adding any content.
function HudCorner({ top, bottom, left, right }) {
  return (
    <div aria-hidden="true" style={{
      position: 'absolute', width: 18, height: 18, zIndex: 2,
      top, bottom, left, right,
      borderTop: top !== undefined ? '2px solid rgba(56,189,248,0.45)' : 'none',
      borderBottom: bottom !== undefined ? '2px solid rgba(56,189,248,0.45)' : 'none',
      borderLeft: left !== undefined ? '2px solid rgba(56,189,248,0.45)' : 'none',
      borderRight: right !== undefined ? '2px solid rgba(56,189,248,0.45)' : 'none',
    }} />
  )
}

// The hero's signature moment: a heartbeat-monitor trace that draws
// itself once the header has faded in, then stays put — a single
// orchestrated beat rather than a looping animation. Grounded in the
// app's own subject (future doctors) instead of a generic divider line.
function EcgDivider({ visible }) {
  return (
    <svg
      viewBox="0 0 300 60" width="200" height="36"
      style={{ display: 'block', margin: '10px auto 0', position: 'relative', zIndex: 1 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ecgGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <path
        d="M0,30 L58,30 L72,10 L86,50 L100,30 L138,30 L152,16 L164,44 L176,30 L300,30"
        fill="none"
        stroke="url(#ecgGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: visible ? 0 : 1,
          transition: 'stroke-dashoffset 1.6s cubic-bezier(0.65, 0, 0.35, 1) 0.5s'
        }}
      />
    </svg>
  )
}

// One readout in the hero's stat strip — tabular numerals, small caps
// label underneath, like an instrument-panel gauge rather than a badge.
function HudChip({ icon, value, label, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 64, padding: '0 6px' }}>
      <div style={{ fontSize: 15, marginBottom: 2 }}>{icon}</div>
      <div style={{
        color, fontWeight: 900, fontSize: 17, fontFamily: DISPLAY_FONT,
        fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
        maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
      }}>{value}</div>
      <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
    </div>
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

  // Technical-drawing-style divider: a line, a label, a line. Replaces
  // plain uppercase text so each section reads like a labeled panel
  // rather than a floating heading.
  function SectionLabel({ text, color }) {
    const lineColor = color || '#334155'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${lineColor}80)` }} />
        <span style={{
          fontFamily: DISPLAY_FONT, fontSize: 12, fontWeight: 700, letterSpacing: 2,
          textTransform: 'uppercase', color: c.sub, whiteSpace: 'nowrap'
        }}>{text}</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${lineColor}80, transparent)` }} />
      </div>
    )
  }

  // Icon-in-a-badge treatment shared by module/tool/completed cards —
  // the icon now reads as an indicator light in a frame, not a loose
  // emoji floating in whitespace.
  function IconBeacon({ icon, color, grayscale }) {
    return (
      <div style={{
        width: 52, height: 52, borderRadius: 14, margin: '0 auto 10px',
        background: `${color}1a`, border: `1px solid ${color}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, filter: grayscale ? 'grayscale(0.5)' : 'none'
      }}>{icon}</div>
    )
  }

  // Glass panel with a colored left accent bar — shared visual language
  // for "Continue where you left off" and the Announcement, so two
  // different kinds of status messages still read as the same family
  // of component instead of two unrelated rounded boxes.
  function Panel({ accentColor, onClick, children, style }) {
    return (
      <div
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? onActivateKeyDown(onClick) : undefined}
        style={{
          position: 'relative', overflow: 'hidden',
          background: dark ? 'linear-gradient(135deg, rgba(30,41,59,0.65), rgba(15,23,42,0.5))' : c.card,
          border: `1px solid ${dark ? 'rgba(148,163,184,0.18)' : c.border}`,
          borderRadius: 16, padding: '16px 20px 16px 26px',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'border-color 0.2s',
          ...style
        }}
        onMouseEnter={onClick ? (e => e.currentTarget.style.borderColor = accentColor) : undefined}
        onMouseLeave={onClick ? (e => e.currentTarget.style.borderColor = dark ? 'rgba(148,163,184,0.18)' : c.border) : undefined}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: accentColor }} />
        {children}
      </div>
    )
  }

  // Unified stat readout for the hero — replaces three separate boxes
  // (streak badge, weekly-summary card) with one instrument strip.
  const chips = []
  if (streak > 0) chips.push({ icon: '🔥', value: streak, label: 'day streak', color: '#f59e0b' })
  if (weeklySummary) {
    chips.push({ icon: '📈', value: `${weeklySummary.accuracy}%`, label: 'week accuracy', color: weeklySummary.accuracy >= 60 ? '#22c55e' : '#ef4444' })
    chips.push({ icon: '✍️', value: weeklySummary.totalAttempted, label: 'questions/wk', color: '#38bdf8' })
    if (weeklySummary.topSubjectName) chips.push({ icon: '📚', value: weeklySummary.topSubjectName, label: 'top subject', color: '#a78bfa' })
  }

  return (
    <div style={{ padding: '24px 16px 100px' }}>
      {modulesError && <div className="page-container"><ErrorBanner /></div>}

      {/* Hero — the instrument panel */}
      <div className="page-container">
        <div style={{
          position: 'relative', overflow: 'hidden',
          borderRadius: 28, padding: '22px 20px 26px',
          border: `1px solid ${dark ? 'rgba(56,189,248,0.2)' : 'rgba(14,165,233,0.25)'}`,
          background: dark
            ? 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(56,189,248,0.10), transparent 70%), linear-gradient(180deg, rgba(15,23,42,0.5), rgba(10,15,30,0.15))'
            : 'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(14,165,233,0.08), transparent 70%), #ffffff',
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'all 0.6s ease'
        }}>
          <HudGridBackdrop />
          <HudCorner top={14} left={14} />
          <HudCorner top={14} right={14} />
          <HudCorner bottom={14} left={14} />
          <HudCorner bottom={14} right={14} />

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
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
                    background: dark ? 'rgba(15,23,42,0.5)' : c.card,
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

            {/* "Vital Pulse" — three rings sweep outward from the icon
                once, like a heartbeat monitor, then settle into the
                icon's own static glow. */}
            <div style={{
              position: 'relative', width: 88, height: 88, margin: '0 auto 12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div className="pulse-ring" />
              <div className="pulse-ring pulse-ring--2" />
              <div className="pulse-ring pulse-ring--3" />
              <img
                src={dark ? '/icon-512.png' : '/icon-512-light.png'}
                alt="ZNU Future Doctors"
                style={{
                  position: 'relative', zIndex: 1,
                  width: 88, height: 88, borderRadius: '50%', objectFit: 'cover',
                  filter: dark ? 'drop-shadow(0 0 20px rgba(56,189,248,0.5))' : 'drop-shadow(0 2px 10px rgba(14,165,233,0.25))'
                }}
              />
            </div>

            <h1 style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 30, fontWeight: 900, letterSpacing: '-0.015em',
              background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginBottom: 8
            }}>ZNU Future Doctors</h1>
            <p style={{ color: c.sub, fontSize: 15 }}>
              Your Integrated Medical Study Platform
            </p>

            <EcgDivider visible={titleVisible} />

            {/* Instrument readout — streak, weekly accuracy, weekly
                volume, top subject. Nothing shown until there's real
                data to report; no empty gauges. */}
            {chips.length > 0 && (
              <div style={{
                display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
                marginTop: 18, paddingTop: 16,
                borderTop: `1px solid ${dark ? 'rgba(148,163,184,0.15)' : '#e2e8f0'}`
              }}>
                {chips.map((chip, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                    {i > 0 && <div style={{ width: 1, height: 30, background: dark ? 'rgba(148,163,184,0.15)' : '#e2e8f0', margin: '0 4px' }} />}
                    <HudChip {...chip} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="page-container" style={{ marginTop: 20 }}>
        <NotifyPermissionButton dark={dark} label="🔔 Enable exam & deadline reminders" />
      </div>

      {/* Continue where you left off */}
      {pausedExam && (
        <div className="page-container" style={{ marginBottom: 24 }}>
          <Panel accentColor="#e2725b" onClick={() => navigate('/mcq')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ color: '#e2725b', fontWeight: 700, fontSize: 14 }}>⏸ Continue where you left off</div>
                <div style={{ color: c.sub, fontSize: 12, marginTop: 2 }}>
                  {Object.keys(pausedExam.answers || {}).length}/{(pausedExam.quizQuestions || []).length} answered
                </div>
              </div>
              <div style={{ color: '#e2725b', fontSize: 20 }}>→</div>
            </div>
          </Panel>
        </div>
      )}

      {/* Announcement */}
      {announcement && (
        <div className="page-container" style={{ marginBottom: 24 }}>
          <Panel accentColor="#38bdf8">
            <div style={{
              color: c.text, fontSize: 14, fontWeight: 600, lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {announcement}
            </div>
          </Panel>
        </div>
      )}

      {/* Active Modules */}
      {activeModules.length > 0 && (
        <div className="page-container" style={{ marginBottom: 32 }}>
          <SectionLabel text="Active Modules" color="#22c55e" />
          <AutoGrid>
            {activeModules.map((mod, i) => (
              <AnimatedCard key={mod.id} delay={200 + i * 80} color={mod.color} dark={dark}
                onClick={() => navigate(`/module/${mod.id}`)}>
                <IconBeacon icon={mod.icon} color={mod.color} />
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
        <SectionLabel text="Tools" />
        <AutoGrid>
          {toolCards.map((card, i) => (
            <AnimatedCard key={i} delay={400 + i * 80} color={card.color} dark={dark}
              onClick={() => navigate(card.to)}>
              <IconBeacon icon={card.emoji} color={card.color} />
              <div style={{ color: c.text, fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 700 }}>{card.title}</div>
            </AnimatedCard>
          ))}
        </AutoGrid>
      </div>

      {/* Completed Modules */}
      {completedModules.length > 0 && (
        <div className="page-container">
          <SectionLabel text="Completed Modules" />
          <AutoGrid>
            {completedModules.map((mod, i) => (
              <AnimatedCard key={mod.id} delay={i * 80} color='#475569' dark={dark}
                onClick={() => navigate(`/module/${mod.id}`)}>
                <IconBeacon icon={mod.icon} color="#64748b" grayscale />
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
