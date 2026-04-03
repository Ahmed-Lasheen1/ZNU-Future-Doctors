import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Schedule() {
  const [modules, setModules] = useState([])
  const [schedules, setSchedules] = useState([])
  const [activeModule, setActiveModule] = useState(null)
  const [activeType, setActiveType] = useState('study')
  const [loading, setLoading] = useState(true)
  const [viewer, setViewer] = useState(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [modRes, schRes] = await Promise.all([
        supabase.from('modules').select('*').order('status').order('created_at'),
        supabase.from('schedules').select('*').order('created_at')
      ])
      if (modRes.data) {
        const sorted = [
          ...modRes.data.filter(m => m.status === 'active'),
          ...modRes.data.filter(m => m.status !== 'active')
        ]
        setModules(sorted)
        const active = sorted.find(m => m.status === 'active')
        if (active) setActiveModule(active.id)
      }
      if (schRes.data) setSchedules(schRes.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const getPreviewUrl = (url) => {
    if (!url) return ''
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`
    }
    return url
  }

  const filtered = schedules.filter(s =>
    s.module_id === activeModule && s.type === activeType
  )

  return (
    <div style={{ padding: '20px', maxWidth: 700, margin: '0 auto' }}>

      {viewer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.95)', zIndex: 2000,
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', background: '#1e293b', borderBottom: '1px solid #1e3a5f'
          }}>
            <span style={{ color: '#a78bfa', fontWeight: 700 }}>📅 {viewer.title}</span>
            <button onClick={() => setViewer(null)} style={{
              background: '#ef4444', color: '#fff', border: 'none',
              borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700
            }}>✕ Close</button>
          </div>
          <iframe
            src={getPreviewUrl(viewer.url)}
            style={{ flex: 1, border: 'none', width: '100%' }}
            title={viewer.title}
            allow="autoplay"
          />
        </div>
      )}

      <h1 style={{ color: '#a78bfa', textAlign: 'center', marginBottom: 20 }}>
        📅 Schedules
      </h1>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
        {modules.map(mod => (
          <button key={mod.id} onClick={() => setActiveModule(mod.id)} style={{
            padding: '8px 16px', borderRadius: 10, whiteSpace: 'nowrap',
            border: `2px solid ${activeModule === mod.id ? mod.color : '#1e3a5f'}`,
            background: activeModule === mod.id ? `${mod.color}20` : 'transparent',
            color: activeModule === mod.id ? mod.color : '#64748b',
            cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit'
          }}>
            {mod.icon} {mod.name}
            {mod.status === 'completed' && <span style={{ fontSize: 10, marginLeft: 4, color: '#64748b' }}>✓</span>}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {['study', 'exam'].map(type => (
          <button key={type} onClick={() => setActiveType(type)} style={{
            flex: 1, padding: '10px', borderRadius: 10, fontFamily: 'inherit',
            border: `2px solid ${activeType === type ? '#a78bfa' : '#1e3a5f'}`,
            background: activeType === type ? '#a78bfa20' : 'transparent',
            color: activeType === type ? '#a78bfa' : '#64748b',
            cursor: 'pointer', fontWeight: 700, fontSize: 13
          }}>
            {type === 'study' ? '📅 Study Schedule' : '📝 Exam Schedule'}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading...</p>}

      {!loading && filtered.length === 0 && (
        <div style={{
          background: '#1e293b', border: '1px solid #1e3a5f',
          borderRadius: 16, padding: 40, textAlign: 'center'
        }}>
          <p style={{ color: '#64748b' }}>No schedules yet 🚧</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {filtered.map(sch => (
          <div key={sch.id} style={{
            background: 'linear-gradient(135deg, #1e293b, #0f2540)',
            border: '1px solid #1e3a5f', borderRadius: 16,
            overflow: 'hidden', transition: 'all 0.2s'
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#a78bfa'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#1e3a5f'}>
            <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#e2e8f0', marginBottom: 4 }}>{sch.title}</h3>
                {sch.week && <p style={{ color: '#64748b', fontSize: 13 }}>{sch.week}</p>}
              </div>
              <button onClick={() => setViewer(sch)} style={{
                background: '#a78bfa', color: '#0f172a', border: 'none',
                padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                fontWeight: 700, fontSize: 13, fontFamily: 'inherit'
              }}>
                🔍 View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
