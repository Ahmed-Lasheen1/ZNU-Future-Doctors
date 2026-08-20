import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import { getTheme } from '../theme'
import ErrorBanner from '../components/ErrorBanner'
import ModuleTabs from '../components/ModuleTabs'
import { useModules } from '../App'

function PDFViewer({ url, onClose }) {
  const getPreviewUrl = (url) => {
    if (!url) return ''
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`
    }
    return url
  }
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#1e293b', borderBottom: '1px solid #1e3a5f' }}>
        <span style={{ color: '#38bdf8', fontWeight: 700 }}>📄 PDF Viewer</span>
        <button onClick={onClose} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}>✕ Close</button>
      </div>
      <iframe src={getPreviewUrl(url)} style={{ flex: 1, border: 'none' }} title="PDF Viewer" allow="autoplay" />
    </div>
  )
}

function VideoViewer({ url, onClose }) {
  const getEmbedUrl = (url) => {
    if (!url) return ''
    if (url.includes('youtube.com/watch')) {
      const id = new URL(url).searchParams.get('v')
      return `https://www.youtube.com/embed/${id}`
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1].split('?')[0]
      return `https://www.youtube.com/embed/${id}`
    }
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`
    }
    return url
  }
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#1e293b', borderBottom: '1px solid #1e3a5f' }}>
        <span style={{ color: '#38bdf8', fontWeight: 700 }}>🎥 Video Player</span>
        <button onClick={onClose} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}>✕ Close</button>
      </div>
      <iframe src={getEmbedUrl(url)} style={{ flex: 1, border: 'none' }} allowFullScreen title="Video Player" />
    </div>
  )
}

function AudioViewer({ url, name, onClose }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1e293b', borderRadius: 20, padding: 32, border: '1px solid #1e3a5f', width: '90%', maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
        <h3 style={{ color: '#38bdf8', marginBottom: 20 }}>{name}</h3>
        <audio controls src={url} style={{ width: '100%', marginBottom: 20 }} />
        <button onClick={onClose} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700 }}>✕ Close</button>
      </div>
    </div>
  )
}

export default function FilesPage({ dark }) {
  const c = getTheme(dark)
  const [files, setFiles] = useState([])
  const { modules, modulesLoaded, modulesError } = useModules()
  const [subjects, setSubjects] = useState([])
  const [activeModule, setActiveModule] = useState(null)
  const [activeSubject, setActiveSubject] = useState('all')
  const [loading, setLoading] = useState(true)
  const [viewer, setViewer] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const fileType = params.get('type')
  const moduleParam = params.get('module')

  const titles = {
    sharah: '📖 Explanation Files',
    questions: '❓ Question Files',
    lectures: '🎥 Lecture Recordings',
    courses: '🎓 Course Recordings',
  }

  const getFileIcon = (type) => {
    if (type === 'video') return '🎥'
    if (type === 'audio') return '🎵'
    return '📄'
  }

  const getOpenLabel = (type) => {
    if (type === 'video') return '▶ Play'
    if (type === 'audio') return '🎵 Listen'
    return '📄 Open'
  }

  useEffect(() => {
    if (moduleParam) {
      setActiveModule(moduleParam)
    } else if (modulesLoaded && modules.length > 0 && !activeModule) {
      const active = modules.find(m => m.status === 'active')
      setActiveModule(active ? active.id : modules[0].id)
    }
  }, [modulesLoaded, modules, moduleParam])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [subRes, fileRes] = await Promise.all([
        supabase.from('subjects').select('*').order('name'),
        supabase.from('files').select('*').eq('type', fileType).order('created_at', { ascending: false })
      ])
      if (subRes.data) setSubjects(subRes.data)
      if (fileRes.data) setFiles(fileRes.data)
      if (subRes.error || fileRes.error) setLoadError(true)
      setLoading(false)
    }
    fetchData()
  }, [fileType])

  const moduleSubjects = subjects.filter(s => s.module_id === activeModule)
  const filtered = files.filter(f => {
    const moduleMatch = f.module_id === activeModule
    const subjectMatch = activeSubject === 'all' || f.subject_id === activeSubject
    return moduleMatch && subjectMatch
  })

  return (
    <div className="page-container" style={{ padding: '20px' }}>
      {(loadError || modulesError) && <ErrorBanner />}
      {viewer && viewer.file_type === 'pdf' && <PDFViewer url={viewer.url} onClose={() => setViewer(null)} />}
      {viewer && viewer.file_type === 'video' && <VideoViewer url={viewer.url} onClose={() => setViewer(null)} />}
      {viewer && viewer.file_type === 'audio' && <AudioViewer url={viewer.url} name={viewer.name} onClose={() => setViewer(null)} />}

      <h1 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 20 }}>{titles[fileType]}</h1>

      <ModuleTabs
        modules={modules}
        activeModule={activeModule}
        onSelect={(id) => { setActiveModule(id); setActiveSubject('all') }}
        dark={dark}
      />

      {moduleSubjects.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
          <button onClick={() => setActiveSubject('all')} style={{ ...subBtn, borderColor: activeSubject === 'all' ? '#38bdf8' : c.border, color: activeSubject === 'all' ? '#38bdf8' : c.sub }}>All</button>
          {moduleSubjects.map(sub => (
            <button key={sub.id} onClick={() => setActiveSubject(sub.id)} style={{ ...subBtn, borderColor: activeSubject === sub.id ? '#38bdf8' : c.border, color: activeSubject === sub.id ? '#38bdf8' : c.sub }}>{sub.name}</button>
          ))}
        </div>
      )}

      {loading && <p style={{ color: c.sub, textAlign: 'center' }}>Loading...</p>}

      {!loading && filtered.length === 0 && (
        <div style={{ background: c.cardFlat, border: `1px solid ${c.border}`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <p style={{ color: c.sub }}>No files yet 🚧</p>
        </div>
      )}

      {filtered.map(file => (
        <div key={file.id} style={{
          background: c.card,
          border: `1px solid ${c.border}`, borderRadius: 16,
          padding: '16px 20px', marginBottom: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'all 0.2s'
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#38bdf8'}
          onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>{getFileIcon(file.file_type)}</span>
            <span style={{ color: c.text, fontWeight: 600, fontSize: 14 }}>{file.name}</span>
          </div>
          <button onClick={() => setViewer(file)} style={{
            background: '#38bdf8', color: '#0f172a', border: 'none',
            padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
            fontWeight: 700, fontSize: 13, fontFamily: 'inherit', whiteSpace: 'nowrap'
          }}>
            {getOpenLabel(file.file_type)}
          </button>
        </div>
      ))}
    </div>
  )
}

const subBtn = { padding: '6px 14px', borderRadius: 20, background: 'transparent', border: '1px solid', whiteSpace: 'nowrap', fontSize: 12, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }
