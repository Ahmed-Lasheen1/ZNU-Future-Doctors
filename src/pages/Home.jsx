import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, NavMenu, useModules } from '../App'
import { supabase } from '../supabase'
import ErrorBanner from '../components/ErrorBanner'
import PulseSignal from '../components/pulse/PulseSignal'
import { computeStreak } from '../lib/streak'
import { getGuestHistory } from '../lib/reviewStorage'
import { loadSavedActiveExam } from '../lib/activeExam'
import NotifyPermissionButton from '../components/NotifyPermissionButton'

// ── ZNU PULSE — experimental home page redesign ─────────────────────
// Scoped to this page only (see New_Design_unleash.md). Colors and
// typography here are deliberately independent of the app-wide
// dark/light theme so the concept can be evaluated on its own without
// touching any other page. All existing Home functionality (auth,
// streak, weekly summary, paused-exam resume, announcement, module
// nav, tools nav, exam reminders) is preserved — only the presentation
// changed.
const pulse = {
  bg: '#12151c',
  text: '#f3efe9',
  sub: '#93a0b4',
  faint: '#5b6577',
  accent: '#e2725b', // reuses the app's existing MCQ/quiz brand color
  line: 'rgba(255,255,255,0.08)',
}

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

export default function Home() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { modules, modulesError } = useModules()
  const [streak, setStreak] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const [pausedExam, setPausedExam] = useState(null)
  const [weeklySummary, setWeeklySummary] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => { setTimeout(() => setVisible(true), 60) }, [])

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'home_announcement').single()
      .then(({ data }) => { if (data?.value) setAnnouncement(data.value) })
  }, [])

  // Study streak — unchanged logic from the original Home.jsx.
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

  // "Continue where you left off" — unchanged logic.
  useEffect(() => {
    loadSavedActiveExam(user).then(setPausedExam)
  }, [user])

  // Weekly summary — unchanged logic; also feeds the pulse's intensity
  // below, so the animation reflects something real.
  useEffect(() => {
    async function loadWeekly() {
      const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000
      let rows = []
      if (user) {
        const { data } = await supabase
          .from('exam_history')
          .select('total, correct, completed_at')
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
      setWeeklySummary({ totalAttempted, accuracy })
    }
    loadWeekly()
  }, [user])

  // Upcoming-exam local notification check — unchanged logic, kept
  // headless (no UI change here).
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

  // The pulse's energy is tied to a real signal, not decoration: a
  // stronger weekly accuracy (or an active streak) reads as a fuller,
  // steadier signal; a new/idle student gets a calmer one.
  const pulseIntensity = weeklySummary
    ? 0.55 + Math.min(0.45, (weeklySummary.accuracy / 100) * 0.45)
    : streak > 0 ? 0.7 : 0.55

  return (
    <div style={{ background: pulse.bg, minHeight: '100vh', color: pulse.text, fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 20px 100px' }}>

        {/* Minimal top bar — no theme toggle by design (see brief) */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40,
          opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease'
        }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <NavMenu dark={true} />
            <button onClick={() => navigate('/search')} aria-label="Search" style={navGhostBtn}>Search</button>
          </div>

          {user && profile ? (
            <div onClick={() => navigate('/profile')} role="button" tabIndex={0}
              onKeyDown={onActivateKeyDown(() => navigate('/profile'))}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', background: pulse.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 900, color: pulse.bg, flexShrink: 0
              }}>{initialOf(profile.name)}</div>
              <div style={{ fontSize: 13, color: pulse.sub }}>
                Dr. {profile.name} · <span style={{ color: pulse.accent }}>{profile.points}pts</span>
              </div>
            </div>
          ) : (
            <button onClick={() => navigate('/auth')} style={{ ...navGhostBtn, color: pulse.accent, borderColor: `${pulse.accent}55` }}>
              Sign in
            </button>
          )}
        </div>

        {modulesError && <ErrorBanner />}

        {/* Hero */}
        <div style={{
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(14px)',
          transition: 'all 0.7s ease', marginBottom: 8
        }}>
          <div style={{ color: pulse.accent, fontSize: 13, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 18 }}>
            ZNU Pulse
          </div>
          <h1 style={{
            fontSize: 'clamp(38px, 7vw, 76px)', fontWeight: 800, lineHeight: 1.02,
            letterSpacing: '-0.02em', margin: 0, color: pulse.text
          }}>
            Your medical<br />journey,<br />in motion.
          </h1>
          <p style={{ color: pulse.sub, fontSize: 15, marginTop: 20, maxWidth: 420 }}>
            Built for Future Doctors.
          </p>
        </div>

        {/* The pulse itself — a real, continuously generated signal */}
        <div style={{ margin: '28px 0 44px' }}>
          <PulseSignal height={110} intensity={pulseIntensity} color={pulse.accent} />
        </div>

        {/* Contextual state — connects the pulse to real numbers */}
        <div style={{ marginBottom: 56, display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'baseline' }}>
          {streak > 0 && (
            <div>
              <div style={{ fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800 }}>{streak}</div>
              <div style={{ color: pulse.sub, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>day streak</div>
            </div>
          )}
          {weeklySummary && (
            <>
              <div>
                <div style={{ fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800 }}>{weeklySummary.totalAttempted}</div>
                <div style={{ color: pulse.sub, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>questions this week</div>
              </div>
              <div>
                <div style={{ fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 800, color: weeklySummary.accuracy >= 60 ? '#8fd6b4' : pulse.accent }}>
                  {weeklySummary.accuracy}%
                </div>
                <div style={{ color: pulse.sub, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>weekly accuracy</div>
              </div>
            </>
          )}
          {!streak && !weeklySummary && (
            <div style={{ color: pulse.sub, fontSize: 15 }}>
              Keep going, Future Doctor — your first pulse is one question away.
            </div>
          )}
        </div>

        <div style={{ marginBottom: 40 }}>
          <NotifyPermissionButton dark={true} label="Enable exam & deadline reminders" />
        </div>

        {/* Continue where you left off */}
        {pausedExam && (
          <div onClick={() => navigate('/mcq')} role="button" tabIndex={0}
            onKeyDown={onActivateKeyDown(() => navigate('/mcq'))}
            style={{
              borderTop: `1px solid ${pulse.line}`, borderBottom: `1px solid ${pulse.line}`,
              padding: '24px 0', marginBottom: 40, cursor: 'pointer'
            }}>
            <div style={{ color: pulse.accent, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
              Continue
            </div>
            <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700 }}>
              {Object.keys(pausedExam.answers || {}).length}/{(pausedExam.quizQuestions || []).length} answered →
            </div>
          </div>
        )}

        {/* Announcement — quiet line, no card */}
        {announcement && (
          <p style={{ color: pulse.sub, fontSize: 14, lineHeight: 1.7, marginBottom: 48, whiteSpace: 'pre-wrap', maxWidth: 600 }}>
            {announcement}
          </p>
        )}

        {/* Active modules — editorial rows, not cards */}
        {activeModules.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            <div style={{ color: pulse.faint, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
              Active modules
            </div>
            {activeModules.map((mod, i) => (
              <div key={mod.id} onClick={() => navigate(`/module/${mod.id}`)}
                role="button" tabIndex={0}
                onKeyDown={onActivateKeyDown(() => navigate(`/module/${mod.id}`))}
                style={{
                  display: 'flex', alignItems: 'baseline', gap: 20,
                  padding: '20px 0', borderBottom: `1px solid ${pulse.line}`,
                  cursor: 'pointer', transition: 'opacity 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 0.7}
                onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                <div style={{ color: pulse.faint, fontSize: 15, fontWeight: 700, width: 28, flexShrink: 0 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'clamp(18px, 2.4vw, 26px)', fontWeight: 700, color: mod.color }}>
                    {mod.icon} {mod.name.toUpperCase()}
                  </div>
                </div>
                <div style={{ color: pulse.sub, fontSize: 13, flexShrink: 0 }}>Active →</div>
              </div>
            ))}
          </div>
        )}

        {/* Tools — plain text links, no cards/icons-as-buttons */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ color: pulse.faint, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
            Tools
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 28px' }}>
            {toolLinks.map(t => (
              <button key={t.to} onClick={() => navigate(t.to)} style={{
                background: 'none', border: 'none', borderBottom: '1px solid transparent',
                color: pulse.text, fontSize: 16, fontWeight: 600, cursor: 'pointer',
                padding: '6px 0', fontFamily: 'inherit'
              }}
                onMouseEnter={e => e.currentTarget.style.borderBottomColor = pulse.accent}
                onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}>
                {t.title}
              </button>
            ))}
          </div>
        </div>

        {/* Completed modules — quiet list */}
        {completedModules.length > 0 && (
          <div>
            <div style={{ color: pulse.faint, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
              Completed
            </div>
            {completedModules.map(mod => (
              <div key={mod.id} onClick={() => navigate(`/module/${mod.id}`)}
                role="button" tabIndex={0}
                onKeyDown={onActivateKeyDown(() => navigate(`/module/${mod.id}`))}
                style={{
                  display: 'flex', justifyContent: 'space-between', padding: '12px 0',
                  borderBottom: `1px solid ${pulse.line}`, color: pulse.sub, fontSize: 14, cursor: 'pointer'
                }}>
                <span>{mod.icon} {mod.name}</span>
                <span>✓</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const navGhostBtn = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.14)',
  color: '#93a0b4', padding: '7px 14px', borderRadius: 8,
  cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit'
}
