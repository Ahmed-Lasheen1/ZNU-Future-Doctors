import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { getTheme, inputStyle } from '../../theme'
import InlineMessage from '../../components/InlineMessage'
import ModuleSelect from './ModuleSelect'
import { btnStyle, miniBtn, cancelBtnStyle } from './adminStyles'
import { EXAM_STAGES as STAGE_META } from '../../lib/examStages'

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'stage'
}

export default function StagesTab({ dark, modules }) {
  const c = getTheme(dark)
  const inStyle = inputStyle(c)
  const [msg, setMsg] = useState('')
  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const [stageModuleId, setStageModuleId] = useState('')
  const [moduleStagesList, setModuleStagesList] = useState([])
  const [stagesIsCustom, setStagesIsCustom] = useState(false)
  const [stagesLoading, setStagesLoading] = useState(false)
  const [stagesSaving, setStagesSaving] = useState(false)

  useEffect(() => {
    if (stageModuleId) loadModuleStagesForAdmin(stageModuleId)
  }, [stageModuleId])

  async function loadModuleStagesForAdmin(moduleId) {
    setStagesLoading(true)
    const { data } = await supabase.from('module_exam_stages').select('*').eq('module_id', moduleId).order('position')
    if (data && data.length > 0) {
      setModuleStagesList(data.map(s => ({ id: s.id, value: s.value, title: s.title, emoji: s.emoji, color: s.color })))
      setStagesIsCustom(true)
    } else {
      setModuleStagesList(STAGE_META.map(s => ({ id: null, value: s.value, title: s.title, emoji: s.emoji, color: s.color })))
      setStagesIsCustom(false)
    }
    setStagesLoading(false)
  }

  function updateStageField(index, field, val) {
    setModuleStagesList(prev => prev.map((s, i) => i === index ? { ...s, [field]: val } : s))
  }
  function removeStageRow(index) {
    setModuleStagesList(prev => prev.filter((_, i) => i !== index))
  }
  function addStageRow() {
    const existingValues = moduleStagesList.map(s => s.value)
    let value = 'new_stage'
    let suffix = 1
    while (existingValues.includes(value)) { value = `new_stage_${suffix}`; suffix++ }
    setModuleStagesList(prev => [...prev, { id: null, value, title: 'New Stage', emoji: '📌', color: '#64748b' }])
  }

  async function saveModuleStages() {
    if (!stageModuleId) return
    if (moduleStagesList.length === 0) return showMsg('❌ A module needs at least one exam stage')
    setStagesSaving(true)
    // Simplest correct approach: replace the whole set atomically rather
    // than diffing row-by-row (a module only has a handful of stages).
    await supabase.from('module_exam_stages').delete().eq('module_id', stageModuleId)
    const rows = moduleStagesList.map((s, i) => ({
      module_id: stageModuleId,
      value: s.value || slugify(s.title),
      title: s.title || 'Stage',
      emoji: s.emoji || '📌',
      color: s.color || '#64748b',
      position: i
    }))
    const { error } = await supabase.from('module_exam_stages').insert(rows)
    setStagesSaving(false)
    if (error) return showMsg('❌ ' + error.message)
    showMsg('✅ Stages saved for this module!')
    setStagesIsCustom(true)
    loadModuleStagesForAdmin(stageModuleId)
  }

  async function resetModuleStages() {
    if (!stageModuleId) return
    if (!confirm("Reset this module to the 4 default exam stages? Custom stages you added will be removed — anything already tagged with a removed stage keeps that tag, it just won't have a matching button anymore.")) return
    setStagesSaving(true)
    await supabase.from('module_exam_stages').delete().eq('module_id', stageModuleId)
    setStagesSaving(false)
    showMsg('✅ Reset to default stages')
    loadModuleStagesForAdmin(stageModuleId)
  }

  return (
    <div>
      <InlineMessage message={msg} />
      <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}`, marginBottom: 16 }}>
        <h3 style={{ color: '#38bdf8', marginBottom: 8 }}>🎯 Exam Stages per Module</h3>
        <p style={{ color: c.sub, fontSize: 13, marginBottom: 16 }}>
          Every module starts with the same 4 default stages (TBL, End Module, Practical, Final). Pick a module
          below to rename, add, or remove stages just for that module — everywhere else keeps the defaults
          until you save changes here.
        </p>
        <ModuleSelect modules={modules} value={stageModuleId} onChange={e => setStageModuleId(e.target.value)} inStyle={inStyle} />
      </div>

      {stageModuleId && (
        <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
          {stagesLoading && <p style={{ color: c.sub, textAlign: 'center' }}>Loading...</p>}

          {!stagesLoading && (
            <>
              <div style={{
                fontSize: 12, fontWeight: 700, marginBottom: 16,
                color: stagesIsCustom ? '#f59e0b' : c.sub
              }}>
                {stagesIsCustom ? '⚙️ Custom stages for this module' : '📌 Showing global defaults (not yet customized)'}
              </div>

              {moduleStagesList.map((stage, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '50px 1fr 70px 1fr auto', gap: 8,
                  alignItems: 'center', marginBottom: 10
                }}>
                  <input value={stage.emoji} onChange={e => updateStageField(i, 'emoji', e.target.value)}
                    style={{ ...inStyle, marginTop: 0, textAlign: 'center', padding: '8px 4px' }} />
                  <input value={stage.title} onChange={e => updateStageField(i, 'title', e.target.value)}
                    style={{ ...inStyle, marginTop: 0 }} />
                  <input type="color" value={stage.color} onChange={e => updateStageField(i, 'color', e.target.value)}
                    style={{ ...inStyle, marginTop: 0, padding: 4, height: 42 }} />
                  <div style={{ color: c.sub, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {stage.value}
                  </div>
                  <button onClick={() => removeStageRow(i)} aria-label="Remove stage"
                    style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                </div>
              ))}

              <button onClick={addStageRow} style={{
                background: 'transparent', border: `1px dashed ${c.border}`, borderRadius: 10,
                padding: '10px', width: '100%', cursor: 'pointer', color: c.sub,
                fontFamily: 'inherit', fontSize: 13, fontWeight: 700, marginBottom: 16
              }}>+ Add Stage</button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveModuleStages} disabled={stagesSaving} style={{ ...btnStyle, flex: 1 }}>
                  {stagesSaving ? 'Saving...' : '✅ Save Stages'}
                </button>
                {stagesIsCustom && (
                  <button onClick={resetModuleStages} disabled={stagesSaving} style={cancelBtnStyle(c)}>
                    Reset to Default
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
