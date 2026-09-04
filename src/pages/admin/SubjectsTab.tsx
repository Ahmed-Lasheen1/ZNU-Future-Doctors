import { useState } from 'react'
import { supabase } from '../../supabase'
import { getPulseTheme } from '../../premiumTheme'
import InlineMessage from '../../components/InlineMessage'
import ModuleSelect from './ModuleSelect'
import AdminSplitLayout from './AdminSplitLayout'
import IconPicker from '../../components/admin/IconPicker'
import LiquidGlassCard from '@/components/ui/liquid-glass-card'
import { ModuleIcon } from '../../lib/medicalIcons'
import { btnStyle, miniBtn, cancelBtnStyle, inStyle as adminInStyle, fieldLabel, groupHeading } from './adminStyles'
import type { AdminModule, AdminSubject } from './adminTypes'

interface SubjectsTabProps {
  dark: boolean
  modules: AdminModule[]
  subjects: AdminSubject[]
  fetchSubjects: () => void
}

export default function SubjectsTab({ dark, modules, subjects, fetchSubjects }: SubjectsTabProps) {
  const pt = getPulseTheme(dark)
  const inStyle = adminInStyle(pt, dark)
  const [msg, setMsg] = useState('')
  function showMsg(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [subName, setSubName] = useState('')
  const [subModuleId, setSubModuleId] = useState('')
  const [subType, setSubType] = useState('both')
  const [subIcon, setSubIcon] = useState('📖')
  const [subColor, setSubColor] = useState('#34d399')
  const [moduleFilter, setModuleFilter] = useState('all')

  function editSubject(sub: AdminSubject) {
    setEditingSubjectId(sub.id)
    setSubModuleId(sub.module_id); setSubName(sub.name); setSubType(sub.type || 'both')
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

  async function deleteSubject(id: string) {
    if (!confirm('Delete this subject? Its files, lessons and questions will also be deleted. This cannot be undone.')) return
    if (editingSubjectId === id) resetSubjectForm()
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Subject deleted')
    fetchSubjects()
  }

  const filteredSubjects = (moduleId: string) => subjects.filter(s => s.module_id === moduleId)
  const visibleModules = moduleFilter === 'all' ? modules : modules.filter(m => m.id === moduleFilter)

  const form = (
    <LiquidGlassCard dark={dark} delay={0} style={{ padding: '20px 22px' }}>
      <h3 style={{ color: pt.cobalt, marginBottom: 16, fontWeight: 800 }}>{editingSubjectId ? '✏️ Edit Subject' : '➕ Add Subject'}</h3>
      <label style={fieldLabel(pt)}>Module</label>
      <ModuleSelect modules={modules} value={subModuleId} onChange={setSubModuleId} dark={dark} />
      <input placeholder="Subject name" value={subName} onChange={e => setSubName(e.target.value)} style={inStyle} />

      <IconPicker value={subIcon} onChange={setSubIcon} inStyle={inStyle} pt={pt} />

      <label style={fieldLabel(pt)}>Color</label>
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
  )

  const list = (
    <div>
      <div style={{ marginBottom: 16 }}>
        <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} style={{ ...inStyle, width: 'auto', marginBottom: 0 }}>
          <option value="all">All modules ({subjects.length})</option>
          {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {subjects.length === 0 && (
        <LiquidGlassCard dark={dark} delay={0} style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: pt.sub }}>No subjects yet — add one on the left 🚧</p>
        </LiquidGlassCard>
      )}

      {visibleModules.map(mod => {
        const subs = filteredSubjects(mod.id)
        if (subs.length === 0) return null
        return (
          <div key={mod.id} style={{ marginBottom: 20 }}>
            <h4 style={groupHeading(mod.color)}>
              <ModuleIcon value={mod.icon} size={18} color={mod.color} /> {mod.name}
            </h4>
            <div className="admin-list-grid">
              {subs.map(sub => (
                <LiquidGlassCard key={sub.id} dark={dark} delay={0} style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      background: sub.color || '#34d399', display: 'inline-block'
                    }} />
                    <ModuleIcon value={sub.icon || '📖'} size={18} color={sub.color || '#34d399'} />
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

  return (
    <div>
      <InlineMessage message={msg} />
      <AdminSplitLayout form={form} list={list} />
    </div>
  )
}
