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

// Flat, scannable link list — replaces the old 4-up colorful "Tools"
// card grid with typography + dividers instead of identical boxes.
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
// Small, self-contained motion helpers. Kept local to this file
// (rather than shared components) since this is a scoped design test
// of the Home page only.
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

// Fires `visible = true` once the element scrolls into view, and stays
// true (a one-time reveal rather than a repeating scroll-jank effect).
function useReveal(reducedMotion) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (reducedMotion) { setVisible(true); return }
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') { setVisible(true); return }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.unobserve(el) }
    }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [reducedMotion])
  return [ref, visible]
}

// Counts up from 0 to `value` once `active` becomes true. Purely
// decorative — the underlying number is real data, this only affects
// how it's revealed.
function CountUp({ value, active, duration = 900, suffix = '' }) {
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

// The one literal "vital signs" motif on the page: a hairline trace
// that draws itself once on load, with a small pulse of light that
// keeps traveling along it afterward. Subtle — background texture,
// not a decoration competing with the heading.
function HeroPulse({ color, glow, reducedMotion }) {
  const d = 'M0,60 L110,60 L134,22 L156,96 L178,44 L200,60 L360,60 L382,32 L406,72 L428,60 L600,60 L624,16 L648,100 L670,40 L692,60 L800,60'
  return (
    <svg viewBox="0 0 800 120" preserveAspectRatio="none" aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{
          opacity: 0.5,
          strokeDasharray: 1500,
          strokeDashoffset: reducedMotion ? 0 : 1500,
          animation: reducedMotion ? 'none' : 'znuDraw 2.4s cubic-bezier(0.65,0,0.35,1) 0.15s forwards',
        }} />
      {!reducedMotion && (
        <circle r="4" fill={glow} opacity="0.9">
          <animateMotion dur="7s" begin="2.5s" repeatCount="indefinite" path={d} />
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  )
}

// Two very soft, slow-drifting color fields behind the hero — gives
// the page depth without becoming a "glassmorphism template".
function FloatingOrbs({ colorA, colorB, reducedMotion }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', width: 320, height: 320, borderRadius: '50%',
        top: -120, right: -80, background: colorA, filter: 'blur(70px)',
        animation: reducedMotion ? 'none' : 'znuFloatA 16s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 260, height: 260, borderRadius: '50%',
        top: 40, left: -100, background: colorB, filter: 'blur(60px)',
        animation: reducedMotion ? 'none' : 'znuFloatB 18s ease-in-out infinite',
      }} />
    </div>
  )
}

// The primary CTA card gets a light 3D tilt that follows the cursor —
// the single "signature" interaction on the page, used once so it
// still feels special rather than gimmicky.
function TiltCard({ children, onClick, style, reducedMotion }) {
  const ref = useRef(null)
  const [transform, setTransform] = useState('perspective(700px) rotateX(0deg) rotateY(0deg)')

  function handleMove(e) {
    if (reducedMotion || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width - 0.5
    const relY = (e.clientY - rect.top) / rect.height - 0.5
    setTransform(`perspective(700px) rotateX(${(-relY * 4).toFixed(2)}deg) rotateY(${(relX * 4).toFixed(2)}deg)`)
  }
  function reset() { setTransform('perspective(700px) rotateX(0deg) rotateY(0deg)') }

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

  const [heroRef, heroVisible] = useReveal(reducedMotion)
  const [nextRef, nextVisible] = useReveal(reducedMotion)
  const [statsRef, statsVisible] = useReveal(reducedMotion)
  const [modulesRef, modulesVisible] = useReveal(reducedMotion)
  const [exploreRef, exploreVisible] = useReveal(reducedMotion)

  useEffect(() => {
    setTimeout(() => setBarVisible(true), 60)
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
  const nextModule = activeModules[0] || null

  const sectionLabel = (text) => (
    <div style={{
      color: t.textFaint, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
      textTransform: 'uppercase', marginBottom: 14, fontFamily: t.fontSans
    }}>{text}</div>
  )

  const reveal = (visible, delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  })

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: t.fontSans, color: t.text }}>
      <style>{`
        @keyframes znuDraw { to { stroke-dashoffset: 0; } }
        @keyframes znuFloatA { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-24px, 26px); } }
        @keyframes znuFloatB { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(22px, -20px); } }
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
      `}</style>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 20px 100px' }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 0', borderBottom: `1px solid ${t.border}`, marginBottom: 8,
          opacity: barVisible ? 1 : 0, transform: barVisible ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={toggleTheme} style={iconBtn(t)}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? '☀' : '☾'}
            </button>
            <NavMenu dark={dark} />
            <button onClick={() => navigate('/search')} aria-label="Search" style={iconBtn(t)}>⌕</button>
          </div>

          {user && profile ? (
            <div onClick={() => navigate('/profile')}
              role="button" tabIndex={0}
              onKeyDown={onActivateKeyDown(() => navigate('/profile'))}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Dr. {profile.name}</div>
                <div style={{ fontSize: 11, color: t.textSub }}>{profile.points} points</div>
              </div>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', background: t.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: dark ? '#0B0F17' : '#fff', flexShrink: 0
              }}>{initialOf(profile.name)}</div>
            </div>
          ) : (
            <button onClick={() => navigate('/auth')} style={{
              background: 'transparent', color: t.primary, border: `1px solid ${t.primary}`,
              padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
              fontFamily: t.fontSans
            }}>Sign In</button>
          )}
        </div>

        {modulesError && <div style={{ marginTop: 16 }}><ErrorBanner /></div>}

        {/* Hero — drawn pulse line + traveling dot + floating depth orbs */}
        <div ref={heroRef} style={{ position: 'relative', padding: '56px 0 40px', overflow: 'hidden' }}>
          <FloatingOrbs colorA={t.glowA} colorB={t.glowB} reducedMotion={reducedMotion} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 6, height: 60 }}>
            {heroVisible && <HeroPulse color={t.border} glow={t.accent} reducedMotion={reducedMotion} />}
          </div>

          <div style={{ position: 'relative', ...reveal(heroVisible) }}>
            <div style={{ color: t.textSub, fontSize: 15, marginBottom: 8 }}>
              {timeGreeting()}{user && profile ? `, ${profile.name.split(' ')[0]}` : ''}.
            </div>
            <h1 style={{
              fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(32px, 4.8vw, 48px)',
              lineHeight: 1.08, letterSpacing: '-0.02em', margin: 0, color: t.text
            }}>
              Your medical journey<br />
              <span style={{
                background: `linear-gradient(90deg, ${t.primary}, ${t.accent})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>continues.</span>
            </h1>

            {streak > 0 && (
              <div style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 8, color: t.accent, fontSize: 13, fontWeight: 700 }}>
                <span style={{ position: 'relative', width: 8, height: 8 }}>
                  <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: t.accent }} />
                  {!reducedMotion && (
                    <span style={{
                      position: 'absolute', inset: 0, borderRadius: '50%', background: t.accent,
                      animation: 'znuBreathe 2.2s ease-in-out infinite'
                    }} />
                  )}
                </span>
                <CountUp value={streak} active={heroVisible} suffix="-day study streak" />
              </div>
            )}
          </div>
        </div>

        {/* Next step — the one "signature" tilt interaction on the page */}
        <div ref={nextRef} style={{ margin: '28px 0 36px', ...reveal(nextVisible) }}>
          {sectionLabel('Next Step')}
          {pausedExam ? (
            <TiltCard reducedMotion={reducedMotion} onClick={() => navigate('/mcq')} style={{
              border: `1px solid ${t.border}`, borderRadius: 16, padding: '22px 24px',
              background: t.surfaceRaised, cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, fontFamily: t.fontDisplay }}>Continue your paused quiz</div>
                <div style={{ fontSize: 13, color: t.textSub }}>
                  {Object.keys(pausedExam.answers || {}).length} of {(pausedExam.quizQuestions || []).length} answered
                </div>
              </div>
              <span className="znu-arrow" style={{ color: t.primary, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>Continue →</span>
            </TiltCard>
          ) : nextModule ? (
            <TiltCard reducedMotion={reducedMotion} onClick={() => navigate(`/module/${nextModule.id}`)} style={{
              border: `1px solid ${t.border}`, borderRadius: 16, padding: '22px 24px',
              background: t.surfaceRaised, cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, fontFamily: t.fontDisplay }}>Continue {nextModule.name}</div>
                <div style={{ fontSize: 13, color: t.textSub }}>Pick up where your active module leaves off</div>
              </div>
              <span className="znu-arrow" style={{ color: t.primary, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>Continue →</span>
            </TiltCard>
          ) : (
            <div style={{ padding: '18px 0', borderTop: `1px solid ${t.border}`, color: t.textSub, fontSize: 14 }}>
              No active module yet — check back once one is added.
            </div>
          )}
        </div>

        <div style={{ marginBottom: 36 }}>
          <NotifyPermissionButton dark={dark} label="Enable exam & deadline reminders" />
        </div>

        {/* Weekly progress — numbers count up once scrolled into view */}
        {weeklySummary && (
          <div ref={statsRef} style={{ marginBottom: 40, ...reveal(statsVisible) }}>
            {sectionLabel('Your Progress — This Week')}
            <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', borderTop: `1px solid ${t.border}`, paddingTop: 18 }}>
              <div>
                <div style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 30 }}>
                  <CountUp value={weeklySummary.totalAttempted} active={statsVisible} />
                </div>
                <div style={{ color: t.textSub, fontSize: 12 }}>Questions answered</div>
              </div>
              <div>
                <div style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 30, color: weeklySummary.accuracy >= 60 ? t.success : t.danger }}>
                  <CountUp value={weeklySummary.accuracy} active={statsVisible} suffix="%" />
                </div>
                <div style={{ color: t.textSub, fontSize: 12 }}>Accuracy</div>
              </div>
              {weeklySummary.topSubjectName && (
                <div>
                  <div style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 20 }}>{weeklySummary.topSubjectName}</div>
                  <div style={{ color: t.textSub, fontSize: 12 }}>Most practiced</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Announcement */}
        {announcement && (
          <div style={{
            marginBottom: 40, padding: '16px 18px', borderRadius: 10,
            border: `1px solid ${t.border}`, background: t.surfaceRaised,
            color: t.text, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap'
          }}>
            {announcement}
          </div>
        )}

        {/* Modules — editorial rows, staggered in, accent bar on hover */}
        {activeModules.length > 0 && (
          <div ref={modulesRef} style={{ marginBottom: 40 }}>
            {sectionLabel('Modules')}
            <div>
              {activeModules.map((mod, i) => (
                <div key={mod.id} className="znu-row" onClick={() => navigate(`/module/${mod.id}`)}
                  role="button" tabIndex={0}
                  onKeyDown={onActivateKeyDown(() => navigate(`/module/${mod.id}`))}
                  style={{
                    borderTop: `1px solid ${t.border}`, padding: '20px 0',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: 16,
                    ...reveal(modulesVisible, i * 70),
                  }}>
                  <div>
                    <div style={{ color: t.textFaint, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 6 }}>
                      MODULE {String(i + 1).padStart(2, '0')}
                    </div>
                    <div style={{ fontFamily: t.fontDisplay, fontSize: 21, fontWeight: 700 }}>{mod.name}</div>
                    <div style={{ color: t.accent, fontSize: 12, fontWeight: 700, marginTop: 6 }}>● Active</div>
                  </div>
                  <span className="znu-arrow" style={{ color: t.primary, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>Continue →</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {completedModules.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            {sectionLabel('Completed Modules')}
            <div>
              {completedModules.map(mod => (
                <div key={mod.id} className="znu-row" onClick={() => navigate(`/module/${mod.id}`)}
                  role="button" tabIndex={0}
                  onKeyDown={onActivateKeyDown(() => navigate(`/module/${mod.id}`))}
                  style={{
                    borderTop: `1px solid ${t.border}`, padding: '16px 0',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: 16, color: t.textSub
                  }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{mod.name}</div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>✓ Completed</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explore — flat link list, replaces the old Tools card grid */}
        <div ref={exploreRef} style={{ marginBottom: 20 }}>
          {sectionLabel('Explore')}
          <div>
            {exploreLinks.map((link, i) => (
              <div key={i} className="znu-row" onClick={() => navigate(link.to)}
                role="button" tabIndex={0}
                onKeyDown={onActivateKeyDown(() => navigate(link.to))}
                style={{
                  borderTop: `1px solid ${t.border}`,
                  borderBottom: i === exploreLinks.length - 1 ? `1px solid ${t.border}` : 'none',
                  padding: '16px 0', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                  ...reveal(exploreVisible, i * 60),
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

      </div>
    </div>
  )
}
