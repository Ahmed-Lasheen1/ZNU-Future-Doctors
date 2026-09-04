import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { getPulseTheme } from '../../premiumTheme'
import InlineMessage from '../../components/InlineMessage'
import ModuleSelect from './ModuleSelect'
import LiquidGlassCard from '@/components/ui/liquid-glass-card'
import { btnStyle, miniBtn, cancelBtnStyle, inStyle as adminInStyle, LIST_LIMIT } from './adminStyles'

export default function SchedulesTab({ dark, modules }) {
  const pt = getPulseTheme(dark)
  const inStyle = adminInStyle(pt, dark)
  const [msg, setMsg] = useState('')
  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const [schedules, setSchedules] = useState([])
  const [editingScheduleId, setEditingScheduleId] = useState(null)
  const [schTitle, setSchTitle] = useState('')
  const [schUrl, setSchUrl] = useState('')
  const [schType, setSchType] = useState('study')
  const [schModuleId, setSchModuleId] = useState('')
  const [schDate, setSchDate] = useState('')

  useEffect(() => { fetchSchedules() }, [])

  async function fetchSchedules() {
    const { data } = await supabase.from('schedules').select('*').order('created_at', { ascending: false }).limit(LIST_LIMIT)
    if (data) setSchedules(data)
  }

  function editSchedule(s) {
    setEditingScheduleId(s.id)
    setSchTitle(s.title); setSchUrl(s.url); setSchType(s.type); setSchModuleId(s.module_id); setSchDate(s.date || '')
  }
  function resetScheduleForm() {
    setEditingScheduleId(null); setSchTitle(''); setSchUrl(''); setSchDate('')
  }
  async function saveSchedule() {
    if (!schTitle || !schUrl || !schModuleId) return
    const payload = {
      title: schTitle, url: schUrl, type: schType, module_id: schModuleId,
      date: schType === 'exam' && schDate ? schDate : null
    }
    if (editingScheduleId) {
      const { error } = await supabase.from('schedules').update(payload).eq('id', editingScheduleId)
      if (!error) { showMsg('✅ Schedule updated!'); resetScheduleForm(); fetchSchedules() }
      else showMsg('❌ ' + error.message)
    } else {
      const { error } = await supabase.from('schedules').insert([payload])
      if (!error) { showMsg('✅ Schedule added!'); resetScheduleForm(); fetchSchedules() }
      else showMsg('❌ ' + error.message)
    }
  }
  async function deleteSchedule(id) {
    if (!confirm('Delete this schedule? This cannot be undone.')) return
    if (editingScheduleId === id) resetScheduleForm()
    const { error } = await supabase.from('schedules').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Schedule deleted')
    fetchSchedules()
  }

  return (
    <div>
      <InlineMessage message={msg} />
      <div style={{ marginBottom: 16 }}>
        <LiquidGlassCard dark={dark} delay={0} style={{ padding: '20px 22px' }}>
          <h3 style={{ color: pt.cobalt, marginBottom: 16, fontWeight: 800 }}>{editingScheduleId ? '✏️ Edit Schedule' : '➕ Add Schedule'}</h3>
          <input placeholder="Title (e.g. Week 1)" value={schTitle} onChange={e => setSchTitle(e.target.value)} style={inStyle} />
          <input placeholder="Image URL (Google Drive)" value={schUrl} onChange={e => setSchUrl(e.target.value)} style={inStyle} />
          <label style={{ color: pt.textMuted, fontSize: 12, display: 'block', marginBottom: 4 }}>Type</label>
          <select value={schType} onChange={e => setSchType(e.target.value)} style={inStyle}>
            <option value="study">📅 Study Schedule</option>
            <option value="exam">📝 Exam Schedule</option>
          </select>
          {schType === 'exam' && (
            <>
              <label style={{ color: pt.textMuted, fontSize: 12, display: 'block', marginBottom: 4 }}>Exam Date (for reminder notifications)</label>
              <input type="date" value={schDate} onChange={e => setSchDate(e.target.value)} style={inStyle} />
            </>
          )}
          <label style={{ color: pt.textMuted, fontSize: 12, display: 'block', marginBottom: 4 }}>Module</label>
          <ModuleSelect modules={modules} value={schModuleId} onChange={e => setSchModuleId(e.target.value)} inStyle={inStyle} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveSchedule} style={{ ...btnStyle(pt, dark), flex: 1 }}>{editingScheduleId ? 'Save Changes' : 'Add Schedule'}</button>
            {editingScheduleId && <button onClick={resetScheduleForm} style={cancelBtnStyle(pt, dark)}>Cancel</button>}
          </div>
        </LiquidGlassCard>
      </div>

      {schedules.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {modules.map(mod => {
            const modSchedules = schedules.filter(s => s.module_id === mod.id)
            if (modSchedules.length === 0) return null
            return (
              <div key={mod.id} style={{ marginBottom: 16 }}>
                <h4 style={{ color: mod.color, marginBottom: 8 }}>{mod.icon} {mod.name}</h4>
                <div style={{ display: 'grid', gap: 10 }}>
                  {modSchedules.map(s => (
                    <LiquidGlassCard key={s.id} dark={dark} delay={0} style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <span style={{ color: pt.text, fontWeight: 600 }}>{s.title}</span>
                        <span style={{ color: pt.textMuted, fontSize: 12, marginLeft: 8 }}>· {s.type}{s.date ? ` · 📅 ${s.date}` : ''}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => editSchedule(s)} aria-label={`Edit schedule: ${s.title}`} style={miniBtn(pt, pt.cobalt)}>✏️</button>
                        <button onClick={() => deleteSchedule(s.id)} aria-label={`Delete schedule: ${s.title}`} style={miniBtn(pt, pt.danger)}>🗑</button>
                      </div>
                    </LiquidGlassCard>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
