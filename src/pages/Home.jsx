import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, NavMenu, useModules } from '../App'
import { supabase } from '../supabase'
import ErrorBanner from '../components/ErrorBanner'
import { computeStreak } from '../lib/streak'
import { getGuestHistory } from '../lib/reviewStorage'
import { loadSavedActiveExam } from '../lib/activeExam'
import NotifyPermissionButton from '../components/NotifyPermissionButton'
import { getPremiumTheme } from '../premiumTheme'

// Numbered "sections" for the distinctive top nav — same destinations
// the app already has, just presented as an editorial index instead of
// a generic navbar list.
const primaryNav = [
  { n: '01', label: 'Explore', to: '/' },
  { n: '02', label: 'Practice', to: '/mcq' },
  { n: '03', label: 'Review', to: '/review' },
  { n: '04', label: 'Progress', to: '/profile?tab=history' },
]

const exploreLinks = [
  { title: 'Schedules', description: 'Study & exam calendars', to: '/schedule' },
  { title: 'Checklist', description: 'Your study plan', to: '/checklist' },
  { title: 'Anonymous Q&A', description: 'Ask without a name attached', to: '/anon-questions' },
  { title: 'Leaderboard', description: 'See where you stand', to: '/profile?tab=leaderboard' },
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

function timeGreeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// ─────────────────────────────────────────────────────────────────
// Motion helpers — self-contained, respect prefers-reduced-motion.
// ─────────────────────────────────────────────────────────────────

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e) => setReduced(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])
  return reduced
}

function useReveal(reducedMotion) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (reducedMotion) { setVisible(true); return }
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') { setVisible(true); return }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.unobserve(el) }
    }, { threshold: 0.18 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [reducedMotion])
  return [ref, visible]
}

function CountUp({ value, active, duration = 1000, suffix = '' }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!active) return
    let raf
    const startTime = performance.now()
    function tick(now) {
      const p = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setDisplay(value)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, value, duration])
  return <>{active ? display : 0}{suffix}</>
}

// ─────────────────────────────────────────────────────────────────
// The ZNU Pulse — the recurring brand line. One shared path drawn in
// three contexts on this page: the hero (horizontal, once), the
// Medical Map (vertical spine connecting modules), and each module's
// own progress indicator (a short segment that fills as a pulse).
// Deliberately the same visual grammar everywhere so it reads as one
// signature rather than three different ECG decorations.
// ─────────────────────────────────────────────────────────────────

function HeroPulse({ color, glow, reducedMotion }) {
  const d = 'M0,60 L120,60 L144,20 L168,98 L190,42 L212,60 L380,60 L404,30 L428,74 L452,60 L640,60 L664,14 L688,102 L710,38 L732,60 L900,60'
  return (
    <svg viewBox="0 0 900 120" preserveAspectRatio="none" aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{
          opacity: 0.5,
          strokeDasharray: 1700,
          strokeDashoffset: reducedMotion ? 0 : 1700,
          animation: reducedMotion ? 'none' : 'znuDraw 2.6s cubic-bezier(0.65,0,0.35,1) 0.2s forwards',
        }} />
      {!reducedMotion && (
        <circle r="4" fill={glow} opacity="0.9">
          <animateMotion dur="7.5s" begin="2.8s" repeatCount="indefinite" path={d} />
          <animate attributeName="opacity" values="0.9;0.25;0.9" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  )
}

// Vertical spine that runs behind the Medical Map, with a small pulse
// kink at each module's node.
function MapSpine({ color, height, nodeCount }) {
  const segment = nodeCount > 1 ? height / (nodeCount - 1) : height
  let d = `M1,0 `
  for (let i = 1; i < nodeCount; i++) {
    const y = i * segment
    d += `L1,${y - 10} L7,${y - 4} L1,${y + 4} L1,${y} `
  }
  d += `L1,${height}`
  return (
    <svg width="8" height={height} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  )
}

function FloatingOrbs({ colorA, colorB, reducedMotion }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', width: 340, height: 340, borderRadius: '50%',
        top: -130, right: -90, background: colorA, filter: 'blur(75px)',
        animation: reducedMotion ? 'none' : 'znuFloatA 17s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 280, height: 280, borderRadius: '50%',
        top: 60, left: -110, background: colorB, filter: 'blur(65px)',
        animation: reducedMotion ? 'none' : 'znuFloatB 19s ease-in-out infinite',
      }} />
    </div>
  )
}

// A faint, elegant branching motif (abstract vessel/neural line) used
// once per module row, mirrored on alternating rows — the "subtle
// scientific visualization beside the content" the brief asks for,
// without inventing per-specialty iconography we can't derive from data.
function BranchMotif({ color, flip }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" style={{
      position: 'absolute', top: '50%', [flip ? 'left' : 'right']: -20,
      transform: `translateY(-50%) ${flip ? 'scaleX(-1)' : ''}`,
      width: 160, height: 160, opacity: 0.16, pointerEvents: 'none'
    }}>
      <path d="M10,100 C50,100 40,40 90,40 C120,40 110,20 150,20 M90,40 C110,40 100,80 140,80 M10,100 C50,100 40,160 90,160 C120,160 110,180 150,180 M90,160 C110,160 100,120 140,120"
        fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="150" cy="20" r="3" fill={color} />
      <circle cx="140" cy="80" r="3" fill={color} />
      <circle cx="150" cy="180" r="3" fill={color} />
      <circle cx="140" cy="120" r="3" fill={color} />
    </svg>
  )
}

// A short pulse-styled progress fill — same grammar as HeroPulse/
// MapSpine, scaled down to sit under a module's stats line.
function PulseProgress({ percent, color, track, active }) {
  return (
    <div style={{ position: 'relative', height: 3, background: track, borderRadius: 3, marginTop: 14, maxWidth: 220 }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 3, background: color,
        width: active ? `${percent}%` : '0%', transition: 'width 1s cubic-bezier(0.16,1,0.3,1) 0.15s',
      }} />
      <div style={{
        position: 'absolute', top: '50%', width: 7, height: 7, borderRadius: '50%', background: color,
        left: active ? `${percent}%` : '0%', transform: 'translate(-50%, -50%)',
        transition: 'left 1s cubic-bezier(0.16,1,0.3,1) 0.15s',
      }} />
    </div>
  )
}

// The one "magnetic" interaction on the page — reserved for the single
// most useful action, per the brief's "Next Move" concept.
function TiltBand({ children, onClick, style, reducedMotion }) {
  const ref = useRef(null)
  const [transform, setTransform] = useState('perspective(900px) rotateX(0deg) rotateY(0deg)')
  function handleMove(e) {
    if (reducedMotion || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width - 0.5
    const relY = (e.clientY - rect.top) / rect.height - 0.5
    setTransform(`perspective(900px) rotateX(${(-relY * 2.5).toFixed(2)}deg) rotateY(${(relX * 2.5).toFixed(2)}deg)`)
  }
  function reset() { setTransform('perspective(900px) rotateX(0deg) rotateY(0deg)') }
  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={reset} onClick={onClick}
      role="button" tabIndex={0} onKeyDown={onActivateKeyDown(onClick)}
      style={{ transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)', transform, ...style }}>
      {children}
    </div>
  )
}

function iconBtn(t) {
  return {
    background: 'transparent', border: `1px solid ${t.border}`, color: t.text,
    width: 34, height: 34, borderRadius: 8, cursor: 'pointer', fontSize: 15,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: t.fontSans,
  }
}

export default function Home({ dark, toggleTheme }) {
  const t = getPremiumTheme(dark)
  const reducedMotion = usePrefersReducedMotion()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { modules, modulesError } = useModules()

  const [barVisible, setBarVisible] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [streak, setStreak] = useState(0)
  const [pausedExam, setPausedExam] = useState(null)
  const [weeklySummary, setWeeklySummary] = useState(null)
  const [upcomingExams, setUpcomingExams] = useState([])

  // Real (non-fabricated) per-module counts, computed from the same
  // tables the rest of the app already uses — three lightweight,
  // read-only queries (id + module_id columns only), fetched once.
  const [moduleStats, setModuleStats] = useState(null)
  const [answeredCounts, setAnsweredCounts] = useState({})

  const [heroRef, heroVisible] = useReveal(reducedMotion)
  const [mapRef, mapVisible] = useReveal(reducedMotion)
  const [statsRef, statsVisible] = useReveal(reducedMotion)
  const [nextRef, nextVisible] = useReveal(reducedMotion)
  const [keepGoingRef, keepGoingVisible] = useReveal(reducedMotion)

  useEffect(() => {
    setTimeout(() => setBarVisible(true), 60)
  }, [])

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'home_announcement').single()
      .then(({ data }) => { if (data?.value) setAnnouncement(data.value) })
  }, [])

  // Study streak — consecutive days with at least one quiz attempt.
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

  // "Continue where you left off" — a paused mock/practice exam.
  useEffect(() => {
    loadSavedActiveExam(user).then(setPausedExam)
  }, [user])

  // Weekly summary — questions attempted, accuracy, most-practiced
  // subject over the last 7 days.
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

  // Upcoming-exam reminder — fires a local notification (unchanged
  // behavior) AND now also keeps the list in state so "Keep Going"
  // can surface it, reusing the same fetch instead of a second query.
  useEffect(() => {
    async function checkExamReminders() {
      const { data } = await supabase.from('schedules').select('title, date, module_id').eq('type', 'exam').not('date', 'is', null)
      if (!data || data.length === 0) { setUpcomingExams([]); return }

      const today = new Date(); today.setHours(0, 0, 0, 0)
      const upcoming = data.filter(s => {
        const diffDays = Math.round((new Date(s.date) - today) / (24 * 60 * 60 * 1000))
        return diffDays >= 0 && diffDays <= 2
      })
      setUpcomingExams(upcoming)
      if (upcoming.length === 0) return

      if (!('Notification' in window) || Notification.permission !== 'granted') return
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

  // Real per-module stats — subjects / lessons / questions counted
  // from the actual rows (id + module_id only), not fabricated.
  useEffect(() => {
    async function loadModuleStats() {
      const [subjectsRes, lessonsRes, questionsRes] = await Promise.all([
        supabase.from('subjects').select('id, module_id'),
        supabase.from('lessons').select('id, module_id'),
        supabase.from('questions').select('id, module_id'),
      ])
      const countBy = (rows) => {
        const map = {}
        ;(rows || []).forEach(r => { if (r.module_id) map[r.module_id] = (map[r.module_id] || 0) + 1 })
        return map
      }
      const questionModuleMap = {}
      ;(questionsRes.data || []).forEach(q => { questionModuleMap[q.id] = q.module_id })

      setModuleStats({
        subjects: countBy(subjectsRes.data),
        lessons: countBy(lessonsRes.data),
        questions: countBy(questionsRes.data),
        questionModuleMap,
      })
    }
    loadModuleStats()
  }, [])

  // Per-module "answered" progress — only meaningful for signed-in
  // users, since guest history doesn't track individual question ids
  // per module. Signed-out visitors simply see modules without a
  // progress fill rather than an invented number.
  useEffect(() => {
    if (!user || !moduleStats) return
    supabase.from('answered_questions').select('question_id').eq('user_id', user.id)
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach(r => {
          const modId = moduleStats.questionModuleMap[r.question_id]
          if (modId) map[modId] = (map[modId] || 0) + 1
        })
        setAnsweredCounts(map)
      })
  }, [user, moduleStats])

  const activeModules = modules.filter(m => m.status === 'active')
  const completedModules = modules.filter(m => m.status === 'completed')
  const nextModule = activeModules[0] || null
  const mapModules = activeModules.slice(0, 6)

  const kicker = (text) => (
    <div style={{
      color: t.textFaint, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
      textTransform: 'uppercase', fontFamily: t.fontSans
    }}>{text}</div>
  )

  const reveal = (visible, delay = 0, axis = 'y') => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translate(0,0)' : axis === 'y' ? 'translateY(24px)' : `translateX(${axis === 'left' ? '-' : ''}24px)`,
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  })

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: t.fontSans, color: t.text, position: 'relative' }}>
      <style>{`
        @keyframes znuDraw { to { stroke-dashoffset: 0; } }
        @keyframes znuFloatA { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-26px, 28px); } }
        @keyframes znuFloatB { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(24px, -22px); } }
        @keyframes znuBreathe { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.8); opacity: 0.25; } }
        .znu-row { position: relative; }
        .znu-row::before {
          content: ''; position: absolute; left: -16px; top: 8px; bottom: 8px; width: 2px;
          background: ${t.accent}; transform: scaleY(0); transform-origin: center;
          transition: transform 0.3s ease;
        }
        .znu-row:hover::before, .znu-row:focus-visible::before { transform: scaleY(1); }
        .znu-row:hover .znu-arrow, .znu-row:focus-visible .znu-arrow { transform: translateX(4px); opacity: 1; }
        .znu-arrow { display: inline-block; transition: transform 0.25s ease, opacity 0.25s ease; opacity: 0.7; }
        .znu-navlink { position: relative; }
        .znu-navlink::after {
          content: ''; position: absolute; left: 0; bottom: -3px; height: 1px; width: 100%;
          background: currentColor; transform: scaleX(0); transform-origin: left; transition: transform 0.25s ease;
        }
        .znu-navlink:hover::after, .znu-navlink:focus-visible::after { transform: scaleX(1); }
      `}</style>

      {/* Faint scientific grid — fixed so it reads as page atmosphere,
          not a per-section decoration. */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(${t.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${t.gridLine} 1px, transparent 1px)`,
        backgroundSize: '56px 56px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 880, margin: '0 auto', padding: '0 20px 110px' }}>

        {/* Top bar — wordmark + numbered index nav, plus the app's real controls */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '22px 0', borderBottom: `1px solid ${t.border}`, marginBottom: 8, flexWrap: 'wrap', gap: 12,
          opacity: barVisible ? 1 : 0, transform: barVisible ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <div style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 16, letterSpacing: '0.02em' }}>
              ZNU<span style={{ color: t.accent }}>.</span>FD
            </div>
            <nav style={{ display: 'flex', gap: 20 }} className="znu-desktop-nav">
              {primaryNav.map(item => (
                <span key={item.n} className="znu-navlink" onClick={() => navigate(item.to)}
                  role="button" tabIndex={0} onKeyDown={onActivateKeyDown(() => navigate(item.to))}
                  style={{
                    cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
                    color: item.n === '01' ? t.text : t.textSub, display: 'none'
                  }}>
                  <span style={{ color: t.textFaint, marginRight: 6 }}>{item.n}</span>{item.label.toUpperCase()}
                </span>
              ))}
            </nav>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={toggleTheme} style={iconBtn(t)}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? '☀' : '☾'}
            </button>
            <NavMenu dark={dark} />
            <button onClick={() => navigate('/search')} aria-label="Search" style={iconBtn(t)}>⌕</button>

            {user && profile ? (
              <div onClick={() => navigate('/profile')}
                role="button" tabIndex={0}
                onKeyDown={onActivateKeyDown(() => navigate('/profile'))}
                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginLeft: 6 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', background: t.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: dark ? '#0B0F17' : '#fff', flexShrink: 0
                }}>{initialOf(profile.name)}</div>
              </div>
            ) : (
              <button onClick={() => navigate('/auth')} style={{
                background: 'transparent', color: t.primary, border: `1px solid ${t.primary}`,
                padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                fontFamily: t.fontSans, marginLeft: 4
              }}>Sign In</button>
            )}
          </div>
        </div>

        {modulesError && <div style={{ marginTop: 16 }}><ErrorBanner /></div>}

        {/* ── HERO — the wow moment ─────────────────────────────── */}
        <div ref={heroRef} style={{ position: 'relative', padding: '64px 0 46px', overflow: 'hidden' }}>
          <FloatingOrbs colorA={t.glowA} colorB={t.glowB} reducedMotion={reducedMotion} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 10, height: 70 }}>
            {heroVisible && <HeroPulse color={t.border} glow={t.accent} reducedMotion={reducedMotion} />}
          </div>

          <div style={{ position: 'relative', ...reveal(heroVisible) }}>
            <div style={{
              color: t.textFaint, fontSize: 12, fontWeight: 700, letterSpacing: '0.22em',
              marginBottom: 20, textTransform: 'uppercase'
            }}>ZNU · Future Doctors</div>

            <h1 style={{ margin: 0, fontFamily: t.fontDisplay, letterSpacing: '-0.02em' }}>
              <span style={{ display: 'block', fontWeight: 600, fontSize: 'clamp(20px, 3vw, 28px)', color: t.textSub, marginBottom: 2 }}>
                Your medical
              </span>
              <span style={{
                display: 'block', fontWeight: 800, fontSize: 'clamp(48px, 8.5vw, 92px)', lineHeight: 0.98,
                background: `linear-gradient(90deg, ${t.text}, ${t.primary})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>journey,</span>
              <span style={{ display: 'block', fontWeight: 800, fontSize: 'clamp(32px, 5.5vw, 56px)', color: t.accent }}>
                mapped.
              </span>
            </h1>

            <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <span style={{ color: t.textSub, fontSize: 14 }}>
                {timeGreeting()}{user && profile ? `, ${profile.name.split(' ')[0]}` : ''} — {activeModules.length} active module{activeModules.length === 1 ? '' : 's'} waiting.
              </span>
              {streak > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: t.accent, fontSize: 13, fontWeight: 700 }}>
                  <span style={{ position: 'relative', width: 8, height: 8 }}>
                    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: t.accent }} />
                    {!reducedMotion && (
                      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: t.accent, animation: 'znuBreathe 2.2s ease-in-out infinite' }} />
                    )}
                  </span>
                  <CountUp value={streak} active={heroVisible} suffix="-day streak" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── YOUR MEDICAL MAP ──────────────────────────────────── */}
        {mapModules.length > 0 && (
          <div ref={mapRef} style={{ margin: '60px 0 8px' }}>
            {kicker('Your Medical Map')}
            <div style={{ position: 'relative', marginTop: 30, paddingLeft: 28 }}>
              {mapVisible && <MapSpine color={t.accent} height={mapModules.length * 168} nodeCount={mapModules.length} />}

              {mapModules.map((mod, i) => {
                const subjects = moduleStats?.subjects[mod.id] || 0
                const lessons = moduleStats?.lessons[mod.id] || 0
                const questions = moduleStats?.questions[mod.id] || 0
                const answered = answeredCounts[mod.id] || 0
                const hasProgress = !!user && questions > 0
                const percent = hasProgress ? Math.min(100, Math.round((answered / questions) * 100)) : 0
                const flip = i % 2 === 1

                return (
                  <div key={mod.id} onClick={() => navigate(`/module/${mod.id}`)}
                    role="button" tabIndex={0}
                    onKeyDown={onActivateKeyDown(() => navigate(`/module/${mod.id}`))}
                    style={{
                      position: 'relative', minHeight: 140, padding: '10px 0 10px 30px',
                      cursor: 'pointer', overflow: 'hidden',
                      ...reveal(mapVisible, i * 100, flip ? 'left' : 'x'),
                    }}>
                    <BranchMotif color={t.accent} flip={flip} />
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
                      <div style={{
                        fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(36px, 5vw, 54px)',
                        color: t.textFaint, lineHeight: 1, WebkitTextStroke: `1px ${t.textFaint}`,
                      }}>{String(i + 1).padStart(2, '0')}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(20px, 2.6vw, 28px)', letterSpacing: '-0.01em' }}>
                          {mod.name}
                        </div>
                        <div style={{ color: t.textSub, fontSize: 12, fontWeight: 600, marginTop: 6, letterSpacing: '0.02em' }}>
                          {subjects} subject{subjects === 1 ? '' : 's'} · {lessons} lesson{lessons === 1 ? '' : 's'} · {questions} question{questions === 1 ? '' : 's'}
                        </div>
                        {hasProgress && (
                          <>
                            <PulseProgress percent={percent} color={t.accent} track={t.border} active={mapVisible} />
                            <div style={{ color: t.accent, fontSize: 12, fontWeight: 700, marginTop: 6 }}>
                              <CountUp value={percent} active={mapVisible} suffix="% complete" />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="znu-arrow" style={{
                      position: 'absolute', right: 0, bottom: 14, color: t.primary, fontSize: 13, fontWeight: 700
                    }}>Continue →</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!mapModules.length && (
          <div style={{ padding: '18px 0', borderTop: `1px solid ${t.border}`, color: t.textSub, fontSize: 14, marginTop: 40 }}>
            No active module yet — check back once one is added.
          </div>
        )}

        {/* ── WHERE YOU ARE NOW ─────────────────────────────────── */}
        {weeklySummary && (
          <div ref={statsRef} style={{ margin: '56px 0', ...reveal(statsVisible) }}>
            {kicker('Where You Are Now')}
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', marginTop: 22 }}>
              <div>
                <div style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: 1 }}>
                  <CountUp value={weeklySummary.totalAttempted} active={statsVisible} />
                </div>
                <div style={{ color: t.textSub, fontSize: 12, fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Questions this week</div>
              </div>
              <div>
                <div style={{
                  fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: 1,
                  color: weeklySummary.accuracy >= 60 ? t.success : t.danger
                }}>
                  <CountUp value={weeklySummary.accuracy} active={statsVisible} suffix="%" />
                </div>
                <div style={{ color: t.textSub, fontSize: 12, fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Accuracy</div>
              </div>
              {weeklySummary.topSubjectName && (
                <div style={{ alignSelf: 'flex-end' }}>
                  <div style={{ fontFamily: t.fontDisplay, fontWeight: 700, fontSize: 20 }}>{weeklySummary.topSubjectName}</div>
                  <div style={{ color: t.textSub, fontSize: 12, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Most practiced</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Announcement */}
        {announcement && (
          <div style={{
            margin: '0 0 48px', padding: '16px 18px', borderRadius: 10,
            border: `1px solid ${t.border}`, background: t.surfaceRaised,
            color: t.text, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap'
          }}>
            {announcement}
          </div>
        )}

        {/* ── YOUR NEXT MOVE ────────────────────────────────────── */}
        <div ref={nextRef} style={{ margin: '0 0 56px', ...reveal(nextVisible) }}>
          {kicker('Your Next Move')}
          <div style={{ marginTop: 18 }}>
            {pausedExam ? (
              <TiltBand reducedMotion={reducedMotion} onClick={() => navigate('/mcq')} style={{
                background: t.bandBg, color: t.bandText, borderRadius: 18, padding: '30px 28px',
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20,
              }}>
                <div>
                  <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, marginBottom: 6, fontFamily: t.fontDisplay }}>
                    Continue your paused quiz
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.75 }}>
                    {Object.keys(pausedExam.answers || {}).length} of {(pausedExam.quizQuestions || []).length} answered
                  </div>
                </div>
                <span className="znu-arrow" style={{ fontSize: 22, fontWeight: 700 }}>→</span>
              </TiltBand>
            ) : nextModule ? (
              <TiltBand reducedMotion={reducedMotion} onClick={() => navigate(`/module/${nextModule.id}`)} style={{
                background: t.bandBg, color: t.bandText, borderRadius: 18, padding: '30px 28px',
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20,
              }}>
                <div>
                  <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, marginBottom: 6, fontFamily: t.fontDisplay }}>
                    Continue {nextModule.name}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.75 }}>Pick up where your active module leaves off</div>
                </div>
                <span className="znu-arrow" style={{ fontSize: 22, fontWeight: 700 }}>→</span>
              </TiltBand>
            ) : (
              <div style={{ color: t.textSub, fontSize: 14 }}>Nothing in progress yet — pick a module above to begin.</div>
            )}
          </div>
          <div style={{ marginTop: 20 }}>
            <NotifyPermissionButton dark={dark} label="Enable exam & deadline reminders" />
          </div>
        </div>

        {/* ── KEEP GOING ────────────────────────────────────────── */}
        <div ref={keepGoingRef} style={{ marginBottom: 20 }}>
          {kicker('Keep Going')}
          <div style={{ marginTop: 6 }}>
            <div className="znu-row" onClick={() => navigate('/review')}
              role="button" tabIndex={0} onKeyDown={onActivateKeyDown(() => navigate('/review'))}
              style={{
                borderTop: `1px solid ${t.border}`, padding: '16px 0', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                ...reveal(keepGoingVisible, 0),
              }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Flagged & incorrect questions</div>
                <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>Everything worth another look</div>
              </div>
              <span className="znu-arrow" style={{ color: t.textFaint, fontSize: 16 }}>→</span>
            </div>

            {upcomingExams.map((exam, i) => {
              const mod = modules.find(m => m.id === exam.module_id)
              return (
                <div key={i} className="znu-row" onClick={() => navigate('/schedule')}
                  role="button" tabIndex={0} onKeyDown={onActivateKeyDown(() => navigate('/schedule'))}
                  style={{
                    borderTop: `1px solid ${t.border}`, padding: '16px 0', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                    ...reveal(keepGoingVisible, (i + 1) * 50),
                  }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: t.warning }}>
                      {mod ? `${mod.name} — ` : ''}{exam.title}
                    </div>
                    <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>
                      Exam on {new Date(exam.date).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="znu-arrow" style={{ color: t.textFaint, fontSize: 16 }}>→</span>
                </div>
              )
            })}

            {exploreLinks.map((link, i) => (
              <div key={link.to} className="znu-row" onClick={() => navigate(link.to)}
                role="button" tabIndex={0} onKeyDown={onActivateKeyDown(() => navigate(link.to))}
                style={{
                  borderTop: `1px solid ${t.border}`,
                  borderBottom: i === exploreLinks.length - 1 ? `1px solid ${t.border}` : 'none',
                  padding: '16px 0', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                  ...reveal(keepGoingVisible, (i + upcomingExams.length + 1) * 50),
                }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{link.title}</div>
                  <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>{link.description}</div>
                </div>
                <span className="znu-arrow" style={{ color: t.textFaint, fontSize: 16 }}>→</span>
              </div>
            ))}
          </div>
        </div>

        {completedModules.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {kicker('Completed')}
            <div style={{ marginTop: 6 }}>
              {completedModules.map(mod => (
                <div key={mod.id} className="znu-row" onClick={() => navigate(`/module/${mod.id}`)}
                  role="button" tabIndex={0}
                  onKeyDown={onActivateKeyDown(() => navigate(`/module/${mod.id}`))}
                  style={{
                    borderTop: `1px solid ${t.border}`, padding: '14px 0',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: 16, color: t.textSub
                  }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{mod.name}</div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>✓</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Desktop nav becomes visible at wider widths — mobile keeps
          the hamburger (NavMenu) as the single, purpose-built entry
          point instead of a shrunk desktop bar. */}
      <style>{`
        @media (min-width: 720px) {
          nav span[role="button"] { display: inline-flex !important; align-items: center; }
        }
      `}</style>
    </div>
  )
}
