import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { getTheme, inputStyle } from '../../theme'
import InlineMessage from '../../components/InlineMessage'
import ModuleSelect from './ModuleSelect'
import { btnStyle, miniBtn, cancelBtnStyle, LIST_LIMIT } from './adminStyles'
import { EXAM_STAGES as STAGE_META } from '../../lib/examStages'
import { fetchModuleStages } from '../../lib/moduleStages'

const EXAM_STAGES = STAGE_META.map(s => ({ value: s.value, label: `${s.emoji} ${s.title}` }))

export default function SummariesTab({ dark, modules, subjects, lessons }) {
  const c = getTheme(dark)
  const inStyle = inputStyle(c)
  const [msg, setMsg] = useState('')
  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const [summaries, setSummaries] = useState([])
  const [editingSummaryId, setEditingSummaryId] = useState(null)
  const [sumTitle, setSumTitle] = useState('')
  const [sumUrl, setSumUrl] = useState('')
  const [sumModuleId, setSumModuleId] = useState('')
  const [sumSubjectId, setSumSubjectId] = useState('')
  const [sumLessonId, setSumLessonId] = useState('')
  // Empty string = "no specific stage" — optional, same as subject/lesson.
  const [sumExamStage, setSumExamStage] = useState('')
  const [sumStageOptions, setSumStageOptions] = useState(EXAM_STAGES)

  useEffect(() => { fetchSummaries() }, [])
  useEffect(() => {
    fetchModuleStages(sumModuleId).then(list => setSumStageOptions(list.map(s => ({ value: s.value, label: `${s.emoji} ${s.title}` }))))
  }, [sumModuleId])

  async function fetchSummaries() {
    const { data } = await supabase.from('summaries').select('*').order('created_at', { ascending: false }).limit(LIST_LIMIT)
    if (data) setSummaries(data)
  }

  function editSummary(s) {
    setEditingSummaryId(s.id)
    setSumTitle(s.title); setSumUrl(s.url); setSumModuleId(s.module_id)
    setSumSubjectId(s.subject_id || ''); setSumLessonId(s.lesson_id || '')
    setSumExamStage(s.exam_stage || '')
  }
  function resetSummaryForm() {
    setEditingSummaryId(null); setSumTitle(''); setSumUrl('')
    setSumSubjectId(''); setSumLessonId(''); setSumExamStage('')
  }
  async function saveSummary() {
    // Only title, URL and module are required — subject, lesson and
    // exam stage are all optional, so a summary can be scoped to just
    // a module and nothing more.
    if (!sumTitle || !sumUrl || !sumModuleId) return
    const payload = {
      title: sumTitle, url: sumUrl, module_id: sumModuleId,
      subject_id: sumSubjectId || null,
      lesson_id: sumLessonId || null,
      exam_stage: sumExamStage || null
    }
    if (editingSummaryId) {
      const { error } = await supabase.from('summaries').update(payload).eq('id', editingSummaryId)
      if (!error) { showMsg('✅ Summary updated!'); resetSummaryForm(); fetchSummaries() }
      else showMsg('❌ ' + error.message)
    } else {
      const { error } = await supabase.from('summaries').insert([payload])
      if (!error) { showMsg('✅ Summary added!'); resetSummaryForm(); fetchSummaries() }
      else showMsg('❌ ' + error.message)
    }
  }
  async function deleteSummary(id) {
    if (!confirm('Delete this summary? This cannot be undone.')) return
    if (editingSummaryId === id) resetSummaryForm()
    const { error } = await supabase.from('summaries').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Summary deleted')
    fetchSummaries()
  }

  const filteredSubjects = (moduleId) => subjects.filter(s => s.module_id === moduleId)
  const filteredLessons = (subjectId) => lessons.filter(l => l.subject_id === subjectId)

  return (
    <div>
      <InlineMessage message={msg} />
      <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
        <h3 style={{ color: '#38bdf8', marginBottom: 16 }}>{editingSummaryId ? '✏️ Edit Summary' : '➕ Add Summary'}</h3>
        <ModuleSelect modules={modules} value={sumModuleId} onChange={e => { setSumModuleId(e.target.value); setSumSubjectId(''); setSumLessonId('') }} inStyle={inStyle} />

        <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Subject (optional)</label>
        <select value={sumSubjectId} onChange={e => { setSumSubjectId(e.target.value); setSumLessonId('') }} style={inStyle} disabled={!sumModuleId}>
          <option value="">All Subjects</option>
          {filteredSubjects(sumModuleId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        {sumSubjectId && filteredLessons(sumSubjectId).length > 0 && (
          <>
            <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Lesson (optional)</label>
            <select value={sumLessonId} onChange={e => setSumLessonId(e.target.value)} style={inStyle}>
              <option value="">No specific lesson</option>
              {filteredLessons(sumSubjectId).map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </>
        )}

        <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Exam Stage (optional)</label>
        <select value={sumExamStage} onChange={e => setSumExamStage(e.target.value)} style={inStyle}>
          <option value="">No specific stage</option>
          {sumStageOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <input placeholder="Title (e.g. End Module Exam)" value={sumTitle} onChange={e => setSumTitle(e.target.value)} style={inStyle} />
        <input placeholder="Summary URL" value={sumUrl} onChange={e => setSumUrl(e.target.value)} style={inStyle} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={saveSummary} style={{ ...btnStyle, flex: 1 }}>{editingSummaryId ? 'Save Changes' : 'Add Summary'}</button>
          {editingSummaryId && <button onClick={resetSummaryForm} style={cancelBtnStyle(c)}>Cancel</button>}
        </div>
      </div>

      {summaries.length > 0 && (
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
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => editSummary(s)} aria-label={`Edit summary: ${s.title}`} style={{ ...miniBtn, borderColor: '#38bdf8', color: '#38bdf8' }}>✏️</button>
                      <button onClick={() => deleteSummary(s.id)} aria-label={`Delete summary: ${s.title}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
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
