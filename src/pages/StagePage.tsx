// src/pages/StagePage.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getPulseTheme, pulseFonts, pulseType } from '../premiumTheme'
import ErrorBanner from '../components/ErrorBanner'
import LiquidGlassCard from '@/components/ui/liquid-glass-card'
import PulseBackground from '../components/pulse/PulseBackground'
import BackButton from '../components/pulse/BackButton'
import SummaryOverlay from '../components/SummaryOverlay'
import { useModules } from '../contexts'
import { fetchModuleStages, stageMetaFrom } from '../lib/moduleStages'
import { fetchSubjectsForModule } from '../lib/subjects'
import { useHistoryOverlay } from '../lib/useHistoryOverlay'
import { FILE_CARDS } from '../lib/fileCards'
import { ModuleIcon, ExamIcon, NotesIcon } from '../lib/medicalIcons'

interface PageModule { id: string; name: string; icon?: string | null; color: string }
interface PageSubject { id: string; module_id: string; name: string; icon?: string | null; color?: string | null }
interface ExamStage { value: string; title: string; emoji: string; color: string }
interface Summary { id: string; title: string; url: string }

function gridCols(n: number) { return n === 1 ? 1 : n === 2 ? 2 : n === 3 ? 3 : 4 }

export default function StagePage({ dark }: { dark: boolean }) {
  const pt = getPulseTheme(dark)
  const { moduleId, stage } = useParams()
  const navigate = useNavigate()
  const { modules, modulesLoaded, modulesError } = useModules() as { modules: PageModule[]; modulesLoaded: boolean; modulesError: boolean }
  const module = modules.find(m => m.id === moduleId) || null
  const [stages, setStages] = useState<ExamStage[]>([])
  const meta = stageMetaFrom(stages, stage!)
  const [presentFileTypes, setPresentFileTypes] = useState<Set<string>>(new Set())
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [driveUrl, setDriveUrl] = useState('')
  const [subjects, setSubjects] = useState<PageSubject[]>([])

  // Hardware/browser back now closes the full-screen summary overlay
  // instead of leaving StagePage entirely — see useHistoryOverlay.
  useHistoryOverlay(!!selectedSummary, () => setSelectedSummary(null))

  useEffect(() => {
    let ignore = false
    fetchModuleStages(moduleId!).then(result => { if (!ignore) setStages(result) })
    return () => { ignore = true }
  }, [moduleId])

  useEffect(() => {
    let ignore = false
    supabase.from('site_settings').select('key, value').in('key', ['drive_url', `drive_url_${stage}`])
      .then(({ data }) => {
        if (ignore || !data) return
        const byKey = Object.fromEntries(data.map((r: any) => [r.key, r.value]))
        setDriveUrl(byKey[`drive_url_${stage}`] || byKey['drive_url'] || '')
      })
    return () => { ignore = true }
  }, [stage])

  useEffect(() => {
    let ignore = false

    supabase.from('files').select('type').eq('module_id', moduleId).eq('exam_stage', stage)
      .then(({ data, error }) => {
        if (ignore) return
        if (data) setPresentFileTypes(new Set(data.map((f: any) => f.type)))
        if (error) setLoadError(true)
      })
    supabase.from('summaries').select('*').eq('module_id', moduleId).eq('exam_stage', stage).order('created_at')
      .then(({ data, error }) => {
        if (ignore) return
        if (data) setSummaries(data)
        if (error) setLoadError(true)
      })
    fetchSubjectsForModule(moduleId!).then(({ subjects, error }) => {
      if (ignore) return
      setSubjects(subjects)
      if (error) setLoadError(true)
    })

    return () => { ignore = true }
  }, [moduleId, stage])

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

  if (selectedSummary) return (
    <SummaryOverlay
      onBack={() => setSelectedSummary(null)}
      eyebrow={`${module.name} · ${meta.title}`}
      title={selectedSummary.title}
      titleColor={module.color}
      url={selectedSummary.url}
    />
  )

  const filteredFileCards = FILE_CARDS.filter(card => presentFileTypes.has(card.type))

  function openSummaries() {
    if (summaries.length === 1) setSelectedSummary(summaries[0])
    else navigate(`/summaries?module=${moduleId}&stage=${stage}`)
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PulseBackground />
      <div className="pulse-wide" style={{ position: 'relative', zIndex: 1, padding: '24px 20px 100px', fontFamily: pulseFonts.body }}>

        <div style={{ marginBottom: 8 }}>
          <BackButton dark={dark} fallback={`/module/${moduleId}`} />
        </div>

        <div style={{ textAlign: 'center', padding: '10px 0 30px' }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>{meta.emoji}</div>
          <h1 style={{ ...pulseType.pageTitle, fontSize: 24, color: meta.color, marginBottom: 6 }}>{meta.title}</h1>
          <div style={{ color: pt.sub, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <ModuleIcon value={module.icon} size={14} color={pt.sub} /> {module.name}
          </div>
        </div>

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

        <div style={{ marginBottom: 32 }}>
          <h2 style={{ ...pulseType.sectionLabel, color: pt.textMuted, marginBottom: 16 }}>📝 Smart Summaries</h2>
          <LiquidGlassCard dark={dark} delay={0} onClick={openSummaries} style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <NotesIcon color="#34d399" size={30} />
            </div>
            <div style={{ ...pulseType.cardTitle, color: pt.textPrimary }}>Summaries</div>
            <div style={{ ...pulseType.small, color: pt.textMuted, marginTop: 4 }}>
              {summaries.length === 0 ? `${meta.title} summaries` : summaries.length === 1 ? summaries[0].title : `${summaries.length} available`}
            </div>
          </LiquidGlassCard>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h2 style={{ ...pulseType.sectionLabel, color: pt.textMuted, marginBottom: 16 }}>🧪 Practice</h2>
          <LiquidGlassCard dark={dark} delay={0} onClick={() => navigate(`/mcq?module=${moduleId}&stage=${stage}`)} style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <ExamIcon color="#e2725b" size={30} />
            </div>
            <div style={{ ...pulseType.cardTitle, color: pt.textPrimary }}>MCQ Bank</div>
            <div style={{ ...pulseType.small, color: pt.textMuted, marginTop: 4 }}>Practice {meta.title} questions</div>
          </LiquidGlassCard>
        </div>
      </div>
    </div>
  )
}
