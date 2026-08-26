import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, NavMenu, useModules } from '../App'
import { getTheme } from '../theme'
import { getPulseTheme, pulseFonts } from '../premiumTheme'
import { supabase } from '../supabase'
import ErrorBanner from '../components/ErrorBanner'
import AnimatedCard from '../components/AnimatedCard'
import AutoGrid from '../components/AutoGrid'
import { computeStreak } from '../lib/streak'
import { getGuestHistory } from '../lib/reviewStorage'
import { loadSavedActiveExam } from '../lib/activeExam'
import NotifyPermissionButton from '../components/NotifyPermissionButton'

const toolCards = [
  { emoji: '📅', title: 'Schedules', to: '/schedule', accent: 'indigo' },
  { emoji: '🎯', title: 'Checklist', to: '/checklist', accent: 'amber' },
  { emoji: '💬', title: 'Anonymous Q&A', to: '/anon-questions', accent: 'indigo' },
  { emoji: '🏆', title: 'Leaderboard', to: '/profile?tab=leaderboard', accent: 'amber' },
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

// ── ZNU PULSE brand mark ──────────────────────────────────────────
// One readable ECG cycle (subtle P, focused QRS, T wave) with wide
// calm flat intervals before and after. The line reads as though it's
// being drawn with light: a narrow luminous core sweeps the path on a
// loop. Two staggered sweeps mask any hard "reset" moment. Respects
// prefers-reduced-motion by disabling the sweep and showing a fully
// lit static line instead.
const ECG_PATH = 'M0,36 L104,36 C110,36 112,28 118,28 C124,28 126,36 134,36 L140,36 L144,36 L148,54 L152,8 L156,58 L160,36 L168,36 C179,36 183,19 192,19 C201,19 205,36 216,36 L320,36'

function ZnuPulseBrand({ dark, pt }) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', '--znu-ecg-glow': pt.ecgGlow }}
    >
      <style>{`
        @keyframes znuPulseSweepA {
          0%   { stroke-dashoffset: 1; opacity: 0; }
          8%   { opacity: 1; }
          46%  { opacity: 1; }
          58%  { stroke-dashoffset: -0.55; opacity: 0; }
          100% { stroke-dashoffset: -0.55; opacity: 0; }
        }
        @keyframes znuPulseSweepB {
          0%   { stroke-dashoffset: 1; opacity: 0; }
          8%   { opacity: 1; }
          46%  { opacity: 1; }
          58%  { stroke-dashoffset: -0.55; opacity: 0; }
          100% { stroke-dashoffset: -0.55; opacity: 0; }
        }
        .znu-ecg-sweep-a {
          stroke-dasharray: 0.16 1;
          animation: znuPulseSweepA 5.2s ease-in-out infinite;
          filter: drop-shadow(0 0 2px var(--znu-ecg-glow)) drop-shadow(0 0 6px var(--znu-ecg-glow));
        }
        .znu-ecg-sweep-b {
          stroke-dasharray: 0.1 1;
          animation: znuPulseSweepB 5.2s ease-in-out infinite;
          animation-delay: 2.6s;
          filter: drop-shadow(0 0 2px var(--znu-ecg-glow)) drop-shadow(0 0 5px var(--znu-ecg-glow));
        }
        @media (prefers-reduced-motion: reduce) {
          .znu-ecg-sweep-a, .znu-ecg-sweep-b { animation: none; opacity: 0; }
          .znu-ecg-static { opacity: 1 !important; }
        }
      `}</style>

      <svg width="112" height="30" viewBox="0 0 320 72" style={{ flexShrink: 0 }}>
        <path d={ECG_PATH} fill="none" stroke={pt.ecgBase} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
        <path className="znu-ecg-static" d={ECG_PATH} fill="none" stroke={pt.ecgLine} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0" />
        <path className="znu-ecg-sweep-a" pathLength="1" d={ECG_PATH} fill="none" stroke={pt.ecgLine} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path className="znu-ecg-sweep-b" pathLength="1" d={ECG_PATH} fill="none" stroke={pt.ecgLine} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <div>
        <div style={{
          fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 22, letterSpacing: 1.5,
          color: pt.text, lineHeight: 1
        }}>ZNU PULSE</div>
        <div style={{
          fontFamily: pulseFonts.body, fontWeight: 700, fontSize: 10, letterSpacing: 3,
          color: pt.faint, marginTop: 5, textTransform: 'uppercase'
        }}>For Future Doctors</div>
      </div>
    </div>
  )
}

export default function Home({ dark, toggleTheme }) {
  const c = getTheme(dark)
  const pt = getPulseTheme(dark)
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

  const sectionTitle = (text) => (
    <h2 style={{
      color: pt.faint,
      fontSize: 12, fontWeight: 700, letterSpacing: 2.5,
      marginBottom: 16, textTransform: 'uppercase',
      fontFamily: pulseFonts.body
    }}>{text}</h2>
  )

  const utilityBtnStyle = {
    background: pt.surfaceFlat,
    color: pt.cobalt,
    border: `1px solid ${pt.border}`,
    padding: '6px 14px', borderRadius: 10,
    cursor: 'pointer', fontSize: 16, fontWeight: 700
  }

  const showWeeklyPanel = !!weeklySummary || streak > 0

  return (
    <div style={{
      padding: '20px 16px 100px',
      background: dark
        ? `linear-gradient(180deg, ${pt.canvasAlt}, ${pt.canvas})`
        : `linear-gradient(180deg, ${pt.canvas}, ${pt.canvasAlt})`,
      minHeight: '100vh',
      fontFamily: pulseFonts.body
    }}>
      {modulesError && <div className="page-container"><ErrorBanner /></div>}

      {/* Compact header — utilities row + ZNU PULSE brand identity */}
      <div className="page-container" style={{
        padding: '10px 0 22px',
        opacity: titleVisible ? 1 : 0,
        transform: titleVisible ? 'translateY(0)' : 'translateY(-14px)',
        transition: 'all 0.55s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={toggleTheme} style={utilityBtnStyle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? '☀️' : '🌙'}</button>
            <NavMenu dark={dark} />
            <button onClick={() => navigate('/search')} aria-label="Search" style={utilityBtnStyle}>🔍</button>
          </div>

          {/* Profile Bar */}
          {user && profile ? (
            <div onClick={() => navigate('/profile')}
              role="button" tabIndex={0}
              onKeyDown={onActivateKeyDown(() => navigate('/profile'))}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: pt.surfaceFlat,
                border: `1px solid ${pt.border}`,
                borderRadius: 20, padding: '8px 16px', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = pt.cobaltBorder}
              onMouseLeave={e => e.currentTarget.style.borderColor = pt.border}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `linear-gradient(135deg, ${pt.cobalt}, ${pt.indigo})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0
              }}>
                {initialOf(profile.name)}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: pt.text, fontSize: 13, fontWeight: 700 }}>
                  Dr. {profile.name}
                </div>
                <div style={{ color: pt.amber, fontSize: 11, fontWeight: 700 }}>
                  ⭐ {profile.points} points
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => navigate('/auth')} style={{
              background: pt.cobaltSoft, color: pt.cobalt,
              border: `1px solid ${pt.cobaltBorder}`,
              padding: '8px 16px', borderRadius: 20,
              cursor: 'pointer', fontSize: 13, fontWeight: 700
            }}>Sign In →</button>
          )}
        </div>

        <ZnuPulseBrand dark={dark} pt={pt} />
      </div>

      <div className="page-container">
        <NotifyPermissionButton dark={dark} label="🔔 Enable exam & deadline reminders" />
      </div>

      {/* Weekly report — accuracy, questions, top subject, and the
          study streak all live here now, sized by importance rather
          than as four identical stat cards. */}
      {showWeeklyPanel && (
        <div className="page-container" style={{ marginBottom: 24 }}>
          <div style={{
            background: pt.surface, border: `1px solid ${pt.border}`, borderRadius: 18,
            padding: '20px 22px 22px'
          }}>
            <div style={{
              color: pt.faint, fontSize: 11, fontWeight: 700, letterSpacing: 2.5,
              marginBottom: 16, textTransform: 'uppercase'
            }}>📈 Weekly Report</div>

            {weeklySummary ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 30, flexWrap: 'wrap' }}>
                <div>
                  <div style={{
                    fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 42, lineHeight: 1,
                    color: weeklySummary.accuracy >= 60 ? pt.cobalt : pt.danger
                  }}>{weeklySummary.accuracy}%</div>
                  <div style={{ color: pt.sub, fontSize: 12, marginTop: 6 }}>Accuracy this week</div>
                </div>

                <div>
                  <div style={{ fontFamily: pulseFonts.display, fontWeight: 700, fontSize: 22, color: pt.text }}>{weeklySummary.totalAttempted}</div>
                  <div style={{ color: pt.sub, fontSize: 11, marginTop: 4 }}>Questions attempted</div>
                </div>

                {weeklySummary.topSubjectName && (
                  <div>
                    <div style={{ fontFamily: pulseFonts.display, fontWeight: 700, fontSize: 16, color: pt.indigo }}>{weeklySummary.topSubjectName}</div>
                    <div style={{ color: pt.sub, fontSize: 11, marginTop: 4 }}>Most practiced</div>
                  </div>
                )}

                {streak > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, color: pt.terracotta }}>
                      <span style={{ fontSize: 15 }}>🔥</span>
                      <span style={{ fontFamily: pulseFonts.display, fontWeight: 700, fontSize: 20 }}>{streak}</span>
                    </div>
                    <div style={{ color: pt.sub, fontSize: 11, marginTop: 4 }}>Day streak</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, color: pt.terracotta }}>
                  <span style={{ fontSize: 20 }}>🔥</span>
                  <span style={{ fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 34 }}>{streak}</span>
                </div>
                <div style={{ color: pt.sub, fontSize: 13 }}>
                  day streak — keep it going. No questions logged yet this week.
                </div>
              </div>
            )}
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
              background: pt.terracottaSoft, border: `2px solid ${pt.terracotta}60`, borderRadius: 16,
              padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 12, transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = pt.terracotta}
            onMouseLeave={e => e.currentTarget.style.borderColor = `${pt.terracotta}60`}>
            <div>
              <div style={{ color: pt.terracotta, fontWeight: 700, fontSize: 14 }}>⏸ Continue where you left off</div>
              <div style={{ color: pt.sub, fontSize: 12, marginTop: 2 }}>
                {Object.keys(pausedExam.answers || {}).length}/{(pausedExam.quizQuestions || []).length} answered
              </div>
            </div>
            <div style={{ color: pt.terracotta, fontSize: 20 }}>→</div>
          </div>
        </div>
      )}

      {/* Announcement */}
      {announcement && (
        <div className="page-container" style={{ marginBottom: 24 }}>
          <div style={{
            background: `linear-gradient(135deg, ${pt.cobaltSoft}, ${pt.indigoSoft})`,
            border: `1px solid ${pt.cobaltBorder}`, borderRadius: 16,
            padding: '14px 20px', textAlign: 'center',
            color: pt.text, fontSize: 14, fontWeight: 600, lineHeight: 1.6,
            whiteSpace: 'pre-wrap'
          }}>
            {announcement}
          </div>
        </div>
      )}

      {/* Active Modules */}
      {activeModules.length > 0 && (
        <div className="page-container" style={{ marginBottom: 32 }}>
          {sectionTitle('🟦 Active Modules')}
          <AutoGrid>
            {activeModules.map((mod, i) => (
              <AnimatedCard key={mod.id} delay={200 + i * 80} color={mod.color} dark={dark}
                onClick={() => navigate(`/module/${mod.id}`)}>
                <div style={{ fontSize: 'clamp(32px, 3.5vw, 52px)', marginBottom: 8 }}>{mod.icon}</div>
                <div style={{ color: c.text, fontSize: 'clamp(14px, 1.2vw, 17px)', fontWeight: 700, marginBottom: 8 }}>{mod.name}</div>
                <div style={{
                  display: 'inline-block', background: pt.cobaltSoft, color: pt.cobalt,
                  border: `1px solid ${pt.cobaltBorder}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
                }}>● Active</div>
              </AnimatedCard>
            ))}
          </AutoGrid>
        </div>
      )}

      {/* Tools — Schedules, Checklist, Anonymous Q&A, Leaderboard */}
      <div className="page-container" style={{ marginBottom: 32 }}>
        {sectionTitle('🛠 Tools')}
        <AutoGrid>
          {toolCards.map((card, i) => (
            <AnimatedCard key={i} delay={400 + i * 80} color={card.accent === 'amber' ? pt.amber : pt.indigo} dark={dark}
              onClick={() => navigate(card.to)}>
              <div style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: 8 }}>{card.emoji}</div>
              <div style={{ color: c.text, fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 700 }}>{card.title}</div>
            </AnimatedCard>
          ))}
        </AutoGrid>
      </div>

      {/* Completed Modules */}
      {completedModules.length > 0 && (
        <div className="page-container">
          {sectionTitle('✓ Completed Modules')}
          <AutoGrid>
            {completedModules.map((mod, i) => (
              <AnimatedCard key={mod.id} delay={i * 80} color={pt.faint} dark={dark}
                onClick={() => navigate(`/module/${mod.id}`)}>
                <div style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: 8, filter: 'grayscale(0.5)' }}>{mod.icon}</div>
                <div style={{ color: c.sub, fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 700, marginBottom: 8 }}>{mod.name}</div>
                <div style={{
                  display: 'inline-block', background: `${pt.faint}20`, color: pt.faint,
                  border: `1px solid ${pt.faint}40`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
                }}>✓ Completed</div>
              </AnimatedCard>
            ))}
          </AutoGrid>
        </div>
      )}
    </div>
  )
}
