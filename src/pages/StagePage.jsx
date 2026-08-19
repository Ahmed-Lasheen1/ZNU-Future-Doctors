import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getTheme } from '../theme'
import ErrorBanner from '../components/ErrorBanner'
import AnimatedCard from '../components/AnimatedCard'
import { useModules } from '../App'
import { stageMeta } from '../lib/examStages'

export default function StagePage({ dark }) {
  const c = getTheme(dark)
  const { moduleId, stage } = useParams()
  const navigate = useNavigate()
  const { modules, modulesLoaded, modulesError } = useModules()
  const module = modules.find(m => m.id === moduleId) || null
  const meta = stageMeta(stage)
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [selectedSummary, setSelectedSummary] = useState(null)

  useEffect(() => {
    setLoading(true)
    supabase.from('summaries')
      .select('*')
      .eq('module_id', moduleId)
      .eq('exam_stage', stage)
      .order('created_at')
      .then(({ data, error }) => {
        if (data) setSummaries(data)
        if (error) setLoadError(true)
        setLoading(false)
      })
  }, [moduleId, stage])

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
          <div style={{ fontSize: 11, color: '#7eb8ff', letterSpacing: 2, textTransform: 'uppercase' }}>{module.name} · {meta.title}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: module.color }}>{selectedSummary.title}</div>
        </div>
        <div style={{ width: 80 }} />
      </div>
      <iframe src={selectedSummary.url} style={{ flex: 1, border: 'none', width: '100%' }} title={selectedSummary.title} />
    </div>
  )

  return (
    <div className="page-container" style={{ padding: '24px 16px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button onClick={() => navigate(`/module/${moduleId}`)} style={backBtn}>← Back</button>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ textAlign: 'center', padding: '10px 0 30px' }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>{meta.emoji}</div>
        <h1 style={{ color: meta.color, fontSize: 24, fontWeight: 900, marginBottom: 6 }}>{meta.title}</h1>
        <div style={{ color: c.sub, fontSize: 13 }}>{module.icon} {module.name}</div>
      </div>

      {/* Summaries for this stage */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: c.sub, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
          📝 Smart Summaries
        </h2>
        {loading ? (
          <p style={{ color: c.sub, textAlign: 'center' }}>Loading...</p>
        ) : summaries.length > 0 ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {summaries.map((sum, i) => (
              <AnimatedCard key={sum.id} delay={i * 80} color='#34d399' dark={dark} onClick={() => setSelectedSummary(sum)}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>📝</div>
                <div style={{ color: c.text, fontSize: 13, fontWeight: 700 }}>{sum.title}</div>
                <div style={{ color: c.sub, fontSize: 12, marginTop: 4 }}>Interactive Summary</div>
              </AnimatedCard>
            ))}
          </div>
        ) : (
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <p style={{ color: c.sub, fontSize: 13 }}>No summaries here yet 🚧</p>
          </div>
        )}
      </div>

      {/* Practice for this stage */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: c.sub, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
          🧪 Practice
        </h2>
        <AnimatedCard delay={200} color='#f472b6' dark={dark}
          onClick={() => navigate(`/mcq?module=${moduleId}&stage=${stage}`)}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🧪</div>
          <div style={{ color: c.text, fontSize: 13, fontWeight: 700 }}>MCQ Bank</div>
          <div style={{ color: c.sub, fontSize: 12, marginTop: 4 }}>Practice {meta.title} questions</div>
        </AnimatedCard>
      </div>
    </div>
  )
}

const backBtn = { background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '6px 14px', color: '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }
