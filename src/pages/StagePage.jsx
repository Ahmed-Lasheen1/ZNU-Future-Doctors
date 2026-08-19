import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getTheme } from '../theme'
import ErrorBanner from '../components/ErrorBanner'
import AnimatedCard from '../components/AnimatedCard'
import { useModules } from '../App'
import { stageMeta } from '../lib/examStages'
import { FILE_CARDS } from '../lib/fileCards'

export default function StagePage({ dark }) {
  const c = getTheme(dark)
  const { moduleId, stage } = useParams()
  const navigate = useNavigate()
  const { modules, modulesLoaded, modulesError } = useModules()
  const module = modules.find(m => m.id === moduleId) || null
  const meta = stageMeta(stage)
  const [presentFileTypes, setPresentFileTypes] = useState(new Set())
  const [loadError, setLoadError] = useState(false)
  const [driveUrl, setDriveUrl] = useState('')

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'drive_url').single()
      .then(({ data }) => { if (data?.value) setDriveUrl(data.value) })
  }, [])

  useEffect(() => {
    supabase.from('files').select('type').eq('module_id', moduleId).eq('exam_stage', stage)
      .then(({ data, error }) => {
        if (data) setPresentFileTypes(new Set(data.map(f => f.type)))
        if (error) setLoadError(true)
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

  const filteredFileCards = FILE_CARDS.filter(card => presentFileTypes.has(card.type))

  return (
    <div className="page-container" style={{ padding: '24px 16px 100px' }}>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => navigate(`/module/${moduleId}`)} style={backBtn}>← Back</button>
      </div>

      <div style={{ textAlign: 'center', padding: '10px 0 30px' }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>{meta.emoji}</div>
        <h1 style={{ color: meta.color, fontSize: 24, fontWeight: 900, marginBottom: 6 }}>{meta.title}</h1>
        <div style={{ color: c.sub, fontSize: 13 }}>{module.icon} {module.name}</div>
      </div>

      {/* Study Materials — only what's tagged for this specific stage, plus the university Drive link */}
      {(filteredFileCards.length > 0 || driveUrl) && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ color: c.sub, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
            📁 Study Materials
          </h2>
          {filteredFileCards.length > 0 && (
            <div className="card-grid">
              {filteredFileCards.map((card, i) => (
                <AnimatedCard key={i} delay={i * 80} color={card.color} dark={dark}
                  onClick={() => navigate(`/files?type=${card.type}&module=${moduleId}`)}>
                  <div style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: 8 }}>{card.emoji}</div>
                  <div style={{ color: c.text, fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 700 }}>{card.title}</div>
                </AnimatedCard>
              ))}
            </div>
          )}

          {driveUrl && (
            <a href={driveUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{
                marginTop: filteredFileCards.length > 0 ? 16 : 0,
                background: c.card, border: `1px solid ${c.border}`,
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
      )}

      {/* Smart Summaries — single card, same treatment as Practice.
          Opens the summaries page pre-filtered to this exact stage. */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: c.sub, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
          📝 Smart Summaries
        </h2>
        <AnimatedCard delay={200} color='#34d399' dark={dark}
          onClick={() => navigate(`/summaries?module=${moduleId}&stage=${stage}`)}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>📝</div>
          <div style={{ color: c.text, fontSize: 13, fontWeight: 700 }}>Summaries</div>
          <div style={{ color: c.sub, fontSize: 12, marginTop: 4 }}>{meta.title} summaries</div>
        </AnimatedCard>
      </div>

      {/* Practice */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: c.sub, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
          🧪 Practice
        </h2>
        <AnimatedCard delay={300} color='#f472b6' dark={dark}
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
