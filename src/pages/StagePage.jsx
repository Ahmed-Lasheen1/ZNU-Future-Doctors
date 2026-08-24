import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getTheme, backBtnStyle } from '../theme'
import ErrorBanner from '../components/ErrorBanner'
import AnimatedCard from '../components/AnimatedCard'
import AutoGrid from '../components/AutoGrid'
import { useModules } from '../App'
import { fetchModuleStages, stageMetaFrom } from '../lib/moduleStages'
import { FILE_CARDS } from '../lib/fileCards'

export default function StagePage({ dark }) {
  const c = getTheme(dark)
  const { moduleId, stage } = useParams()
  const navigate = useNavigate()
  const { modules, modulesLoaded, modulesError } = useModules()
  const module = modules.find(m => m.id === moduleId) || null
  const [stages, setStages] = useState([])
  const meta = stageMetaFrom(stages, stage)
  const [presentFileTypes, setPresentFileTypes] = useState(new Set())
  const [summaries, setSummaries] = useState([])
  const [selectedSummary, setSelectedSummary] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [driveUrl, setDriveUrl] = useState('')

  useEffect(() => {
    fetchModuleStages(moduleId).then(setStages)
  }, [moduleId])

  useEffect(() => {
    // Stage-specific link takes priority (e.g. "drive_url_final"); falls
    // back to the general "drive_url" if that stage has nothing set.
    supabase.from('site_settings').select('key, value').in('key', ['drive_url', `drive_url_${stage}`])
      .then(({ data }) => {
        if (!data) return
        const byKey = Object.fromEntries(data.map(r => [r.key, r.value]))
        setDriveUrl(byKey[`drive_url_${stage}`] || byKey['drive_url'] || '')
      })
  }, [stage])

  useEffect(() => {
    supabase.from('files').select('type').eq('module_id', moduleId).eq('exam_stage', stage)
      .then(({ data, error }) => {
        if (data) setPresentFileTypes(new Set(data.map(f => f.type)))
        if (error) setLoadError(true)
      })
    supabase.from('summaries').select('*').eq('module_id', moduleId).eq('exam_stage', stage).order('created_at')
      .then(({ data, error }) => {
        if (data) setSummaries(data)
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

  if (selectedSummary) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a2a4a, #0f1e35)',
        borderBottom: '2px solid #2a4a7a',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0
      }}>
        <button onClick={() => setSelectedSummary(null)} style={backBtnStyle()}>← Back</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#7eb8ff', letterSpacing: 2, textTransform: 'uppercase' }}>{module.name} · {meta.title}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: module.color }}>{selectedSummary.title}</div>
        </div>
        <div style={{ width: 80 }} />
      </div>
      <iframe src={selectedSummary.url} style={{ flex: 1, border: 'none', width: '100%' }} title={selectedSummary.title} />
    </div>
  )

  const filteredFileCards = FILE_CARDS.filter(card => presentFileTypes.has(card.type))

  function openSummaries() {
    // One summary for this stage → open it directly, no extra click.
    // Zero or several → send to the picker page (it shows the empty
    // state itself if there's nothing there yet).
    if (summaries.length === 1) {
      setSelectedSummary(summaries[0])
    } else {
      navigate(`/summaries?module=${moduleId}&stage=${stage}`)
    }
  }

  return (
    <div className="page-container" style={{ padding: '24px 16px 100px' }}>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => navigate(`/module/${moduleId}`)} style={backBtnStyle()}>← Back</button>
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
            <AutoGrid>
              {filteredFileCards.map((card, i) => (
                <AnimatedCard key={i} delay={i * 80} color={card.color} dark={dark}
                  onClick={() => navigate(`/files?type=${card.type}&module=${moduleId}`)}>
                  <div style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: 8 }}>{card.emoji}</div>
                  <div style={{ color: c.text, fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 700 }}>{card.title}</div>
                </AnimatedCard>
              ))}
            </AutoGrid>
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

      {/* Smart Summaries — opens the summary directly when there's only
          one (the common case). Falls back to the picker page only when
          there's more than one to choose from. */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: c.sub, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
          📝 Smart Summaries
        </h2>
        <AnimatedCard delay={200} color='#34d399' dark={dark} onClick={openSummaries}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>📝</div>
          <div style={{ color: c.text, fontSize: 13, fontWeight: 700 }}>Summaries</div>
          <div style={{ color: c.sub, fontSize: 12, marginTop: 4 }}>
            {summaries.length === 0 ? `${meta.title} summaries` : summaries.length === 1 ? summaries[0].title : `${summaries.length} available`}
          </div>
        </AnimatedCard>
      </div>

      {/* Practice */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: c.sub, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
          🧪 Practice
        </h2>
        <AnimatedCard delay={300} color='#e2725b' dark={dark}
          onClick={() => navigate(`/mcq?module=${moduleId}&stage=${stage}`)}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🧪</div>
          <div style={{ color: c.text, fontSize: 13, fontWeight: 700 }}>MCQ Bank</div>
          <div style={{ color: c.sub, fontSize: 12, marginTop: 4 }}>Practice {meta.title} questions</div>
        </AnimatedCard>
      </div>
    </div>
  )
}
