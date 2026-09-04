import { useState } from 'react'
import { supabase } from '../../supabase'
import { getPulseTheme } from '../../premiumTheme'
import InlineMessage from '../../components/InlineMessage'
import IconPicker from '../../components/admin/IconPicker'
import AdminSplitLayout from './AdminSplitLayout'
import LiquidGlassCard from '@/components/ui/liquid-glass-card'
import { ModuleIcon } from '../../lib/medicalIcons'
import { btnStyle, miniBtn, cancelBtnStyle, inStyle as adminInStyle } from './adminStyles'
import type { AdminModule } from './adminTypes'

interface ModulesTabProps {
  dark: boolean
  modules: AdminModule[]
  fetchModules: () => void
}

export default function ModulesTab({ dark, modules, fetchModules }: ModulesTabProps) {
  const pt = getPulseTheme(dark)
  const inStyle = adminInStyle(pt, dark)
  const [msg, setMsg] = useState('')
  function showMsg(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [modName, setModName] = useState('')
  const [modColor, setModColor] = useState('#38bdf8')
  const [modIcon, setModIcon] = useState('📚')
  const [modStatus, setModStatus] = useState<'active' | 'completed'>('active')

  function editModule(mod: AdminModule) {
    setEditingModuleId(mod.id)
    setModName(mod.name); setModColor(mod.color); setModIcon(mod.icon || '📚'); setModStatus(mod.status)
  }
  function resetModuleForm() {
    setEditingModuleId(null); setModName(''); setModColor('#38bdf8'); setModIcon('📚'); setModStatus('active')
  }
  async function saveModule() {
    if (!modName) return
    const dup = modules.some(m => m.name.trim().toLowerCase() === modName.trim().toLowerCase() && m.id !== editingModuleId)
    if (dup) return showMsg('❌ A module with this name already exists')

    if (editingModuleId) {
      const { error } = await supabase.from('modules').update({ name: modName, color: modColor, icon: modIcon, status: modStatus }).eq('id', editingModuleId)
      if (!error) { showMsg('✅ Module updated!'); resetModuleForm(); fetchModules() }
      else showMsg('❌ ' + error.message)
    } else {
      const { error } = await supabase.from('modules').insert([{ name: modName, color: modColor, icon: modIcon, status: modStatus }])
      if (!error) { showMsg('✅ Module added!'); resetModuleForm(); fetchModules() }
      else showMsg('❌ ' + error.message)
    }
  }

  async function toggleModuleStatus(mod: AdminModule) {
    const newStatus = mod.status === 'active' ? 'completed' : 'active'
    await supabase.from('modules').update({ status: newStatus }).eq('id', mod.id)
    fetchModules()
  }

  async function deleteModule(id: string) {
    if (!confirm('Delete this module? This will also permanently delete all its subjects, files, schedules, questions and summaries. This cannot be undone.')) return
    if (editingModuleId === id) resetModuleForm()
    const { error } = await supabase.from('modules').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Module deleted')
    fetchModules()
  }

  const activeModules = modules.filter(m => m.status === 'active')
  const completedModules = modules.filter(m => m.status !== 'active')

  function moduleRow(mod: AdminModule, toggleLabel: string, toggleColor: string) {
    return (
      <LiquidGlassCard key={mod.id} dark={dark} delay={0} style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex' }}>
            <ModuleIcon value={mod.icon} size={24} color={mod.color} />
          </span>
          <div style={{ color: mod.color, fontWeight: 700 }}>{mod.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => editModule(mod)} aria-label={`Edit module: ${mod.name}`} style={miniBtn(pt, pt.cobalt)}>✏️</button>
          <button onClick={() => toggleModuleStatus(mod)} style={miniBtn(pt, toggleColor)}>{toggleLabel}</button>
          <button onClick={() => deleteModule(mod.id)} aria-label={`Delete module: ${mod.name}`} style={miniBtn(pt, pt.danger)}>🗑</button>
        </div>
      </LiquidGlassCard>
    )
  }

  const form = (
    <LiquidGlassCard dark={dark} delay={0} style={{ padding: '20px 22px' }}>
      <h3 style={{ color: pt.cobalt, marginBottom: 16, fontWeight: 800 }}>{editingModuleId ? '✏️ Edit Module' : '➕ Add Module'}</h3>
      <input placeholder="Module name" value={modName} onChange={e => setModName(e.target.value)} style={inStyle} />

      <IconPicker value={modIcon} onChange={setModIcon} inStyle={inStyle} pt={pt} />

      <div className="admin-form-row-2">
        <div>
          <label style={{ color: pt.textMuted, fontSize: 12, display: 'block', marginBottom: 4 }}>Color</label>
          <input type="color" value={modColor} onChange={e => setModColor(e.target.value)} style={{ ...inStyle, padding: 4, height: 48, marginBottom: 0 }} />
        </div>
        <div>
          <label style={{ color: pt.textMuted, fontSize: 12, display: 'block', marginBottom: 4 }}>Status</label>
          <select value={modStatus} onChange={e => setModStatus(e.target.value as 'active' | 'completed')} style={{ ...inStyle, marginBottom: 0 }}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={saveModule} style={{ ...btnStyle(pt, dark), flex: 1 }}>{editingModuleId ? 'Save Changes' : 'Add Module'}</button>
        {editingModuleId && <button onClick={resetModuleForm} style={cancelBtnStyle(pt, dark)}>Cancel</button>}
      </div>
    </LiquidGlassCard>
  )

  const list = (
    <div>
      {activeModules.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#22c55e', marginBottom: 8 }}>🟢 Active</h4>
          <div className="admin-list-grid">
            {activeModules.map(mod => moduleRow(mod, '⏸ Done', pt.amber))}
          </div>
        </div>
      )}

      {completedModules.length > 0 && (
        <div>
          <h4 style={{ color: pt.textMuted, marginBottom: 8 }}>✅ Completed</h4>
          <div className="admin-list-grid">
            {completedModules.map(mod => moduleRow(mod, '▶ Active', '#22c55e'))}
          </div>
        </div>
      )}

      {modules.length === 0 && (
        <LiquidGlassCard dark={dark} delay={0} style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: pt.sub }}>No modules yet — add one on the left 🚧</p>
        </LiquidGlassCard>
      )}
    </div>
  )

  return (
    <div>
      <InlineMessage message={msg} />
      <AdminSplitLayout form={form} list={list} />
    </div>
  )
}
