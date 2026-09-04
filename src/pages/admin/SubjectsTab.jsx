import { useState } from 'react'
import { supabase } from '../../supabase'
import { getPulseTheme } from '../../premiumTheme'
import InlineMessage from '../../components/InlineMessage'
import ModuleSelect from './ModuleSelect'
import IconPicker from '../../components/admin/IconPicker'
import LiquidGlassCard from '@/components/ui/liquid-glass-card'
import { ModuleIcon } from '../../lib/medicalIcons'
import { btnStyle, miniBtn, cancelBtnStyle, inStyle as adminInStyle } from './adminStyles'

export default function SubjectsTab({ dark, modules, subjects, fetchSubjects }) {
  const pt = getPulseTheme(dark)
  const inStyle = adminInStyle(pt, dark)
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
      <div style={{ marginBottom: 16 }}>
        <LiquidGlassCard dark={dark} delay={0} style={{ padding: '20px 22px' }}>
          <h3 style={{ color: pt.cobalt, marginBottom: 16, fontWeight: 800 }}>{editingSubjectId ? '✏️ Edit Subject' : '➕ Add Subject'}</h3>
          <ModuleSelect modules={modules} value={subModuleId} onChange={e => setSubModuleId(e.target.value)} inStyle={inStyle} />
          <input placeholder="Subject name" value={subName} onChange={e => setSubName(e.target.value)} style={inStyle} />

          <IconPicker value={subIcon} onChange={setSubIcon} inStyle={inStyle} pt={pt} />

          <label style={{ color: pt.textMuted, fontSize: 12, display: 'block', marginBottom: 4 }}>Color</label>
          <input type="color" value={subColor} onChange={e => setSubColor(e.target.value)} style={{ ...inStyle, padding: 4, height: 48, marginBottom: 12 }} />

          <select value={subType} onChange={e => setSubType(e.target.value)} style={inStyle}>
            <option value="both">Theory + Practical</option>
            <option value="theory">Theory Only</option>
            <option value="practical">Practical Only</option>
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveSubject} style={{ ...btnStyle(pt, dark), flex: 1 }}>{editingSubjectId ? 'Save Changes' : 'Add Subject'}</button>
            {editingSubjectId && <button onClick={resetSubjectForm} style={cancelBtnStyle(pt, dark)}>Cancel</button>}
          </div>
        </LiquidGlassCard>
      </div>
      {modules.map(mod => {
        const subs = filteredSubjects(mod.id)
        if (subs.length === 0) return null
        return (
          <div key={mod.id} style={{ marginBottom: 16 }}>
            <h4 style={{ color: mod.color, marginBottom: 8 }}>{mod.icon} {mod.name}</h4>
            <div style={{ display: 'grid', gap: 10 }}>
              {subs.map(sub => (
                <LiquidGlassCard key={sub.id} dark={dark} delay={0} style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      background: sub.color || '#34d399', display: 'inline-block'
                    }} />
                    <span style={{ display: 'inline-flex' }}>
                      <ModuleIcon value={sub.icon || '📖'} size={18} color={sub.color || '#34d399'} />
                    </span>
                    <span style={{ color: pt.text, fontWeight: 600 }}>{sub.name}</span>
                    <span style={{ color: pt.textMuted, fontSize: 12 }}>· {sub.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => editSubject(sub)} aria-label={`Edit subject: ${sub.name}`} style={miniBtn(pt, pt.cobalt)}>✏️</button>
                    <button onClick={() => deleteSubject(sub.id)} aria-label={`Delete subject: ${sub.name}`} style={miniBtn(pt, pt.danger)}>🗑</button>
                  </div>
                </LiquidGlassCard>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
