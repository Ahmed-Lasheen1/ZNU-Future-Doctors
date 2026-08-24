import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getTheme, backBtnStyle } from '../theme'
import ErrorBanner from '../components/ErrorBanner'
import AnimatedCard from '../components/AnimatedCard'
import { useModules } from '../App'

export default function LessonPage({ dark }) {
  const c = getTheme(dark)
  const { moduleId, subjectId, lessonId } = useParams()
  const navigate = useNavigate()
  const { modules, modulesLoaded, modulesError } = useModules()
  const module = modules.find(m => m.id === moduleId) || null
  const [lesson, setLesson] = useState(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      supabase.from('lessons').select('*').eq('id', lessonId).single(),
      supabase.from('questions').select('id', { count: 'exact', head: true }).eq('lesson_id', lessonId)
    ]).then(([lessonRes, countRes]) => {
      if (lessonRes.data) setLesson(lessonRes.data)
      if (countRes.count != null) setQuestionCount(countRes.count)
      if (lessonRes.error) setLoadError(true)
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

  if (showSummary && lesson?.summary_url) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a2a4a, #0f1e35)',
        borderBottom: '2px solid #2a4a7a', padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0
      }}>
        <button onClick={() => setShowSummary(false)} style={backBtnStyle()}>← Back</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 900, color: '#34d399' }}>{lesson.title}</div>
        <div style={{ width: 80 }} />
      </div>
      <iframe src={lesson.summary_url} style={{ flex: 1, border: 'none', width: '100%' }} title={lesson.title} />
    </div>
  )

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
            {lesson.summary_url ? (
              <AnimatedCard delay={100} color='#34d399' dark={dark} onClick={() => setShowSummary(true)}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>📝</div>
                <div style={{ color: c.text, fontSize: 13, fontWeight: 700 }}>Open Lesson Summary</div>
              </AnimatedCard>
            ) : (
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 32, textAlign: 'center' }}>
                <p style={{ color: c.sub, fontSize: 13 }}>No summary added yet 🚧</p>
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
