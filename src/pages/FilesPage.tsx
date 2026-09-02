// src/pages/FilesPage.tsx
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import { getPulseTheme, pulseFonts, pulseType } from '../premiumTheme'
import { useModules } from '../contexts'
import ErrorBanner from '../components/ErrorBanner'
import ModuleTabs from '../components/ModuleTabs'
import MediaOverlay from '../components/MediaOverlay'
import LiquidGlassCard from '@/components/ui/liquid-glass-card'
import PulseBackground from '../components/pulse/PulseBackground'
import PulseGlassRow from '../components/pulse/PulseGlassRow'
import BackButton from '../components/pulse/BackButton'
import { useHistoryOverlay } from '../lib/useHistoryOverlay'
import { getDriveOrRawUrl, getVideoEmbedUrl } from '../lib/embedUrl'

interface FilesModule {
  id: string
  name: string
  icon?: string | null
  color: string
  status: 'active' | 'completed'
}

interface FileRow {
  id: string
  name: string
  url: string
  type: string
  file_type: 'pdf' | 'video' | 'audio'
  module_id: string
  subject_id?: string | null
}

interface FilesSubject {
  id: string
  module_id: string
  name: string
}

const FILE_ACCENT = '#38bdf8'

function AudioViewer({ url, name, onClose, dark }: { url: string; name: string; onClose: () => void; dark: boolean }) {
  const pt = getPulseTheme(dark)
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ width: '90%', maxWidth: 400 }}>
        <LiquidGlassCard dark={dark} delay={0} style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
          <h3 style={{ ...pulseType.sectionTitle, color: FILE_ACCENT, marginBottom: 20 }}>{name}</h3>
          <audio controls src={url} style={{ width: '100%', marginBottom: 20 }} />
          <button onClick={onClose} style={{
            background: pt.danger, color: '#fff', border: 'none', borderRadius: 999,
            padding: '10px 24px', cursor: 'pointer', fontWeight: 700, fontFamily: pulseFonts.body
          }}>✕ Close</button>
        </LiquidGlassCard>
      </div>
    </div>
  )
}

export default function FilesPage({ dark }: { dark: boolean }) {
  const pt = getPulseTheme(dark)
  const [files, setFiles] = useState<FileRow[]>([])
  const { modules, modulesLoaded, modulesError } = useModules() as {
    modules: FilesModule[]; modulesLoaded: boolean; modulesError: boolean
  }
  const [subjects, setSubjects] = useState<FilesSubject[]>([])
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [activeSubject, setActiveSubject] = useState('all')
  const [loading, setLoading] = useState(true)
  const [viewer, setViewer] = useState<FileRow | null>(null)
  const [loadError, setLoadError] = useState(false)
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const fileType = params.get('type')
  const moduleParam = params.get('module')

  useHistoryOverlay(!!viewer, () => setViewer(null))

  const activeModules = modules.filter(m => m.status === 'active')

  const titles: Record<string, string> = {
    sharah: '📖 Explanation Files',
    questions: '❓ Question Files',
    lectures: '🎥 Lecture Recordings',
    courses: '🎓 Course Recordings',
  }

  const getFileIcon = (type: string) => type === 'video' ? '🎥' : type === 'audio' ? '🎵' : '📄'
  const getOpenLabel = (type: string) => type === 'video' ? '▶ Play' : type === 'audio' ? '🎵 Listen' : '📄 Open'

  useEffect(() => {
    if (moduleParam) {
      setActiveModule(moduleParam)
    } else if (modulesLoaded && activeModules.length > 0 && !activeModule) {
      setActiveModule(activeModules[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulesLoaded, modules, moduleParam])

  useEffect(() => {
    let ignore = false
    async function fetchData() {
      setLoading(true)
      const [subRes, fileRes] = await Promise.all([
        supabase.from('subjects').select('*').order('name'),
        supabase.from('files').select('*').eq('type', fileType).order('created_at', { ascending: false })
      ])
      if (ignore) return
      if (subRes.data) setSubjects(subRes.data)
      if (fileRes.data) setFiles(fileRes.data)
      if (subRes.error || fileRes.error) setLoadError(true)
      setLoading(false)
    }
    fetchData()
    return () => { ignore = true }
  }, [fileType])

  const moduleSubjects = subjects.filter(s => s.module_id === activeModule)
  const filtered = files.filter(f => {
    const moduleMatch = f.module_id === activeModule
    const subjectMatch = activeSubject === 'all' || f.subject_id === activeSubject
    return moduleMatch && subjectMatch
  })

  const hoverTint = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PulseBackground />
      <div className="pulse-wide" style={{ position: 'relative', zIndex: 1, padding: '24px 20px 100px', fontFamily: pulseFonts.body }}>

        <div style={{ marginBottom: 8 }}>
          <BackButton dark={dark} fallback="/" />
        </div>

        {(loadError || modulesError) && <ErrorBanner />}

        {viewer && viewer.file_type === 'pdf' && (
          <MediaOverlay
            label="📄 PDF Viewer" labelColor={FILE_ACCENT}
            onClose={() => setViewer(null)}
            src={getDriveOrRawUrl(viewer.url)}
            iframeTitle="PDF Viewer"
            allow="autoplay" allowFullScreen={undefined}          />
        )}
        {viewer && viewer.file_type === 'video' && (
          <MediaOverlay
            label="🎥 Video Player" labelColor={FILE_ACCENT}
            onClose={() => setViewer(null)}
            src={getVideoEmbedUrl(viewer.url)}
            iframeTitle="Video Player"
            allowFullScreen allow={undefined}          />
        )}
        {viewer && viewer.file_type === 'audio' && (
          <AudioViewer url={viewer.url} name={viewer.name} onClose={() => setViewer(null)} dark={dark} />
        )}

        <div style={{ textAlign: 'center', padding: '10px 0 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{fileType ? titles[fileType]?.split(' ')[0] : '📁'}</div>
          <h1 style={{ fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 24, color: pt.text, marginBottom: 4 }}>
            {fileType ? titles[fileType]?.split(' ').slice(1).join(' ') : 'Files'}
          </h1>
        </div>

        <ModuleTabs
          modules={activeModules}
          activeModule={activeModule}
          onSelect={(id) => { setActiveModule(id); setActiveSubject('all') }}
          dark={dark}
        />

        {moduleSubjects.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
            <PulseGlassRow dark={dark} radius={999} active={activeSubject === 'all'}
              activeTint={`${FILE_ACCENT}26`} hoverTint={hoverTint} onClick={() => setActiveSubject('all')}
              role="button" tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveSubject('all') } }}>
              <div style={{ padding: '9px 16px', whiteSpace: 'nowrap', ...pulseType.button, color: activeSubject === 'all' ? FILE_ACCENT : pt.sub }}>All</div>
            </PulseGlassRow>
            {moduleSubjects.map(sub => {
              const active = activeSubject === sub.id
              return (
                <PulseGlassRow key={sub.id} dark={dark} radius={999} active={active}
                  activeTint={`${FILE_ACCENT}26`} hoverTint={hoverTint} onClick={() => setActiveSubject(sub.id)}
                  role="button" tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveSubject(sub.id) } }}>
                  <div style={{ padding: '9px 16px', whiteSpace: 'nowrap', ...pulseType.button, color: active ? FILE_ACCENT : pt.sub }}>{sub.name}</div>
                </PulseGlassRow>
              )
            })}
          </div>
        )}

        {loading && <p style={{ color: pt.sub, textAlign: 'center' }}>Loading...</p>}

        {!loading && filtered.length === 0 && (
          <LiquidGlassCard dark={dark} delay={0} style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ color: pt.sub }}>No files yet 🚧</p>
          </LiquidGlassCard>
        )}

        {filtered.map((file, i) => {
          const isLast = i === filtered.length - 1
          return (
            <div key={file.id} style={{ marginBottom: isLast ? 0 : 12 }}>
              <LiquidGlassCard dark={dark} delay={i * 70} style={{
                padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{getFileIcon(file.file_type)}</span>
                  <span style={{ ...pulseType.cardTitle, color: pt.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                </div>
                <button onClick={() => setViewer(file)} style={{
                  background: FILE_ACCENT, color: '#0f172a', border: 'none',
                  padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
                  fontWeight: 700, fontSize: 13, fontFamily: pulseFonts.body, whiteSpace: 'nowrap', flexShrink: 0
                }}>
                  {getOpenLabel(file.file_type)}
                </button>
              </LiquidGlassCard>
            </div>
          )
        })}
      </div>
    </div>
  )
}
