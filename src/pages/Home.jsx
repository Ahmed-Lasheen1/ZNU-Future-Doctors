import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, NavMenu, useModules } from '../App'
import { supabase } from '../supabase'
import ErrorBanner from '../components/ErrorBanner'
import AnimatedCard from '../components/AnimatedCard'
import AutoGrid from '../components/AutoGrid'
import { computeStreak } from '../lib/streak'
import { getGuestHistory } from '../lib/reviewStorage'
import { loadSavedActiveExam } from '../lib/activeExam'
import NotifyPermissionButton from '../components/NotifyPermissionButton'
import PulseLogo from '../components/pulse/PulseLogo'
import { getPulseTokens } from '../lib/pulseTheme'

// Order intentionally fixed to: Schedules, Checklist, Anonymous Q&A,
// Leaderboard (see New Design Template.md). Colors are assigned at
// render time from the ZNU PULSE token set (see the `toolColors`
// array below) instead of being hardcoded here, since tokens depend
// on dark/light mode.
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

// Small uppercase section label with a colored accent dot instead of
// an emoji — keeps every section marker on the same restrained,
// "precise instrument" visual language and avoids emoji glyphs that
// render as green on some platforms (checkmarks, green circles).
function SectionLabel({ text, color, t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <span style={{ width: 6, height: 6, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
      <span style={{ color: t.textSub, fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>{text}</span>
    </div>
  )
}

export default function Home({ dark, toggleTheme }) {
  const t = getPulseTokens(dark)
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

  // Tool card accent colors, assigned in the fixed display order
  // (Schedules, Checklist, Anonymous Q&A, Leaderboard) from the ZNU
  // PULSE accent set — no green anywhere in the set.
  const toolColors = [t.indigo, t.amber, t.cobalt, t.terracotta]

  // Weekly-report stats, built as a simple ordered list so typography
  // can scale by importance (largest = the most meaningful active
  // value) rather than four identical stat cards. When there's no
  // weekly activity but a streak still exists, the streak becomes the
  // headline value instead of being squeezed in as an afterthought.
  const weeklyStats = []
  if (weeklySummary) {
    weeklyStats.push({
      key: 'accuracy', label: 'Accuracy', size: 40,
      color: weeklySummary.accuracy >= 60 ? t.cobalt : t.terracotta,
      value: `${weeklySummary.accuracy}%`
    })
    weeklyStats.push({ key: 'questions', label: 'Questions', size: 22, color: t.textStrong, value: weeklySummary.totalAttempted })
    if (weeklySummary.topSubjectName) {
      weeklyStats.push({ key: 'subject', label: 'Most practiced', size: 15, color: t.indigo, value: weeklySummary.topSubjectName })
    }
  }
  if (streak > 0) {
    weeklyStats.push({
      key: 'streak', label: 'Study streak', color: t.amber,
      size: weeklySummary ? 20 : 36,
      value: `${streak} day${streak === 1 ? '' : 's'}`
    })
  }
  const showWeekly = weeklyStats.length > 0
  const weeklyTitle = weeklySummary ? 'This Week' : 'Study Streak'

  return (
    <div style={{ background: t.canvas, minHeight: '100vh', padding: '0 0 100px', transition: 'background 0.3s ease' }}>
      {modulesError && <div className="page-container" style={{ paddingTop: 20 }}><ErrorBanner /></div>}

      {/* Compact header: utility controls + the ZNU PULSE ECG brand mark.
          Deliberately NOT a tall hero — see New Design Template.md. */}
      <div className="page-container" style={{
        padding: '20px 16px 22px',
        opacity: titleVisible ? 1 : 0,
        transform: titleVisible ? 'translateY(0)' : 'translateY(-12px)',
        transition: 'all 0.5s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={toggleTheme} style={{
              background: t.surface, color: t.cobalt, border: `1px solid ${t.border}`,
              padding: '6px 14px', borderRadius: 10,
              cursor: 'pointer', fontSize: 16, fontWeight: 700
            }} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? '☀️' : '🌙'}</button>
            <NavMenu dark={dark} />
            <button onClick={() => navigate('/search')} aria-label="Search" style={{
              background: t.surface, color: t.cobalt, border: `1px solid ${t.border}`,
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
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 20, padding: '8px 16px', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = t.cobalt}
              onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `linear-gradient(135deg, ${t.cobalt}, ${t.indigo})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0
              }}>
                {initialOf(profile.name)}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: t.textStrong, fontSize: 13, fontWeight: 700 }}>
                  Dr. {profile.name}
                </div>
                <div style={{ color: t.amber, fontSize: 11, fontWeight: 700 }}>
                  ⭐ {profile.points} points
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => navigate('/auth')} style={{
              background: `${t.cobalt}20`, color: t.cobalt,
              border: `1px solid ${t.cobalt}40`,
              padding: '8px 16px', borderRadius: 20,
              cursor: 'pointer', fontSize: 13, fontWeight: 700
            }}>Sign In →</button>
          )}
        </div>

        {/* ZNU PULSE brand mark: ECG logo + wordmark, compact single unit */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <PulseLogo dark={dark} size={34} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 21, fontWeight: 900, letterSpacing: 2, color: t.textStrong, lineHeight: 1.1 }}>
              ZNU <span style={{ color: t.cobalt }}>PULSE</span>
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: t.textSub, textTransform: 'uppercase', marginTop: 4 }}>
              For Future Doctors
            </div>
          </div>
        </div>
      </div>

      <div className="page-container">
        <NotifyPermissionButton dark={dark} label="🔔 Enable exam & deadline reminders" />
      </div>

      {/* Weekly report — now also the home of the study streak. Typography
          scales by importance instead of four identical stat cards. */}
      {showWeekly && (
        <div className="page-container" style={{ marginBottom: 24 }}>
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 18, padding: '20px 22px' }}>
            <div style={{ color: t.textSub, fontSize: 11, fontWeight: 800, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
              {weeklyTitle}
            </div>
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'baseline' }}>
              {weeklyStats.map(stat => (
                <div key={stat.key}>
                  <div style={{ color: stat.color, fontWeight: 900, fontSize: stat.size, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ color: t.textSub, fontSize: 11, marginTop: 6, fontWeight: 600 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Continue where you left off */}
      {pausedExam && (
        <div className="page-container" style={{ marginBottom: 24 }}>
          <div onClick={() => navigate('/mcq')}
            role="button" tabIndex={0}
            onKeyDown={onActivateKeyDown(() => navigate('/mcq'))}
            style={{
              background: `${t.terracotta}20`, border: `2px solid ${t.terracotta}60`, borderRadius: 16,
              padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 12, transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = t.terracotta}
            onMouseLeave={e => e.currentTarget.style.borderColor = `${t.terracotta}60`}>
            <div>
              <div style={{ color: t.terracotta, fontWeight: 700, fontSize: 14 }}>⏸ Continue where you left off</div>
              <div style={{ color: t.textSub, fontSize: 12, marginTop: 2 }}>
                {Object.keys(pausedExam.answers || {}).length}/{(pausedExam.quizQuestions || []).length} answered
              </div>
            </div>
            <div style={{ color: t.terracotta, fontSize: 20 }}>→</div>
          </div>
        </div>
      )}

      {/* Announcement */}
      {announcement && (
        <div className="page-container" style={{ marginBottom: 24 }}>
          <div style={{
            background: `linear-gradient(135deg, ${t.cobalt}20, ${t.indigo}15)`,
            border: `1px solid ${t.cobalt}40`, borderRadius: 16,
            padding: '14px 20px', textAlign: 'center',
            color: t.textStrong, fontSize: 14, fontWeight: 600, lineHeight: 1.6,
            whiteSpace: 'pre-wrap'
          }}>
            {announcement}
          </div>
        </div>
      )}

      {/* Active Modules */}
      {activeModules.length > 0 && (
        <div className="page-container" style={{ marginBottom: 32 }}>
          <SectionLabel text="Active Modules" color={t.cobalt} t={t} />
          <AutoGrid>
            {activeModules.map((mod, i) => (
              <AnimatedCard key={mod.id} delay={200 + i * 80} color={mod.color} dark={dark}
                onClick={() => navigate(`/module/${mod.id}`)}>
                <div style={{ fontSize: 'clamp(32px, 3.5vw, 52px)', marginBottom: 8 }}>{mod.icon}</div>
                <div style={{ color: t.textStrong, fontSize: 'clamp(14px, 1.2vw, 17px)', fontWeight: 700, marginBottom: 8 }}>{mod.name}</div>
                <div style={{
                  display: 'inline-block', background: `${t.cobalt}20`, color: t.cobalt,
                  border: `1px solid ${t.cobalt}40`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
                }}>● Active</div>
              </AnimatedCard>
            ))}
          </AutoGrid>
        </div>
      )}

      {/* Tools */}
      <div className="page-container" style={{ marginBottom: 32 }}>
        <SectionLabel text="Tools" color={t.indigo} t={t} />
        <AutoGrid>
          {toolCards.map((card, i) => (
            <AnimatedCard key={i} delay={400 + i * 80} color={toolColors[i]} dark={dark}
              onClick={() => navigate(card.to)}>
              <div style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: 8 }}>{card.emoji}</div>
              <div style={{ color: t.textStrong, fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 700 }}>{card.title}</div>
            </AnimatedCard>
          ))}
        </AutoGrid>
      </div>

      {/* Completed Modules */}
      {completedModules.length > 0 && (
        <div className="page-container">
          <SectionLabel text="Completed Modules" color={t.slate} t={t} />
          <AutoGrid>
            {completedModules.map((mod, i) => (
              <AnimatedCard key={mod.id} delay={i * 80} color={t.slate} dark={dark}
                onClick={() => navigate(`/module/${mod.id}`)}>
                <div style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: 8, filter: 'grayscale(0.5)' }}>{mod.icon}</div>
                <div style={{ color: t.textSub, fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 700, marginBottom: 8 }}>{mod.name}</div>
                <div style={{
                  display: 'inline-block', background: `${t.slate}20`, color: t.slate,
                  border: `1px solid ${t.slate}40`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
                }}>✓ Completed</div>
              </AnimatedCard>
            ))}
          </AutoGrid>
        </div>
      )}
    </div>
  )
}
