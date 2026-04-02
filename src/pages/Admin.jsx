import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const PASS = 'znu2026'

export default function Admin() {
  const [pass, setPass] = useState('')
  const [isAuth, setIsAuth] = useState(false)
  const [activeTab, setActiveTab] = useState('modules')
  const [modules, setModules] = useState([])
  const [subjects, setSubjects] = useState([])
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

  const [sumTitle, setSumTitle] = useState('')
  const [sumUrl, setSumUrl] = useState('')
  const [sumModuleId, setSumModuleId] = useState('')

  useEffect(() => {
    if (isAuth) { fetchModules(); fetchSubjects() }
  }, [isAuth])

  async function fetchModules() {
    const { data } = await supabase.from('modules').select('*').order('created_at')
    if (data) setModules(data)
  }

  async function fetchSubjects() {
    const { data } = await supabase.from('subjects').select('*').order('created_at')
    if (data) setSubjects(data)
  }

  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  async function addModule() {
    if (!modName) return
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
    if (!confirm('Delete this module?')) return
    await supabase.from('modules').delete().eq('id', id)
    fetchModules()
  }

  async function addSubject() {
    if (!subName || !subModuleId) return
    const { error } = await supabase.from('subjects').insert([{ name: subName, module_id: subModuleId, type: subType }])
    if (!error) { showMsg('✅ Subject added!'); setSubName(''); fetchSubjects() }
    else showMsg('❌ ' + error.message)
  }

  async function deleteSubject(id) {
    await supabase.from('subjects').delete().eq('id', id)
    fetchSubjects()
  }

  async function addFile() {
    if (!fileName || !fileUrl || !fileModuleId) return
    const { error } = await supabase.from('files').insert([{
      name: fileName, url: fileUrl, type: fileType,
      file_type: fileFileType, module_id: fileModuleId,
      subject_id: fileSubjectId || null
    }])
    if (!error) { showMsg('✅ File added!'); setFileName(''); setFileUrl('') }
    else showMsg('❌ ' + error.message)
  }

  async function addSchedule() {
    if (!schTitle || !schUrl || !schModuleId) return
    const { error } = await supabase.from('schedules').insert([{
      title: schTitle, url: schUrl, type: schType, module_id: schModuleId
    }])
    if (!error) { showMsg('✅ Schedule added!'); setSchTitle(''); setSchUrl('') }
    else showMsg('❌ ' + error.message)
  }

  async function addTask() {
    if (!taskText || !taskModuleId) return
    const { error } = await supabase.from('checklist').insert([{
      text: taskText, module_id: taskModuleId,
      subject_id: taskSubjectId || null,
      subject: subjects.find(s => s.id === taskSubjectId)?.name || ''
    }])
    if (!error) { showMsg('✅ Task added!'); setTaskText('') }
    else showMsg('❌ ' + error.message)
  }

  async function addQuestion() {
    if (!qText || !qA || !qB || !qC || !qD || !qModuleId) return
    const { error } = await supabase.from('questions').insert([{
      question: qText, option_a: qA, option_b: qB, option_c: qC, option_d: qD,
      correct: qCorrect, explanation: qExplanation,
      module_id: qModuleId, subject_id: qSubjectId || null
    }])
    if (!error) { showMsg('✅ Question added!'); setQText(''); setQA(''); setQB(''); setQC(''); setQD(''); setQExplanation('') }
    else showMsg('❌ ' + error.message)
  }

  async function addSummary() {
    if (!sumTitle || !sumUrl || !sumModuleId) return
    const { error } = await supabase.from('summaries').insert([{
      title: sumTitle, url: sumUrl, module_id: sumModuleId
    }])
    if (!error) { showMsg('✅ Summary added!'); setSumTitle(''); setSumUrl('') }
    else showMsg('❌ ' + error.message)
  }

  const filteredSubjects = (moduleId) => subjects.filter(s => s.module_id === moduleId)

  if (!isAuth) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1e293b', padding: 30, borderRadius: 20, width: '90%', maxWidth: 400, border: '1px solid #1e3a5f' }}>
        <h3 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 20 }}>🔐 Admin Panel</h3>
        <input type="password" placeholder="Password" onChange={e => setPass(e.target.value)} style={inStyle} />
        <button onClick={() => pass === PASS && setIsAuth(true)} style={btnStyle}>Enter</button>
      </div>
    </div>
  )

  const tabs = ['modules', 'subjects', 'files', 'schedules', 'checklist', 'questions', 'summaries']

  return (
    <div style={{ padding: '20px', maxWidth: '650px', margin: '0 auto' }}>
      <h2 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 20 }}>⚙️ Admin Panel</h2>

      {msg && <div style={{ background: '#1e293b', border: '1px solid #38bdf8', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#38bdf8', textAlign: 'center' }}>{msg}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 8 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            ...tabStyle,
            background: activeTab === t ? '#38bdf8' : '#1e293b',
            color: activeTab === t ? '#0f172a' : '#94a3b8',
            border: `1px solid ${activeTab === t ? '#38bdf8' : '#334155'}`
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {activeTab === 'modules' && (
        <div>
          <div style={cardStyle}>
            <h3 style={sectionTitle}>➕ Add Module</h3>
            <input placeholder="Module name (e.g. GIT Module)" value={modName} onChange={e => setModName(e.target.value)} style={inStyle} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Icon</label>
                <input placeholder="Emoji" value={modIcon} onChange={e => setModIcon(e.target.value)} style={inStyle} />
              </div>
              <div>
                <label style={labelStyle}>Color</label>
                <input type="color" value={modColor} onChange={e => setModColor(e.target.value)} style={{ ...inStyle, padding: 4, height: 42 }} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={modStatus} onChange={e => setModStatus(e.target.value)} style={inStyle}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <button onClick={addModule} style={btnStyle}>Add Module</button>
          </div>
          <h3 style={{ color: '#94a3b8', marginBottom: 12 }}>All Modules</h3>
          {modules.map(mod => (
            <div key={mod.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{mod.icon}</span>
                <div>
                  <div style={{ color: mod.color, fontWeight: 700 }}>{mod.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{mod.status}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => toggleModuleStatus(mod)} style={{ ...miniBtn, borderColor: mod.status === 'active' ? '#22c55e' : '#f59e0b', color: mod.status === 'active' ? '#22c55e' : '#f59e0b' }}>
                  {mod.status === 'active' ? '✓ Active' : '⏸ Done'}
                </button>
                <button onClick={() => deleteModule(mod.id)} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'subjects' && (
        <div>
          <div style={cardStyle}>
            <h3 style={sectionTitle}>➕ Add Subject</h3>
            <select value={subModuleId} onChange={e => setSubModuleId(e.target.value)} style={inStyle}>
              <option value="">Select Module</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input placeholder="Subject name (e.g. Anatomy)" value={subName} onChange={e => setSubName(e.target.value)} style={inStyle} />
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
                  <div key={sub.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                    <div>
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{sub.name}</span>
                      <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}> · {sub.type}</span>
                    </div>
                    <button onClick={() => deleteSubject(sub.id)} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'files' && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>➕ Add File / Recording</h3>
          <input placeholder="File name" value={fileName} onChange={e => setFileName(e.target.value)} style={inStyle} />
          <input placeholder="URL (Drive / YouTube / SoundCloud)" value={fileUrl} onChange={e => setFileUrl(e.target.value)} style={inStyle} />
          <label style={labelStyle}>Content Type</label>
          <select value={fileType} onChange={e => setFileType(e.target.value)} style={inStyle}>
            <option value="sharah">📖 Explanation Files</option>
            <option value="questions">❓ Question Files</option>
            <option value="lectures">🎥 Lecture Recordings</option>
            <option value="courses">🎓 Course Recordings</option>
          </select>
          <label style={labelStyle}>File Type</label>
          <select value={fileFileType} onChange={e => setFileFileType(e.target.value)} style={inStyle}>
            <option value="pdf">📄 PDF</option>
            <option value="video">🎥 Video</option>
            <option value="audio">🎵 Audio</option>
          </select>
          <label style={labelStyle}>Module</label>
          <select value={fileModuleId} onChange={e => { setFileModuleId(e.target.value); setFileSubjectId('') }} style={inStyle}>
            <option value="">Select Module</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          {fileModuleId && (
            <>
              <label style={labelStyle}>Subject (optional)</label>
              <select value={fileSubjectId} onChange={e => setFileSubjectId(e.target.value)} style={inStyle}>
                <option value="">All Subjects</option>
                {filteredSubjects(fileModuleId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </>
          )}
          <button onClick={addFile} style={btnStyle}>Add File</button>
        </div>
      )}

      {activeTab === 'schedules' && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>➕ Add Schedule</h3>
          <input placeholder="Title (e.g. Week 1)" value={schTitle} onChange={e => setSchTitle(e.target.value)} style={inStyle} />
          <input placeholder="Image URL" value={schUrl} onChange={e => setSchUrl(e.target.value)} style={inStyle} />
          <label style={labelStyle}>Type</label>
          <select value={schType} onChange={e => setSchType(e.target.value)} style={inStyle}>
            <option value="study">📅 Study Schedule</option>
            <option value="exam">📝 Exam Schedule</option>
          </select>
          <label style={labelStyle}>Module</label>
          <select value={schModuleId} onChange={e => setSchModuleId(e.target.value)} style={inStyle}>
            <option value="">Select Module</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button onClick={addSchedule} style={btnStyle}>Add Schedule</button>
        </div>
      )}

      {activeTab === 'checklist' && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>➕ Add Checklist Item</h3>
          <select value={taskModuleId} onChange={e => { setTaskModuleId(e.target.value); setTaskSubjectId('') }} style={inStyle}>
            <option value="">Select Module</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          {taskModuleId && (
            <select value={taskSubjectId} onChange={e => setTaskSubjectId(e.target.value)} style={inStyle}>
              <option value="">Select Subject</option>
              {filteredSubjects(taskModuleId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <input placeholder="Topic (e.g. Stomach Blood Supply)" value={taskText} onChange={e => setTaskText(e.target.value)} style={inStyle} />
          <button onClick={addTask} style={btnStyle}>Add Task</button>
        </div>
      )}

      {activeTab === 'questions' && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>➕ Add MCQ Question</h3>
          <select value={qModuleId} onChange={e => { setQModuleId(e.target.value); setQSubjectId('') }} style={inStyle}>
            <option value="">Select Module</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          {qModuleId && (
            <select value={qSubjectId} onChange={e => setQSubjectId(e.target.value)} style={inStyle}>
              <option value="">All Subjects</option>
              {filteredSubjects(qModuleId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <textarea placeholder="Question" value={qText} onChange={e => setQText(e.target.value)} style={{ ...inStyle, minHeight: 80, resize: 'vertical' }} />
          {['A', 'B', 'C', 'D'].map((opt, i) => (
            <input key={opt} placeholder={`Option ${opt}`}
              value={[qA, qB, qC, qD][i]}
              onChange={e => [setQA, setQB, setQC, setQD][i](e.target.value)}
              style={inStyle} />
          ))}
          <label style={labelStyle}>Correct Answer</label>
          <select value={qCorrect} onChange={e => setQCorrect(e.target.value)} style={inStyle}>
            <option value="a">A</option>
            <option value="b">B</option>
            <option value="c">C</option>
            <option value="d">D</option>
          </select>
          <textarea placeholder="Explanation (optional)" value={qExplanation} onChange={e => setQExplanation(e.target.value)} style={{ ...inStyle, minHeight: 60, resize: 'vertical' }} />
          <button onClick={addQuestion} style={btnStyle}>Add Question</button>
        </div>
      )}

      {activeTab === 'summaries' && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>➕ Add Summary</h3>
          <select value={sumModuleId} onChange={e => setSumModuleId(e.target.value)} style={inStyle}>
            <option value="">Select Module</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <input placeholder="Title (e.g. End Module Exam)" value={sumTitle} onChange={e => setSumTitle(e.target.value)} style={inStyle} />
          <input placeholder="Summary URL (e.g. https://git-end-summary.vercel.app)" value={sumUrl} onChange={e => setSumUrl(e.target.value)} style={inStyle} />
          <button onClick={addSummary} style={btnStyle}>Add Summary</button>
        </div>
      )}
    </div>
  )
}

const inStyle = { width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '10px', border: '1px solid #1e3a5f', background: '#0f172a', color: '#fff', outline: 'none', fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }
const btnStyle = { width: '100%', padding: '12px', background: '#38bdf8', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#0f172a', fontFamily: 'inherit', fontSize: 14 }
const tabStyle = { padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'inherit', fontSize: 12 }
const cardStyle = { background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #1e3a5f', marginBottom: 16 }
const miniBtn = { background: 'transparent', border: '1px solid', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }
const sectionTitle = { color: '#38bdf8', marginBottom: 16, fontSize: 16 }
const labelStyle = { color: '#94a3b8', fontSize: 12, display: 'block', marginBottom: 4 }
