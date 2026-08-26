import { useEffect, useState } from 'react'
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
// card grid. Same destinations as before, just presented with
// typography + dividers instead of identical boxes (see design
// direction §5/§20: cards only when they genuinely help grouping).
const exploreLinks = [
  { title: 'Schedules', description: 'Study & exam calendars', to: '/schedule' },
  { title: 'Checklist', description: 'Your study plan', to: '/checklist' },
  { title: 'Anonymous Q&A', description: 'Ask without a name attached', to: '/anon-questions' },
  { title: 'Leaderboard', description: 'See where you stand', to: '/profile?tab=leaderboard' },
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

function timeGreeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// The one literal "medical" motif on the page — a faint ECG-style
// pulse used once as a section divider, not sprinkled everywhere
// (design direction §2: subtle, not stethoscope-and-pill clichés).
function PulseDivider({ color }) {
  return (
    <svg viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true"
      style={{ width: '100%', height: 20, display: 'block' }}>
      <polyline
        points="0,12 130,12 145,3 158,21 172,12 400,12"
        fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.55"
      />
    </svg>
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

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: t.fontSans, color: t.text }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 20px 100px' }}>

        {/* Top bar — same controls/behavior as before, flat styling */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 0', borderBottom: `1px solid ${t.border}`, marginBottom: 40
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

        {modulesError && <ErrorBanner />}

        {/* Hero */}
        <div style={{
          opacity: titleVisible ? 1 : 0, transform: titleVisible ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 0.5s ease', marginBottom: 36
        }}>
          <div style={{ color: t.textSub, fontSize: 15, marginBottom: 6 }}>
            {timeGreeting()}{user && profile ? `, ${profile.name.split(' ')[0]}` : ''}.
          </div>
          <h1 style={{
            fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 'clamp(30px, 4.4vw, 44px)',
            lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, color: t.text
          }}>
            Your medical journey<br />continues.
          </h1>
          {streak > 0 && (
            <div style={{ marginTop: 14, color: t.accent, fontSize: 13, fontWeight: 700 }}>
              {streak}-day study streak
            </div>
          )}
        </div>

        <PulseDivider color={t.border} />

        {/* Next step */}
        <div style={{ margin: '36px 0' }}>
          {sectionLabel('Next Step')}
          {pausedExam ? (
            <div onClick={() => navigate('/mcq')} role="button" tabIndex={0}
              onKeyDown={onActivateKeyDown(() => navigate('/mcq'))}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 16, cursor: 'pointer', padding: '18px 0', borderTop: `1px solid ${t.border}`
              }}>
              <div>
                <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Continue your paused quiz</div>
                <div style={{ fontSize: 13, color: t.textSub }}>
                  {Object.keys(pausedExam.answers || {}).length} of {(pausedExam.quizQuestions || []).length} answered
                </div>
              </div>
              <span style={{ color: t.primary, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>Continue →</span>
            </div>
          ) : nextModule ? (
            <div onClick={() => navigate(`/module/${nextModule.id}`)} role="button" tabIndex={0}
              onKeyDown={onActivateKeyDown(() => navigate(`/module/${nextModule.id}`))}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 16, cursor: 'pointer', padding: '18px 0', borderTop: `1px solid ${t.border}`
              }}>
              <div>
                <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Continue {nextModule.name}</div>
                <div style={{ fontSize: 13, color: t.textSub }}>Pick up where your active module leaves off</div>
              </div>
              <span style={{ color: t.primary, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>Continue →</span>
            </div>
          ) : (
            <div style={{ padding: '18px 0', borderTop: `1px solid ${t.border}`, color: t.textSub, fontSize: 14 }}>
              No active module yet — check back once one is added.
            </div>
          )}
        </div>

        <div style={{ marginBottom: 36 }}>
          <NotifyPermissionButton dark={dark} label="Enable exam & deadline reminders" />
        </div>

        {/* Weekly progress */}
        {weeklySummary && (
          <div style={{ marginBottom: 40 }}>
            {sectionLabel('Your Progress — This Week')}
            <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', borderTop: `1px solid ${t.border}`, paddingTop: 18 }}>
              <div>
                <div style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 28 }}>{weeklySummary.totalAttempted}</div>
                <div style={{ color: t.textSub, fontSize: 12 }}>Questions answered</div>
              </div>
              <div>
                <div style={{ fontFamily: t.fontDisplay, fontWeight: 800, fontSize: 28, color: weeklySummary.accuracy >= 60 ? t.success : t.danger }}>
                  {weeklySummary.accuracy}%
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

        {/* Modules — editorial rows instead of a colorful card grid */}
        {activeModules.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            {sectionLabel('Modules')}
            <div>
              {activeModules.map((mod, i) => (
                <div key={mod.id} onClick={() => navigate(`/module/${mod.id}`)}
                  role="button" tabIndex={0}
                  onKeyDown={onActivateKeyDown(() => navigate(`/module/${mod.id}`))}
                  style={{
                    borderTop: `1px solid ${t.border}`, padding: '20px 0',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: 16
                  }}>
                  <div>
                    <div style={{ color: t.textFaint, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 6 }}>
                      MODULE {String(i + 1).padStart(2, '0')}
                    </div>
                    <div style={{ fontFamily: t.fontDisplay, fontSize: 21, fontWeight: 700 }}>{mod.name}</div>
                    <div style={{ color: t.accent, fontSize: 12, fontWeight: 700, marginTop: 6 }}>● Active</div>
                  </div>
                  <span style={{ color: t.primary, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>Continue →</span>
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
                <div key={mod.id} onClick={() => navigate(`/module/${mod.id}`)}
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
        <div style={{ marginBottom: 20 }}>
          {sectionLabel('Explore')}
          <div>
            {exploreLinks.map((link, i) => (
              <div key={i} onClick={() => navigate(link.to)}
                role="button" tabIndex={0}
                onKeyDown={onActivateKeyDown(() => navigate(link.to))}
                style={{
                  borderTop: `1px solid ${t.border}`,
                  borderBottom: i === exploreLinks.length - 1 ? `1px solid ${t.border}` : 'none',
                  padding: '16px 0', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16
                }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{link.title}</div>
                  <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>{link.description}</div>
                </div>
                <span style={{ color: t.textFaint, fontSize: 16 }}>→</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
