// src/pages/Home.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth, useModules } from '../contexts'
import NavMenu from '../components/NavMenu'
import { getTheme } from '../theme'
import { getPulseTheme, pulseFonts, pulseType } from '../premiumTheme'
import { supabase } from '../supabase'
import ErrorBanner from '../components/ErrorBanner'
import AutoGrid from '../components/AutoGrid'
import { computeStreak } from '../lib/streak'
import { getGuestHistory } from '../lib/reviewStorage'
import { loadSavedActiveExam } from '../lib/activeExam'
import { ENTRANCE_PAUSE } from '../lib/pulseMotion'
import NotifyPermissionButton from '../components/NotifyPermissionButton'
import LiquidGlassCard from '@/components/ui/liquid-glass-card'
import EcgHero from '../components/pulse/EcgHero'
import PulseBackground from '../components/pulse/PulseBackground'
import PulseBrand from '../components/pulse/PulseBrand'
import { ScheduleIcon, ChecklistIcon, AnonQAIcon, LeaderboardIcon } from '@/components/ui/tool-icons'
import { ModuleIcon } from '../lib/medicalIcons'

interface HomeModule {
  id: string; name: string; icon?: string | null; color: string; status: 'active' | 'completed'
}

const toolCards = [
  { Icon: ScheduleIcon, title: 'Schedules', sub: 'Plan your study time', to: '/schedule', accent: 'indigo' },
  { Icon: ChecklistIcon, title: 'Checklist', sub: 'Track your progress', to: '/checklist', accent: 'amber' },
  { Icon: AnonQAIcon, title: 'Anonymous Q&A', sub: 'Ask. Learn. Grow.', to: '/anon-questions', accent: 'indigo' },
  { Icon: LeaderboardIcon, title: 'Leaderboard', sub: 'See where you stand', to: '/profile?tab=leaderboard', accent: 'amber' },
] as const

const MODULE_BLURBS: Record<string, string> = {
  neuro: 'Explore the wonders of the nervous system',
  cardio: 'Understand the heart and blood vessels',
  respirat: 'Study the mechanics of breathing',
  digest: 'Learn the process of nourishment',
  gastro: 'Learn the process of nourishment',
}
function moduleBlurb(name: string) {
  const key = Object.keys(MODULE_BLURBS).find(k => name.toLowerCase().includes(k))
  return key ? MODULE_BLURBS[key] : 'Master the essentials of this module.'
}

// ── Custom line-art icons for the Weekly Report card ────────────────
// Drawn in the same convention as src/components/ui/tool-icons.tsx
// (thin ~1.6-1.8px rounded strokes) — replaces the plain 📊 and 🔥
// emoji with purpose-built glyphs instead.

function WeeklyReportIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 9.5l4.5-3.5 4.5 2.5L19 3"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
      <path d="M4 20v-6.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.5 20V11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 20v-9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 20V6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function StreakFlameIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21c4.2 0 7-2.9 7-6.8 0-3-1.9-4.8-3-7.6-.9 2.6-2.7 2.8-2.7 5.3 0-2.8-1.9-4.6-.9-7.4C9.5 6.3 7 9.7 7 13.4 7 17.6 9.4 21 12 21Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M12 21c1.7 0 3-1.3 3-3.1 0-1.6-1.1-2.5-1.6-3.6-.5 1.1-1.4 1.3-1.4 2.6 0-1.3-.9-2-.6-3.3-1.5 1-2.4 2.7-2.4 4.3 0 1.8 1.3 3.1 3 3.1Z"
        fill={color}
        opacity="0.35"
      />
    </svg>
  )
}

// Major dashboard-number style (weekly accuracy %, questions attempted,
// streak) — sourced from the shared typography hierarchy, scaled down
// from the full `display` size since these sit inside compact stat
// tiles rather than as a page hero number.
const statNumStyle = { ...pulseType.display, fontSize: 28, lineHeight: 1.1 }

// ── Reveal order ───────────────────────────────────────────────────
const HERO_DELAY = ENTRANCE_PAUSE
const LOGO_DELAY = ENTRANCE_PAUSE + 0.5
const NOTIFY_DELAY = LOGO_DELAY + 0.3
const WEEKLY_REPORT_START = LOGO_DELAY + 0.6
const ACTIVE_MODULES_START = WEEKLY_REPORT_START + 0.6
const TOOLS_START = ACTIVE_MODULES_START + 0.6
const FOOTER_DELAY = TOOLS_START + 0.5
const COMPLETED_MODULES_START = TOOLS_START + 0.6

function msFor(targetSeconds: number) {
  return Math.round(((targetSeconds - ENTRANCE_PAUSE) / 1.5) * 1000)
}

// ── Brand block timeline ──────────────────────────────────────────
const BRAND_WORDS_START = LOGO_DELAY + 0.45
const BRAND_WORD_STAGGER = 0.2
const BRAND_TAGLINE_DELAY = BRAND_WORDS_START + BRAND_WORD_STAGGER * 2 + 0.2

export default function Home({ dark, toggleTheme }: { dark: boolean; toggleTheme: () => void }) {
  const c = getTheme(dark)
  const pt = getPulseTheme(dark)
  const navigate = useNavigate()
  const { user, profile } = useAuth() as any
  const { modules, modulesLoaded, modulesError } = useModules() as { modules: HomeModule[]; modulesLoaded: boolean; modulesError: boolean }
  const [announcement, setAnnouncement] = useState('')
  const [streak, setStreak] = useState(0)
  const [pausedExam, setPausedExam] = useState<any>(null)
  const [weeklySummary, setWeeklySummary] = useState<{ totalAttempted: number; accuracy: number; topSubjectName: string | null } | null>(null)

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'home_announcement').single()
      .then(({ data }) => { if (data?.value) setAnnouncement(data.value) })
  }, [])

  useEffect(() => {
    async function loadStreak() {
      if (user) {
        const { data } = await supabase.from('exam_history').select('completed_at').eq('user_id', user.id)
        setStreak(computeStreak((data || []).map((r: any) => r.completed_at)))
      } else {
        setStreak(computeStreak(getGuestHistory().map((r: any) => r.completed_at)))
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
      let rows: any[] = []
      if (user) {
        const { data } = await supabase
          .from('exam_history')
          .select('total, correct, subject_id, completed_at')
          .eq('user_id', user.id)
          .gte('completed_at', new Date(weekAgoMs).toISOString())
        rows = data || []
      } else {
        rows = getGuestHistory().filter((h: any) => h.completed_at >= weekAgoMs)
      }

      if (rows.length === 0) { setWeeklySummary(null); return }

      const totalAttempted = rows.reduce((a, h) => a + h.total, 0)
      const totalCorrect = rows.reduce((a, h) => a + h.correct, 0)
      const accuracy = totalAttempted > 0 ? Math.round((100 * totalCorrect) / totalAttempted) : 0

      const bySubject: Record<string, number> = {}
      rows.forEach(h => { if (h.subject_id) bySubject[h.subject_id] = (bySubject[h.subject_id] || 0) + h.total })
      const topSubjectId = Object.entries(bySubject).sort((a, b) => b[1] - a[1])[0]?.[0] || null

      let topSubjectName: string | null = null
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
      const upcoming = data.filter((s: any) => {
        const diffDays = Math.round((new Date(s.date).getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
        return diffDays >= 0 && diffDays <= 2
      })
      if (upcoming.length === 0) return

      const todayStr = today.toDateString()
      if (localStorage.getItem('exam_reminder_last_notify') === todayStr) return

      upcoming.forEach((s: any) => {
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

  // Section eyebrow labels ("⚡ TOOLS", "✓ COMPLETED MODULES") — now
  // driven entirely by the shared sectionLabel typography token
  // (Sora, 600 weight, uppercase, +0.16em tracking) instead of local
  // ad-hoc sizing, so every uppercase label in the app matches.
  const sectionTitle = (text: string, delaySeconds: number) => (
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: delaySeconds }}
      style={{
        ...pulseType.sectionLabel,
        color: pt.textMuted,
        marginBottom: 16,
      }}>{text}</motion.h2>
  )

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
      <PulseBackground />

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 500,
        pointerEvents: 'none',
      }}>
        <div className="pulse-wide" style={{
          paddingTop: 'max(16px, env(safe-area-inset-top))',
          paddingBottom: 16,
          pointerEvents: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <PulseBrand
              dark={dark}
              animation={{
                logoDelay: LOGO_DELAY,
                wordsStart: BRAND_WORDS_START,
                wordStagger: BRAND_WORD_STAGGER,
                taglineDelay: BRAND_TAGLINE_DELAY,
              }}
            />

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: LOGO_DELAY }}
            >
              <NavMenu dark={dark} toggleTheme={toggleTheme} align="right" />
            </motion.div>
          </div>
        </div>
      </div>

      <div style={{
        position: 'relative', zIndex: 1,
        fontFamily: pulseFonts.body
      }}>
        <style>{`
          .pulse-fold {
            min-height: 100vh;
            min-height: 100svh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: clamp(16px, 3vh, 40px);
            padding: clamp(14px, 2.5vh, 28px) 0 clamp(24px, 4vh, 56px);
            padding-bottom: max(clamp(24px, 4vh, 56px), env(safe-area-inset-bottom));
            box-sizing: border-box;
          }

          .pulse-dash-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: clamp(14px, 1.6vw, 28px);
            align-items: stretch;
          }
          @media (max-width: 1000px) {
            .pulse-dash-grid { grid-template-columns: 1fr; }
          }
          .pulse-report-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
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
            .pulse-report-grid { gap: 8px; }
          }
        `}</style>

        <div style={{ height: 'calc(76px + env(safe-area-inset-top))' }} />

        <div className="pulse-fold">
          {modulesError && <div className="pulse-wide"><ErrorBanner /></div>}

          <motion.div className="pulse-wide"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: NOTIFY_DELAY }}
          >
            <NotifyPermissionButton dark={dark} label="🔔 Enable exam & deadline reminders" />
          </motion.div>

          <div className="pulse-wide">
            <div className="pulse-dash-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <LiquidGlassCard dark={dark} delay={msFor(WEEKLY_REPORT_START)} style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <WeeklyReportIcon color={pt.text} size={16} />
                    <div style={{ ...pulseType.sectionLabel, fontSize: 16, color: pt.text }}>
                      Weekly Report
                    </div>
                  </div>
                  <div className="pulse-report-grid">
                    <div>
                      <div style={{
                        ...statNumStyle,
                        color: weeklySummary ? (weeklySummary.accuracy >= 60 ? pt.cobalt : pt.danger) : pt.textPrimary
                      }}>
                        {weeklySummary ? `${weeklySummary.accuracy}%` : '—'}
                      </div>
                      <div style={{ ...pulseType.small, color: pt.textSecondary, marginTop: 4 }}>
                        {weeklySummary ? 'Accuracy this week' : 'No questions logged this week'}
                      </div>
                    </div>
                    <div>
                      <div style={{ ...statNumStyle, color: pt.textPrimary }}>{weeklySummary ? weeklySummary.totalAttempted : 0}</div>
                      <div style={{ ...pulseType.small, color: pt.textSecondary, marginTop: 4 }}>Questions attempted</div>
                    </div>
                    <div>
                      <div style={{ ...pulseType.cardTitle, fontSize: 15, color: pt.indigo }}>
                        {weeklySummary?.topSubjectName || '—'}
                      </div>
                      <div style={{ ...pulseType.small, fontSize: 11, color: pt.textMuted, marginTop: 4 }}>Most practiced</div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, color: pt.terracotta }}>
                        <StreakFlameIcon color={pt.terracotta} size={16} />
                        <span style={{ ...pulseType.display, fontSize: 22, lineHeight: 1 }}>{streak}</span>
                      </div>
                      <div style={{ ...pulseType.small, fontSize: 11, color: pt.textMuted, marginTop: 4 }}>Day streak</div>
                    </div>
                  </div>
                </LiquidGlassCard>

                {(pausedExam || announcement) && (
                  <LiquidGlassCard dark={dark} delay={msFor(WEEKLY_REPORT_START) + 200}
                    onClick={pausedExam ? () => navigate('/mcq') : undefined}
                    style={{ padding: '16px 20px' }}>
                    {pausedExam ? (
                      <div style={{ ...pulseType.cardTitle, fontSize: 14, color: pt.cobalt }}>
                        ⏸ Continue where you left off →
                      </div>
                    ) : (
                      <div style={{ ...pulseType.bodyEmphasis, fontSize: 13, color: pt.textPrimary, lineHeight: 1.5 }}>
                        {announcement}
                      </div>
                    )}
                  </LiquidGlassCard>
                )}
              </div>

              <motion.div className="pulse-hero-panel"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.85, delay: HERO_DELAY }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <EcgHero height={400} />
              </motion.div>

              <div>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: ACTIVE_MODULES_START }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, color: pt.cobalt, marginBottom: 14, ...pulseType.sectionLabel }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: pt.cobalt, display: 'inline-block' }} />
                  Active Modules
                </motion.div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {modulesLoaded && activeModules.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: ACTIVE_MODULES_START }}
                      style={{ ...pulseType.body, color: pt.textSecondary }}
                    >No active modules yet.</motion.div>
                  )}
                  {activeModules.map((mod, i) => (
                    <LiquidGlassCard key={mod.id} dark={dark} delay={msFor(ACTIVE_MODULES_START) + i * 110}
                      onClick={() => navigate(`/module/${mod.id}`)}
                      style={{ borderRadius: 999, padding: '10px 18px 10px 10px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                        background: `${mod.color}22`, border: `1px solid ${mod.color}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <ModuleIcon value={mod.icon} size={20} color={mod.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ ...pulseType.cardTitle, color: pt.textPrimary }}>{mod.name}</div>
                        <div style={{ ...pulseType.small, color: pt.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{moduleBlurb(mod.name)}</div>
                      </div>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: mod.color, display: 'inline-block', flexShrink: 0 }} />
                    </LiquidGlassCard>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pulse-wide">
            {sectionTitle('⚡ Tools', TOOLS_START)}
            <div className="pulse-tools-grid">
              {toolCards.map((card, i) => {
                const accentColor = card.accent === 'amber' ? pt.amber : pt.indigo
                const Icon = card.Icon
                return (
                  <LiquidGlassCard key={i} dark={dark} delay={msFor(TOOLS_START) + i * 110}
                    onClick={() => navigate(card.to)}
                    style={{ borderRadius: 22, padding: '18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        background: `${accentColor}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon color={accentColor} size={19} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ ...pulseType.cardTitle, fontSize: 13, color: pt.textPrimary }}>{card.title}</div>
                        <div style={{ ...pulseType.small, fontSize: 11, color: pt.textMuted, marginTop: 1 }}>{card.sub}</div>
                      </div>
                    </div>
                    <div style={{ color: pt.textMuted, fontSize: 16, flexShrink: 0 }}>→</div>
                  </LiquidGlassCard>
                )
              })}
            </div>
          </div>

          <motion.div className="pulse-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: FOOTER_DELAY }}
            style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center' }}
          >
            <div style={{ height: 1, background: pt.border, flex: 1, maxWidth: 120 }} />
            <div style={{ ...pulseType.small, display: 'flex', alignItems: 'center', gap: 8, color: pt.textMuted }}>
              <img src="/icon-192.png" alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }} />
              Keep the pulse. Shape the future.
            </div>
            <div style={{ height: 1, background: pt.border, flex: 1, maxWidth: 120 }} />
          </motion.div>
        </div>

        {completedModules.length > 0 && (
          <div className="pulse-wide" style={{ paddingBottom: 'max(100px, env(safe-area-inset-bottom))' }}>
            {sectionTitle('✓ Completed Modules', COMPLETED_MODULES_START)}
            <AutoGrid>
              {completedModules.map((mod, i) => (
                <LiquidGlassCard key={mod.id} dark={dark} delay={msFor(COMPLETED_MODULES_START) + i * 110}
                  onClick={() => navigate(`/module/${mod.id}`)}
                  style={{ padding: 'clamp(20px, 2vw, 28px)', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, filter: 'grayscale(0.5)' }}>
                    <ModuleIcon value={mod.icon} size={38} color={pt.textMuted} />
                  </div>
                  <div style={{ ...pulseType.cardTitle, fontSize: 'clamp(13px, 1.1vw, 16px)', color: pt.textSecondary, marginBottom: 8 }}>{mod.name}</div>
                  <div style={{
                    ...pulseType.small, fontSize: 11,
                    display: 'inline-block', background: `${pt.textMuted}20`, color: pt.textMuted,
                    border: `1px solid ${pt.textMuted}40`, borderRadius: 20, padding: '2px 10px'
                  }}>✓ Completed</div>
                </LiquidGlassCard>
              ))}
            </AutoGrid>
          </div>
        )}
      </div>
    </div>
  )
}
