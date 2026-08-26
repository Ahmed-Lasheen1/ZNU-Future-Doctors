import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, NavMenu, useModules } from '../App'
import { supabase } from '../supabase'
import { getPulseTheme } from '../premiumTheme'
import ErrorBanner from '../components/ErrorBanner'
import { computeStreak } from '../lib/streak'
import { getGuestHistory } from '../lib/reviewStorage'
import { loadSavedActiveExam } from '../lib/activeExam'
import NotifyPermissionButton from '../components/NotifyPermissionButton'

// ─────────────────────────────────────────────────────────────────
// ZNU PULSE — ECG hero signal.
//
// Draws a continuously-advancing, non-looping ECG-style waveform on
// a canvas. Beats are generated on the fly as time passes (RR
// interval, amplitude and a tiny baseline drift all jitter slightly
// beat to beat), so nothing about it visibly repeats. Respects
// prefers-reduced-motion by rendering one still waveform instead of
// animating.
// ─────────────────────────────────────────────────────────────────
function gaussianBump(x, center, width, height) {
  const d = (x - center) / width
  return height * Math.exp(-4 * d * d)
}

// One heartbeat's shape as a function of phase (0..1): a small P
// wave, a sharp QRS complex, then a broader T wave. Deliberately
// abstract, not a diagnostic waveform.
function beatShape(phase) {
  let v = 0
  v += gaussianBump(phase, 0.14, 0.045, 0.14)          // P wave
  v += gaussianBump(phase, 0.30, 0.010, -0.18)          // Q dip
  v += gaussianBump(phase, 0.325, 0.014, 1.0)           // R peak
  v += gaussianBump(phase, 0.35, 0.012, -0.32)          // S dip
  v += gaussianBump(phase, 0.62, 0.09, 0.22)            // T wave
  return v
}

// Cheap deterministic pseudo-random in [0,1) seeded by an integer —
// used so each beat's jitter is stable frame to frame without
// needing to store extra state per beat.
function hashRand(n) {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

function PulseECG({ stroke, glow, height = 120 }) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const rafRef = useRef(null)
  const beatsRef = useRef([{ start: 0, dur: 0.86, amp: 1 }])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0, heightPx = 0, dpr = Math.min(2, window.devicePixelRatio || 1)

    function resize() {
      width = wrap.clientWidth
      heightPx = height
      canvas.width = width * dpr
      canvas.height = heightPx * dpr
      canvas.style.width = width + 'px'
      canvas.style.height = heightPx + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const WINDOW_SEC = 6.5

    // Extend the beat schedule forward as time advances so the
    // pattern never has to loop back to a fixed start.
    function beatValueAt(t) {
      const beats = beatsRef.current
      let last = beats[beats.length - 1]
      while (last.start + last.dur < t + WINDOW_SEC) {
        const idx = beats.length
        const rrJitter = 1 + (hashRand(idx * 3.1) - 0.5) * 0.12     // ±6% RR variation
        const ampJitter = 1 + (hashRand(idx * 7.7) - 0.5) * 0.16    // ±8% amplitude variation
        const next = { start: last.start + last.dur, dur: 0.86 * rrJitter, amp: ampJitter }
        beats.push(next)
        last = next
      }
      // Drop beats that scrolled fully off-screen a while ago.
      while (beats.length > 4 && beats[1].start + beats[1].dur < t - WINDOW_SEC) beats.shift()

      for (let i = beats.length - 1; i >= 0; i--) {
        const b = beats[i]
        if (t >= b.start && t < b.start + b.dur) {
          const phase = (t - b.start) / b.dur
          return beatShape(phase) * b.amp
        }
      }
      return 0
    }

    function baselineDrift(t) {
      return Math.sin(t * 0.37) * 0.035 + Math.sin(t * 0.13 + 1.7) * 0.02
    }

    function draw(t) {
      ctx.clearRect(0, 0, width, heightPx)
      const midY = heightPx * 0.58
      const scale = heightPx * 0.34

      const grad = ctx.createLinearGradient(0, 0, width, 0)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(0.12, stroke)
      grad.addColorStop(1, stroke)

      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.strokeStyle = grad
      ctx.shadowColor = glow
      ctx.shadowBlur = 8

      ctx.beginPath()
      const steps = Math.floor(width)
      for (let x = 0; x <= steps; x++) {
        const time = t - (width - x) / width * WINDOW_SEC
        const v = beatValueAt(time) + baselineDrift(time)
        const y = midY - v * scale
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Leading dot — the "live" tip of the signal.
      const headV = beatValueAt(t) + baselineDrift(t)
      const headY = midY - headV * scale
      ctx.beginPath()
      ctx.fillStyle = stroke
      ctx.arc(width - 2, headY, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    if (reduceMotion) {
      draw(2)
    } else {
      const t0 = performance.now()
      const tick = (now) => {
        draw((now - t0) / 1000)
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [stroke, glow, height])

  return (
    <div ref={wrapRef} style={{ width: '100%', height }}>
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  )
}

// Small helper so a missing/blank name never crashes the avatar badge.
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

const toolLinks = [
  { emoji: '📅', title: 'Schedules', to: '/schedule' },
  { emoji: '🎯', title: 'Checklist', to: '/checklist' },
  { emoji: '💬', title: 'Anonymous Q&A', to: '/anon-questions' },
  { emoji: '🏆', title: 'Leaderboard', to: '/profile?tab=leaderboard' },
]

export default function Home({ dark, toggleTheme }) {
  const p = getPulseTheme(dark)
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { modules, modulesError } = useModules()
  const [heroVisible, setHeroVisible] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [streak, setStreak] = useState(0)
  const [pausedExam, setPausedExam] = useState(null)
  const [weeklySummary, setWeeklySummary] = useState(null)

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 80)
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
  // from MCQ.jsx.
  useEffect(() => {
    loadSavedActiveExam(user).then(setPausedExam)
  }, [user])

  // Weekly summary — built purely from exam_history (or its guest-local
  // equivalent): questions attempted, accuracy, most-practiced subject
  // over the last 7 days.
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

  // ── Next action — the single most important thing on the page ──
  const pausedModule = pausedExam ? modules.find(m => m.id === pausedExam.activeModule) : null
  let nextAction = null
  if (pausedExam) {
    const answered = Object.keys(pausedExam.answers || {}).length
    const total = (pausedExam.quizQuestions || []).length
    nextAction = {
      eyebrow: 'PICK UP WHERE YOU STOPPED',
      label: pausedModule ? `Continue ${pausedModule.name}` : 'Continue your exam',
      sub: `${answered}/${total} questions answered`,
      cta: '→ Resume',
      onClick: () => navigate('/mcq'),
    }
  } else if (activeModules.length > 0) {
    const mod = activeModules[0]
    nextAction = {
      eyebrow: 'NEXT ACTION',
      label: `Start ${mod.name}`,
      sub: 'Study materials and practice questions are ready',
      cta: '→ Open',
      onClick: () => navigate(`/module/${mod.id}`),
    }
  } else {
    nextAction = {
      eyebrow: 'NEXT ACTION',
      label: 'Explore ZNU Pulse',
      sub: 'Your modules will appear here as soon as they’re added',
      cta: '→ Explore',
      onClick: () => navigate('/search'),
    }
  }

  const eyebrowStyle = {
    fontFamily: p.font.body, fontSize: p.type.micro.size, fontWeight: p.type.micro.weight,
    letterSpacing: p.type.micro.spacing, textTransform: p.type.micro.transform, color: p.textMuted,
  }
  const metaStyle = { fontFamily: p.font.body, fontSize: p.type.meta.size, color: p.textMuted }
  const dividerStyle = { borderTop: `1px solid ${p.line}` }

  return (
    <div style={{ background: p.bg, minHeight: '100vh', color: p.text, fontFamily: p.font.body }}>
      {/* ── Nav ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 20px', position: 'sticky', top: 0, zIndex: 50,
        background: p.dark ? 'rgba(10,15,26,0.82)' : 'rgba(247,247,245,0.86)',
        backdropFilter: 'blur(10px)', borderBottom: `1px solid ${p.line}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: p.font.display, fontWeight: 800, fontSize: 17, letterSpacing: '-0.01em', color: p.text }}>
            ZNU <span style={{ color: p.accentTeal }}>PULSE</span>
          </span>
          <span style={{ ...eyebrowStyle, display: window.innerWidth > 640 ? 'inline' : 'none' }}>Future Doctors</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={toggleTheme} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} style={{
            background: 'transparent', border: 'none', color: p.textMuted, cursor: 'pointer', fontSize: 16, padding: 4
          }}>{dark ? '☀️' : '🌙'}</button>
          <NavMenu dark={dark} />
          <button onClick={() => navigate('/search')} aria-label="Search" style={{
            background: 'transparent', border: 'none', color: p.textMuted, cursor: 'pointer', fontSize: 16, padding: 4
          }}>🔍</button>

          {user && profile ? (
            <div onClick={() => navigate('/profile')} role="button" tabIndex={0}
              onKeyDown={onActivateKeyDown(() => navigate('/profile'))}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: p.accentTeal, color: p.dark ? '#0A0F1A' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 900, flexShrink: 0
              }}>{initialOf(profile.name)}</div>
              <span style={{ ...metaStyle, fontWeight: 700, color: p.text, display: window.innerWidth > 480 ? 'inline' : 'none' }}>
                Dr. {profile.name}
              </span>
            </div>
          ) : (
            <button onClick={() => navigate('/auth')} style={{
              background: 'transparent', border: `1px solid ${p.lineStrong}`, borderRadius: 20,
              padding: '5px 14px', color: p.text, cursor: 'pointer', fontFamily: p.font.body,
              fontSize: 12, fontWeight: 700
            }}>Sign in</button>
          )}
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 980, margin: '0 auto', padding: '48px 20px 12px',
        opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(14px)',
        transition: `all ${p.motion.slow} ${p.motion.ease}`
      }}>
        <div style={eyebrowStyle}>ZNU PULSE</div>
        <h1 style={{
          fontFamily: p.font.display, fontWeight: p.type.display.weight,
          fontSize: p.type.display.size, letterSpacing: p.type.display.spacing,
          lineHeight: 1.04, margin: '10px 0 6px', maxWidth: 720
        }}>
          Your medical journey,<br />in motion.
        </h1>
        <div style={{ ...metaStyle, fontStyle: 'italic', marginBottom: 22 }}>
          For Future Doctors{streak > 0 ? ` · 🔥 ${streak}-day study streak` : ''}
        </div>

        <PulseECG stroke={p.pulseStroke} glow={p.pulseGlow} height={110} />
      </div>

      {modulesError && (
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 20px' }}>
          <ErrorBanner />
        </div>
      )}

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 20px' }}>
        <NotifyPermissionButton dark={dark} label="🔔 Enable exam & deadline reminders" />
      </div>

      {/* ── Next action ─────────────────────────────────────── */}
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '20px 20px 8px' }}>
        <div onClick={nextAction.onClick} role="button" tabIndex={0}
          onKeyDown={onActivateKeyDown(nextAction.onClick)}
          style={{
            padding: '26px 0', borderTop: `1px solid ${p.line}`, borderBottom: `1px solid ${p.line}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 20, transition: `opacity ${p.motion.base} ${p.motion.ease}`
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = 0.75}
          onMouseLeave={e => e.currentTarget.style.opacity = 1}>
          <div style={{ minWidth: 0 }}>
            <div style={eyebrowStyle}>{nextAction.eyebrow}</div>
            <div style={{
              fontFamily: p.font.display, fontWeight: p.type.heading.weight,
              fontSize: p.type.heading.size, marginTop: 6, color: p.text,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>{nextAction.label}</div>
            <div style={{ ...metaStyle, marginTop: 4 }}>{nextAction.sub}</div>
          </div>
          <div style={{
            fontFamily: p.font.display, fontWeight: 800, fontSize: 15, color: p.accentTeal,
            whiteSpace: 'nowrap', flexShrink: 0
          }}>{nextAction.cta}</div>
        </div>
      </div>

      {/* ── Announcement ────────────────────────────────────── */}
      {announcement && (
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '20px 20px 0' }}>
          <div style={{
            borderLeft: `3px solid ${p.accentBlue}`, padding: '4px 0 4px 16px',
            color: p.text, fontSize: 14, fontWeight: 500, lineHeight: 1.6, whiteSpace: 'pre-wrap'
          }}>
            {announcement}
          </div>
        </div>
      )}

      {/* ── This week ───────────────────────────────────────── */}
      {weeklySummary && (
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 20px 8px' }}>
          <div style={eyebrowStyle}>THIS WEEK</div>
          <div style={{ display: 'flex', gap: 'clamp(24px, 6vw, 56px)', flexWrap: 'wrap', marginTop: 14, alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontFamily: p.font.display, fontWeight: 800, fontSize: 'clamp(38px, 6vw, 56px)', lineHeight: 1, color: p.text }}>
                {weeklySummary.totalAttempted}
              </div>
              <div style={{ ...metaStyle, marginTop: 4 }}>Questions answered</div>
            </div>
            <div>
              <div style={{
                fontFamily: p.font.display, fontWeight: 800, fontSize: 'clamp(38px, 6vw, 56px)', lineHeight: 1,
                color: weeklySummary.accuracy >= 60 ? p.success : p.danger
              }}>
                {weeklySummary.accuracy}%
              </div>
              <div style={{ ...metaStyle, marginTop: 4 }}>Accuracy</div>
            </div>
            {weeklySummary.topSubjectName && (
              <div>
                <div style={{ fontFamily: p.font.display, fontWeight: 800, fontSize: 20, color: p.accentBlue, lineHeight: 1.2 }}>
                  {weeklySummary.topSubjectName}
                </div>
                <div style={{ ...metaStyle, marginTop: 4 }}>Most practiced</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modules ─────────────────────────────────────────── */}
      {activeModules.length > 0 && (
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 20px 8px' }}>
          <div style={eyebrowStyle}>YOUR MODULES</div>
          <div style={{ marginTop: 6 }}>
            {activeModules.map((mod, i) => (
              <div key={mod.id} onClick={() => navigate(`/module/${mod.id}`)}
                role="button" tabIndex={0} onKeyDown={onActivateKeyDown(() => navigate(`/module/${mod.id}`))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 18, padding: '18px 0',
                  borderBottom: `1px solid ${p.line}`, cursor: 'pointer',
                  transition: `opacity ${p.motion.base} ${p.motion.ease}`
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 0.72}
                onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                <div style={{
                  fontFamily: p.font.display, fontWeight: 800, fontSize: 15, color: p.textFaint,
                  width: 26, flexShrink: 0
                }}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ fontSize: 22, flexShrink: 0 }}>{mod.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: p.font.display, fontWeight: 700, fontSize: 'clamp(15px, 2vw, 19px)',
                    color: p.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>{mod.name}</div>
                </div>
                <div style={{
                  ...metaStyle, color: p.success, fontWeight: 700, flexShrink: 0,
                  display: window.innerWidth > 520 ? 'block' : 'none'
                }}>● Active</div>
                <div style={{ color: p.accentTeal, fontFamily: p.font.display, fontWeight: 800, fontSize: 15, flexShrink: 0 }}>→</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedModules.length > 0 && (
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 20px 8px' }}>
          <div style={eyebrowStyle}>COMPLETED</div>
          <div style={{ marginTop: 6 }}>
            {completedModules.map(mod => (
              <div key={mod.id} onClick={() => navigate(`/module/${mod.id}`)}
                role="button" tabIndex={0} onKeyDown={onActivateKeyDown(() => navigate(`/module/${mod.id}`))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 18, padding: '13px 0',
                  borderBottom: `1px solid ${p.line}`, cursor: 'pointer', opacity: 0.6,
                  transition: `opacity ${p.motion.base} ${p.motion.ease}`
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 0.95}
                onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
                <div style={{ fontSize: 17, flexShrink: 0, filter: 'grayscale(0.6)' }}>{mod.icon}</div>
                <div style={{ flex: 1, minWidth: 0, fontFamily: p.font.body, fontWeight: 600, fontSize: 14, color: p.textMuted }}>
                  {mod.name}
                </div>
                <div style={{ ...metaStyle, flexShrink: 0 }}>✓ Completed</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tools ───────────────────────────────────────────── */}
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 20px 60px' }}>
        <div style={eyebrowStyle}>MORE</div>
        <div style={{ marginTop: 6 }}>
          {toolLinks.map((tool, i) => (
            <div key={i} onClick={() => navigate(tool.to)}
              role="button" tabIndex={0} onKeyDown={onActivateKeyDown(() => navigate(tool.to))}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '15px 0',
                borderBottom: i < toolLinks.length - 1 ? `1px solid ${p.line}` : 'none',
                cursor: 'pointer', transition: `opacity ${p.motion.base} ${p.motion.ease}`
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = 0.7}
              onMouseLeave={e => e.currentTarget.style.opacity = 1}>
              <span style={{ fontSize: 18 }}>{tool.emoji}</span>
              <span style={{ flex: 1, fontFamily: p.font.body, fontWeight: 600, fontSize: 14, color: p.text }}>{tool.title}</span>
              <span style={{ color: p.textFaint, fontSize: 14 }}>→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
