import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, Search, Sun, Moon, ChevronDown, TrendingUp, Flame,
  Calendar, Target, MessageCircle, Trophy, ArrowRight, CalendarClock
} from 'lucide-react'
import { useAuth, NavMenu, useModules } from '../App'
import { getTheme } from '../theme'
import { pulseTheme, iconSquareGradient, glassCardStyle } from '../premiumTheme'
import { supabase } from '../supabase'
import ErrorBanner from '../components/ErrorBanner'
import { computeStreak } from '../lib/streak'
import { getGuestHistory } from '../lib/reviewStorage'
import { loadSavedActiveExam } from '../lib/activeExam'
import NotifyPermissionButton from '../components/NotifyPermissionButton'

const toolCards = [
  { icon: Calendar, title: 'Schedules', desc: 'Plan your study time', to: '/schedule', color: '#38bdf8' },
  { icon: Target, title: 'Checklist', desc: 'Track your progress', to: '/checklist', color: '#e2725b' },
  { icon: MessageCircle, title: 'Anonymous Q&A', desc: 'Ask. Learn. Grow.', to: '/anon-questions', color: '#34d399' },
  { icon: Trophy, title: 'Leaderboard', desc: 'See where you stand', to: '/profile?tab=leaderboard', color: '#f59e0b' },
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

// A hand-drawn PQRST-style waveform, animated with a slow light sweep
// (a moving gradient + a glowing "spark" traveling the exact same path)
// so the line reads as live telemetry rather than a static illustration.
function PulseGraphic({ dark }) {
  const t = pulseTheme(dark)
  const path = 'M0,100 L60,100 L85,88 L100,100 L140,100 L158,40 L176,168 L194,20 L214,120 L236,100 ' +
    'L300,100 L322,90 L340,100 L410,100 L428,95 L446,105 L462,100 ' +
    'L540,100 L560,150 L580,55 L600,150 L620,90 L640,100 L760,100'

  return (
    <div className="znu-pulse-graphic">
      <svg viewBox="0 0 760 200" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="znuSweep" gradientUnits="userSpaceOnUse" x1="-260" y1="0" x2="-60" y2="0">
            <stop offset="0%" stopColor={t.ecgSpark} stopOpacity="0" />
            <stop offset="50%" stopColor={t.ecgSpark} stopOpacity="0.95" />
            <stop offset="100%" stopColor={t.ecgSpark} stopOpacity="0" />
            <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="1020 0" dur="5s" repeatCount="indefinite" />
          </linearGradient>
          <filter id="znuGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* faint deterministic starfield */}
        {[...Array(16)].map((_, i) => (
          <circle
            key={i}
            cx={(i * 53) % 760}
            cy={18 + ((i * 71) % 160)}
            r={i % 3 === 0 ? 1.6 : 1}
            fill={t.ecgLine}
            opacity={0.2 + (i % 4) * 0.1}
          />
        ))}

        {/* static base line, always visible */}
        <path d={path} fill="none" stroke={t.ecgLine} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* the slow-moving light sweep, riding the same path */}
        <path d={path} fill="none" stroke="url(#znuSweep)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" filter="url(#znuGlow)" />

        {/* glowing comet head traveling left to right along the path */}
        <path id="znuEcgMotionPath" d={path} fill="none" stroke="none" />
        <circle r="4" fill="#ffffff" filter="url(#znuGlow)">
          <animateMotion dur="5s" repeatCount="indefinite" rotate="auto">
            <mpath href="#znuEcgMotionPath" xlinkHref="#znuEcgMotionPath" />
          </animateMotion>
        </circle>
      </svg>
    </div>
  )
}

export default function Home({ dark, toggleTheme }) {
  const c = getTheme(dark)
  const t = pulseTheme(dark)
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { modules, modulesError } = useModules()
  const [announcement, setAnnouncement] = useState('')
  const [streak, setStreak] = useState(0)
  const [pausedExam, setPausedExam] = useState(null)
  const [weeklySummary, setWeeklySummary] = useState(null)

  const completedRef = useRef(null)
  const [completedVisible, setCompletedVisible] = useState(false)

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

  // Reveal the Completed Modules section with a scroll-triggered
  // animation instead of showing it up front — matches the design
  // brief ("hidden and appears by animation with scrolling"). Fires
  // once, the moment the section's wrapper enters the viewport.
  useEffect(() => {
    const el = completedRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setCompletedVisible(true)
        observer.disconnect()
      }
    }, { threshold: 0.15 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [modules])

  const activeModules = modules.filter(m => m.status === 'active')
  const completedModules = modules.filter(m => m.status === 'completed')

  // Weekly-report CTA — one pill, three possible states, cheapest first:
  // a paused exam always wins (it's time-sensitive), then a playful nod
  // to a perfect week, then a gentle nudge either way.
  let cta = { label: 'Start Practicing', action: () => navigate('/mcq') }
  if (pausedExam) {
    cta = { label: 'Continue where you left off', action: () => navigate('/mcq') }
  } else if (weeklySummary?.accuracy === 100) {
    cta = { label: 'Enjoy the Vacation 🔥', action: () => navigate('/checklist') }
  } else if (weeklySummary) {
    cta = { label: 'Keep the Momentum', action: () => navigate('/mcq') }
  }

  return (
    <div style={{ background: t.pageBg, minHeight: '100vh' }}>
      <style>{`
        .znu-wrap { max-width: 1180px; margin: 0 auto; padding: 20px 16px 100px; font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif; }
        .znu-header-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 22px; }
        .znu-header-left { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .znu-util-cluster { display: flex; gap: 6px; }
        .znu-util-btn { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .znu-logo { display: flex; align-items: center; gap: 10px; }
        .znu-logo-mark { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .znu-logo-word { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 19px; letter-spacing: 0.5px; line-height: 1; }
        .znu-logo-sub { font-size: 10px; font-weight: 700; letter-spacing: 2px; margin-top: 3px; }
        .znu-profile-chip { display: flex; align-items: center; gap: 10px; border-radius: 30px; padding: 6px 14px 6px 6px; cursor: pointer; transition: all 0.2s; }
        .znu-shell { position: relative; border-radius: 28px; padding: 28px 22px; overflow: hidden; margin-bottom: 28px; }
        .znu-dashboard-grid { display: grid; grid-template-columns: 1fr; gap: 20px; position: relative; z-index: 1; }
        .znu-eyebrow { display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 800; letter-spacing: 1.6px; text-transform: uppercase; margin-bottom: 16px; }
        .znu-dot { width: 7px; height: 7px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 8px #38bdf8; flex-shrink: 0; }
        .znu-card-pad { padding: 22px; display: flex; flex-direction: column; }
        .znu-big-stat { font-size: 46px; font-weight: 800; line-height: 1; font-family: 'Plus Jakarta Sans', sans-serif; margin-bottom: 6px; }
        .znu-big-stat-label { display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; margin-bottom: 20px; }
        .znu-stat-row { display: flex; gap: 22px; flex-wrap: wrap; margin-bottom: 22px; }
        .znu-stat-num { font-weight: 800; font-size: 18px; display: flex; align-items: center; gap: 4px; }
        .znu-stat-label { font-size: 10.5px; font-weight: 600; margin-top: 2px; }
        .znu-cta { margin-top: auto; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: 14px; padding: 13px 20px; font-family: inherit; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; }
        .znu-cta:hover { transform: translateY(-1px); filter: brightness(1.06); }
        .znu-pulse-graphic { width: 100%; height: 150px; }
        .znu-module-list { display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto; padding-right: 2px; }
        .znu-module-row { display: flex; align-items: center; gap: 12px; border-radius: 14px; padding: 10px; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
        .znu-module-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .znu-module-text { flex: 1; min-width: 0; }
        .znu-module-name { font-weight: 700; font-size: 13.5px; margin-bottom: 2px; }
        .znu-module-desc { font-size: 11px; }
        .znu-active-badge { font-size: 10.5px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
        .znu-tools-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .znu-tool-card { display: flex; align-items: center; gap: 14px; padding: 18px; border-radius: 18px; cursor: pointer; transition: all 0.2s; }
        .znu-tool-icon { width: 46px; height: 46px; border-radius: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .znu-tool-title { font-weight: 700; font-size: 14px; }
        .znu-tool-desc { font-size: 11.5px; margin-top: 2px; }
        .znu-tool-arrow { margin-left: auto; flex-shrink: 0; opacity: 0.6; }
        .znu-tagline { display: flex; align-items: center; justify-content: center; gap: 14px; margin: 36px 0 8px; }
        .znu-tagline-line { height: 1px; width: 60px; opacity: 0.3; }
        .znu-tagline-text { font-size: 12.5px; font-weight: 600; letter-spacing: 0.3px; white-space: nowrap; }
        .znu-completed-wrap { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .znu-completed-wrap.visible { opacity: 1; transform: translateY(0); }
        .znu-completed-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (min-width: 640px) {
          .znu-tools-grid { grid-template-columns: repeat(4, 1fr); }
          .znu-completed-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 900px) {
          .znu-dashboard-grid { grid-template-columns: 1.05fr 1.3fr 1fr; align-items: stretch; }
          .znu-pulse-graphic { height: 100%; min-height: 220px; }
        }
        @media (min-width: 1100px) {
          .znu-completed-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>

      <div className="znu-wrap">
        {modulesError && <ErrorBanner />}

        {/* Header */}
        <div className="znu-header-row">
          <div className="znu-header-left">
            <div className="znu-util-cluster">
              <button onClick={toggleTheme} className="znu-util-btn" style={{
                background: dark ? 'rgba(56,189,248,0.1)' : '#eef2f7',
                color: dark ? '#38bdf8' : '#475569',
                border: `1px solid ${dark ? 'rgba(56,189,248,0.25)' : '#e2e8f0'}`
              }} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <NavMenu dark={dark} />
              <button onClick={() => navigate('/search')} className="znu-util-btn" aria-label="Search" style={{
                background: dark ? 'rgba(56,189,248,0.1)' : '#eef2f7',
                color: dark ? '#38bdf8' : '#475569',
                border: `1px solid ${dark ? 'rgba(56,189,248,0.25)' : '#e2e8f0'}`
              }}>
                <Search size={16} />
              </button>
            </div>

            <div className="znu-logo">
              <div className="znu-logo-mark" style={{
                background: dark ? 'rgba(56,189,248,0.12)' : '#e6f4fd',
                border: `1px solid ${dark ? 'rgba(56,189,248,0.4)' : '#bae3fb'}`
              }}>
                <Activity size={22} color="#38bdf8" strokeWidth={2.4} />
              </div>
              <div>
                <div className="znu-logo-word">
                  <span style={{ color: '#38bdf8' }}>ZNU</span> <span style={{ color: c.text }}>PULSE</span>
                </div>
                <div className="znu-logo-sub" style={{ color: t.sub }}>FOR FUTURE DOCTORS</div>
              </div>
            </div>
          </div>

          {user && profile ? (
            <div onClick={() => navigate('/profile')}
              role="button" tabIndex={0}
              onKeyDown={onActivateKeyDown(() => navigate('/profile'))}
              className="znu-profile-chip"
              style={{ background: t.glassBg, border: `1px solid ${t.glassBorder}` }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0
              }}>
                {initialOf(profile.name)}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: c.text, fontSize: 13, fontWeight: 700 }}>Dr. {profile.name}</div>
                <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700 }}>★ {profile.points} points</div>
              </div>
              <ChevronDown size={15} color={t.sub} />
            </div>
          ) : (
            <button onClick={() => navigate('/auth')} style={{
              background: '#38bdf820', color: '#38bdf8',
              border: '1px solid #38bdf840',
              padding: '10px 18px', borderRadius: 20,
              cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit'
            }}>Sign In →</button>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <NotifyPermissionButton dark={dark} label="🔔 Enable exam & deadline reminders" />
        </div>

        {/* Announcement */}
        {announcement && (
          <div style={{
            ...glassCardStyle(t, { padding: '14px 20px', marginBottom: 20, textAlign: 'center' }),
            color: c.text, fontSize: 14, fontWeight: 600, lineHeight: 1.6, whiteSpace: 'pre-wrap'
          }}>
            {announcement}
          </div>
        )}

        {/* Dashboard shell */}
        <div className="znu-shell" style={{ background: t.shellBg, border: `1px solid ${t.shellBorder}`, boxShadow: t.shellShadow }}>
          <div className="znu-dashboard-grid">

            {/* Weekly Report */}
            <div className="znu-card-pad" style={glassCardStyle(t)}>
              <div className="znu-eyebrow" style={{ color: t.eyebrow }}>
                <CalendarClock size={14} /> Weekly Report
              </div>
              <div className="znu-big-stat" style={{ color: c.text }}>
                {weeklySummary ? `${weeklySummary.accuracy}%` : '—'}
              </div>
              <div className="znu-big-stat-label" style={{ color: t.sub }}>
                Accuracy this week <TrendingUp size={13} color="#22c55e" />
              </div>
              <div className="znu-stat-row">
                <div>
                  <div className="znu-stat-num" style={{ color: c.text }}>{weeklySummary?.totalAttempted ?? 0}</div>
                  <div className="znu-stat-label" style={{ color: t.sub }}>Questions attempted</div>
                </div>
                <div>
                  <div className="znu-stat-num" style={{ color: c.text, fontSize: 14 }}>{weeklySummary?.topSubjectName || '—'}</div>
                  <div className="znu-stat-label" style={{ color: t.sub }}>Most practiced</div>
                </div>
                <div>
                  <div className="znu-stat-num" style={{ color: c.text }}><Flame size={16} color="#f59e0b" /> {streak}</div>
                  <div className="znu-stat-label" style={{ color: t.sub }}>Day streak</div>
                </div>
              </div>
              <button className="znu-cta" onClick={cta.action} style={{ background: '#38bdf8', color: '#0f172a' }}>
                {cta.label} <ArrowRight size={15} />
              </button>
            </div>

            {/* Pulse */}
            <PulseGraphic dark={dark} />

            {/* Active Modules */}
            <div className="znu-card-pad" style={glassCardStyle(t)}>
              <div className="znu-eyebrow" style={{ color: t.eyebrow }}>
                <span className="znu-dot" /> Active Modules
              </div>
              <div className="znu-module-list">
                {activeModules.map(mod => (
                  <div key={mod.id} className="znu-module-row"
                    role="button" tabIndex={0}
                    onClick={() => navigate(`/module/${mod.id}`)}
                    onKeyDown={onActivateKeyDown(() => navigate(`/module/${mod.id}`))}
                    style={{ borderColor: 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = `${mod.color}50`}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                    <div className="znu-module-icon" style={{ background: iconSquareGradient(mod.color) }}>{mod.icon}</div>
                    <div className="znu-module-text">
                      <div className="znu-module-name" style={{ color: c.text }}>{mod.name}</div>
                      <div className="znu-module-desc" style={{ color: t.sub }}>Explore {mod.name.toLowerCase()}</div>
                    </div>
                    <span className="znu-active-badge" style={{ color: mod.color }}>● Active</span>
                  </div>
                ))}
                {activeModules.length === 0 && (
                  <div style={{ color: t.sub, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                    No active modules right now.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tools */}
        <div style={{ marginBottom: 32 }}>
          <div className="znu-eyebrow" style={{ color: t.eyebrow }}>⚡ Tools</div>
          <div className="znu-tools-grid">
            {toolCards.map((card, i) => {
              const Icon = card.icon
              return (
                <div key={i} className="znu-tool-card" style={glassCardStyle(t)}
                  role="button" tabIndex={0}
                  onClick={() => navigate(card.to)}
                  onKeyDown={onActivateKeyDown(() => navigate(card.to))}
                  onMouseEnter={e => e.currentTarget.style.borderColor = t.glassHoverBorder}
                  onMouseLeave={e => e.currentTarget.style.borderColor = t.glassBorder}>
                  <div className="znu-tool-icon" style={{ background: iconSquareGradient(card.color) }}>
                    <Icon size={20} color="#fff" strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="znu-tool-title" style={{ color: c.text }}>{card.title}</div>
                    <div className="znu-tool-desc" style={{ color: t.sub }}>{card.desc}</div>
                  </div>
                  <ArrowRight size={16} color={t.sub} className="znu-tool-arrow" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Tagline */}
        <div className="znu-tagline">
          <span className="znu-tagline-line" style={{ background: t.sub }} />
          <Activity size={14} color="#38bdf8" />
          <span className="znu-tagline-text" style={{ color: t.sub }}>Keep the pulse. Shape the future.</span>
          <span className="znu-tagline-line" style={{ background: t.sub }} />
        </div>

        {/* Completed Modules — hidden until scrolled into view */}
        {completedModules.length > 0 && (
          <div ref={completedRef} className={`znu-completed-wrap ${completedVisible ? 'visible' : ''}`} style={{ marginTop: 24 }}>
            <div className="znu-eyebrow" style={{ color: t.eyebrow }}>✅ Completed Modules</div>
            <div className="znu-completed-grid">
              {completedModules.map(mod => (
                <div key={mod.id} className="znu-tool-card" style={{ ...glassCardStyle(t), flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}
                  role="button" tabIndex={0}
                  onClick={() => navigate(`/module/${mod.id}`)}
                  onKeyDown={onActivateKeyDown(() => navigate(`/module/${mod.id}`))}>
                  <div className="znu-module-icon" style={{ background: iconSquareGradient('#64748b'), filter: 'grayscale(0.4)' }}>{mod.icon}</div>
                  <div>
                    <div className="znu-tool-title" style={{ color: c.sub }}>{mod.name}</div>
                    <div style={{
                      display: 'inline-block', marginTop: 6, background: '#47556920', color: '#64748b',
                      border: '1px solid #47556940', borderRadius: 20, padding: '2px 10px', fontSize: 10.5, fontWeight: 700
                    }}>✓ Completed</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
