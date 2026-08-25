import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getTheme, backBtnStyle } from '../theme'
import ErrorBanner from '../components/ErrorBanner'
import AnimatedCard from '../components/AnimatedCard'
import AutoGrid from '../components/AutoGrid'
import SummaryOverlay from '../components/SummaryOverlay'
import { useToast } from '../components/ToastProvider'
import { useModules } from '../App'

export default function SubjectPage({ dark }) {
  const c = getTheme(dark)
  const { moduleId, subjectId } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const { modules, modulesLoaded, modulesError } = useModules()
  const module = modules.find(m => m.id === moduleId) || null
  const [subject, setSubject] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [selectedSummary, setSelectedSummary] = useState(null)
  const [showSummaryPicker, setShowSummaryPicker] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      supabase.from('subjects').select('*').eq('id', subjectId).single(),
      // Newest lessons on top — `position` exists in the schema but
      // nothing in Admin actually sets it today (it's always 0), so
      // sorting by it first was really just an alphabetical/insert-order
      // tiebreaker in disguise. created_at descending is what "newest
      // first" actually means.
      supabase.from('lessons').select('*').eq('subject_id', subjectId).order('created_at', { ascending: false })
    ]).then(([subRes, lessonRes]) => {
      if (subRes.data) setSubject(subRes.data)
      if (lessonRes.data) setLessons(lessonRes.data)
      if (subRes.error || lessonRes.error) setLoadError(true)
      setLoading(false)
    })
  }, [subjectId])

  if (!module) return (
    <div style={{ padding: 24, textAlign: 'center', color: c.sub }}>
      {(loadError || modulesError)
        ? <ErrorBanner message="Couldn't load this — check your connection." />
        : !modulesLoaded ? 'Loading...' : "This module doesn't exist or was removed."}
    </div>
  )

  if (selectedSummary) return (
    <SummaryOverlay
      onBack={() => setSelectedSummary(null)}
      eyebrow={subject?.name}
      title={selectedSummary.title}
      titleColor="#34d399"
      url={selectedSummary.url}
    />
  )

  const lessonsWithSummaries = lessons.filter(l => l.summary_url)

  function openAllSummaries() {
    if (lessonsWithSummaries.length === 0) {
      showToast('No summaries added for this subject yet')
      return
    }
    // One summary → open it directly, no extra click, same convention
    // used on StagePage. Several → show the inline picker below.
    if (lessonsWithSummaries.length === 1) {
      const l = lessonsWithSummaries[0]
      setSelectedSummary({ title: l.title, url: l.summary_url })
    } else {
      setShowSummaryPicker(prev => !prev)
    }
  }

  return (
    <div className="page-container" style={{ padding: '24px 16px 100px' }}>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => navigate(`/module/${moduleId}`)} style={backBtnStyle()}>← Back</button>
      </div>

      <div style={{ textAlign: 'center', padding: '10px 0 30px' }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>{subject?.icon || '📖'}</div>
        <h1 style={{ color: subject?.color || '#34d399', fontSize: 24, fontWeight: 900, marginBottom: 6 }}>{subject ? subject.name : ''}</h1>
        <div style={{ color: c.sub, fontSize: 13 }}>{module.icon} {module.name}</div>
      </div>

      {/* All MCQs / All Summaries — subject-wide shortcuts so students
          don't have to open every lesson individually to practice or
          review everything at once. */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        <button onClick={() => navigate(`/mcq?module=${moduleId}&subject=${subjectId}`)} style={{
          flex: 1, background: '#e2725b20', border: '2px solid #e2725b60',
          borderRadius: 14, padding: '14px 12px', cursor: 'pointer',
          color: '#e2725b', fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
        }}>
          <span style={{ fontSize: 22 }}>🧪</span>
          All MCQs
        </button>
        <button onClick={openAllSummaries} style={{
          flex: 1, background: '#34d39920', border: '2px solid #34d39960',
          borderRadius: 14, padding: '14px 12px', cursor: 'pointer',
          color: '#34d399', fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
        }}>
          <span style={{ fontSize: 22 }}>📝</span>
          All Summaries
        </button>
      </div>

      {showSummaryPicker && lessonsWithSummaries.length > 1 && (
        <div style={{ display: 'grid', gap: 10, marginBottom: 28 }}>
          {lessonsWithSummaries.map(l => (
            <div key={l.id} onClick={() => setSelectedSummary({ title: l.title, url: l.summary_url })}
              role="button" tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedSummary({ title: l.title, url: l.summary_url }) } }}
              style={{
                background: c.card, border: '1px solid #34d39940', borderRadius: 12,
                padding: '12px 16px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: 10, transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#34d399'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#34d39940'}>
              <span style={{ fontSize: 16 }}>📝</span>
              <span style={{ color: c.text, fontSize: 13, fontWeight: 600 }}>{l.title}</span>
            </div>
          ))}
        </div>
      )}

      {loading && <p style={{ color: c.sub, textAlign: 'center' }}>Loading...</p>}
      {loadError && <ErrorBanner />}

      {!loading && lessons.length === 0 && (
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <p style={{ color: c.sub }}>No lessons here yet 🚧</p>
        </div>
      )}

      {lessons.length > 0 && (
        <AutoGrid>
          {lessons.map((lesson, i) => (
            <AnimatedCard key={lesson.id} delay={i * 80} color='#34d399' dark={dark}
              onClick={() => navigate(`/module/${moduleId}/subject/${subjectId}/lesson/${lesson.id}`)}>
              <div style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: 8 }}>📘</div>
              <div style={{ color: c.text, fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 700 }}>{lesson.title}</div>
            </AnimatedCard>
          ))}
        </AutoGrid>
      )}
    </div>
  )
}
