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
import PulseIntro from '../components/pulse/PulseIntro'
import PulseParticles from '../components/pulse/PulseParticles'
import ScrollRevealItem from '../components/pulse/ScrollRevealItem'
// Tailwind's generated stylesheet is otherwise only loaded when the
// lazy Auth/ResetPassword chunks mount — Home is eager, so it needs
// its own import for the Tailwind classes below to actually render.
import '../styles/shadcn-theme.css'

const LOGO_SRC = '/icon-192.png'

const LOGO_BG_CLASS =
  'bg-[linear-gradient(180deg,#a6d2ef_0%,#97bcd7_15%,#81a6c3_30%,#6c8fad_45%,#497194_60%,#274e79_75%,#042a59_90%,#010c4a_100%)]'

const toolCards = [
  { emoji: '📅', title: 'Schedules', sub: 'Plan your study time', to: '/schedule', accent: 'indigo' },
  { emoji: '🎯', title: 'Checklist', sub: 'Track your progress', to: '/checklist', accent: 'amber' },
  { emoji: '💬', title: 'Anonymous Q&A', sub: 'Ask. Learn. Grow.', to: '/anon-questions', accent: 'indigo' },
  { emoji: '🏆', title: 'Leaderboard', sub: 'See where you stand', to: '/profile?tab=leaderboard', accent: 'amber' },
]

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

function ZnuPulseBrand() {
  return (
    <div className="flex items-center gap-3.5">
      <div className="w-11 h-11 flex-shrink-0 rounded-xl overflow-hidden bg-[var(--pulse-surface-flat)] border border-[var(--pulse-cobalt-border)]">
        <img src={LOGO_SRC} alt="ZNU Pulse" className="w-full h-full object-cover block" />
      </div>
      <div>
        <div
          className="font-extrabold text-xl leading-[1.15] text-[var(--pulse-text)]"
          style={{ fontFamily: pulseFonts.display, letterSpacing: '0.02em' }}
        >
          ZNU <span className="text-[var(--pulse-cobalt)]">PULSE</span>
        </div>
        <div
          className="font-semibold text-[10px] uppercase text-[var(--pulse-faint)] mt-1"
          style={{ fontFamily: pulseFonts.body, letterSpacing: '0.16em' }}
        >
          For Future Doctors
        </div>
      </div>
    </div>
  )
}

function StatTile({ dark, delay, children, accent }) {
  return (
    <PulseCard dark={dark} delay={delay} accent={accent} style={{ padding: '18px 20px' }}>
      {children}
    </PulseCard>
  )
}

const utilityBtnClass =
  'bg-[var(--pulse-surface-flat)] text-[var(--pulse-cobalt)] border border-[var(--pulse-border)] px-3.5 py-1.5 rounded-[10px] cursor-pointer text-base font-bold transition-colors'

const sectionLabelClass =
  'text-[var(--pulse-sub)] text-xs font-bold uppercase mb-4'

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

  // ── Pulse Initialization intro ──────────────────────────────────
  // Plays once per browser session (sessionStorage flag) and never
  // under prefers-reduced-motion. `revealBase` is added to every
  // existing card-stagger delay below so the normal Home reveal
  // sequence (Weekly Report → Active Modules → Tools) starts right as
  // the intro finishes, instead of racing it underneath the overlay.
  const [showIntro] = useState(() => {
    if (typeof window === 'undefined') return false
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    try {
      if (sessionStorage.getItem('znu_pulse_intro_seen')) return false
      sessionStorage.setItem('znu_pulse_intro_seen', '1')
      return true
    } catch {
      return false
    }
  })
  const [introPlaying, setIntroPlaying] = useState(showIntro)
  const revealBase = showIntro ? 1750 : 0

  useEffect(() => {
    setTimeout(() => setTitleVisible(true), 100 + revealBase)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'home_announcement').single()
      .then(({ data }) => { if (data?.value) setAnnouncement(data.value) })
  }, [])

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

  useEffect(() => {
    loadSavedActiveExam(user).then(setPausedExam)
  }, [user])

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

  // Theme tokens exposed as CSS custom properties so Tailwind's
  // arbitrary-value syntax can reference them below (one source of
  // truth in premiumTheme.js, actual styling in utility classes).
  const pulseVars = {
    '--pulse-text': pt.text,
    '--pulse-sub': pt.sub,
    '--pulse-faint': pt.faint,
    '--pulse-cobalt': pt.cobalt,
    '--pulse-cobalt-soft': pt.cobaltSoft,
    '--pulse-cobalt-border': pt.cobaltBorder,
    '--pulse-indigo': pt.indigo,
    '--pulse-terracotta': pt.terracotta,
    '--pulse-amber': pt.amber,
    '--pulse-danger': pt.danger,
    '--pulse-border': pt.border,
    '--pulse-surface-flat': pt.surfaceFlat,
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {introPlaying && <PulseIntro onDone={() => setIntroPlaying(false)} />}

      <div className={`fixed inset-0 z-0 pointer-events-none ${LOGO_BG_CLASS}`} />
      <PulseParticles />

      <div className="relative z-10" style={{ ...pulseVars, fontFamily: pulseFonts.body }}>
        <style>{`
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

          .pulse-hero-panel {
            min-height: clamp(130px, 34vw, 320px);
          }
          @media (max-width: 640px) {
            .pulse-hero-panel { min-height: clamp(110px, 46vw, 220px); }
          }

          @media (max-width: 640px) {
            .pulse-fold { gap: 14px; }
            .pulse-stat-row-2 { gap: 8px; }
          }
        `}</style>

        <div className="pulse-fold">
          {modulesError && <div className="pulse-wide"><ErrorBanner /></div>}

          <div
            className={`pulse-wide transition-all duration-500 ease-out ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3.5'}`}
          >
            <div className="flex justify-between items-center gap-3 flex-wrap">
              <ZnuPulseBrand />

              <div className="flex gap-2.5 items-center flex-wrap">
                <button onClick={toggleTheme} className={utilityBtnClass} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? '☀️' : '🌙'}</button>
                <NavMenu dark={dark} />
                <button onClick={() => navigate('/search')} aria-label="Search" className={utilityBtnClass}>🔍</button>

                {user && profile ? (
                  <div
                    onClick={() => navigate('/profile')}
                    role="button" tabIndex={0}
                    onKeyDown={onActivateKeyDown(() => navigate('/profile'))}
                    className="flex items-center gap-2.5 bg-[var(--pulse-surface-flat)] border border-[var(--pulse-border)] rounded-full pl-1.5 pr-3.5 py-1.5 cursor-pointer transition-colors hover:border-[var(--pulse-cobalt-border)]"
                  >
                    <div className="w-[30px] h-[30px] rounded-full flex-shrink-0 flex items-center justify-center text-[13px] font-black text-white bg-gradient-to-br from-[var(--pulse-cobalt)] to-[var(--pulse-indigo)]">
                      {initialOf(profile.name)}
                    </div>
                    <div className="text-left">
                      <div className="text-[var(--pulse-text)] text-xs font-bold">Dr. {profile.name}</div>
                      <div className="text-[var(--pulse-amber)] text-[10px] font-bold">⭐ {profile.points} points</div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/auth')}
                    className="bg-[var(--pulse-cobalt-soft)] text-[var(--pulse-cobalt)] border border-[var(--pulse-cobalt-border)] px-4 py-2 rounded-full cursor-pointer text-[13px] font-bold"
                  >
                    Sign In →
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pulse-wide">
            <NotifyPermissionButton dark={dark} label="🔔 Enable exam & deadline reminders" />
          </div>

          <div className="pulse-wide">
            <div className="pulse-dash-grid">
              <div className="flex flex-col gap-3.5">
                <StatTile dark={dark} delay={80 + revealBase} accent={pt.cobalt}>
                  <div className="text-[var(--pulse-sub)] text-[11px] font-bold uppercase mb-2">
                    📊 Weekly Report
                  </div>
                  <div
                    className="font-extrabold text-[30px] leading-[1.15]"
                    style={{
                      fontFamily: pulseFonts.display,
                      color: weeklySummary ? (weeklySummary.accuracy >= 60 ? 'var(--pulse-cobalt)' : 'var(--pulse-danger)') : 'var(--pulse-text)'
                    }}
                  >
                    {weeklySummary ? `${weeklySummary.accuracy}%` : '—'}
                  </div>
                  <div className="text-[var(--pulse-sub)] text-xs mt-1 leading-[1.4]">
                    {weeklySummary ? 'Accuracy this week' : 'No questions logged this week'}
                  </div>
                </StatTile>

                <StatTile dark={dark} delay={140 + revealBase} accent={pt.indigo}>
                  <div className="font-extrabold text-[30px] leading-[1.15] text-[var(--pulse-text)]" style={{ fontFamily: pulseFonts.display }}>
                    {weeklySummary ? weeklySummary.totalAttempted : 0}
                  </div>
                  <div className="text-[var(--pulse-sub)] text-xs mt-1 leading-[1.4]">Questions attempted</div>
                </StatTile>

                <div className="pulse-stat-row-2">
                  <StatTile dark={dark} delay={200 + revealBase} accent={pt.indigo}>
                    <div className="text-[var(--pulse-indigo)] font-bold text-[15px] leading-[1.3]">
                      {weeklySummary?.topSubjectName || '—'}
                    </div>
                    <div className="text-[var(--pulse-sub)] text-[11px] mt-1 leading-[1.4]">Most practiced</div>
                  </StatTile>
                  <StatTile dark={dark} delay={230 + revealBase} accent={pt.terracotta}>
                    <div className="flex items-baseline gap-1.5 text-[var(--pulse-terracotta)]">
                      <span className="text-base">🔥</span>
                      <span className="font-extrabold text-[22px]" style={{ fontFamily: pulseFonts.display }}>{streak}</span>
                    </div>
                    <div className="text-[var(--pulse-sub)] text-[11px] mt-1 leading-[1.4]">Day streak</div>
                  </StatTile>
                </div>

                {(pausedExam || announcement) && (
                  <PulseCard dark={dark} delay={280 + revealBase} accent={pt.cobalt}
                    onClick={pausedExam ? () => navigate('/mcq') : undefined}
                    style={{ padding: '16px 20px' }}>
                    {pausedExam ? (
                      <div className="text-[var(--pulse-cobalt)] font-extrabold text-sm">
                        ⏸ Continue where you left off →
                      </div>
                    ) : (
                      <div className="text-[var(--pulse-text)] font-bold text-[13px] leading-[1.5]">
                        {announcement}
                      </div>
                    )}
                  </PulseCard>
                )}
              </div>

              <div className="pulse-hero-panel flex items-center justify-center">
                <EcgHero height="100%" />
              </div>

              <div>
                <div className="flex items-center gap-2 text-[var(--pulse-cobalt)] text-[11px] font-bold uppercase mb-3.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--pulse-cobalt)] inline-block" style={{ letterSpacing: '0.2em' }} />
                  <span style={{ letterSpacing: '0.2em' }}>Active Modules</span>
                </div>
                <div className="flex flex-col gap-3">
                  {activeModules.length === 0 && (
                    <div className="text-[var(--pulse-sub)] text-[13px]">No active modules yet.</div>
                  )}
                  {activeModules.map((mod, i) => (
                    <PulseCard key={mod.id} dark={dark} delay={250 + revealBase + i * 70} accent={mod.color}
                      onClick={() => navigate(`/module/${mod.id}`)}
                      style={{ borderRadius: 999, padding: '10px 18px 10px 10px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        className="w-[46px] h-[46px] rounded-full flex-shrink-0 flex items-center justify-center text-xl bg-[color-mix(in_srgb,var(--accent)_13%,transparent)] border border-[color-mix(in_srgb,var(--accent)_33%,transparent)]"
                        style={{ '--accent': mod.color }}
                      >
                        {mod.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[var(--pulse-text)] font-bold text-sm leading-[1.25]">{mod.name}</div>
                        <div className="text-[var(--pulse-sub)] text-[11px] mt-0.5 leading-[1.4] overflow-hidden text-ellipsis whitespace-nowrap">{moduleBlurb(mod.name)}</div>
                      </div>
                      <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: mod.color }} />
                    </PulseCard>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pulse-wide">
            <div className={sectionLabelClass} style={{ letterSpacing: '0.15em' }}>⚡ Tools</div>
            <div className="pulse-tools-grid">
              {toolCards.map((card, i) => {
                const accentColor = card.accent === 'amber' ? pt.amber : pt.indigo
                return (
                  <PulseCard key={i} dark={dark} delay={500 + revealBase + i * 70} accent={accentColor}
                    onClick={() => navigate(card.to)}
                    style={{ borderRadius: 22, padding: '18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-[38px] h-[38px] rounded-full flex-shrink-0 flex items-center justify-center text-lg bg-[color-mix(in_srgb,var(--accent)_13%,transparent)]"
                        style={{ '--accent': accentColor }}
                      >
                        {card.emoji}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[var(--pulse-text)] font-bold text-[13px] leading-[1.25]">{card.title}</div>
                        <div className="text-[var(--pulse-sub)] text-[11px] mt-0.5 leading-[1.4]">{card.sub}</div>
                      </div>
                    </div>
                    <div className="text-[var(--pulse-faint)] text-base flex-shrink-0">→</div>
                  </PulseCard>
                )
              })}
            </div>
          </div>

          <div className="pulse-wide flex items-center gap-3.5 justify-center">
            <div className="h-px bg-[var(--pulse-border)] flex-1 max-w-[120px]" />
            <div className="flex items-center gap-2 text-[var(--pulse-faint)] text-[13px] font-semibold">
              <img src={LOGO_SRC} alt="" className="w-[18px] h-[18px] rounded object-cover" />
              Keep the pulse. Shape the future.
            </div>
            <div className="h-px bg-[var(--pulse-border)] flex-1 max-w-[120px]" />
          </div>
        </div>

        {completedModules.length > 0 && (
          <div className="pulse-wide pb-[100px]">
            <div className={sectionLabelClass} style={{ letterSpacing: '0.15em' }}>✓ Completed Modules</div>
            <AutoGrid>
              {completedModules.map((mod, i) => (
                <ScrollRevealItem key={mod.id} delay={i * 110}>
                  <PulseCard dark={dark} delay={0}
                    onClick={() => navigate(`/module/${mod.id}`)}
                    style={{ padding: 'clamp(20px, 2vw, 28px)', textAlign: 'center' }}>
                    <div className="text-[clamp(28px,3vw,42px)] mb-2" style={{ filter: 'grayscale(0.5)' }}>{mod.icon}</div>
                    <div className="text-[var(--pulse-sub)] text-[clamp(13px,1.1vw,16px)] font-bold mb-2 leading-[1.3]">{mod.name}</div>
                    <div className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold text-[var(--pulse-faint)] bg-[color-mix(in_srgb,var(--pulse-faint)_12%,transparent)] border border-[color-mix(in_srgb,var(--pulse-faint)_25%,transparent)]">
                      ✓ Completed
                    </div>
                  </PulseCard>
                </ScrollRevealItem>
              ))}
            </AutoGrid>
          </div>
        )}
      </div>
    </div>
  )
}
