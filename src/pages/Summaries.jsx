import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function SummariesHome({ modules, onSelect }) {
  const sorted = [
    ...modules.filter(m => m.status === 'active'),
    ...modules.filter(m => m.status !== 'active')
  ]

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

      {sorted.length === 0 && (
        <div style={{ background: '#1e293b', border: '1px solid #1e3a5f', borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <p style={{ color: '#64748b' }}>No summaries available yet 🚧</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: sorted.length === 1 ? '1fr' : '1fr 1fr', gap: 16 }}>
        {sorted.map(mod => (
          <div key={mod.id} onClick={() => onSelect(mod)} style={{
            background: 'linear-gradient(135deg, #1e293b, #0f2540)',
            border: `2px solid ${mod.status === 'active' ? mod.color : '#1e3a5f'}`,
            borderRadius: 20, padding: 24,
            cursor: 'pointer', transition: 'all 0.25s',
            textAlign: 'center',
            opacity: mod.status === 'active' ? 1 : 0.7
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = mod.color
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = `0 12px 40px ${mod.color}30`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = mod.status === 'active' ? mod.color : '#1e3a5f'
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

function ModuleSummaries({ mod, onBack }) {
  const [summaries, setSummaries] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('summaries')
      .select('*')
      .eq('module_id', mod.id)
      .order('created_at')
      .then(({ data }) => {
        if (data) setSummaries(data)
        setLoading(false)
      })
  }, [mod.id])

  if (selected) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a2a4a, #0f1e35)',
        borderBottom: '2px solid #2a4a7a',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0
      }}>
        <button onClick={() => setSelected(null)} style={backBtn}>← Back</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#7eb8ff', letterSpacing: 2, textTransform: 'uppercase' }}>{mod.name}</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: mod.color }}>{selected.title}</div>
        </div>
        <div style={{ width: 80 }} />
      </div>
      <iframe src={selected.url} style={{ flex: 1, border: 'none', width: '100%' }} title={selected.title} />
    </div>
  )

  return (
    <div style={{ padding: '24px 16px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={backBtn}>← Back</button>
        <h2 style={{ color: mod.color, flex: 1 }}>{mod.icon} {mod.name}</h2>
      </div>

      {loading && <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading...</p>}

      {!loading && summaries.length === 0 && (
        <div style={{ background: '#1e293b', border: '1px solid #1e3a5f', borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <p style={{ color: '#64748b' }}>No summaries yet 🚧</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {summaries.map(sum => (
          <div key={sum.id} onClick={() => setSelected(sum)} style={{
            background: 'linear-gradient(135deg, #1e293b, #0f2540)',
            border: `2px solid ${mod.color}40`,
            borderRadius: 16, padding: '20px 24px',
            cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = mod.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${mod.color}40`; e.currentTarget.style.transform = 'translateY(0)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                background: `${mod.color}20`, border: `1px solid ${mod.color}40`,
                borderRadius: 12, width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0
              }}>📝</div>
              <div>
                <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>{sum.title}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{mod.name}</div>
              </div>
            </div>
            <div style={{
              background: mod.color, color: '#0f172a',
              borderRadius: 10, padding: '6px 14px',
              fontSize: 12, fontWeight: 700, flexShrink: 0
            }}>Open →</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Summaries() {
  const [modules, setModules] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    supabase.from('modules').select('*').order('created_at')
      .then(({ data }) => { if (data) setModules(data) })
  }, [])

  if (selected) return <ModuleSummaries mod={selected} onBack={() => setSelected(null)} />
  return <SummariesHome modules={modules} onSelect={setSelected} />
}

const backBtn = { background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '6px 14px', color: '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }
