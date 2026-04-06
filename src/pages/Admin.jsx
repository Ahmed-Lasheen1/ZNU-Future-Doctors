import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const PASS = 'Ail@10_11_2006#'

export default function Admin({ dark }) {
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

  const c = {
    bg: dark ? '#0f172a' : '#f8fafc',
    card: dark ? '#1e293b' : '#fff',
    border: dark ? '#1e3a5f' : '#e2e8f0',
    text: dark ? '#e2e8f0' : '#1e293b',
    sub: dark ? '#94a3b8' : '#64748b',
    input: dark ? '#0f172a' : '#f8fafc',
  }

  useEffect(() => {
    if (isAuth) { fetchModules(); fetchSubjects() }
  }, [isAuth])

  async function fetchModules() {
    const { data } = await supabase.from('modules').select('*').order('status').order('created_at')
    if (data) {
      const sorted = [
        ...data.filter(m => m.status === 'active'),
        ...data.filter(m => m.status !== 'active')
      ]
      setModules(sorted)
    }
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

  const activeModules = modules.filter(m => m.status === 'active')
  const completedModules = modules.filter(m => m.status !== 'active')
  const filteredSubjects = (moduleId) => subjects.filter(s => s.module_id === moduleId)

  const inStyle = {
    width: '100%', padding: '12px', marginBottom: '12px',
    borderRadius: '10px', border: `1px solid ${c.border}`,
    background: c.input, color: c.text,
    fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none'
  }

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
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: c.card, padding: 30, borderRadius: 20, width: '90%', maxWidth: 400, border: `1px solid ${c.border}` }}>
        <h3 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 20 }}>🔐 Admin Panel</h3>
        <input type="password" placeholder="Password" onChange={e => setPass(e.target.value)} style={inStyle} />
        <button onClick={() => pass === PASS && setIsAuth(true)} style={btnStyle}>Enter</button>
      </div>
    </div>
  )

  const tabs = ['modules', 'subjects', 'files', 'schedules', 'questions', 'summaries']

  return (
    <div style={{ padding: '20px', maxWidth: '650px', margin: '0 auto' }}>
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
                    <button onClick={() => deleteModule(mod.id)} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
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
                    <button onClick={() => deleteModule(mod.id)} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
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
                    <button onClick={() => deleteSubject(sub.id)} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
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
          <button onClick={addFile} style={btnStyle}>Add File</button>
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

      {activeTab === 'questions' && (
        <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
          <h3 style={{ color: '#38bdf8', marginBottom: 16 }}>➕ Add MCQ Question</h3>
          <ModuleSelect value={qModuleId} onChange={e => { setQModuleId(e.target.value); setQSubjectId('') }} />
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
          <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Correct Answer</label>
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
        <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
          <h3 style={{ color: '#38bdf8', marginBottom: 16 }}>➕ Add Summary</h3>
          <ModuleSelect value={sumModuleId} onChange={e => setSumModuleId(e.target.value)} />
          <input placeholder="Title (e.g. End Module Exam)" value={sumTitle} onChange={e => setSumTitle(e.target.value)} style={inStyle} />
          <input placeholder="Summary URL" value={sumUrl} onChange={e => setSumUrl(e.target.value)} style={inStyle} />
          <button onClick={addSummary} style={btnStyle}>Add Summary</button>
        </div>
      )}
    </div>
  )
}

const btnStyle = { width: '100%', padding: '12px', background: '#38bdf8', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#0f172a', fontFamily: 'inherit', fontSize: 14 }
const miniBtn = { background: 'transparent', border: '1px solid', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }
