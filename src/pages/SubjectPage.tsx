// src/pages/SubjectPage.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getPulseTheme, pulseFonts, pulseType } from '../premiumTheme'
import ErrorBanner from '../components/ErrorBanner'
import LiquidGlassCard from '@/components/ui/liquid-glass-card'
import PulseBackground from '../components/pulse/PulseBackground'
import PulseGlassRow from '../components/pulse/PulseGlassRow'
import SummaryOverlay from '../components/SummaryOverlay'
import { useToast } from '../components/ToastProvider'
import { useModules } from '../contexts'
import { fetchSubjectById } from '../lib/subjects'
import { fetchLessonsForSubject } from '../lib/lessons'
import { ModuleIcon, ExamIcon, NotesIcon } from '../lib/medicalIcons'

interface PageModule { id: string; name: string; icon?: string | null; color: string }
interface Subject { id: string; name: string; icon?: string | null; color?: string | null }
interface Lesson { id: string; title: string; icon?: string | null; summary_url?: string | null }
interface LessonSummary { id: string; title: string; url: string; lesson_id: string }

function gridCols(n: number) { return n === 1 ? 1 : n === 2 ? 2 : n === 3 ? 3 : 4 }

export default function SubjectPage({ dark }: { dark: boolean }) {
  const pt = getPulseTheme(dark)
  const { moduleId, subjectId } = useParams()
  const navigate = useNavigate()
  const showToast = useToast() as (message: string) => void
  const { modules, modulesLoaded, modulesError } = useModules() as { modules: PageModule[]; modulesLoaded: boolean; modulesError: boolean }
  const module = modules.find(m => m.id === moduleId) || null
  const [subject, setSubject] = useState<Subject | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [lessonSummaries, setLessonSummaries] = useState<LessonSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [selectedSummary, setSelectedSummary] = useState<{ title: string; url: string } | null>(null)
  const [showSummaryPicker, setShowSummaryPicker] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchSubjectById(subjectId!),
      fetchLessonsForSubject(subjectId!),
      // Lesson-scoped summaries live in `summaries` (via lesson_id) —
      // there is no `lessons.summary_url` column.
      supabase.from('summaries').select('id, title, url, lesson_id').eq('subject_id', subjectId).not('lesson_id', 'is', null)
    ]).then(([subjectRes, lessonRes, summaryRes]) => {
      setSubject(subjectRes.subject)
      setLessons(lessonRes.lessons)
      if (summaryRes.data) setLessonSummaries(summaryRes.data)
      if (subjectRes.error || lessonRes.error || summaryRes.error) setLoadError(true)
      setLoading(false)
    })
  }, [subjectId])

  if (!module) return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PulseBackground />
      <div style={{ position: 'relative', zIndex: 1, padding: 24, textAlign: 'center', color: pt.sub }}>
        {(loadError || modulesError)
          ? <ErrorBanner message="Couldn't load this — check your connection." />
          : !modulesLoaded ? 'Loading...' : "This module doesn't exist or was removed."}
      </div>
    </div>
  )

  if (selectedSummary) return (
    <SummaryOverlay onBack={() => setSelectedSummary(null)} eyebrow={subject?.name} title={selectedSummary.title} titleColor="#34d399" url={selectedSummary.url} />
  )

  const hoverTint = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'

  function openAllSummaries() {
    if (lessonSummaries.length === 0) { showToast('No summaries added for this subject yet'); return }
    if (lessonSummaries.length === 1) {
      const s = lessonSummaries[0]
      setSelectedSummary({ title: s.title, url: s.url })
    } else {
      setShowSummaryPicker(prev => !prev)
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PulseBackground />
      <div className="pulse-wide" style={{ position: 'relative', zIndex: 1, padding: '24px 20px 100px', fontFamily: pulseFonts.body }}>

        <div style={{ marginBottom: 8 }}>
          <PulseGlassRow dark={dark} radius={999} hoverTint={hoverTint} onClick={() => navigate(`/module/${moduleId}`)}
            role="button" tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/module/${moduleId}`) } }}>
            <div style={{ padding: '8px 18px', ...pulseType.small, fontWeight: 700, color: pt.sub }}>← Back</div>
          </PulseGlassRow>
        </div>

        <div style={{ textAlign: 'center', padding: '10px 0 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <ModuleIcon value={subject?.icon || '📖'} size={44} color={subject?.color || '#34d399'} />
          </div>
          <h1 style={{ ...pulseType.pageTitle, fontSize: 24, color: subject?.color || '#34d399', marginBottom: 6 }}>{subject ? subject.name : ''}</h1>
          <div style={{ color: pt.sub, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <ModuleIcon value={module.icon} size={14} color={pt.sub} /> {module.name}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          <LiquidGlassCard dark={dark} delay={0} onClick={() => navigate(`/mcq?module=${moduleId}&subject=${subjectId}`)}
            style={{ flex: 1, padding: '16px 12px', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <ExamIcon color="#e2725b" size={22} />
              <span style={{ color: '#e2725b', fontWeight: 700, fontSize: 13 }}>All MCQs</span>
            </div>
          </LiquidGlassCard>
          <LiquidGlassCard dark={dark} delay={0} onClick={openAllSummaries}
            style={{ flex: 1, padding: '16px 12px', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <NotesIcon color="#34d399" size={22} />
              <span style={{ color: '#34d399', fontWeight: 700, fontSize: 13 }}>All Summaries</span>
            </div>
          </LiquidGlassCard>
        </div>

        {showSummaryPicker && lessonSummaries.length > 1 && (
          <div style={{ display: 'grid', gap: 10, marginBottom: 28 }}>
            {lessonSummaries.map((s, i) => (
              <LiquidGlassCard key={s.id} dark={dark} delay={i * 60}
                onClick={() => setSelectedSummary({ title: s.title, url: s.url })}
                style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <NotesIcon color="#34d399" size={16} />
                <span style={{ color: pt.textPrimary, fontSize: 13, fontWeight: 600 }}>{s.title}</span>
              </LiquidGlassCard>
            ))}
          </div>
        )}

        {loading && <p style={{ color: pt.sub, textAlign: 'center' }}>Loading...</p>}
        {loadError && <ErrorBanner />}

        {!loading && lessons.length === 0 && (
          <LiquidGlassCard dark={dark} delay={0} style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ color: pt.sub }}>No lessons here yet 🚧</p>
          </LiquidGlassCard>
        )}

        {lessons.length > 0 && (
          <div className="auto-grid" style={{ ['--auto-grid-cols' as any]: gridCols(lessons.length) }}>
            {lessons.map((lesson, i) => (
              <LiquidGlassCard key={lesson.id} dark={dark} delay={i * 80}
                onClick={() => navigate(`/module/${moduleId}/subject/${subjectId}/lesson/${lesson.id}`)}
                style={{ padding: 'clamp(20px, 2vw, 28px)', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <ModuleIcon value={lesson.icon || '📘'} size={36} color="#34d399" />
                </div>
                <div style={{ ...pulseType.cardTitle, fontSize: 'clamp(13px, 1.1vw, 16px)', color: pt.textPrimary }}>{lesson.title}</div>
              </LiquidGlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
