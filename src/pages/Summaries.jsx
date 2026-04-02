import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function SummariesHome({ modules, onSelect }) {
  return (
    <div style={{ padding: '24px 16px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '30px 0 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
        <h1 style={{
          fontSize: 26, fontWeight: 900,
          background: 'linear-gradient(135deg, #34d399, #38bdf8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 8
        }}>Smart Summaries</h1>
        <p style={{ color: '#94a3b8' }}>Interactive study summaries for each module</p>
      </div>

      {modules.length === 0 && (
        <div style={{
          background: '#1e293b', border: '1px solid #1e3a5f',
          borderRadius: 16, padding: 40, textAlign: 'center'
        }}>
          <p style={{ color: '#64748b' }}>No summaries available yet 🚧</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: modules.length === 1 ? '1fr' : '1fr 1fr', gap: 16 }}>
        {modules.map(mod => (
          <div key={mod.id} onClick={() => onSelect(mod)} style={{
            background: 'linear-gradient(135deg, #1e293b, #0f2540)',
            border: `2px solid ${mod.color}40`,
            borderRadius: 20, padding: 24,
            cursor: 'pointer', transition: 'all 0.25s',
            textAlign: 'center'
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = mod.color
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = `0 12px 40px ${mod.color}30`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = `${mod.color}40`
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>{mod.icon}</div>
            <div style={{ fontWeight: 900, color: mod.color, fontSize: 18, marginBottom: 6 }}>{mod.name}</div>
            <div style={{
              display: 'inline-block',
              background: mod.status === 'active' ? '#22c55e20' : '#47556920',
              color: mod.status === 'active' ? '#22c55e' : '#64748b',
              border: `1px solid ${mod.status === 'active' ? '#22c55e40' : '#47556940'}`,
              borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700
            }}>
              {mod.status === 'active' ? '● Active' : '✓ Completed'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SummaryViewer({ mod, onBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a2a4a, #0f1e35)',
        borderBottom: '2px solid #2a4a7a',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0
      }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.08)',
          border: '2px solid rgba(255,255,255,0.15)',
          borderRadius: 10, padding: '6px 14px',
          color: '#94a3b8', cursor: 'pointer',
          fontSize: 12, fontWeight: 700, fontFamily: 'inherit'
        }}>← Back</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#7eb8ff', letterSpacing: 2, textTransform: 'uppercase' }}>Smart Summaries</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: mod.color }}>{mod.icon} {mod.name}</div>
        </div>
        <div style={{ width: 80 }} />
      </div>
      <iframe
        src={mod.summary_url}
        style={{ flex: 1, border: 'none', width: '100%' }}
        title={mod.name}
      />
    </div>
  )
}

export default function Summaries() {
  const [modules, setModules] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    supabase.from('modules')
      .select('*')
      .not('summary_url', 'is', null)
      .order('created_at')
      .then(({ data }) => {
        if (data) setModules(data)
      })
  }, [])

  if (selected) return <SummaryViewer mod={selected} onBack={() => setSelected(null)} />
  return <SummariesHome modules={modules} onSelect={setSelected} />
}
