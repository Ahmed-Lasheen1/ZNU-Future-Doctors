import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, NavMenu, useModules } from '../App'
import { supabase } from '../supabase'
import ErrorBanner from '../components/ErrorBanner'
import { computeStreak } from '../lib/streak'
import { getGuestHistory } from '../lib/reviewStorage'
import { loadSavedActiveExam } from '../lib/activeExam'
import NotifyPermissionButton from '../components/NotifyPermissionButton'

// ── Redesign preview: local tokens ──────────────────────────────────
// One accent — a calm teal — chosen to read clearly on both a near-
// black and a near-white background, so it never needs to change when
// the person toggles dark/light. Scoped to this page for now; once
// approved these move into theme.js for a full rollout.
function tokens(dark) {
  return {
    bg: dark ? '#0A0D10' : '#F7F8FA',
    surface: dark ? '#14181D' : '#FFFFFF',
    line: dark ? '#232830' : '#E3E6EA',
    text: dark ? '#EDEFF2' : '#14181D',
    sub: dark ? '#8B93A0' : '#667085',
    accent: '#0EA5A9',
    shadow: dark ? '0 24px 48px -28px rgba(0,0,0,0.55)' : '0 24px 48px -28px rgba(20,24,29,0.18)',
    display: "'Manrope', 'Segoe UI', sans-serif",
    body: "'Inter', 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  }
}

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)' // deliberate, weighted settle — no bounce

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

// Counts a number up once it becomes active, starting after
// `startDelay` — synced to the moment its container actually becomes
// visible, so the count is something you watch happen, not a number
// that's already finished by the time you can see it.
function useCountUp(target, active, startDelay = 0) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!active || typeof target !== 'number' || Number.isNaN(target)) return
    let raf
    const timeout = setTimeout(() => {
      const start = performance.now()
      const duration = 800
      function tick(now) {
        const p = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - p, 3)
        setDisplay(Math.round(target * eased))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, startDelay)
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf) }
  }, [target, active, startDelay])
  return display
}

// Reveals its children once they scroll into view — everything below
// the hero stays invisible until its moment, then rises into place.
// One-shot: it doesn't re-hide on scrolling back up.
function Reveal({ children, delay = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(18px)',
      transition: `opacity 0.7s ${EASE} ${delay}ms, transform 0.7s ${EASE} ${delay}ms`
    }}>
      {children}
    </div>
  )
}

// Signature element — a full-bleed heartbeat trace behind the hero,
// with a single soft dot continuously running along it. The spike
// height is driven by the student's own streak (capped, so it's a
// subtle "this is about you" touch rather than a gimmick).
function pulsePath(amp) {
  const mid = 90
  return `M0,${mid} L330,${mid} L352,${mid - amp * 0.22} L374,${mid + amp * 0.12} L396,${mid - amp} L418,${mid + amp * 0.45} L442,${mid} L480,${mid} L1000,${mid}`
}

function PulseSVG({ t, streak }) {
  const amp = Math.min(58, 22 + streak * 1.2)
  const d = pulsePath(amp)
  return (
    <svg viewBox="0 0 1000 180" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="pulseFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={t.accent} stopOpacity="0" />
          <stop offset="35%" stopColor={t.accent} stopOpacity="0.55" />
          <stop offset="65%" stopColor={t.accent} stopOpacity="0.55" />
          <stop offset="100%" stopColor={t.accent} stopOpacity="0" />
        </linearGradient>
        <filter id="pulseGlow" x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={d} fill="none" stroke="url(#pulseFade)" strokeWidth="1.75"
        strokeLinecap="round" strokeLinejoin="round"
        filter="url(#pulseGlow)" pathLength="1" className="hero-pulse-draw" />
      <circle r="3.5" fill={t.accent} opacity="0.8" filter="url(#pulseGlow)">
        <animateMotion path={d} dur="4.4s" repeatCount="indefinite" begin="1.8s" />
      </circle>
    </svg>
  )
}

// A thin ruler of tick marks with a single light scanning across it in
// discrete mechanical steps (not eased) — a quiet clock/metronome
// motif under the vitals, distinct from the heartbeat's organic curve.
function TickRail({ t }) {
  return (
    <div aria-hidden="true" style={{
      position: 'relative', width: '100%', maxWidth: 360, height: 10, margin: '30px auto 0',
      backgroundImage: `repeating-linear-gradient(90deg, ${t.line} 0 1.5px, transparent 1.5px 12px)`,
      opacity: 0.9
    }}>
      <div className="tick-scan" style={{ position: 'absolute', top: 0, left: 0, width: 10, height: '100%', background: t.accent, borderRadius: 1 }} />
    </div>
  )
}

function Vital({ raw, suffix, text, label, t, last, delay }) {
  const isNumber = typeof raw === 'number'
  const count = useCountUp(isNumber ? raw : 0, isNumber, delay)
  const shown = isNumber ? `${count}${suffix || ''}` : text
  return (
    <div className="enter-item" style={{ display: 'flex', alignItems: 'center', gap: 24, animationDelay: `${delay}ms` }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontFamily: t.mono, fontSize: 22, fontWeight: 700, color: t.text, letterSpacing: '-0.02em' }}>{shown}</span>
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: t.sub }}>{label}</span>
      </div>
      {!last && <span style={{ width: 4, height: 4, borderRadius: '50%', background: t.accent, opacity: 0.5 }} />}
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
        transform: hover ? 'scale(1.015)' : 'scale(1)',
        boxShadow: hover ? t.shadow : 'none',
        transition: `transform 0.3s ${EASE}, border-color 0.3s ${EASE}, box-shadow 0.3s ${EASE}`,
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
        fontSize: 13, fontWeight: 600, transition: `all 0.25s ${EASE}`,
        transform: hover ? 'translateY(-2px)' : 'translateY(0)'
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
  const [announcement, setAnnouncement] = useState('')
  const [streak, setStreak] = useState(0)
  const [pausedExam, setPausedExam] = useState(null)
  const [weeklySummary, setWeeklySummary] = useState(null)
  const pulseWrapRef = useRef(null)

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

  // Subtle scroll parallax — the hero pulse recedes and fades slightly
  // as the page scrolls away from it, like a rack-focus pulling off.
  // Imperative (ref-driven), not React state, so it never re-renders.
  useEffect(() => {
    let ticking = false
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = Math.min(60, window.scrollY * 0.15)
        const fade = Math.max(0.3, 1 - window.scrollY / 480)
        if (pulseWrapRef.current) {
          pulseWrapRef.current.style.transform = `translate(-50%, ${-y}px)`
          pulseWrapRef.current.style.opacity = fade
        }
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const activeModules = modules.filter(m => m.status === 'active')
  const completedModules = modules.filter(m => m.status === 'completed')

  const vitals = [
    streak > 0 ? { raw: streak, suffix: 'd', label: 'Streak' } : null,
    user && profile ? { raw: profile.points, suffix: '', label: 'Points' } : null,
    weeklySummary ? { raw: weeklySummary.accuracy, suffix: '%', label: 'Week accuracy' } : null,
    weeklySummary ? { raw: weeklySummary.totalAttempted, suffix: '', label: 'Week questions' } : null,
    weeklySummary?.topSubjectName ? { text: weeklySummary.topSubjectName, label: 'Most practiced' } : null,
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
          0% { stroke-dashoffset: 1; opacity: 0.85; }
          70% { stroke-dashoffset: 0; opacity: 0.85; }
          100% { stroke-dashoffset: 0; opacity: 0.5; }
        }
        .hero-pulse-draw { stroke-dasharray: 1; animation: hero-pulse-draw-in 1.4s ${EASE} 0.35s both; }

        @keyframes item-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .enter-item { opacity: 0; animation: item-in 0.8s ${EASE} forwards; }

        @keyframes title-reveal {
          0% { opacity: 0; letter-spacing: 0.3em; filter: blur(8px); transform: translateY(6px); }
          100% { opacity: 1; letter-spacing: -0.02em; filter: blur(0); transform: translateY(0); }
        }
        .title-reveal { opacity: 0; animation: title-reveal 1.1s ${EASE} 0.5s forwards; }

        @keyframes mark-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .mark-in { opacity: 0; animation: mark-in 0.7s ${EASE} 0.1s forwards; }

        @keyframes tick-scan { to { transform: translateX(350px); } }
        .tick-scan { animation: tick-scan 3.4s steps(28, jump-none) infinite; }
      `}</style>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', paddingTop: 28 }}>
        <div ref={pulseWrapRef} style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100vw', height: '100%', overflow: 'hidden', pointerEvents: 'none',
          willChange: 'transform, opacity'
        }} aria-hidden="true">
          <PulseSVG t={t} streak={streak} />
        </div>

        <div className="page-container" style={{ position: 'relative', padding: '0 16px' }}>
          {modulesError && <ErrorBanner />}

          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 44 }}>
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
                  fontFamily: t.display, fontSize: 12, fontWeight: 800, color: '#fff'
                }}>{initialOf(profile.name)}</div>
                <span style={{ color: t.text, fontSize: 13, fontWeight: 600, fontFamily: t.body }}>Dr. {profile.name}</span>
              </div>
            ) : (
              <button onClick={() => navigate('/auth')} style={{
                background: t.accent, color: '#fff', border: 'none',
                padding: '8px 16px', borderRadius: 20, cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: t.body
              }}>Sign In →</button>
            )}
          </div>

          {/* Centered hero content — choreographed: mark, title, subhead, vitals, ticks */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 0 8px' }}>
            <img src={dark ? '/icon-512.png' : '/icon-512-light.png'} alt="ZNU Future Doctors"
              className="mark-in"
              style={{
                width: 68, height: 68, borderRadius: '50%', objectFit: 'cover',
                border: `1px solid ${t.line}`, background: t.bg, marginBottom: 22
              }} />
            <h1 className="title-reveal" style={{
              fontFamily: t.display, fontSize: 'clamp(32px, 5.5vw, 54px)', fontWeight: 800,
              color: t.text, lineHeight: 1.05, marginBottom: 14
            }}>
              ZNU Future Doctors
            </h1>
            <p className="enter-item" style={{ color: t.sub, fontSize: 15, fontFamily: t.body, marginBottom: 32, maxWidth: 420, animationDelay: '850ms' }}>
              Your integrated medical study platform
            </p>

            {vitals.length > 0 && (
              <div className="enter-item" style={{
                display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
                padding: '18px 28px', borderRadius: 16,
                background: t.surface, border: `1px solid ${t.line}`, animationDelay: '1050ms'
              }}>
                {vitals.map((v, i) => (
                  <Vital key={i} t={t} raw={v.raw} suffix={v.suffix} text={v.text} label={v.label}
                    last={i === vitals.length - 1} delay={1150 + i * 90} />
                ))}
              </div>
            )}

            {vitals.length > 0 && <TickRail t={t} />}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="page-container" style={{ padding: '56px 16px 100px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <NotifyPermissionButton dark={dark} label="🔔 Enable exam & deadline reminders" />
        </div>

        {/* Continue where you left off */}
        {pausedExam && (
          <Reveal>
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
          </Reveal>
        )}

        {/* Announcement */}
        {announcement && (
          <Reveal>
            <div style={{
              borderLeft: `3px solid ${t.accent}`, background: t.surface,
              borderRadius: '0 10px 10px 0', padding: '14px 18px', marginBottom: 28,
              color: t.text, fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: t.body,
              textAlign: 'center'
            }}>
              {announcement}
            </div>
          </Reveal>
        )}

        {/* Active Modules */}
        {activeModules.length > 0 && (
          <div style={{ marginBottom: 44 }}>
            <Reveal>{sectionTitle('Active modules')}</Reveal>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 200px))',
              gap: 12, justifyContent: 'center'
            }}>
              {activeModules.map((mod, i) => (
                <Reveal key={mod.id} delay={i * 80}>
                  <ModuleCard mod={mod} t={t} onClick={() => navigate(`/module/${mod.id}`)} />
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {/* Tools */}
        <div style={{ marginBottom: 44 }}>
          <Reveal>{sectionTitle('Tools')}</Reveal>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {toolCards.map((card, i) => (
              <Reveal key={i} delay={i * 80}>
                <ToolChip card={card} t={t} navigate={navigate} />
              </Reveal>
            ))}
          </div>
        </div>

        {/* Completed Modules */}
        {completedModules.length > 0 && (
          <div>
            <Reveal>{sectionTitle('Completed modules')}</Reveal>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 200px))',
              gap: 12, justifyContent: 'center'
            }}>
              {completedModules.map((mod, i) => (
                <Reveal key={mod.id} delay={i * 80}>
                  <ModuleCard mod={mod} t={t} muted onClick={() => navigate(`/module/${mod.id}`)} />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
