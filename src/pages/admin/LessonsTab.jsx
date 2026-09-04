import { useState } from 'react'
import { supabase } from '../../supabase'
import { getPulseTheme } from '../../premiumTheme'
import InlineMessage from '../../components/InlineMessage'
import ModuleSelect from './ModuleSelect'
import IconPicker from '../../components/admin/IconPicker'
import LiquidGlassCard from '@/components/ui/liquid-glass-card'
import { ModuleIcon } from '../../lib/medicalIcons'
import { btnStyle, miniBtn, cancelBtnStyle, inStyle as adminInStyle } from './adminStyles'

export default function LessonsTab({ dark, modules, subjects, lessons, fetchLessons }) {
  const pt = getPulseTheme(dark)
  const inStyle = adminInStyle(pt, dark)
  const [msg, setMsg] = useState('')
  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const [editingLessonId, setEditingLessonId] = useState(null)
  const [lessonModuleId, setLessonModuleId] = useState('')
  const [lessonSubjectId, setLessonSubjectId] = useState('')
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonIcon, setLessonIcon] = useState('')

  function editLesson(l) {
    setEditingLessonId(l.id)
    setLessonModuleId(l.module_id); setLessonSubjectId(l.subject_id)
    setLessonTitle(l.title); setLessonIcon(l.icon || '')
  }
  function resetLessonForm() {
    setEditingLessonId(null); setLessonTitle(''); setLessonIcon('')
  }
  async function saveLesson() {
    if (!lessonTitle || !lessonSubjectId || !lessonModuleId) return showMsg('❌ Pick a module, subject, and title first')
    const payload = { title: lessonTitle, subject_id: lessonSubjectId, module_id: lessonModuleId, icon: lessonIcon || null }
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
      <div style={{ marginBottom: 16 }}>
        <LiquidGlassCard dark={dark} delay={0} style={{ padding: '20px 22px' }}>
          <h3 style={{ color: pt.cobalt, marginBottom: 8, fontWeight: 800 }}>{editingLessonId ? '✏️ Edit Lesson' : '➕ Add Lesson'}</h3>
          <p style={{ color: pt.textMuted, fontSize: 13, marginBottom: 16 }}>
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
          <IconPicker value={lessonIcon} onChange={setLessonIcon} inStyle={inStyle} pt={pt} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveLesson} style={{ ...btnStyle(pt, dark), flex: 1 }}>{editingLessonId ? 'Save Changes' : 'Add Lesson'}</button>
            {editingLessonId && <button onClick={resetLessonForm} style={cancelBtnStyle(pt, dark)}>Cancel</button>}
          </div>
        </LiquidGlassCard>
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
                  <div style={{ color: pt.textMuted, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{sub.name}</div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {subLessons.map(l => (
                      <LiquidGlassCard key={l.id} dark={dark} delay={0} style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ display: 'inline-flex' }}>
                            <ModuleIcon value={l.icon || '📘'} size={18} color="#34d399" />
                          </span>
                          <span style={{ color: pt.text, fontWeight: 600 }}>{l.title}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => editLesson(l)} aria-label={`Edit lesson: ${l.title}`} style={miniBtn(pt, pt.cobalt)}>✏️</button>
                          <button onClick={() => deleteLesson(l.id)} aria-label={`Delete lesson: ${l.title}`} style={miniBtn(pt, pt.danger)}>🗑</button>
                        </div>
                      </LiquidGlassCard>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
