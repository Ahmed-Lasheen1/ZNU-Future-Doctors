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

// The ZNU Pulse mark — same file used for the PWA/manifest icons (see
// public/manifest.json), so there's only one logo asset to keep in
// sync. Reused here at header scale and again inside the tagline
// footer.
const LOGO_SRC = '/icon-192.png'

// Exact gradient sampled from the ZNU Pulse logo artwork itself (top →
// bottom: light sky-blue fading to deep navy) — same recipe as
// PAGE_BG in src/components/ui/sign-up.tsx, reproduced stop-for-stop.
// Lives on the FIXED page backdrop below, covering the whole page.
const LOGO_BG = [
  'linear-gradient(180deg,',
  '#a6d2ef 0%,',
  '#97bcd7 15%,',
  '#81a6c3 30%,',
  '#6c8fad 45%,',
  '#497194 60%,',
  '#274e79 75%,',
  '#042a59 90%,',
  '#010c4a 100%)',
].join(' ')

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

const statNumStyle = { fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 30 }

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
// The real logo artwork, static — no beat/glow animation here.
// Position unchanged: top-left of the header, same as before.
function ZnuPulseBrand({ dark, pt }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 44, height: 44, flexShrink: 0,
        borderRadius: 12, overflow: 'hidden',
        background: pt.surfaceFlat, border: `1px solid ${pt.cobaltBorder}`,
      }}>
        <img src={LOGO_SRC} alt="ZNU Pulse" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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

// ── Small floating stat tile — every dashboard number gets its own
// glass card with tilt, instead of living inside one big merged panel. ──
function StatTile({ dark, pt, delay, children, accent }) {
  return (
    <PulseCard dark={dark} delay={delay} accent={accent} style={{ padding: '18px 20px' }}>
      {children}
    </PulseCard>
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
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Fixed backdrop — the exact logo gradient, pinned to the
          viewport so it NEVER scrolls or moves. Only the content
          layer below (header, cards, sections) moves as the page is
          scrolled, which is what creates the flat "2D" feel: a still
          backdrop with floating UI on top, on any screen size. */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: LOGO_BG,
      }} />

      {/* Scrolling content layer — everything the person actually
          interacts with lives here, above the fixed backdrop. */}
      <div style={{
        position: 'relative', zIndex: 1,
        fontFamily: pulseFonts.body
      }}>
        <style>{`
          /* Wider content container used ONLY on this page — takes
             advantage of large screens far more than the app-wide
             .page-container (which stays capped at 1160px), while
             still keeping comfortable side margins on huge monitors. */
          .pulse-wide {
            width: 100%;
            max-width: 1800px;
            margin: 0 auto;
            padding: 0 20px;
            box-sizing: border-box;
          }
          @media (min-width: 900px) {
            .pulse-wide { padding: 0 40px; }
          }
          @media (min-width: 1400px) {
            .pulse-wide { padding: 0 64px; }
          }

          /* "Above the fold" block: header + dashboard + tools +
             tagline. Targets a full viewport tall on larger screens so
             Completed Modules sits below the first scroll — 100svh is
             the mobile-browser-chrome-safe viewport unit, with 100vh
             as the fallback for browsers that don't support it yet. */
          .pulse-fold {
            min-height: 100vh;
            min-height: 100svh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: clamp(16px, 3vh, 40px);
            padding: clamp(14px, 2.5vh, 28px) 0 clamp(24px, 4vh, 56px);
            box-sizing: border-box;
          }

          .pulse-dash-grid {
            display: grid;
            grid-template-columns: 1fr 1.3fr 1fr;
            gap: clamp(14px, 1.6vw, 28px);
            align-items: stretch;
          }
          @media (max-width: 1000px) {
            .pulse-dash-grid { grid-template-columns: 1fr; }
          }
          .pulse-stat-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .pulse-tools-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: clamp(10px, 1.2vw, 18px);
          }
          @media (max-width: 720px) {
            .pulse-tools-grid { grid-template-columns: repeat(2, 1fr); }
          }

          /* Hero panel scales fluidly from phone to desktop */
          .pulse-hero-panel {
            min-height: clamp(130px, 34vw, 320px);
          }
          @media (max-width: 640px) {
            .pulse-hero-panel { min-height: clamp(110px, 46vw, 220px); }
          }

          /* Mobile-specific tightening across the whole above-fold block */
          @media (max-width: 640px) {
            .pulse-fold { gap: 14px; }
            .pulse-stat-row-2 { gap: 8px; }
          }
        `}</style>

        <div className="pulse-fold">
          {modulesError && <div className="pulse-wide"><ErrorBanner /></div>}

          {/* Header — same position/content as before: logo+name top-left,
              utility buttons + profile pill top-right. */}
          <div className="pulse-wide" style={{
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

          <div className="pulse-wide">
            <NotifyPermissionButton dark={dark} label="🔔 Enable exam & deadline reminders" />
          </div>

          {/* Main dashboard — every stat is its own floating glass tile
              with tilt (left), the exact pulse artwork floats free in
              the center with no panel background of its own (the fixed
              backdrop shows through), and the active-modules list on
              the right is a stack of pill-shaped floating cards. */}
          <div className="pulse-wide">
            <div className="pulse-dash-grid">

              {/* Left: individual stat tiles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <StatTile dark={dark} pt={pt} delay={80} accent={pt.cobalt}>
                  <div style={{ color: pt.faint, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                    📊 Weekly Report
                  </div>
                  <div style={{
                    ...statNumStyle,
                    color: weeklySummary ? (weeklySummary.accuracy >= 60 ? pt.cobalt : pt.danger) : pt.text
                  }}>
                    {weeklySummary ? `${weeklySummary.accuracy}%` : '—'}
                  </div>
                  <div style={{ color: pt.sub, fontSize: 12, marginTop: 4 }}>
                    {weeklySummary ? 'Accuracy this week' : 'No questions logged this week'}
                  </div>
                </StatTile>

                <StatTile dark={dark} pt={pt} delay={140} accent={pt.indigo}>
                  <div style={{ ...statNumStyle, color: pt.text }}>{weeklySummary ? weeklySummary.totalAttempted : 0}</div>
                  <div style={{ color: pt.sub, fontSize: 12, marginTop: 4 }}>Questions attempted</div>
                </StatTile>

                <div className="pulse-stat-row-2">
                  <StatTile dark={dark} pt={pt} delay={200} accent={pt.indigo}>
                    <div style={{ color: pt.indigo, fontWeight: 800, fontSize: 15 }}>
                      {weeklySummary?.topSubjectName || '—'}
                    </div>
                    <div style={{ color: pt.sub, fontSize: 11, marginTop: 4 }}>Most practiced</div>
                  </StatTile>
                  <StatTile dark={dark} pt={pt} delay={230} accent={pt.terracotta}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, color: pt.terracotta }}>
                      <span style={{ fontSize: 16 }}>🔥</span>
                      <span style={{ fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 22 }}>{streak}</span>
                    </div>
                    <div style={{ color: pt.sub, fontSize: 11, marginTop: 4 }}>Day streak</div>
                  </StatTile>
                </div>

                {(pausedExam || announcement) && (
                  <PulseCard dark={dark} delay={280} accent={pt.cobalt}
                    onClick={pausedExam ? () => navigate('/mcq') : undefined}
                    style={{ padding: '16px 20px' }}>
                    {pausedExam ? (
                      <div style={{ color: pt.cobalt, fontWeight: 800, fontSize: 14 }}>
                        ⏸ Continue where you left off →
                      </div>
                    ) : (
                      <div style={{ color: pt.text, fontWeight: 700, fontSize: 13, lineHeight: 1.5 }}>
                        {announcement}
                      </div>
                    )}
                  </PulseCard>
                )}
              </div>

              {/* Center: the exact pulse artwork — no background of its
                  own, so the fixed logo-gradient backdrop shows through
                  exactly like the source logo. Fully responsive via the
                  min-height clamp() above and the image's own
                  aspect-ratio (see EcgHero.jsx). */}
              <div className="pulse-hero-panel" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <EcgHero height="100%" />
              </div>

              {/* Right: Active modules as pill-shaped floating glass cards */}
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
                      style={{ borderRadius: 999, padding: '10px 18px 10px 10px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                        background: `${mod.color}22`, border: `1px solid ${mod.color}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                      }}>{mod.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: pt.text, fontWeight: 700, fontSize: 14 }}>{mod.name}</div>
                        <div style={{ color: pt.sub, fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{moduleBlurb(mod.name)}</div>
                      </div>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: mod.color, display: 'inline-block', flexShrink: 0 }} />
                    </PulseCard>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tools — already floating glass tiles with tilt (PulseCard). */}
          <div className="pulse-wide">
            {sectionTitle('⚡ Tools')}
            <div className="pulse-tools-grid">
              {toolCards.map((card, i) => {
                const accentColor = card.accent === 'amber' ? pt.amber : pt.indigo
                return (
                  <PulseCard key={i} dark={dark} delay={500 + i * 70} accent={accentColor}
                    onClick={() => navigate(card.to)}
                    style={{ borderRadius: 22, padding: '18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
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
          <div className="pulse-wide" style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
            <div style={{ height: 1, background: pt.border, flex: 1, maxWidth: 120 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: pt.faint, fontSize: 13, fontWeight: 600 }}>
              <img src={LOGO_SRC} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }} />
              Keep the pulse. Shape the future.
            </div>
            <div style={{ height: 1, background: pt.border, flex: 1, maxWidth: 120 }} />
          </div>
        </div>

        {/* Completed modules — below the first-screen fold, hidden
            until scrolled into view. */}
        {completedModules.length > 0 && (
          <ScrollReveal>
            <div className="pulse-wide" style={{ paddingBottom: 100 }}>
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
    </div>
  )
}
