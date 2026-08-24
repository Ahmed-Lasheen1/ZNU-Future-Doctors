import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getTheme, backBtnStyle } from '../theme'
import ErrorBanner from '../components/ErrorBanner'
import AnimatedCard from '../components/AnimatedCard'
import AutoGrid from '../components/AutoGrid'
import { useModules } from '../App'

export default function SubjectPage({ dark }) {
  const c = getTheme(dark)
  const { moduleId, subjectId } = useParams()
  const navigate = useNavigate()
  const { modules, modulesLoaded, modulesError } = useModules()
  const module = modules.find(m => m.id === moduleId) || null
  const [subject, setSubject] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      supabase.from('subjects').select('*').eq('id', subjectId).single(),
      supabase.from('lessons').select('*').eq('subject_id', subjectId).order('position').order('created_at')
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

  return (
    <div className="page-container" style={{ padding: '24px 16px 100px' }}>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => navigate(`/module/${moduleId}`)} style={backBtnStyle()}>← Back</button>
      </div>

      <div style={{ textAlign: 'center', padding: '10px 0 30px' }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>📖</div>
        <h1 style={{ color: '#34d399', fontSize: 24, fontWeight: 900, marginBottom: 6 }}>{subject ? subject.name : ''}</h1>
        <div style={{ color: c.sub, fontSize: 13 }}>{module.icon} {module.name}</div>
      </div>

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
