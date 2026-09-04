// src/pages/ModulePage.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getPulseTheme, pulseFonts, pulseType } from '../premiumTheme'
import ErrorBanner from '../components/ErrorBanner'
import LiquidGlassCard from '@/components/ui/liquid-glass-card'
import PulseBackground from '../components/pulse/PulseBackground'
import BackButton from '../components/pulse/BackButton'
import { useModules } from '../contexts'
import { fetchModuleStages } from '../lib/moduleStages'
import { fetchSubjectsForModule } from '../lib/subjects'
import { ModuleIcon, ExamIcon, NotesIcon } from '../lib/medicalIcons'
import { FILE_CARDS } from '../lib/fileCards'

interface PageModule {
  id: string; name: string; icon?: string | null; color: string; status: 'active' | 'completed'
}
interface PageSubject { id: string; module_id: string; name: string; icon?: string | null; color?: string | null }
interface ExamStage { value: string; title: string; emoji: string; color: string }

function gridCols(n: number) { return n === 1 ? 1 : n === 2 ? 2 : n === 3 ? 3 : 4 }

export default function ModulePage({ dark }: { dark: boolean }) {
  const pt = getPulseTheme(dark)
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { modules, modulesLoaded, modulesError } = useModules() as { modules: PageModule[]; modulesLoaded: boolean; modulesError: boolean }
  const module = modules.find(m => m.id === moduleId) || null
  const [presentFileTypes, setPresentFileTypes] = useState<Set<string>>(new Set())
  const [loadError, setLoadError] = useState(false)
  const [driveUrl, setDriveUrl] = useState('')
  const [examStages, setExamStages] = useState<ExamStage[]>([])
  const [subjects, setSubjects] = useState<PageSubject[]>([])

  useEffect(() => {
    let ignore = false
    supabase.from('site_settings').select('value').eq('key', 'drive_url').single()
      .then(({ data }) => { if (!ignore && data?.value) setDriveUrl(data.value) })
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    let ignore = false
    supabase.from('files').select('type').eq('module_id', moduleId)
      .then(({ data, error }) => {
        if (ignore) return
        if (data) setPresentFileTypes(new Set(data.map((f: any) => f.type)))
        if (error) setLoadError(true)
      })
    fetchModuleStages(moduleId!).then(result => { if (!ignore) setExamStages(result) })
    fetchSubjectsForModule(moduleId!).then(({ subjects, error }) => {
      if (ignore) return
      setSubjects(subjects)
      if (error) setLoadError(true)
    })
    return () => { ignore = true }
  }, [moduleId])

  if (!module) return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PulseBackground />
      <div style={{ position: 'relative', zIndex: 1, padding: 24, textAlign: 'center', color: pt.sub }}>
        {(loadError || modulesError)
          ? <ErrorBanner message="Couldn't load this module — check your connection." />
          : !modulesLoaded ? 'Loading...' : "This module doesn't exist or was removed."}
      </div>
    </div>
  )

  const filteredFileCards = FILE_CARDS.filter(card => presentFileTypes.has(card.type))

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PulseBackground />
      <div className="pulse-wide" style={{ position: 'relative', zIndex: 1, padding: '24px 20px 100px', fontFamily: pulseFonts.body }}>

        <div style={{ marginBottom: 8 }}>
          <BackButton dark={dark} fallback="/" />
        </div>

        <div style={{ textAlign: 'center', padding: '20px 0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <ModuleIcon value={module.icon} size={52} color={module.color} />
          </div>
          <h1 style={{ ...pulseType.pageTitle, fontSize: 26, color: module.color, marginBottom: 6 }}>{module.name}</h1>
          <div style={{
            display: 'inline-block',
            background: module.status === 'active' ? 'rgba(74,222,128,0.14)' : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
            color: module.status === 'active' ? '#4ade80' : pt.textMuted,
            border: `1px solid ${module.status === 'active' ? 'rgba(74,222,128,0.35)' : pt.border}`,
            borderRadius: 999, padding: '4px 14px', fontSize: 12, fontWeight: 700
          }}>
            {module.status === 'active' ? '● Active' : '✓ Completed'}
          </div>
        </div>

        {/* Exam Stage */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ ...pulseType.sectionLabel, color: pt.textMuted, marginBottom: 16 }}>🎯 Exam Stage</h2>
          <div className="auto-grid" style={{ ['--auto-grid-cols' as any]: gridCols(examStages.length) }}>
            {examStages.map((stage, i) => (
              <LiquidGlassCard key={stage.value} dark={dark} delay={i * 80}
                onClick={() => navigate(`/module/${moduleId}/stage/${stage.value}`)}
                style={{ padding: 'clamp(20px, 2vw, 28px)', textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: 8 }}>{stage.emoji}</div>
                <div style={{ ...pulseType.cardTitle, fontSize: 'clamp(13px, 1.1vw, 16px)', color: pt.textPrimary }}>{stage.title}</div>
              </LiquidGlassCard>
            ))}
          </div>
        </div>

        {/* Study by Lesson */}
        {subjects.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ ...pulseType.sectionLabel, color: pt.textMuted, marginBottom: 16 }}>📖 Study by Lesson</h2>
            <div className="auto-grid" style={{ ['--auto-grid-cols' as any]: gridCols(subjects.length) }}>
              {subjects.map((sub, i) => (
                <LiquidGlassCard key={sub.id} dark={dark} delay={i * 80}
                  onClick={() => navigate(`/module/${moduleId}/subject/${sub.id}`)}
                  style={{ padding: 'clamp(20px, 2vw, 28px)', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <ModuleIcon value={sub.icon || '📖'} size={38} color={sub.color || '#34d399'} />
                  </div>
                  <div style={{ ...pulseType.cardTitle, fontSize: 'clamp(13px, 1.1vw, 16px)', color: pt.textPrimary }}>{sub.name}</div>
                </LiquidGlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Study Materials */}
        {(filteredFileCards.length > 0 || driveUrl) && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ ...pulseType.sectionLabel, color: pt.textMuted, marginBottom: 16 }}>📁 Study Materials</h2>
            {filteredFileCards.length > 0 && (
              <div className="auto-grid" style={{ ['--auto-grid-cols' as any]: gridCols(filteredFileCards.length) }}>
                {filteredFileCards.map((card, i) => (
                  <LiquidGlassCard key={i} dark={dark} delay={i * 80}
                    onClick={() => navigate(`/files?type=${card.type}&module=${moduleId}`)}
                    style={{ padding: 'clamp(20px, 2vw, 28px)', textAlign: 'center' }}>
                    <div style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: 8 }}>{card.emoji}</div>
                    <div style={{ ...pulseType.cardTitle, fontSize: 'clamp(13px, 1.1vw, 16px)', color: pt.textPrimary }}>{card.title}</div>
                  </LiquidGlassCard>
                ))}
              </div>
            )}

            {driveUrl && (
              <div style={{ marginTop: filteredFileCards.length > 0 ? 16 : 0 }}>
                <LiquidGlassCard dark={dark} delay={0}
                  onClick={() => window.open(driveUrl, '_blank', 'noopener,noreferrer')}
                  style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    background: 'rgba(74,222,128,0.16)', border: '1px solid rgba(74,222,128,0.35)',
                    borderRadius: 12, width: 44, height: 44,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0
                  }}>📁</div>
                  <div>
                    <div style={{ ...pulseType.cardTitle, color: pt.textPrimary }}>University Google Drive</div>
                    <div style={{ ...pulseType.small, color: pt.textMuted, marginTop: 2 }}>Lectures, recordings & more</div>
                  </div>
                </LiquidGlassCard>
              </div>
            )}
          </div>
        )}

        {/* Smart Summaries & Practice — side by side on tablet/desktop,
            stacked and centered on mobile (see .pulse-summary-practice-grid) */}
        <div className="pulse-summary-practice-grid" style={{ marginBottom: 32 }}>
          <div>
            <h2 style={{ ...pulseType.sectionLabel, color: pt.textMuted, marginBottom: 16 }}>📝 Smart Summaries</h2>
            <LiquidGlassCard dark={dark} delay={0} onClick={() => navigate(`/summaries?module=${moduleId}`)} style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <NotesIcon color="#34d399" size={30} />
              </div>
              <div style={{ ...pulseType.cardTitle, color: pt.textPrimary }}>All Summaries</div>
              <div style={{ ...pulseType.small, color: pt.textMuted, marginTop: 4 }}>View summaries for this module</div>
            </LiquidGlassCard>
          </div>

          <div>
            <h2 style={{ ...pulseType.sectionLabel, color: pt.textMuted, marginBottom: 16 }}>🧪 Practice</h2>
            <LiquidGlassCard dark={dark} delay={0} onClick={() => navigate(`/mcq?module=${moduleId}`)} style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <ExamIcon color="#e2725b" size={30} />
              </div>
              <div style={{ ...pulseType.cardTitle, color: pt.textPrimary }}>MCQ Bank</div>
              <div style={{ ...pulseType.small, color: pt.textMuted, marginTop: 4 }}>Practice questions for this module</div>
            </LiquidGlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
