import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { getTheme, inputStyle } from '../../theme'
import InlineMessage from '../../components/InlineMessage'
import ModuleSelect from './ModuleSelect'
import { btnStyle, miniBtn, cancelBtnStyle, LIST_LIMIT } from './adminStyles'

export default function SchedulesTab({ dark, modules }) {
  const c = getTheme(dark)
  const inStyle = inputStyle(c)
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
      <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
        <h3 style={{ color: '#38bdf8', marginBottom: 16 }}>{editingScheduleId ? '✏️ Edit Schedule' : '➕ Add Schedule'}</h3>
        <input placeholder="Title (e.g. Week 1)" value={schTitle} onChange={e => setSchTitle(e.target.value)} style={inStyle} />
        <input placeholder="Image URL (Google Drive)" value={schUrl} onChange={e => setSchUrl(e.target.value)} style={inStyle} />
        <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Type</label>
        <select value={schType} onChange={e => setSchType(e.target.value)} style={inStyle}>
          <option value="study">📅 Study Schedule</option>
          <option value="exam">📝 Exam Schedule</option>
        </select>
        {schType === 'exam' && (
          <>
            <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Exam Date (for reminder notifications)</label>
            <input type="date" value={schDate} onChange={e => setSchDate(e.target.value)} style={inStyle} />
          </>
        )}
        <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Module</label>
        <ModuleSelect modules={modules} value={schModuleId} onChange={e => setSchModuleId(e.target.value)} inStyle={inStyle} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={saveSchedule} style={{ ...btnStyle, flex: 1 }}>{editingScheduleId ? 'Save Changes' : 'Add Schedule'}</button>
          {editingScheduleId && <button onClick={resetScheduleForm} style={cancelBtnStyle(c)}>Cancel</button>}
        </div>
      </div>

      {schedules.length > 0 && (
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
                      <span style={{ color: c.sub, fontSize: 12, marginLeft: 8 }}>· {s.type}{s.date ? ` · 📅 ${s.date}` : ''}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => editSchedule(s)} aria-label={`Edit schedule: ${s.title}`} style={{ ...miniBtn, borderColor: '#38bdf8', color: '#38bdf8' }}>✏️</button>
                      <button onClick={() => deleteSchedule(s.id)} aria-label={`Delete schedule: ${s.title}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
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
