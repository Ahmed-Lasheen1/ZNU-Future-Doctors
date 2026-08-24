import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getTheme } from '../theme'
import ErrorBanner from '../components/ErrorBanner'
import ModuleTabs from '../components/ModuleTabs'
import MediaOverlay from '../components/MediaOverlay'
import { getDriveOrRawUrl } from '../lib/embedUrl'
import { useModules } from '../App'

export default function Schedule({ dark }) {
  const c = getTheme(dark)
  const { modules, modulesLoaded, modulesError } = useModules()
  const [schedules, setSchedules] = useState([])
  const [activeModule, setActiveModule] = useState(null)
  const [activeType, setActiveType] = useState('study')
  const [loading, setLoading] = useState(true)
  const [viewer, setViewer] = useState(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (modulesLoaded && modules.length > 0 && !activeModule) {
      const active = modules.find(m => m.status === 'active')
      setActiveModule(active ? active.id : modules[0].id)
    }
  }, [modulesLoaded, modules])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data, error } = await supabase.from('schedules').select('*').order('created_at')
      if (data) setSchedules(data)
      if (error) setLoadError(true)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filtered = schedules.filter(s =>
    s.module_id === activeModule && s.type === activeType
  )

  return (
    <div className="page-container" style={{ padding: '20px' }}>
      {(loadError || modulesError) && <ErrorBanner />}

      {viewer && (
        <MediaOverlay
          label={`📅 ${viewer.title}`}
          labelColor="#a78bfa"
          onClose={() => setViewer(null)}
          src={getDriveOrRawUrl(viewer.url)}
          iframeTitle={viewer.title}
          allow="autoplay"
        />
      )}

      <h1 style={{ color: '#a78bfa', textAlign: 'center', marginBottom: 20 }}>
        📅 Schedules
      </h1>

      <ModuleTabs modules={modules} activeModule={activeModule} onSelect={setActiveModule} dark={dark} />

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {['study', 'exam'].map(type => (
          <button key={type} onClick={() => setActiveType(type)} style={{
            flex: 1, padding: '10px', borderRadius: 10, fontFamily: 'inherit',
            border: `2px solid ${activeType === type ? '#a78bfa' : c.border}`,
            background: activeType === type ? '#a78bfa20' : 'transparent',
            color: activeType === type ? '#a78bfa' : c.sub,
            cursor: 'pointer', fontWeight: 700, fontSize: 13
          }}>
            {type === 'study' ? '📅 Study Schedule' : '📝 Exam Schedule'}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: c.sub, textAlign: 'center' }}>Loading...</p>}

      {!loading && filtered.length === 0 && (
        <div style={{
          background: c.cardFlat, border: `1px solid ${c.border}`,
          borderRadius: 16, padding: 40, textAlign: 'center'
        }}>
          <p style={{ color: c.sub }}>No schedules yet 🚧</p>
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {filtered.map(sch => (
          <div key={sch.id} style={{
            background: c.card,
            border: `1px solid ${c.border}`, borderRadius: 16,
            overflow: 'hidden', transition: 'all 0.2s'
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#a78bfa'}
            onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
            <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: c.text, marginBottom: 4 }}>{sch.title}</h3>
                {sch.week && <p style={{ color: c.sub, fontSize: 13 }}>{sch.week}</p>}
                {sch.date && <p style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700 }}>📅 {new Date(sch.date).toLocaleDateString()}</p>}
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
