import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getTheme } from '../theme'
import ErrorBanner from '../components/ErrorBanner'
import AnimatedCard from '../components/AnimatedCard'
import { useModules } from '../App'

const fileCards = [
  { emoji: '📖', title: 'Explanation Files', type: 'sharah', color: '#38bdf8' },
  { emoji: '❓', title: 'Question Files', type: 'questions', color: '#60a5fa' },
  { emoji: '🎥', title: 'Lecture Recordings', type: 'lectures', color: '#818cf8' },
  { emoji: '🎓', title: 'Course Recordings', type: 'courses', color: '#c084fc' },
]

export default function ModulePage({ dark }) {
  const c = getTheme(dark)
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { modules, modulesLoaded, modulesError } = useModules()
  const module = modules.find(m => m.id === moduleId) || null
  const [subjects, setSubjects] = useState([])
  const [summaries, setSummaries] = useState([])
  const [visible, setVisible] = useState(false)
  const [selectedSummary, setSelectedSummary] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [driveUrl, setDriveUrl] = useState('')

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'drive_url').single()
      .then(({ data }) => { if (data?.value) setDriveUrl(data.value) })
  }, [])

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    async function fetchData() {
      const [subRes, sumRes] = await Promise.all([
        supabase.from('subjects').select('*').eq('module_id', moduleId).order('name'),
        supabase.from('summaries').select('*').eq('module_id', moduleId).order('created_at')
      ])
      if (subRes.data) setSubjects(subRes.data)
      if (sumRes.data) setSummaries(sumRes.data)
      if (subRes.error || sumRes.error) setLoadError(true)
    }
    fetchData()
  }, [moduleId])

  if (!module) return (
    <div style={{ padding: 24, textAlign: 'center', color: c.sub }}>
      {(loadError || modulesError)
        ? <ErrorBanner message="Couldn't load this module — check your connection." />
        : !modulesLoaded
          ? 'Loading...'
          : "This module doesn't exist or was removed."}
    </div>
  )

  if (selectedSummary) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a2a4a, #0f1e35)',
        borderBottom: '2px solid #2a4a7a',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0
      }}>
        <button onClick={() => setSelectedSummary(null)} style={backBtn}>← Back</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#7eb8ff', letterSpacing: 2, textTransform: 'uppercase' }}>{module.name}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: module.color }}>{selectedSummary.title}</div>
        </div>
        <div style={{ width: 80 }} />
      </div>
      <iframe src={selectedSummary.url} style={{ flex: 1, border: 'none', width: '100%' }} title={selectedSummary.title} />
    </div>
  )

  return (
    <div className="page-container" style={{ padding: '24px 16px 100px' }}>

      {/* Module Header */}
      <div style={{
        textAlign: 'center', padding: '30px 0 24px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.5s ease'
      }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>{module.icon}</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: module.color, marginBottom: 6 }}>{module.name}</h1>
        <div style={{
          display: 'inline-block',
          background: module.status === 'active' ? '#22c55e20' : '#47556920',
          color: module.status === 'active' ? '#22c55e' : '#64748b',
          border: `1px solid ${module.status === 'active' ? '#22c55e40' : '#47556940'}`,
          borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700
        }}>
          {module.status === 'active' ? '● Active' : '✓ Completed'}
        </div>
      </div>

      {/* Subjects */}
      {subjects.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ color: c.sub, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
            📚 Subjects
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {subjects.map(sub => (
              <div key={sub.id} style={{
                background: `${module.color}15`, border: `1px solid ${module.color}40`,
                borderRadius: 20, padding: '6px 16px',
                color: module.color, fontSize: 13, fontWeight: 700
              }}>
                {sub.name}
                {sub.type !== 'both' && <span style={{ color: '#64748b', fontSize: 11, marginLeft: 6 }}>· {sub.type}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Study Materials */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: c.sub, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
          📁 Study Materials
        </h2>
        <div className="card-grid">
          {fileCards.map((card, i) => (
            <AnimatedCard key={i} delay={i * 80} color={card.color} dark={dark}
              onClick={() => navigate(`/files?type=${card.type}&module=${moduleId}`)}>
              <div style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: 8 }}>{card.emoji}</div>
              <div style={{ color: c.text, fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 700 }}>{card.title}</div>
            </AnimatedCard>
          ))}
        </div>

        {driveUrl && (
          <a href={driveUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div style={{
              marginTop: 16, background: c.card, border: `1px solid ${c.border}`,
              borderRadius: 16, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#22c55e'}
              onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
              <div style={{
                background: '#22c55e20', border: '1px solid #22c55e40',
                borderRadius: 12, width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0
              }}>📁</div>
              <div>
                <div style={{ color: c.text, fontWeight: 700, fontSize: 14 }}>University Google Drive</div>
                <div style={{ color: c.sub, fontSize: 12, marginTop: 2 }}>Lectures, recordings & more</div>
              </div>
            </div>
          </a>
        )}
      </div>

      {/* MCQ */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: c.sub, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
          🧪 Practice
        </h2>
        <AnimatedCard delay={400} color='#f472b6' dark={dark}
          onClick={() => navigate(`/mcq?module=${moduleId}`)}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🧪</div>
          <div style={{ color: c.text, fontSize: 13, fontWeight: 700 }}>MCQ Bank</div>
          <div style={{ color: c.sub, fontSize: 12, marginTop: 4 }}>Practice questions for this module</div>
        </AnimatedCard>
      </div>

      {/* Smart Summaries */}
      {summaries.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ color: c.sub, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
            📝 Smart Summaries
          </h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {summaries.map((sum, i) => (
              <AnimatedCard key={sum.id} delay={500 + i * 80} color='#34d399' dark={dark}
                onClick={() => setSelectedSummary(sum)}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>📝</div>
                <div style={{ color: c.text, fontSize: 13, fontWeight: 700 }}>{sum.title}</div>
                <div style={{ color: c.sub, fontSize: 12, marginTop: 4 }}>Interactive Summary</div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const backBtn = { background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '6px 14px', color: '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }
