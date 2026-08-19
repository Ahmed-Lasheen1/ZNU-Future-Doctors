import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { getTheme } from '../theme'
import ErrorBanner from '../components/ErrorBanner'
import AnimatedCard from '../components/AnimatedCard'
import { useModules } from '../App'
import { EXAM_STAGE_CARDS } from '../lib/examStages'
import { FILE_CARDS } from '../lib/fileCards'

export default function ModulePage({ dark }) {
  const c = getTheme(dark)
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { modules, modulesLoaded, modulesError } = useModules()
  const module = modules.find(m => m.id === moduleId) || null
  const [presentFileTypes, setPresentFileTypes] = useState(new Set())
  const [visible, setVisible] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [driveUrl, setDriveUrl] = useState('')

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'drive_url').single()
      .then(({ data }) => { if (data?.value) setDriveUrl(data.value) })
  }, [])

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    supabase.from('files').select('type').eq('module_id', moduleId)
      .then(({ data, error }) => {
        if (data) setPresentFileTypes(new Set(data.map(f => f.type)))
        if (error) setLoadError(true)
      })
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

  const filteredFileCards = FILE_CARDS.filter(card => presentFileTypes.has(card.type))

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

      {/* Exam Stage — the main way in, big cards, no small colored dots */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: c.sub, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
          🎯 Exam Stage
        </h2>
        <div className="card-grid">
          {EXAM_STAGE_CARDS.map((stage, i) => (
            <AnimatedCard key={stage.value} delay={i * 80} color={stage.color} dark={dark}
              onClick={() => navigate(`/module/${moduleId}/stage/${stage.value}`)}>
              <div style={{ fontSize: 'clamp(28px, 3vw, 42px)', marginBottom: 8 }}>{stage.emoji}</div>
              <div style={{ color: c.text, fontSize: 'clamp(13px, 1.1vw, 16px)', fontWeight: 700 }}>{stage.title}</div>
            </AnimatedCard>
          ))}
        </div>
      </div>

      {/* Study Materials — only shown once something's actually there */}
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

      {/* Smart Summaries — always a single card, same treatment as Practice.
          Opens the module's summaries list, which shows its own empty
          state if there's nothing there yet. */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: c.sub, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
          📝 Smart Summaries
        </h2>
        <AnimatedCard delay={200} color='#34d399' dark={dark}
          onClick={() => navigate(`/summaries?module=${moduleId}`)}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>📝</div>
          <div style={{ color: c.text, fontSize: 13, fontWeight: 700 }}>All Summaries</div>
          <div style={{ color: c.sub, fontSize: 12, marginTop: 4 }}>View summaries for this module</div>
        </AnimatedCard>
      </div>

      {/* Practice */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: c.sub, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
          🧪 Practice
        </h2>
        <AnimatedCard delay={300} color='#f472b6' dark={dark}
          onClick={() => navigate(`/mcq?module=${moduleId}`)}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🧪</div>
          <div style={{ color: c.text, fontSize: 13, fontWeight: 700 }}>MCQ Bank</div>
          <div style={{ color: c.sub, fontSize: 12, marginTop: 4 }}>Practice questions for this module</div>
        </AnimatedCard>
      </div>
    </div>
  )
}
