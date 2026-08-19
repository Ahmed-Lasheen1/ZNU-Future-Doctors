import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth, useModules } from '../App'
import { getTheme, inputStyle } from '../theme'
import { fetchModulesSorted } from '../lib/modules'

const EXAM_STAGES = [
  { value: 'tbl', label: '🟢 TBL' },
  { value: 'end_module', label: '🔵 End Module' },
  { value: 'practical', label: '🟠 Practical' },
  { value: 'final', label: '🟣 Final' },
  { value: 'general', label: '⚪ General' },
]

export default function Admin({ dark }) {
  const { user, profile } = useAuth()
  const { refreshModules } = useModules()
  const navigate = useNavigate()
  const isAuth = profile?.role === 'admin'
  const [activeTab, setActiveTab] = useState('modules')
  const [modules, setModules] = useState([])
  const [subjects, setSubjects] = useState([])
  const [files, setFiles] = useState([])
  const [schedules, setSchedules] = useState([])
  const [questions, setQuestions] = useState([])
  const [summaries, setSummaries] = useState([])
  const [msg, setMsg] = useState('')

  const [modName, setModName] = useState('')
  const [modColor, setModColor] = useState('#38bdf8')
  const [modIcon, setModIcon] = useState('📚')
  const [modStatus, setModStatus] = useState('active')

  const [subName, setSubName] = useState('')
  const [subModuleId, setSubModuleId] = useState('')
  const [subType, setSubType] = useState('both')

  const [fileName, setFileName] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('sharah')
  const [fileFileType, setFileFileType] = useState('pdf')
  const [fileModuleId, setFileModuleId] = useState('')
  const [fileSubjectId, setFileSubjectId] = useState('')
  const [fileExamStage, setFileExamStage] = useState('general')

  const [schTitle, setSchTitle] = useState('')
  const [schUrl, setSchUrl] = useState('')
  const [schType, setSchType] = useState('study')
  const [schModuleId, setSchModuleId] = useState('')

  const [taskText, setTaskText] = useState('')
  const [taskModuleId, setTaskModuleId] = useState('')
  const [taskSubjectId, setTaskSubjectId] = useState('')

  const [qText, setQText] = useState('')
  const [qA, setQA] = useState('')
  const [qB, setQB] = useState('')
  const [qC, setQC] = useState('')
  const [qD, setQD] = useState('')
  const [qCorrect, setQCorrect] = useState('a')
  const [qExplanation, setQExplanation] = useState('')
  const [qModuleId, setQModuleId] = useState('')
  const [qSubjectId, setQSubjectId] = useState('')
  const [qExamType, setQExamType] = useState('both')
  const [qExamStage, setQExamStage] = useState('general')
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)

  const [sumTitle, setSumTitle] = useState('')
  const [sumUrl, setSumUrl] = useState('')
  const [sumModuleId, setSumModuleId] = useState('')
  const [sumExamStage, setSumExamStage] = useState('general')

  const [announcement, setAnnouncement] = useState('')
  const [announcementSaving, setAnnouncementSaving] = useState(false)
  const [driveUrl, setDriveUrl] = useState('')
  const [driveUrlSaving, setDriveUrlSaving] = useState(false)

  const c = {
    ...getTheme(dark),
    bg: dark ? '#0f172a' : '#f8fafc',
  }

  useEffect(() => {
    if (isAuth) {
      fetchModules(); fetchSubjects(); fetchFiles(); fetchSchedules(); fetchQuestions(); fetchSummaries(); fetchAnnouncement()
    }
  }, [isAuth])

  async function fetchAnnouncement() {
    const { data } = await supabase.from('site_settings').select('key, value').in('key', ['home_announcement', 'drive_url'])
    if (data) {
      const ann = data.find(r => r.key === 'home_announcement')
      const drive = data.find(r => r.key === 'drive_url')
      if (ann) setAnnouncement(ann.value || '')
      if (drive) setDriveUrl(drive.value || '')
    }
  }

  async function saveAnnouncement() {
    setAnnouncementSaving(true)
    const { error } = await supabase.from('site_settings').upsert({ key: 'home_announcement', value: announcement.trim() })
    setAnnouncementSaving(false)
    showMsg(error ? '❌ ' + error.message : '✅ Announcement updated!')
  }

  async function saveDriveUrl() {
    setDriveUrlSaving(true)
    const { error } = await supabase.from('site_settings').upsert({ key: 'drive_url', value: driveUrl.trim() })
    setDriveUrlSaving(false)
    showMsg(error ? '❌ ' + error.message : '✅ Drive link updated!')
  }

  async function fetchModules() {
    const { modules: sorted } = await fetchModulesSorted()
    setModules(sorted)
    refreshModules()
  }

  async function fetchSubjects() {
    const { data } = await supabase.from('subjects').select('*').order('created_at')
    if (data) setSubjects(data)
  }

  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  async function addModule() {
    if (!modName) return
    if (modules.some(m => m.name.trim().toLowerCase() === modName.trim().toLowerCase())) {
      return showMsg('❌ A module with this name already exists')
    }
    const { error } = await supabase.from('modules').insert([{ name: modName, color: modColor, icon: modIcon, status: modStatus }])
    if (!error) { showMsg('✅ Module added!'); setModName(''); fetchModules() }
    else showMsg('❌ ' + error.message)
  }

  async function toggleModuleStatus(mod) {
    const newStatus = mod.status === 'active' ? 'completed' : 'active'
    await supabase.from('modules').update({ status: newStatus }).eq('id', mod.id)
    fetchModules()
  }

  async function deleteModule(id) {
    if (!confirm('Delete this module? This will also permanently delete all its subjects, files, schedules, questions and summaries. This cannot be undone.')) return
    const { error } = await supabase.from('modules').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Module deleted')
    fetchModules()
  }

  async function addSubject() {
    if (!subName || !subModuleId) return
    const existing = subjects.filter(s => s.module_id === subModuleId)
    if (existing.some(s => s.name.trim().toLowerCase() === subName.trim().toLowerCase())) {
      return showMsg('❌ This subject already exists in that module')
    }
    const { error } = await supabase.from('subjects').insert([{ name: subName, module_id: subModuleId, type: subType }])
    if (!error) { showMsg('✅ Subject added!'); setSubName(''); fetchSubjects() }
    else showMsg('❌ ' + error.message)
  }

  async function deleteSubject(id) {
    if (!confirm('Delete this subject? Its files and questions will also be deleted. This cannot be undone.')) return
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Subject deleted')
    fetchSubjects()
  }

  async function fetchFiles() {
    const { data } = await supabase.from('files').select('*').order('created_at', { ascending: false })
    if (data) setFiles(data)
  }

  async function fetchSchedules() {
    const { data } = await supabase.from('schedules').select('*').order('created_at', { ascending: false })
    if (data) setSchedules(data)
  }

  async function fetchQuestions() {
    const { data } = await supabase.from('questions').select('*').order('created_at', { ascending: false })
    if (data) setQuestions(data)
  }

  async function fetchSummaries() {
    const { data } = await supabase.from('summaries').select('*').order('created_at', { ascending: false })
    if (data) setSummaries(data)
  }

  async function deleteFile(id) {
    if (!confirm('Delete this file? This cannot be undone.')) return
    const { error } = await supabase.from('files').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ File deleted')
    fetchFiles()
  }

  async function deleteSchedule(id) {
    if (!confirm('Delete this schedule? This cannot be undone.')) return
    const { error } = await supabase.from('schedules').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Schedule deleted')
    fetchSchedules()
  }

  async function deleteQuestion(id) {
    if (!confirm('Delete this question? This cannot be undone.')) return
    const { error } = await supabase.from('questions').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Question deleted')
    fetchQuestions()
  }

  async function deleteSummary(id) {
    if (!confirm('Delete this summary? This cannot be undone.')) return
    const { error } = await supabase.from('summaries').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Summary deleted')
    fetchSummaries()
  }

  async function addFile() {
    if (!fileName || !fileUrl || !fileModuleId) return
    const { error } = await supabase.from('files').insert([{
      name: fileName, url: fileUrl, type: fileType,
      file_type: fileFileType, module_id: fileModuleId,
      subject_id: fileSubjectId || null, exam_stage: fileExamStage
    }])
    if (!error) { showMsg('✅ File added!'); setFileName(''); setFileUrl(''); fetchFiles() }
    else showMsg('❌ ' + error.message)
  }

  async function addSchedule() {
    if (!schTitle || !schUrl || !schModuleId) return
    const { error } = await supabase.from('schedules').insert([{
      title: schTitle, url: schUrl, type: schType, module_id: schModuleId
    }])
    if (!error) { showMsg('✅ Schedule added!'); setSchTitle(''); setSchUrl(''); fetchSchedules() }
    else showMsg('❌ ' + error.message)
  }

  async function addQuestion() {
    if (!qText || !qA || !qB || !qC || !qD || !qModuleId) return
    const { error } = await supabase.from('questions').insert([{
      question: qText, option_a: qA, option_b: qB, option_c: qC, option_d: qD,
      correct: qCorrect, explanation: qExplanation, exam_type: qExamType,
      exam_stage: qExamStage, module_id: qModuleId, subject_id: qSubjectId || null
    }])
    if (!error) { showMsg('✅ Question added!'); setQText(''); setQA(''); setQB(''); setQC(''); setQD(''); setQExplanation(''); fetchQuestions() }
    else showMsg('❌ ' + error.message)
  }

  // Parses a block of pasted text into multiple questions at once.
  // Expected format per question, separated by a blank line:
  //   Q: question text
  //   A) option a
  //   B) option b
  //   C) option c
  //   D) option d
  //   Correct: B
  //   Explanation: optional explanation
  function parseBulkQuestions(text) {
    const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
    const questions = []
    const errors = []

    blocks.forEach((block, idx) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
      const qLine = lines.find(l => /^Q[:\-]/i.test(l))
      const aLine = lines.find(l => /^A[)\.\-]/i.test(l))
      const bLine = lines.find(l => /^B[)\.\-]/i.test(l))
      const cLine = lines.find(l => /^C[)\.\-]/i.test(l))
      const dLine = lines.find(l => /^D[)\.\-]/i.test(l))
      const correctLine = lines.find(l => /^Correct[:\-]/i.test(l))
      const explLine = lines.find(l => /^Explanation[:\-]/i.test(l))

      if (!qLine || !aLine || !bLine || !cLine || !dLine || !correctLine) {
        errors.push(`Question ${idx + 1}: missing Q/A/B/C/D/Correct line`)
        return
      }
      const correctLetter = correctLine.replace(/^Correct[:\-]/i, '').trim().toLowerCase().charAt(0)
      if (!['a', 'b', 'c', 'd'].includes(correctLetter)) {
        errors.push(`Question ${idx + 1}: "Correct" must be A, B, C or D`)
        return
      }
      questions.push({
        question: qLine.replace(/^Q[:\-]/i, '').trim(),
        option_a: aLine.replace(/^A[)\.\-]/i, '').trim(),
        option_b: bLine.replace(/^B[)\.\-]/i, '').trim(),
        option_c: cLine.replace(/^C[)\.\-]/i, '').trim(),
        option_d: dLine.replace(/^D[)\.\-]/i, '').trim(),
        correct: correctLetter,
        explanation: explLine ? explLine.replace(/^Explanation[:\-]/i, '').trim() : '',
      })
    })

    return { questions, errors }
  }

  async function bulkAddQuestions() {
    if (!qModuleId) return showMsg('❌ Please select a module first')
    if (!bulkText.trim()) return showMsg('❌ Paste some questions first')

    const { questions: parsed, errors } = parseBulkQuestions(bulkText)
    if (errors.length > 0) {
      showMsg(`❌ ${errors.length} question(s) have a formatting problem — ${errors[0]}`)
      return
    }
    if (parsed.length === 0) return showMsg('❌ No questions found in the text')

    setBulkSaving(true)
    const rows = parsed.map(q => ({
      ...q,
      exam_type: qExamType,
      exam_stage: qExamStage,
      module_id: qModuleId,
      subject_id: qSubjectId || null
    }))
    const { error } = await supabase.from('questions').insert(rows)
    setBulkSaving(false)

    if (error) { showMsg('❌ ' + error.message); return }
    showMsg(`✅ ${rows.length} questions added!`)
    setBulkText('')
    fetchQuestions()
  }

  async function addSummary() {
    if (!sumTitle || !sumUrl || !sumModuleId) return
    const { error } = await supabase.from('summaries').insert([{
      title: sumTitle, url: sumUrl, module_id: sumModuleId, exam_stage: sumExamStage
    }])
    if (!error) { showMsg('✅ Summary added!'); setSumTitle(''); setSumUrl(''); fetchSummaries() }
    else showMsg('❌ ' + error.message)
  }

  const activeModules = modules.filter(m => m.status === 'active')
  const completedModules = modules.filter(m => m.status !== 'active')
  const filteredSubjects = (moduleId) => subjects.filter(s => s.module_id === moduleId)

  const inStyle = inputStyle(c)

  const ModuleSelect = ({ value, onChange }) => (
    <select value={value} onChange={onChange} style={inStyle}>
      <option value="">Select Module</option>
      {activeModules.length > 0 && (
        <optgroup label="🟢 Active">
          {activeModules.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
        </optgroup>
      )}
      {completedModules.length > 0 && (
        <optgroup label="✅ Completed">
          {completedModules.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
        </optgroup>
      )}
    </select>
  )

  if (!isAuth) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: c.card, padding: 30, borderRadius: 20, width: '90%', maxWidth: 400, border: `1px solid ${c.border}`, textAlign: 'center' }}>
        <h3 style={{ color: '#38bdf8', marginBottom: 12 }}>🔐 Admin Panel</h3>
        <p style={{ color: c.sub, fontSize: 13, marginBottom: 20 }}>
          {user
            ? "Your account doesn't have admin access."
            : 'Sign in with your admin account to continue.'}
        </p>
        <button onClick={() => navigate(user ? '/' : '/auth')} style={btnStyle}>
          {user ? '← Back to Home' : 'Sign In'}
        </button>
      </div>
    </div>
  )

  const tabs = ['modules', 'subjects', 'files', 'schedules', 'questions', 'summaries', 'settings']

  return (
    <div className="page-container" style={{ padding: '20px', maxWidth: '650px' }}>
      <h2 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 20 }}>⚙️ Admin Panel</h2>

      {msg && (
        <div style={{
          background: msg.includes('✅') ? '#22c55e20' : '#ef444420',
          border: `1px solid ${msg.includes('✅') ? '#22c55e40' : '#ef444440'}`,
          borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          color: msg.includes('✅') ? '#22c55e' : '#ef4444', textAlign: 'center'
        }}>{msg}</div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 8 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
            fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'inherit', fontSize: 12,
            background: activeTab === t ? '#38bdf8' : c.card,
            color: activeTab === t ? '#0f172a' : c.sub,
            border: `1px solid ${activeTab === t ? '#38bdf8' : c.border}`
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {activeTab === 'modules' && (
        <div>
          <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}`, marginBottom: 16 }}>
            <h3 style={{ color: '#38bdf8', marginBottom: 16 }}>➕ Add Module</h3>
            <input placeholder="Module name" value={modName} onChange={e => setModName(e.target.value)} style={inStyle} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Icon</label>
                <input placeholder="Emoji" value={modIcon} onChange={e => setModIcon(e.target.value)} style={inStyle} />
              </div>
              <div>
                <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Color</label>
                <input type="color" value={modColor} onChange={e => setModColor(e.target.value)} style={{ ...inStyle, padding: 4, height: 42 }} />
              </div>
              <div>
                <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Status</label>
                <select value={modStatus} onChange={e => setModStatus(e.target.value)} style={inStyle}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <button onClick={addModule} style={btnStyle}>Add Module</button>
          </div>

          {activeModules.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ color: '#22c55e', marginBottom: 8 }}>🟢 Active</h4>
              {activeModules.map(mod => (
                <div key={mod.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{mod.icon}</span>
                    <div style={{ color: mod.color, fontWeight: 700 }}>{mod.name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => toggleModuleStatus(mod)} style={{ ...miniBtn, borderColor: '#f59e0b', color: '#f59e0b' }}>⏸ Done</button>
                    <button onClick={() => deleteModule(mod.id)} aria-label={`Delete module: ${mod.name}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {completedModules.length > 0 && (
            <div>
              <h4 style={{ color: '#64748b', marginBottom: 8 }}>✅ Completed</h4>
              {completedModules.map(mod => (
                <div key={mod.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{mod.icon}</span>
                    <div style={{ color: mod.color, fontWeight: 700 }}>{mod.name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => toggleModuleStatus(mod)} style={{ ...miniBtn, borderColor: '#22c55e', color: '#22c55e' }}>▶ Active</button>
                    <button onClick={() => deleteModule(mod.id)} aria-label={`Delete module: ${mod.name}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'subjects' && (
        <div>
          <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}`, marginBottom: 16 }}>
            <h3 style={{ color: '#38bdf8', marginBottom: 16 }}>➕ Add Subject</h3>
            <ModuleSelect value={subModuleId} onChange={e => setSubModuleId(e.target.value)} />
            <input placeholder="Subject name" value={subName} onChange={e => setSubName(e.target.value)} style={inStyle} />
            <select value={subType} onChange={e => setSubType(e.target.value)} style={inStyle}>
              <option value="both">Theory + Practical</option>
              <option value="theory">Theory Only</option>
              <option value="practical">Practical Only</option>
            </select>
            <button onClick={addSubject} style={btnStyle}>Add Subject</button>
          </div>
          {modules.map(mod => {
            const subs = filteredSubjects(mod.id)
            if (subs.length === 0) return null
            return (
              <div key={mod.id} style={{ marginBottom: 16 }}>
                <h4 style={{ color: mod.color, marginBottom: 8 }}>{mod.icon} {mod.name}</h4>
                {subs.map(sub => (
                  <div key={sub.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: c.text, fontWeight: 600 }}>{sub.name}</span>
                      <span style={{ color: c.sub, fontSize: 12, marginLeft: 8 }}>· {sub.type}</span>
                    </div>
                    <button onClick={() => deleteSubject(sub.id)} aria-label={`Delete subject: ${sub.name}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'files' && (
        <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
          <h3 style={{ color: '#38bdf8', marginBottom: 16 }}>➕ Add File / Recording</h3>
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
          <ModuleSelect value={fileModuleId} onChange={e => { setFileModuleId(e.target.value); setFileSubjectId('') }} />
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
            {EXAM_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={addFile} style={btnStyle}>Add File</button>
        </div>
      )}

      {activeTab === 'files' && files.length > 0 && (
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
                    <button onClick={() => deleteFile(f.id)} aria-label={`Delete file: ${f.name}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'schedules' && (
        <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
          <h3 style={{ color: '#38bdf8', marginBottom: 16 }}>➕ Add Schedule</h3>
          <input placeholder="Title (e.g. Week 1)" value={schTitle} onChange={e => setSchTitle(e.target.value)} style={inStyle} />
          <input placeholder="Image URL (Google Drive)" value={schUrl} onChange={e => setSchUrl(e.target.value)} style={inStyle} />
          <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Type</label>
          <select value={schType} onChange={e => setSchType(e.target.value)} style={inStyle}>
            <option value="study">📅 Study Schedule</option>
            <option value="exam">📝 Exam Schedule</option>
          </select>
          <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Module</label>
          <ModuleSelect value={schModuleId} onChange={e => setSchModuleId(e.target.value)} />
          <button onClick={addSchedule} style={btnStyle}>Add Schedule</button>
        </div>
      )}

      {activeTab === 'schedules' && schedules.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {modules.map(mod => {
            const modSchedules = schedules.filter(s => s.module_id === mod.id)
            if (modSchedules.length === 0) return null
            return (
              <div key={mod.id} style={{ marginBottom: 16 }}>
                <h4 style={{ color: mod.color, marginBottom: 8 }}>{mod.icon} {mod.name}</h4>
                {modSchedules.map(s => (
                  <div key={s.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: c.text, fontWeight: 600 }}>{s.title}</span>
                      <span style={{ color: c.sub, fontSize: 12, marginLeft: 8 }}>· {s.type}</span>
                    </div>
                    <button onClick={() => deleteSchedule(s.id)} aria-label={`Delete schedule: ${s.title}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'questions' && (
        <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ color: '#38bdf8' }}>{bulkMode ? '📋 Bulk Add Questions' : '➕ Add MCQ Question'}</h3>
            <button onClick={() => setBulkMode(!bulkMode)} style={{
              background: 'transparent', border: `1px solid ${c.border}`,
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
              color: c.sub, fontFamily: 'inherit', fontSize: 12, fontWeight: 700
            }}>{bulkMode ? '✏️ Single Add' : '📋 Bulk Add'}</button>
          </div>

          <ModuleSelect value={qModuleId} onChange={e => { setQModuleId(e.target.value); setQSubjectId('') }} />
          {qModuleId && (
            <select value={qSubjectId} onChange={e => setQSubjectId(e.target.value)} style={inStyle}>
              <option value="">All Subjects</option>
              {filteredSubjects(qModuleId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Use In</label>
          <select value={qExamType} onChange={e => setQExamType(e.target.value)} style={inStyle}>
            <option value="both">Practice + Mock Exam</option>
            <option value="practice">Practice Only</option>
            <option value="mock">Mock Exam Only</option>
          </select>
          <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Exam Stage</label>
          <select value={qExamStage} onChange={e => setQExamStage(e.target.value)} style={inStyle}>
            {EXAM_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {bulkMode ? (
            <>
              <p style={{ color: c.sub, fontSize: 12, marginBottom: 8, lineHeight: 1.6 }}>
                Paste as many questions as you want below, one after another,
                separated by an empty line. Every question in this box will
                be added to the module/subject/type selected above. Format:
              </p>
              <pre style={{
                background: c.input, border: `1px solid ${c.border}`, borderRadius: 10,
                padding: 12, fontSize: 11, color: c.sub, marginBottom: 12,
                whiteSpace: 'pre-wrap', lineHeight: 1.6
              }}>{`Q: What is the powerhouse of the cell?
A) Nucleus
B) Mitochondria
C) Ribosome
D) Golgi apparatus
Correct: B
Explanation: Mitochondria produce ATP.

Q: Second question here...
A) ...
B) ...
C) ...
D) ...
Correct: A`}</pre>
              <textarea
                placeholder="Paste your questions here..."
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                style={{ ...inStyle, minHeight: 240, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
              <button onClick={bulkAddQuestions} disabled={bulkSaving} style={btnStyle}>
                {bulkSaving ? 'Adding...' : 'Parse & Add All'}
              </button>
            </>
          ) : (
            <>
              <textarea placeholder="Question" value={qText} onChange={e => setQText(e.target.value)} style={{ ...inStyle, minHeight: 80, resize: 'vertical' }} />
              {['A', 'B', 'C', 'D'].map((opt, i) => (
                <input key={opt} placeholder={`Option ${opt}`}
                  value={[qA, qB, qC, qD][i]}
                  onChange={e => [setQA, setQB, setQC, setQD][i](e.target.value)}
                  style={inStyle} />
              ))}
              <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Correct Answer</label>
              <select value={qCorrect} onChange={e => setQCorrect(e.target.value)} style={inStyle}>
                <option value="a">A</option>
                <option value="b">B</option>
                <option value="c">C</option>
                <option value="d">D</option>
              </select>
              <textarea placeholder="Explanation (optional)" value={qExplanation} onChange={e => setQExplanation(e.target.value)} style={{ ...inStyle, minHeight: 60, resize: 'vertical' }} />
              <button onClick={addQuestion} style={btnStyle}>Add Question</button>
            </>
          )}
        </div>
      )}

      {activeTab === 'questions' && questions.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {modules.map(mod => {
            const modQuestions = questions.filter(q => q.module_id === mod.id)
            if (modQuestions.length === 0) return null
            return (
              <div key={mod.id} style={{ marginBottom: 16 }}>
                <h4 style={{ color: mod.color, marginBottom: 8 }}>{mod.icon} {mod.name} <span style={{ color: c.sub, fontSize: 12, fontWeight: 400 }}>({modQuestions.length})</span></h4>
                {modQuestions.map(q => (
                  <div key={q.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: c.text, fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question}</span>
                    <button onClick={() => deleteQuestion(q.id)} aria-label="Delete question" style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444', flexShrink: 0 }}>🗑</button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'summaries' && (
        <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
          <h3 style={{ color: '#38bdf8', marginBottom: 16 }}>➕ Add Summary</h3>
          <ModuleSelect value={sumModuleId} onChange={e => setSumModuleId(e.target.value)} />
          <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Exam Stage</label>
          <select value={sumExamStage} onChange={e => setSumExamStage(e.target.value)} style={inStyle}>
            {EXAM_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <input placeholder="Title (e.g. End Module Exam)" value={sumTitle} onChange={e => setSumTitle(e.target.value)} style={inStyle} />
          <input placeholder="Summary URL" value={sumUrl} onChange={e => setSumUrl(e.target.value)} style={inStyle} />
          <button onClick={addSummary} style={btnStyle}>Add Summary</button>
        </div>
      )}

      {activeTab === 'summaries' && summaries.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {modules.map(mod => {
            const modSummaries = summaries.filter(s => s.module_id === mod.id)
            if (modSummaries.length === 0) return null
            return (
              <div key={mod.id} style={{ marginBottom: 16 }}>
                <h4 style={{ color: mod.color, marginBottom: 8 }}>{mod.icon} {mod.name}</h4>
                {modSummaries.map(s => (
                  <div key={s.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: c.text, fontWeight: 600 }}>{s.title}</span>
                    <button onClick={() => deleteSummary(s.id)} aria-label={`Delete summary: ${s.title}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
      {activeTab === 'settings' && (
        <div>
          <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}`, marginBottom: 16 }}>
            <h3 style={{ color: '#38bdf8', marginBottom: 8 }}>📁 University Google Drive Link</h3>
            <p style={{ color: c.sub, fontSize: 13, marginBottom: 16 }}>
              One link, shown on every module page, pointing to the
              university's shared Drive (lectures, recordings, etc.).
              Leave it empty to hide the button.
            </p>
            <input
              placeholder="https://drive.google.com/..."
              value={driveUrl}
              onChange={e => setDriveUrl(e.target.value)}
              style={inStyle} />
            <button onClick={saveDriveUrl} disabled={driveUrlSaving} style={btnStyle}>
              {driveUrlSaving ? 'Saving...' : 'Save Drive Link'}
            </button>
          </div>

          <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
            <h3 style={{ color: '#38bdf8', marginBottom: 8 }}>📢 Home Page Announcement</h3>
            <p style={{ color: c.sub, fontSize: 13, marginBottom: 16 }}>
              This shows in a banner at the top of the Home page for everyone.
              Leave it empty to hide the banner completely. Press Enter for a
              new line — it'll look exactly the same on the site. The box
              below is styled exactly like it'll appear, so what you see here
              is what students will see.
            </p>
            <textarea
              placeholder="e.g. Pharma exam next week, study well! 🔥"
              value={announcement}
              onChange={e => setAnnouncement(e.target.value)}
              style={{
                width: '100%', minHeight: 100, padding: '14px 20px',
                borderRadius: 16, border: '1px solid #38bdf840',
                background: 'linear-gradient(135deg, #38bdf820, #818cf815)',
                color: c.text, fontSize: 14, fontWeight: 600, lineHeight: 1.6,
                textAlign: 'center', fontFamily: 'inherit', outline: 'none',
                resize: 'vertical', marginBottom: 12
              }} />
            <button onClick={saveAnnouncement} disabled={announcementSaving} style={btnStyle}>
              {announcementSaving ? 'Saving...' : 'Save Announcement'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const btnStyle = { width: '100%', padding: '12px', background: '#38bdf8', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#0f172a', fontFamily: 'inherit', fontSize: 14 }
const miniBtn = { background: 'transparent', border: '1px solid', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }
