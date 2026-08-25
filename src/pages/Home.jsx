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
// Minimal palette, one accent *system* (a cyan→violet gradient) instead
// of many colors — the "alive" feeling comes from motion, not from
// adding more hues. Scoped to this page for now; once approved these
// move into theme.js for a full rollout.
function tokens(dark) {
  return {
    bg: dark ? '#05070A' : '#FAFAFC',
    surface: dark ? '#0E1116' : '#FFFFFF',
    line: dark ? '#1B2028' : '#E4E7EC',
    text: dark ? '#F3F5F8' : '#12151B',
    sub: dark ? '#838DA0' : '#667085',
    accentA: '#22D3EE', // cyan
    accentB: '#A855F7', // violet
    gradient: 'linear-gradient(120deg, #22D3EE, #A855F7)',
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

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = () => setReduced(mq.matches)
    mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler)
    return () => (mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler))
  }, [])
  return reduced
}

// Animates a number counting up from 0 once it becomes active — the
// vitals feel like they're "reading" rather than just appearing.
function useCountUp(target, active) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!active || typeof target !== 'number' || Number.isNaN(target)) return
    let raf
    const start = performance.now()
    const duration = 900
    function tick(now) {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active])
  return display
}

// Signature element — a full-bleed heartbeat trace behind the hero,
// with a bright dot continuously running along it. The spike height is
// driven by the student's own streak (capped, so it's a subtle
// "this is about you" touch rather than a gimmick).
function pulsePath(amp) {
  const mid = 90
  return `M0,${mid} L330,${mid} L352,${mid - amp * 0.22} L374,${mid + amp * 0.12} L396,${mid - amp} L418,${mid + amp * 0.45} L442,${mid} L480,${mid} L1000,${mid}`
}

function HeroPulse({ t, streak, motionOK }) {
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
            <stop offset="0%" stopColor={t.accentA} stopOpacity="0" />
            <stop offset="30%" stopColor={t.accentA} stopOpacity="0.9" />
            <stop offset="70%" stopColor={t.accentB} stopOpacity="0.9" />
            <stop offset="100%" stopColor={t.accentB} stopOpacity="0" />
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
        {motionOK && (
          <circle r="4.5" fill={t.accentA} filter="url(#pulseGlow)">
            <animateMotion path={d} dur="3.2s" repeatCount="indefinite" begin="1.4s" />
          </circle>
        )}
      </svg>
    </div>
  )
}

// Two soft, blurred orbs drifting slowly behind the hero — the
// "atmosphere" the rest of the page's motion sits inside.
function AuroraGlow({ t }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div className="aurora-orb aurora-orb-a" style={{ background: t.accentA }} />
      <div className="aurora-orb aurora-orb-b" style={{ background: t.accentB }} />
    </div>
  )
}

function Vital({ raw, suffix, text, label, t, last, delay }) {
  const isNumber = typeof raw === 'number'
  const count = useCountUp(isNumber ? raw : 0, isNumber)
  const shown = isNumber ? `${count}${suffix || ''}` : text
  return (
    <div className="enter-item" style={{ display: 'flex', alignItems: 'center', gap: 24, animationDelay: `${delay}ms` }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontFamily: t.mono, fontSize: 22, fontWeight: 700, color: t.text, letterSpacing: '-0.02em' }}>{shown}</span>
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: t.sub }}>{label}</span>
      </div>
      {!last && <span style={{ width: 4, height: 4, borderRadius: '50%', background: t.accentA, opacity: 0.6 }} />}
    </div>
  )
}

function ModuleCard({ mod, t, muted, onClick, delay }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      className="enter-item"
      onClick={onClick} role="button" tabIndex={0}
      onKeyDown={onActivateKeyDown(onClick)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: t.surface,
        border: `1px solid ${hover ? t.accentA : t.line}`,
        borderRadius: 14, padding: '20px 18px', cursor: 'pointer',
        transform: hover ? 'translateY(-3px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: hover ? `0 12px 30px -12px ${t.accentA}55` : 'none',
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center',
        opacity: muted ? 0.6 : 1, animationDelay: `${delay}ms`
      }}>
      <span style={{ fontSize: 28, filter: muted ? 'grayscale(0.6)' : 'none', transition: 'transform 0.2s ease', transform: hover ? 'scale(1.12)' : 'scale(1)' }}>{mod.icon}</span>
      <div style={{ fontFamily: t.display, fontWeight: 700, fontSize: 15, color: t.text }}>{mod.name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: muted ? t.sub : '#22c55e', flexShrink: 0,
          boxShadow: muted ? 'none' : '0 0 6px #22c55e'
        }} />
        <span style={{ fontFamily: t.mono, fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.sub }}>
          {muted ? 'Completed' : 'Active'}
        </span>
      </div>
    </div>
  )
}

function ToolChip({ card, t, navigate, delay }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      className="enter-item"
      onClick={() => navigate(card.to)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'transparent', border: `1px solid ${hover ? t.accentA : t.line}`,
        borderRadius: 10, padding: '10px 16px', cursor: 'pointer',
        color: hover ? t.accentA : t.text, fontFamily: t.body,
        fontSize: 13, fontWeight: 600, transition: 'all 0.15s ease',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        animationDelay: `${delay}ms`
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
  const motionOK = !usePrefersReducedMotion()
  const [titleVisible, setTitleVisible] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [streak, setStreak] = useState(0)
  const [pausedExam, setPausedExam] = useState(null)
  const [weeklySummary, setWeeklySummary] = useState(null)
  const spotlightRef = useRef(null)

  useEffect(() => {
    setTimeout(() => setTitleVisible(true), 60)
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
    streak > 0 ? { raw: streak, suffix: 'd', label: 'Streak' } : null,
    user && profile ? { raw: profile.points, suffix: '', label: 'Points' } : null,
    weeklySummary ? { raw: weeklySummary.accuracy, suffix: '%', label: 'Week accuracy' } : null,
    weeklySummary ? { raw: weeklySummary.totalAttempted, suffix: '', label: 'Week questions' } : null,
    weeklySummary?.topSubjectName ? { text: weeklySummary.topSubjectName, label: 'Most practiced' } : null,
  ].filter(Boolean)

  function handleHeroMouseMove(e) {
    const el = spotlightRef.current
    if (!el || !motionOK) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    el.style.background = `radial-gradient(560px circle at ${x}% ${y}%, ${t.accentA}22, transparent 45%)`
  }
  function handleHeroMouseLeave() {
    const el = spotlightRef.current
    if (el) el.style.background = 'transparent'
  }

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
          100% { stroke-dashoffset: 0; opacity: 0.6; }
        }
        .hero-pulse-draw { stroke-dasharray: 1; animation: hero-pulse-draw-in 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

        @keyframes aurora-drift-a {
          0%, 100% { transform: translate(-10%, -15%) scale(1); }
          50% { transform: translate(6%, 8%) scale(1.15); }
        }
        @keyframes aurora-drift-b {
          0%, 100% { transform: translate(12%, 10%) scale(1); }
          50% { transform: translate(-8%, -6%) scale(1.1); }
        }
        .aurora-orb {
          position: absolute; width: 46vw; height: 46vw; max-width: 520px; max-height: 520px;
          border-radius: 50%; filter: blur(90px); opacity: 0.28;
        }
        .aurora-orb-a { top: -10%; left: 8%; animation: aurora-drift-a 14s ease-in-out infinite; }
        .aurora-orb-b { top: -6%; right: 6%; animation: aurora-drift-b 16s ease-in-out infinite; }

        @keyframes gradient-text-flow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .gradient-text {
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          animation: gradient-text-flow 6s linear infinite;
        }

        @keyframes border-flow { to { background-position: 200% 0%; } }
        .flow-border {
          border-radius: 16px; padding: 1px; background-size: 200% 100%;
          animation: border-flow 5s linear infinite;
        }

        @keyframes item-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .enter-item { opacity: 0; animation: item-in 0.6s ease forwards; }

        @media (prefers-reduced-motion: reduce) {
          .hero-pulse-draw { animation: none; stroke-dashoffset: 0; opacity: 0.6; }
          .aurora-orb { animation: none; }
          .gradient-text { animation: none; background-position: 0% 50%; }
          .flow-border { animation: none; }
          .enter-item { opacity: 1; animation: none; }
        }
      `}</style>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div
        style={{ position: 'relative', overflow: 'hidden', paddingTop: 28 }}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
      >
        <AuroraGlow t={t} />
        <HeroPulse t={t} streak={streak} motionOK={motionOK} />
        <div ref={spotlightRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', transition: 'background 0.1s ease' }} aria-hidden="true" />

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
                  width: 28, height: 28, borderRadius: '50%', background: t.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: t.display, fontSize: 12, fontWeight: 800, color: '#fff'
                }}>{initialOf(profile.name)}</div>
                <span style={{ color: t.text, fontSize: 13, fontWeight: 600, fontFamily: t.body }}>Dr. {profile.name}</span>
              </div>
            ) : (
              <button onClick={() => navigate('/auth')} style={{
                background: t.gradient, color: '#fff', border: 'none',
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
            <h1 className="gradient-text" style={{
              fontFamily: t.display, fontSize: 'clamp(32px, 5.5vw, 54px)', fontWeight: 800,
              letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 12,
              backgroundImage: t.gradient
            }}>
              ZNU Future Doctors
            </h1>
            <p style={{ color: t.sub, fontSize: 15, fontFamily: t.body, marginBottom: 30, maxWidth: 420 }}>
              Your integrated medical study platform
            </p>

            {vitals.length > 0 && (
              <div className="flow-border" style={{ backgroundImage: `linear-gradient(90deg, ${t.accentA}, ${t.accentB}, ${t.accentA})` }}>
                <div style={{
                  display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
                  padding: '17px 27px', borderRadius: 15, background: t.surface
                }}>
                  {vitals.map((v, i) => (
                    <Vital key={i} t={t} raw={v.raw} suffix={v.suffix} text={v.text} label={v.label}
                      last={i === vitals.length - 1} delay={200 + i * 90} />
                  ))}
                </div>
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
              borderLeft: `3px solid ${t.accentA}`, background: t.surface,
              borderRadius: '0 10px 10px 0', padding: '14px 18px', marginBottom: 14, cursor: 'pointer'
            }}>
            <div>
              <div style={{ color: t.text, fontWeight: 700, fontSize: 13.5, fontFamily: t.body }}>Continue where you left off</div>
              <div style={{ color: t.sub, fontSize: 12, marginTop: 2, fontFamily: t.mono }}>
                {Object.keys(pausedExam.answers || {}).length}/{(pausedExam.quizQuestions || []).length} answered
              </div>
            </div>
            <span style={{ color: t.accentA, fontSize: 18 }}>→</span>
          </div>
        )}

        {/* Announcement */}
        {announcement && (
          <div style={{
            borderLeft: `3px solid ${t.accentA}`, background: t.surface,
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
              {activeModules.map((mod, i) => (
                <ModuleCard key={mod.id} mod={mod} t={t} onClick={() => navigate(`/module/${mod.id}`)} delay={i * 60} />
              ))}
            </div>
          </div>
        )}

        {/* Tools */}
        <div style={{ marginBottom: 40 }}>
          {sectionTitle('Tools')}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {toolCards.map((card, i) => (
              <ToolChip key={i} card={card} t={t} navigate={navigate} delay={i * 60} />
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
              {completedModules.map((mod, i) => (
                <ModuleCard key={mod.id} mod={mod} t={t} muted onClick={() => navigate(`/module/${mod.id}`)} delay={i * 60} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
