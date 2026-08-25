import { useState } from 'react'
import { supabase } from '../../supabase'
import { getTheme, inputStyle } from '../../theme'
import InlineMessage from '../../components/InlineMessage'
import ModuleSelect from './ModuleSelect'
import { btnStyle, miniBtn, cancelBtnStyle } from './adminStyles'

export default function SubjectsTab({ dark, modules, subjects, fetchSubjects }) {
  const c = getTheme(dark)
  const inStyle = inputStyle(c)
  const [msg, setMsg] = useState('')
  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const [editingSubjectId, setEditingSubjectId] = useState(null)
  const [subName, setSubName] = useState('')
  const [subModuleId, setSubModuleId] = useState('')
  const [subType, setSubType] = useState('both')
  const [subIcon, setSubIcon] = useState('📖')
  const [subColor, setSubColor] = useState('#34d399')

  function editSubject(sub) {
    setEditingSubjectId(sub.id)
    setSubModuleId(sub.module_id); setSubName(sub.name); setSubType(sub.type)
    setSubIcon(sub.icon || '📖'); setSubColor(sub.color || '#34d399')
  }
  function resetSubjectForm() {
    setEditingSubjectId(null); setSubName(''); setSubType('both')
    setSubIcon('📖'); setSubColor('#34d399')
  }
  async function saveSubject() {
    if (!subName || !subModuleId) return
    const existing = subjects.filter(s => s.module_id === subModuleId && s.id !== editingSubjectId)
    if (existing.some(s => s.name.trim().toLowerCase() === subName.trim().toLowerCase())) {
      return showMsg('❌ This subject already exists in that module')
    }
    const payload = {
      name: subName, module_id: subModuleId, type: subType,
      icon: subIcon || '📖', color: subColor || '#34d399'
    }
    if (editingSubjectId) {
      const { error } = await supabase.from('subjects').update(payload).eq('id', editingSubjectId)
      if (!error) { showMsg('✅ Subject updated!'); resetSubjectForm(); fetchSubjects() }
      else showMsg('❌ ' + error.message)
    } else {
      const { error } = await supabase.from('subjects').insert([payload])
      if (!error) { showMsg('✅ Subject added!'); resetSubjectForm(); fetchSubjects() }
      else showMsg('❌ ' + error.message)
    }
  }

  async function deleteSubject(id) {
    if (!confirm('Delete this subject? Its files, lessons and questions will also be deleted. This cannot be undone.')) return
    if (editingSubjectId === id) resetSubjectForm()
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Subject deleted')
    fetchSubjects()
  }

  const filteredSubjects = (moduleId) => subjects.filter(s => s.module_id === moduleId)

  return (
    <div>
      <InlineMessage message={msg} />
      <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}`, marginBottom: 16 }}>
        <h3 style={{ color: '#38bdf8', marginBottom: 16 }}>{editingSubjectId ? '✏️ Edit Subject' : '➕ Add Subject'}</h3>
        <ModuleSelect modules={modules} value={subModuleId} onChange={e => setSubModuleId(e.target.value)} inStyle={inStyle} />
        <input placeholder="Subject name" value={subName} onChange={e => setSubName(e.target.value)} style={inStyle} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Icon (emoji)</label>
            <input placeholder="📖" value={subIcon} onChange={e => setSubIcon(e.target.value)} style={inStyle} />
          </div>
          <div>
            <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Color</label>
            <input type="color" value={subColor} onChange={e => setSubColor(e.target.value)} style={{ ...inStyle, padding: 4, height: 42 }} />
          </div>
        </div>

        <select value={subType} onChange={e => setSubType(e.target.value)} style={inStyle}>
          <option value="both">Theory + Practical</option>
          <option value="theory">Theory Only</option>
          <option value="practical">Practical Only</option>
        </select>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={saveSubject} style={{ ...btnStyle, flex: 1 }}>{editingSubjectId ? 'Save Changes' : 'Add Subject'}</button>
          {editingSubjectId && <button onClick={resetSubjectForm} style={cancelBtnStyle(c)}>Cancel</button>}
        </div>
      </div>
      {modules.map(mod => {
        const subs = filteredSubjects(mod.id)
        if (subs.length === 0) return null
        return (
          <div key={mod.id} style={{ marginBottom: 16 }}>
            <h4 style={{ color: mod.color, marginBottom: 8 }}>{mod.icon} {mod.name}</h4>
            {subs.map(sub => (
              <div key={sub.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    background: sub.color || '#34d399', display: 'inline-block'
                  }} />
                  <span style={{ fontSize: 18 }}>{sub.icon || '📖'}</span>
                  <span style={{ color: c.text, fontWeight: 600 }}>{sub.name}</span>
                  <span style={{ color: c.sub, fontSize: 12 }}>· {sub.type}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => editSubject(sub)} aria-label={`Edit subject: ${sub.name}`} style={{ ...miniBtn, borderColor: '#38bdf8', color: '#38bdf8' }}>✏️</button>
                  <button onClick={() => deleteSubject(sub.id)} aria-label={`Delete subject: ${sub.name}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
