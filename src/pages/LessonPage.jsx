import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getTheme, backBtnStyle } from '../theme'
import ErrorBanner from '../components/ErrorBanner'
import AnimatedCard from '../components/AnimatedCard'
import SummaryOverlay from '../components/SummaryOverlay'
import { useModules } from '../App'

export default function LessonPage({ dark }) {
  const c = getTheme(dark)
  const { moduleId, subjectId, lessonId } = useParams()
  const navigate = useNavigate()
  const { modules, modulesLoaded, modulesError } = useModules()
  const module = modules.find(m => m.id === moduleId) || null
  const [lesson, setLesson] = useState(null)
  const [questionCount, setQuestionCount] = useState(0)
  // A lesson can now have more than one summary tagged to it (e.g. one
  // per exam stage) — same "auto-open if there's only one" pattern
  // already used on SubjectPage/StagePage.
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [selectedSummary, setSelectedSummary] = useState(null)
  const [showSummaryPicker, setShowSummaryPicker] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      supabase.from('lessons').select('*').eq('id', lessonId).single(),
      supabase.from('questions').select('id', { count: 'exact', head: true }).eq('lesson_id', lessonId),
      // Summaries are now linked to a lesson via lesson_id (set from
      // the admin Summaries tab) instead of a summary_url column
      // stored directly on the lesson.
      supabase.from('summaries').select('*').eq('lesson_id', lessonId).order('created_at')
    ]).then(([lessonRes, countRes, summaryRes]) => {
      if (lessonRes.data) setLesson(lessonRes.data)
      if (countRes.count != null) setQuestionCount(countRes.count)
      if (summaryRes.data) setSummaries(summaryRes.data)
      if (lessonRes.error || summaryRes.error) setLoadError(true)
      setLoading(false)
    })
  }, [lessonId])

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
      title={selectedSummary.title}
      titleColor="#34d399"
      url={selectedSummary.url}
    />
  )

  function openSummary() {
    if (summaries.length === 0) return
    // One summary → open it directly, no extra click, same convention
    // used on SubjectPage/StagePage. Several → show the inline picker.
    if (summaries.length === 1) {
      setSelectedSummary(summaries[0])
    } else {
      setShowSummaryPicker(prev => !prev)
    }
  }

  return (
    <div className="page-container" style={{ padding: '24px 16px 100px' }}>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => navigate(`/module/${moduleId}/subject/${subjectId}`)} style={backBtnStyle()}>← Back</button>
      </div>

      {loading && <p style={{ color: c.sub, textAlign: 'center' }}>Loading...</p>}
      {loadError && <ErrorBanner />}

      {lesson && (
        <>
          <div style={{ textAlign: 'center', padding: '10px 0 30px' }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>📘</div>
            <h1 style={{ color: '#34d399', fontSize: 24, fontWeight: 900, marginBottom: 6 }}>{lesson.title}</h1>
            <div style={{ color: c.sub, fontSize: 13 }}>{module.icon} {module.name}</div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ color: c.sub, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
              📝 Summary
            </h2>
            {summaries.length > 0 ? (
              <AnimatedCard delay={100} color='#34d399' dark={dark} onClick={openSummary}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>📝</div>
                <div style={{ color: c.text, fontSize: 13, fontWeight: 700 }}>
                  {summaries.length === 1 ? 'Open Lesson Summary' : 'Summaries'}
                </div>
                {summaries.length > 1 && (
                  <div style={{ color: c.sub, fontSize: 12, marginTop: 4 }}>{summaries.length} available</div>
                )}
              </AnimatedCard>
            ) : (
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 32, textAlign: 'center' }}>
                <p style={{ color: c.sub, fontSize: 13 }}>No summary added yet 🚧</p>
              </div>
            )}

            {showSummaryPicker && summaries.length > 1 && (
              <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                {summaries.map(s => (
                  <div key={s.id} onClick={() => setSelectedSummary(s)}
                    role="button" tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedSummary(s) } }}
                    style={{
                      background: c.card, border: '1px solid #34d39940', borderRadius: 12,
                      padding: '12px 16px', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', gap: 10, transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#34d399'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#34d39940'}>
                    <span style={{ fontSize: 16 }}>📝</span>
                    <span style={{ color: c.text, fontSize: 13, fontWeight: 600 }}>{s.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ color: c.sub, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
              🧪 Practice
            </h2>
            {questionCount > 0 ? (
              <AnimatedCard delay={200} color='#e2725b' dark={dark}
                onClick={() => navigate(`/mcq?module=${moduleId}&lesson=${lessonId}`)}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>🧪</div>
                <div style={{ color: c.text, fontSize: 13, fontWeight: 700 }}>Practice This Lesson</div>
                <div style={{ color: c.sub, fontSize: 12, marginTop: 4 }}>{questionCount} question{questionCount === 1 ? '' : 's'}</div>
              </AnimatedCard>
            ) : (
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 32, textAlign: 'center' }}>
                <p style={{ color: c.sub, fontSize: 13 }}>No questions tagged to this lesson yet 🚧</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
