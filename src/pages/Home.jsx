import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, NavMenu, useModules } from '../App'
import { getTheme } from '../theme'
import { getPulseTheme, pulseFonts } from '../premiumTheme'
import { supabase } from '../supabase'
import ErrorBanner from '../components/ErrorBanner'
import AutoGrid from '../components/AutoGrid'
import { computeStreak } from '../lib/streak'
import { getGuestHistory } from '../lib/reviewStorage'
import { loadSavedActiveExam } from '../lib/activeExam'
import NotifyPermissionButton from '../components/NotifyPermissionButton'
import PulseCard from '../components/pulse/PulseCard'
import EcgHero from '../components/pulse/EcgHero'
import ScrollReveal from '../components/pulse/ScrollReveal'

const toolCards = [
  { emoji: '📅', title: 'Schedules', sub: 'Plan your study time', to: '/schedule', accent: 'indigo' },
  { emoji: '🎯', title: 'Checklist', sub: 'Track your progress', to: '/checklist', accent: 'amber' },
  { emoji: '💬', title: 'Anonymous Q&A', sub: 'Ask. Learn. Grow.', to: '/anon-questions', accent: 'indigo' },
  { emoji: '🏆', title: 'Leaderboard', sub: 'See where you stand', to: '/profile?tab=leaderboard', accent: 'amber' },
]

// Small, best-effort marketing captions per module (purely cosmetic —
// not stored in the DB). Falls back to a generic line for any module
// name that doesn't match one of these keywords.
const MODULE_BLURBS = {
  neuro: 'Explore the wonders of the nervous system',
  cardio: 'Understand the heart and blood vessels',
  respirat: 'Study the mechanics of breathing',
  digest: 'Learn the process of nourishment',
  gastro: 'Learn the process of nourishment',
}
function moduleBlurb(name) {
  const key = Object.keys(MODULE_BLURBS).find(k => name.toLowerCase().includes(k))
  return key ? MODULE_BLURBS[key] : 'Master the essentials of this module.'
}

function ctaPillStyle(pt, muted = false) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: muted ? `${pt.cobalt}18` : `linear-gradient(135deg, ${pt.cobalt}, ${pt.indigo})`,
    color: muted ? pt.text : '#fff',
    border: muted ? `1px solid ${pt.cobaltBorder}` : 'none',
    padding: '12px 22px', borderRadius: 999,
    fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
    cursor: muted ? 'default' : 'pointer',
    boxShadow: muted ? 'none' : `0 8px 24px ${pt.cobalt}40`,
    textAlign: 'left', lineHeight: 1.4, whiteSpace: 'pre-wrap',
  }
}

const statNumStyle = { fontFamily: pulseFonts.display, fontWeight: 700, fontSize: 22 }
const statLabelStyle = { fontSize: 11, marginTop: 4 }

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

// ── ZNU PULSE brand mark (header) ──────────────────────────────────
const ECG_PATH = 'M0,36 L104,36 C110,36 112,28 118,28 C124,28 126,36 134,36 L140,36 L144,36 L148,54 L152,8 L156,58 L160,36 L168,36 C179,36 183,19 192,19 C201,19 205,36 216,36 L320,36'

function ZnuPulseBrand({ dark, pt }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, '--znu-ecg-glow': pt.ecgGlow }}>
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

      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: pt.surfaceFlat, border: `1px solid ${pt.cobaltBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <svg width="26" height="26" viewBox="0 0 320 72">
          <path d={ECG_PATH} fill="none" stroke={pt.ecgBase} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
          <path className="znu-ecg-static" d={ECG_PATH} fill="none" stroke={pt.ecgLine} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0" />
          <path className="znu-ecg-sweep-a" pathLength="1" d={ECG_PATH} fill="none" stroke={pt.ecgLine} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path className="znu-ecg-sweep-b" pathLength="1" d={ECG_PATH} fill="none" stroke={pt.ecgLine} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div>
        <div style={{
          fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 20, letterSpacing: 1.2,
          color: pt.text, lineHeight: 1
        }}>ZNU <span style={{ color: pt.cobalt }}>PULSE</span></div>
        <div style={{
          fontFamily: pulseFonts.body, fontWeight: 700, fontSize: 9, letterSpacing: 2.5,
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

  return (
    <div style={{
      padding: '20px 16px 100px',
      background: dark
        ? `linear-gradient(180deg, ${pt.canvasAlt}, ${pt.canvas})`
        : `linear-gradient(180deg, ${pt.canvas}, ${pt.canvasAlt})`,
      minHeight: '100vh',
      fontFamily: pulseFonts.body
    }}>
      <style>{`
        .pulse-dash-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 28px; align-items: start; }
        @media (max-width: 860px) {
          .pulse-dash-grid { grid-template-columns: 1fr; }
        }
        .pulse-tools-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 720px) {
          .pulse-tools-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      {modulesError && <div className="page-container"><ErrorBanner /></div>}

      {/* Header */}
      <div className="page-container" style={{
        padding: '10px 0 22px',
        opacity: titleVisible ? 1 : 0,
        transform: titleVisible ? 'translateY(0)' : 'translateY(-14px)',
        transition: 'all 0.55s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <ZnuPulseBrand dark={dark} pt={pt} />

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={toggleTheme} style={utilityBtnStyle} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? '☀️' : '🌙'}</button>
            <NavMenu dark={dark} />
            <button onClick={() => navigate('/search')} aria-label="Search" style={utilityBtnStyle}>🔍</button>

            {user && profile ? (
              <div onClick={() => navigate('/profile')}
                role="button" tabIndex={0}
                onKeyDown={onActivateKeyDown(() => navigate('/profile'))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: pt.surfaceFlat,
                  border: `1px solid ${pt.border}`,
                  borderRadius: 20, padding: '6px 14px 6px 6px', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = pt.cobaltBorder}
                onMouseLeave={e => e.currentTarget.style.borderColor = pt.border}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${pt.cobalt}, ${pt.indigo})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 900, color: '#fff', flexShrink: 0
                }}>
                  {initialOf(profile.name)}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: pt.text, fontSize: 12, fontWeight: 700 }}>Dr. {profile.name}</div>
                  <div style={{ color: pt.amber, fontSize: 10, fontWeight: 700 }}>⭐ {profile.points} points</div>
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
        </div>
      </div>

      <div className="page-container">
        <NotifyPermissionButton dark={dark} label="🔔 Enable exam & deadline reminders" />
      </div>

      {/* Main dashboard — weekly report + hero on the left, active
          modules list on the right, all inside one glass panel. */}
      <div className="page-container" style={{ marginBottom: 32 }}>
        <PulseCard dark={dark} delay={100} style={{ padding: 'clamp(20px, 2.4vw, 32px)' }}>
          <div className="pulse-dash-grid">
            {/* Left: stats + CTA + hero */}
            <div>
              <div style={{ color: pt.faint, fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>
                📊 Weekly Report
              </div>

              {weeklySummary ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, flexWrap: 'wrap', marginBottom: 20 }}>
                  <div>
                    <div style={{
                      fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 'clamp(38px, 4vw, 52px)', lineHeight: 1,
                      color: weeklySummary.accuracy >= 60 ? pt.cobalt : pt.danger
                    }}>{weeklySummary.accuracy}%</div>
                    <div style={{ color: pt.sub, fontSize: 12, marginTop: 6 }}>Accuracy this week</div>
                  </div>
                  <div>
                    <div style={{ ...statNumStyle, color: pt.text }}>{weeklySummary.totalAttempted}</div>
                    <div style={{ ...statLabelStyle, color: pt.sub }}>Questions attempted</div>
                  </div>
                  {weeklySummary.topSubjectName && (
                    <div>
                      <div style={{ ...statNumStyle, fontSize: 17, color: pt.indigo }}>{weeklySummary.topSubjectName}</div>
                      <div style={{ ...statLabelStyle, color: pt.sub }}>Most practiced</div>
                    </div>
                  )}
                  {streak > 0 && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, color: pt.terracotta }}>
                        <span style={{ fontSize: 15 }}>🔥</span>
                        <span style={{ fontFamily: pulseFonts.display, fontWeight: 700, fontSize: 20 }}>{streak}</span>
                      </div>
                      <div style={{ ...statLabelStyle, color: pt.sub }}>Day streak</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, color: pt.terracotta }}>
                    <span style={{ fontSize: 20 }}>🔥</span>
                    <span style={{ fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 34 }}>{streak}</span>
                  </div>
                  <div style={{ color: pt.sub, fontSize: 13 }}>
                    day streak — keep it going. No questions logged yet this week.
                  </div>
                </div>
              )}

              {pausedExam ? (
                <button onClick={() => navigate('/mcq')} style={ctaPillStyle(pt)}>
                  ⏸ Continue where you left off →
                </button>
              ) : announcement ? (
                <div style={ctaPillStyle(pt, true)}>{announcement}</div>
              ) : null}

              <div style={{ marginTop: 22 }}>
                <EcgHero pt={pt} height={220} />
              </div>
            </div>

            {/* Right: Active modules list */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: pt.cobalt, fontSize: 11, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: pt.cobalt, display: 'inline-block' }} />
                Active Modules
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeModules.length === 0 && (
                  <div style={{ color: pt.sub, fontSize: 13 }}>No active modules yet.</div>
                )}
                {activeModules.map((mod, i) => (
                  <PulseCard key={mod.id} dark={dark} delay={250 + i * 70} accent={mod.color}
                    onClick={() => navigate(`/module/${mod.id}`)}
                    style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: `${mod.color}22`, border: `1px solid ${mod.color}55`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                    }}>{mod.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: pt.text, fontWeight: 700, fontSize: 14 }}>{mod.name}</div>
                      <div style={{ color: pt.sub, fontSize: 12, marginTop: 2 }}>{moduleBlurb(mod.name)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: mod.color, display: 'inline-block' }} />
                      <span style={{ color: mod.color, fontSize: 11, fontWeight: 700 }}>Active</span>
                    </div>
                  </PulseCard>
                ))}
              </div>
            </div>
          </div>
        </PulseCard>
      </div>

      {/* Tools */}
      <div className="page-container" style={{ marginBottom: 32 }}>
        {sectionTitle('⚡ Tools')}
        <div className="pulse-tools-grid">
          {toolCards.map((card, i) => {
            const accentColor = card.accent === 'amber' ? pt.amber : pt.indigo
            return (
              <PulseCard key={i} dark={dark} delay={500 + i * 70} accent={accentColor}
                onClick={() => navigate(card.to)}
                style={{ padding: '18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: `${accentColor}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                  }}>{card.emoji}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: pt.text, fontWeight: 700, fontSize: 13 }}>{card.title}</div>
                    <div style={{ color: pt.sub, fontSize: 11, marginTop: 1 }}>{card.sub}</div>
                  </div>
                </div>
                <div style={{ color: pt.faint, fontSize: 16, flexShrink: 0 }}>→</div>
              </PulseCard>
            )
          })}
        </div>
      </div>

      {/* Tagline footer */}
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', margin: '8px 0 40px' }}>
        <div style={{ height: 1, background: pt.border, flex: 1, maxWidth: 120 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: pt.faint, fontSize: 13, fontWeight: 600 }}>
          <svg width="18" height="14" viewBox="0 0 320 72">
            <path d={ECG_PATH} fill="none" stroke={pt.ecgLine} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Keep the pulse. Shape the future.
        </div>
        <div style={{ height: 1, background: pt.border, flex: 1, maxWidth: 120 }} />
      </div>

      {/* Completed modules — hidden until scrolled into view */}
      {completedModules.length > 0 && (
        <ScrollReveal>
          <div className="page-container">
            {sectionTitle('✓ Completed Modules')}
            <AutoGrid>
              {completedModules.map((mod, i) => (
                <PulseCard key={mod.id} dark={dark} delay={i * 70}
                  onClick={() => navigate(`/module/${mod.id}`)}
                  style={{ padding: 'clamp(20px, 2vw, 28px)', textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: 8, filter: 'grayscale(0.5)' }}>{mod.icon}</div>
                  <div style={{ color: pt.sub, fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 700, marginBottom: 8 }}>{mod.name}</div>
                  <div style={{
                    display: 'inline-block', background: `${pt.faint}20`, color: pt.faint,
                    border: `1px solid ${pt.faint}40`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
                  }}>✓ Completed</div>
                </PulseCard>
              ))}
            </AutoGrid>
          </div>
        </ScrollReveal>
      )}
    </div>
  )
}
