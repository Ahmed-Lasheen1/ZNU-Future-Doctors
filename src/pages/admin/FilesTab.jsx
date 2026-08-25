import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { getTheme, inputStyle } from '../../theme'
import InlineMessage from '../../components/InlineMessage'
import ModuleSelect from './ModuleSelect'
import { btnStyle, miniBtn, cancelBtnStyle, LIST_LIMIT } from './adminStyles'
import { EXAM_STAGES as STAGE_META } from '../../lib/examStages'
import { fetchModuleStages } from '../../lib/moduleStages'

const EXAM_STAGES = STAGE_META.map(s => ({ value: s.value, label: `${s.emoji} ${s.title}` }))

export default function FilesTab({ dark, modules, subjects }) {
  const c = getTheme(dark)
  const inStyle = inputStyle(c)
  const [msg, setMsg] = useState('')
  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const [files, setFiles] = useState([])
  const [editingFileId, setEditingFileId] = useState(null)
  const [fileName, setFileName] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('sharah')
  const [fileFileType, setFileFileType] = useState('pdf')
  const [fileModuleId, setFileModuleId] = useState('')
  const [fileSubjectId, setFileSubjectId] = useState('')
  const [fileExamStage, setFileExamStage] = useState('tbl')
  const [fileStageOptions, setFileStageOptions] = useState(EXAM_STAGES)

  useEffect(() => { fetchFiles() }, [])

  // Every place that lets an admin pick an exam stage for a piece of
  // content should offer THAT module's actual stage set, not just the
  // 4 global defaults.
  useEffect(() => {
    fetchModuleStages(fileModuleId).then(list => setFileStageOptions(list.map(s => ({ value: s.value, label: `${s.emoji} ${s.title}` }))))
  }, [fileModuleId])

  async function fetchFiles() {
    const { data } = await supabase.from('files').select('*').order('created_at', { ascending: false }).limit(LIST_LIMIT)
    if (data) setFiles(data)
  }

  function editFile(f) {
    setEditingFileId(f.id)
    setFileName(f.name); setFileUrl(f.url); setFileType(f.type); setFileFileType(f.file_type)
    setFileModuleId(f.module_id); setFileSubjectId(f.subject_id || ''); setFileExamStage(f.exam_stage)
  }
  function resetFileForm() {
    setEditingFileId(null); setFileName(''); setFileUrl('')
  }
  async function saveFile() {
    if (!fileName || !fileUrl || !fileModuleId) return
    const payload = {
      name: fileName, url: fileUrl, type: fileType,
      file_type: fileFileType, module_id: fileModuleId,
      subject_id: fileSubjectId || null, exam_stage: fileExamStage
    }
    if (editingFileId) {
      const { error } = await supabase.from('files').update(payload).eq('id', editingFileId)
      if (!error) { showMsg('✅ File updated!'); resetFileForm(); fetchFiles() }
      else showMsg('❌ ' + error.message)
    } else {
      const { error } = await supabase.from('files').insert([payload])
      if (!error) { showMsg('✅ File added!'); resetFileForm(); fetchFiles() }
      else showMsg('❌ ' + error.message)
    }
  }
  async function deleteFile(id) {
    if (!confirm('Delete this file? This cannot be undone.')) return
    if (editingFileId === id) resetFileForm()
    const { error } = await supabase.from('files').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ File deleted')
    fetchFiles()
  }

  const filteredSubjects = (moduleId) => subjects.filter(s => s.module_id === moduleId)

  return (
    <div>
      <InlineMessage message={msg} />
      <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
        <h3 style={{ color: '#38bdf8', marginBottom: 16 }}>{editingFileId ? '✏️ Edit File / Recording' : '➕ Add File / Recording'}</h3>
        <input placeholder="File name" value={fileName} onChange={e => setFileName(e.target.value)} style={inStyle} />
        <input placeholder="URL (Drive / YouTube / SoundCloud)" value={fileUrl} onChange={e => setFileUrl(e.target.value)} style={inStyle} />
        <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Content Type</label>
        <select value={fileType} onChange={e => setFileType(e.target.value)} style={inStyle}>
          <option value="sharah">📖 Explanation Files</option>
          <option value="questions">❓ Question Files</option>
          <option value="lectures">🎥 Lecture Recordings</option>
          <option value="courses">🎓 Course Recordings</option>
        </select>
        <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>File Type</label>
        <select value={fileFileType} onChange={e => setFileFileType(e.target.value)} style={inStyle}>
          <option value="pdf">📄 PDF</option>
          <option value="video">🎥 Video</option>
          <option value="audio">🎵 Audio</option>
        </select>
        <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Module</label>
        <ModuleSelect modules={modules} value={fileModuleId} onChange={e => { setFileModuleId(e.target.value); setFileSubjectId('') }} inStyle={inStyle} />
        {fileModuleId && (
          <>
            <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Subject (optional)</label>
            <select value={fileSubjectId} onChange={e => setFileSubjectId(e.target.value)} style={inStyle}>
              <option value="">All Subjects</option>
              {filteredSubjects(fileModuleId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </>
        )}
        <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Exam Stage</label>
        <select value={fileExamStage} onChange={e => setFileExamStage(e.target.value)} style={inStyle}>
          {fileStageOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={saveFile} style={{ ...btnStyle, flex: 1 }}>{editingFileId ? 'Save Changes' : 'Add File'}</button>
          {editingFileId && <button onClick={resetFileForm} style={cancelBtnStyle(c)}>Cancel</button>}
        </div>
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {modules.map(mod => {
            const modFiles = files.filter(f => f.module_id === mod.id)
            if (modFiles.length === 0) return null
            return (
              <div key={mod.id} style={{ marginBottom: 16 }}>
                <h4 style={{ color: mod.color, marginBottom: 8 }}>{mod.icon} {mod.name}</h4>
                {modFiles.map(f => (
                  <div key={f.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: c.text, fontWeight: 600 }}>{f.name}</span>
                      <span style={{ color: c.sub, fontSize: 12, marginLeft: 8 }}>· {f.type} · {f.file_type}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => editFile(f)} aria-label={`Edit file: ${f.name}`} style={{ ...miniBtn, borderColor: '#38bdf8', color: '#38bdf8' }}>✏️</button>
                      <button onClick={() => deleteFile(f.id)} aria-label={`Delete file: ${f.name}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
