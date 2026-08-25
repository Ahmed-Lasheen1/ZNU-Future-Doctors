import { useState } from 'react'
import { supabase } from '../../supabase'
import { getTheme, inputStyle } from '../../theme'
import InlineMessage from '../../components/InlineMessage'
import ModuleSelect from './ModuleSelect'
import { btnStyle, miniBtn, cancelBtnStyle } from './adminStyles'

export default function LessonsTab({ dark, modules, subjects, lessons, fetchLessons }) {
  const c = getTheme(dark)
  const inStyle = inputStyle(c)
  const [msg, setMsg] = useState('')
  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const [editingLessonId, setEditingLessonId] = useState(null)
  const [lessonModuleId, setLessonModuleId] = useState('')
  const [lessonSubjectId, setLessonSubjectId] = useState('')
  const [lessonTitle, setLessonTitle] = useState('')

  function editLesson(l) {
    setEditingLessonId(l.id)
    setLessonModuleId(l.module_id); setLessonSubjectId(l.subject_id)
    setLessonTitle(l.title)
  }
  function resetLessonForm() {
    setEditingLessonId(null); setLessonTitle('')
  }
  async function saveLesson() {
    if (!lessonTitle || !lessonSubjectId || !lessonModuleId) return showMsg('❌ Pick a module, subject, and title first')
    // Summaries are now managed entirely from the Summaries tab (which
    // can link a summary to this lesson) rather than from a URL field
    // stored directly on the lesson.
    const payload = { title: lessonTitle, subject_id: lessonSubjectId, module_id: lessonModuleId }
    if (editingLessonId) {
      const { error } = await supabase.from('lessons').update(payload).eq('id', editingLessonId)
      if (!error) { showMsg('✅ Lesson updated!'); resetLessonForm(); fetchLessons() }
      else showMsg('❌ ' + error.message)
    } else {
      const { error } = await supabase.from('lessons').insert([payload])
      if (!error) { showMsg('✅ Lesson added!'); resetLessonForm(); fetchLessons() }
      else showMsg('❌ ' + error.message)
    }
  }
  async function deleteLesson(id) {
    if (!confirm('Delete this lesson? Questions tagged to it keep their module/subject tags but lose the lesson link. This cannot be undone.')) return
    if (editingLessonId === id) resetLessonForm()
    const { error } = await supabase.from('lessons').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Lesson deleted')
    fetchLessons()
  }

  const filteredSubjects = (moduleId) => subjects.filter(s => s.module_id === moduleId)

  return (
    <div>
      <InlineMessage message={msg} />
      <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}`, marginBottom: 16 }}>
        <h3 style={{ color: '#38bdf8', marginBottom: 8 }}>{editingLessonId ? '✏️ Edit Lesson' : '➕ Add Lesson'}</h3>
        <p style={{ color: c.sub, fontSize: 13, marginBottom: 16 }}>
          A lesson lives under a subject and shows its own tagged question set (tag questions to a lesson from
          the Questions tab). Add a summary for it from the Summaries tab.
        </p>
        <ModuleSelect modules={modules} value={lessonModuleId} onChange={e => { setLessonModuleId(e.target.value); setLessonSubjectId('') }} inStyle={inStyle} />
        {lessonModuleId && (
          <select value={lessonSubjectId} onChange={e => setLessonSubjectId(e.target.value)} style={inStyle}>
            <option value="">Select Subject</option>
            {filteredSubjects(lessonModuleId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <input placeholder="Lesson title" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} style={inStyle} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={saveLesson} style={{ ...btnStyle, flex: 1 }}>{editingLessonId ? 'Save Changes' : 'Add Lesson'}</button>
          {editingLessonId && <button onClick={resetLessonForm} style={cancelBtnStyle(c)}>Cancel</button>}
        </div>
      </div>

      {modules.map(mod => {
        const modSubjects = filteredSubjects(mod.id)
        const modLessons = lessons.filter(l => l.module_id === mod.id)
        if (modLessons.length === 0) return null
        return (
          <div key={mod.id} style={{ marginBottom: 16 }}>
            <h4 style={{ color: mod.color, marginBottom: 8 }}>{mod.icon} {mod.name}</h4>
            {modSubjects.map(sub => {
              const subLessons = modLessons.filter(l => l.subject_id === sub.id)
              if (subLessons.length === 0) return null
              return (
                <div key={sub.id} style={{ marginBottom: 10 }}>
                  <div style={{ color: c.sub, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{sub.name}</div>
                  {subLessons.map(l => (
                    <div key={l.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: c.text, fontWeight: 600 }}>{l.title}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => editLesson(l)} aria-label={`Edit lesson: ${l.title}`} style={{ ...miniBtn, borderColor: '#38bdf8', color: '#38bdf8' }}>✏️</button>
                        <button onClick={() => deleteLesson(l.id)} aria-label={`Delete lesson: ${l.title}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
