// src/pages/Schedule.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getPulseTheme, pulseFonts, pulseType } from '../premiumTheme'
import ErrorBanner from '../components/ErrorBanner'
import ModuleTabs from '../components/ModuleTabs'
import MediaOverlay from '../components/MediaOverlay'
import LiquidGlassCard from '@/components/ui/liquid-glass-card'
import PulseBackground from '../components/pulse/PulseBackground'
import PulseGlassRow from '../components/pulse/PulseGlassRow'
import { getDriveOrRawUrl } from '../lib/embedUrl'
import { useModules } from '../contexts'

// Existing functional accent color for the Schedule feature (already
// used this way elsewhere in the app, e.g. AnonQuestions) — kept as-is
// rather than introducing a new accent.
const SCHEDULE_ACCENT = '#a78bfa'

const SECTION_GAP = 22
const TASK_GAP = 16

interface ScheduleModule {
  id: string
  name: string
  icon?: string | null
  color: string
  status: 'active' | 'completed'
}

interface ScheduleRow {
  id: string
  title: string
  week?: string | null
  date?: string | null
  url: string
  type: 'study' | 'exam'
  module_id: string
}

type ScheduleType = 'study' | 'exam'

export default function Schedule({ dark }: { dark: boolean }) {
  const pt = getPulseTheme(dark)
  const { modules, modulesLoaded, modulesError } = useModules() as {
    modules: ScheduleModule[]
    modulesLoaded: boolean
    modulesError: boolean
  }
  const [schedules, setSchedules] = useState<ScheduleRow[]>([])
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<ScheduleType>('study')
  const [loading, setLoading] = useState(true)
  const [viewer, setViewer] = useState<ScheduleRow | null>(null)
  const [loadError, setLoadError] = useState(false)

  // Only active modules are offered here — a schedule for a completed
  // module isn't something a student needs a tab to keep switching to.
  const activeModules = modules.filter(m => m.status === 'active')

  useEffect(() => {
    if (modulesLoaded && activeModules.length > 0 && !activeModule) {
      setActiveModule(activeModules[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulesLoaded, modules])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data, error } = await supabase.from('schedules').select('*').order('created_at')
      if (data) setSchedules(data as ScheduleRow[])
      if (error) setLoadError(true)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filtered = schedules.filter(s => s.module_id === activeModule && s.type === activeType)
  const hoverTint = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PulseBackground />
      <div className="pulse-wide" style={{ position: 'relative', zIndex: 1, padding: '24px 20px 100px', fontFamily: pulseFonts.body }}>

        {(loadError || modulesError) && <ErrorBanner />}

        {viewer && (
          <MediaOverlay
            label={`📅 ${viewer.title}`}
            labelColor={SCHEDULE_ACCENT}
            onClose={() => setViewer(null)}
            src={getDriveOrRawUrl(viewer.url)}
            iframeTitle={viewer.title}
            allow="autoplay" allowFullScreen={undefined}          />
        )}

        <div style={{ textAlign: 'center', padding: '10px 0 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
          <h1 style={{
            fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 24,
            color: pt.text, marginBottom: 4
          }}>Schedules</h1>
          <p style={{ color: pt.sub, fontSize: 13 }}>Study plans and exam dates, module by module</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: SECTION_GAP }}>
          <ModuleTabs
            modules={activeModules}
            activeModule={activeModule}
            onSelect={setActiveModule}
            dark={dark}
            style={{ justifyContent: 'center', flexWrap: 'wrap', overflowX: 'visible', marginBottom: 0, rowGap: 10 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: SECTION_GAP }}>
          {(['study', 'exam'] as ScheduleType[]).map(type => {
            const active = activeType === type
            return (
              <PulseGlassRow
                key={type}
                dark={dark}
                radius={999}
                active={active}
                activeTint={`${pt.cobalt}26`}
                hoverTint={hoverTint}
                onClick={() => setActiveType(type)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveType(type) } }}
                aria-label={type === 'study' ? 'Study Schedule' : 'Exam Schedule'}
              >
                <div style={{
                  padding: '10px 20px', whiteSpace: 'nowrap',
                  ...pulseType.button, color: active ? pt.cobalt : pt.sub
                }}>
                  {type === 'study' ? '📅 Study Schedule' : '📝 Exam Schedule'}
                </div>
              </PulseGlassRow>
            )
          })}
        </div>

        {!modulesLoaded || loading ? (
          <p style={{ color: pt.sub, textAlign: 'center' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <LiquidGlassCard dark={dark} delay={0} style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ color: pt.sub }}>No schedules yet 🚧</p>
          </LiquidGlassCard>
        ) : (
          <div>
            {filtered.map((sch, i) => {
              const isLast = i === filtered.length - 1
              return (
                <div key={sch.id} style={{ marginBottom: isLast ? 0 : TASK_GAP }}>
                  <LiquidGlassCard
                    dark={dark}
                    delay={i * 90}
                    onClick={() => setViewer(sch)}
                    style={{ borderRadius: 999, padding: '10px 18px 10px 10px', display: 'flex', alignItems: 'center', gap: 14 }}
                  >
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                      background: `${SCHEDULE_ACCENT}22`, border: `1px solid ${SCHEDULE_ACCENT}55`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                    }}>
                      {sch.type === 'exam' ? '📝' : '📅'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...pulseType.cardTitle, color: pt.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sch.title}
                      </div>
                      <div style={{ ...pulseType.small, color: pt.textMuted, marginTop: 2 }}>
                        {sch.week ? sch.week : null}
                        {sch.date && (
                          <span style={{ color: SCHEDULE_ACCENT, fontWeight: 700 }}>
                            {sch.week ? ' · ' : ''}{new Date(sch.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{
                      background: SCHEDULE_ACCENT, color: '#0f172a',
                      borderRadius: 10, padding: '8px 14px',
                      fontWeight: 700, fontSize: 12, flexShrink: 0
                    }}>
                      🔍 View
                    </div>
                  </LiquidGlassCard>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
