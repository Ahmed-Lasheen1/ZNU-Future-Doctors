import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { getTheme, inputStyle } from '../../theme'
import InlineMessage from '../../components/InlineMessage'
import ModuleSelect from './ModuleSelect'
import { btnStyle, miniBtn, cancelBtnStyle, LIST_LIMIT } from './adminStyles'
import { EXAM_STAGES as STAGE_META } from '../../lib/examStages'
import { fetchModuleStages } from '../../lib/moduleStages'

const EXAM_STAGES = STAGE_META.map(s => ({ value: s.value, label: `${s.emoji} ${s.title}` }))

export default function QuestionsTab({ dark, modules, subjects, lessons }) {
  const c = getTheme(dark)
  const inStyle = inputStyle(c)
  const [msg, setMsg] = useState('')
  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const [questions, setQuestions] = useState([])
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [qText, setQText] = useState('')
  const [qA, setQA] = useState('')
  const [qB, setQB] = useState('')
  const [qC, setQC] = useState('')
  const [qD, setQD] = useState('')
  const [qCorrect, setQCorrect] = useState('a')
  const [qExplanation, setQExplanation] = useState('')
  const [qModuleId, setQModuleId] = useState('')
  const [qSubjectId, setQSubjectId] = useState('')
  const [qLessonId, setQLessonId] = useState('')
  const [qExamType, setQExamType] = useState('both')
  const [qExamStage, setQExamStage] = useState('tbl')
  const [qStageOptions, setQStageOptions] = useState(EXAM_STAGES)
  const [qSource, setQSource] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)

  useEffect(() => { fetchQuestions() }, [])
  useEffect(() => {
    fetchModuleStages(qModuleId).then(list => setQStageOptions(list.map(s => ({ value: s.value, label: `${s.emoji} ${s.title}` }))))
  }, [qModuleId])

  async function fetchQuestions() {
    // Note: `correct` and `explanation` are intentionally excluded — those
    // two columns are blocked at the database level for everyone, including
    // this admin panel's LIST view. Editing a specific question instead
    // goes through admin_get_question / admin_update_question, which
    // check the caller is actually an admin before revealing them.
    const { data } = await supabase
      .from('questions')
      .select('id, question, module_id, subject_id, lesson_id, exam_type, exam_stage, source, created_at')
      .order('created_at', { ascending: false })
      .limit(LIST_LIMIT)
    if (data) setQuestions(data)
  }

  async function editQuestion(q) {
    const { data, error } = await supabase.rpc('admin_get_question', { p_question_id: q.id })
    if (error || !data || data.length === 0) return showMsg('❌ Could not load this question for editing')
    const full = data[0]
    setEditingQuestionId(full.id)
    setQText(full.question); setQA(full.option_a); setQB(full.option_b); setQC(full.option_c); setQD(full.option_d)
    setQCorrect(full.correct || 'a'); setQExplanation(full.explanation || '')
    setQExamType(full.exam_type); setQExamStage(full.exam_stage)
    setQModuleId(full.module_id); setQSubjectId(full.subject_id || '')
    setQLessonId(full.lesson_id || ''); setQSource(full.source || '')
    setBulkMode(false)
  }
  function resetQuestionForm() {
    setEditingQuestionId(null)
    setQText(''); setQA(''); setQB(''); setQC(''); setQD(''); setQCorrect('a'); setQExplanation(''); setQLessonId('')
  }
  async function saveQuestion() {
    if (!qText || !qA || !qB || !qC || !qD || !qModuleId) return
    if (editingQuestionId) {
      const { error } = await supabase.rpc('admin_update_question', {
        p_id: editingQuestionId,
        p_question: qText, p_option_a: qA, p_option_b: qB, p_option_c: qC, p_option_d: qD,
        p_correct: qCorrect, p_explanation: qExplanation, p_exam_type: qExamType, p_exam_stage: qExamStage,
        p_module_id: qModuleId, p_subject_id: qSubjectId || null, p_lesson_id: qLessonId || null, p_source: qSource || null
      })
      if (!error) { showMsg('✅ Question updated!'); resetQuestionForm(); fetchQuestions() }
      else showMsg('❌ ' + error.message)
    } else {
      const { error } = await supabase.from('questions').insert([{
        question: qText, option_a: qA, option_b: qB, option_c: qC, option_d: qD,
        correct: qCorrect, explanation: qExplanation, exam_type: qExamType,
        exam_stage: qExamStage, module_id: qModuleId, subject_id: qSubjectId || null,
        lesson_id: qLessonId || null, source: qSource || null
      }])
      if (!error) { showMsg('✅ Question added!'); resetQuestionForm(); fetchQuestions() }
      else showMsg('❌ ' + error.message)
    }
  }

  // Parses a block of pasted text into multiple questions at once.
  // Expected format per question, separated by a blank line:
  //   Q: question text
  //   A) option a
  //   B) option b
  //   C) option c
  //   D) option d
  //   Correct: B
  //   Explanation: optional explanation
  function parseBulkQuestions(text) {
    const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
    const questions = []
    const errors = []

    blocks.forEach((block, idx) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
      const qLine = lines.find(l => /^Q[:\-]/i.test(l))
      const aLine = lines.find(l => /^A[)\.\-]/i.test(l))
      const bLine = lines.find(l => /^B[)\.\-]/i.test(l))
      const cLine = lines.find(l => /^C[)\.\-]/i.test(l))
      const dLine = lines.find(l => /^D[)\.\-]/i.test(l))
      const correctLine = lines.find(l => /^Correct[:\-]/i.test(l))
      const explLine = lines.find(l => /^Explanation[:\-]/i.test(l))

      if (!qLine || !aLine || !bLine || !cLine || !dLine || !correctLine) {
        errors.push(`Question ${idx + 1}: missing Q/A/B/C/D/Correct line`)
        return
      }
      const correctLetter = correctLine.replace(/^Correct[:\-]/i, '').trim().toLowerCase().charAt(0)
      if (!['a', 'b', 'c', 'd'].includes(correctLetter)) {
        errors.push(`Question ${idx + 1}: "Correct" must be A, B, C or D`)
        return
      }
      questions.push({
        question: qLine.replace(/^Q[:\-]/i, '').trim(),
        option_a: aLine.replace(/^A[)\.\-]/i, '').trim(),
        option_b: bLine.replace(/^B[)\.\-]/i, '').trim(),
        option_c: cLine.replace(/^C[)\.\-]/i, '').trim(),
        option_d: dLine.replace(/^D[)\.\-]/i, '').trim(),
        correct: correctLetter,
        explanation: explLine ? explLine.replace(/^Explanation[:\-]/i, '').trim() : '',
      })
    })

    return { questions, errors }
  }

  async function bulkAddQuestions() {
    if (!qModuleId) return showMsg('❌ Please select a module first')
    if (!bulkText.trim()) return showMsg('❌ Paste some questions first')

    const { questions: parsed, errors } = parseBulkQuestions(bulkText)
    if (errors.length > 0) {
      showMsg(`❌ ${errors.length} question(s) have a formatting problem — ${errors[0]}`)
      return
    }
    if (parsed.length === 0) return showMsg('❌ No questions found in the text')

    setBulkSaving(true)
    const rows = parsed.map(q => ({
      ...q,
      exam_type: qExamType,
      exam_stage: qExamStage,
      module_id: qModuleId,
      subject_id: qSubjectId || null,
      lesson_id: qLessonId || null,
      source: qSource || null
    }))
    const { error } = await supabase.from('questions').insert(rows)
    setBulkSaving(false)

    if (error) { showMsg('❌ ' + error.message); return }
    showMsg(`✅ ${rows.length} questions added!`)
    setBulkText('')
    fetchQuestions()
  }

  async function deleteQuestion(id) {
    if (!confirm('Delete this question? This cannot be undone.')) return
    if (editingQuestionId === id) resetQuestionForm()
    const { error } = await supabase.from('questions').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Question deleted')
    fetchQuestions()
  }

  const filteredSubjects = (moduleId) => subjects.filter(s => s.module_id === moduleId)
  const filteredLessons = (subjectId) => lessons.filter(l => l.subject_id === subjectId)

  return (
    <div>
      <InlineMessage message={msg} />
      <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: '#38bdf8' }}>
            {editingQuestionId ? '✏️ Edit Question' : bulkMode ? '📋 Bulk Add Questions' : '➕ Add MCQ Question'}
          </h3>
          {!editingQuestionId && (
            <button onClick={() => setBulkMode(!bulkMode)} style={{
              background: 'transparent', border: `1px solid ${c.border}`,
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
              color: c.sub, fontFamily: 'inherit', fontSize: 12, fontWeight: 700
            }}>{bulkMode ? '✏️ Single Add' : '📋 Bulk Add'}</button>
          )}
        </div>

        <ModuleSelect modules={modules} value={qModuleId} onChange={e => { setQModuleId(e.target.value); setQSubjectId(''); setQLessonId('') }} inStyle={inStyle} />
        {qModuleId && (
          <select value={qSubjectId} onChange={e => { setQSubjectId(e.target.value); setQLessonId('') }} style={inStyle}>
            <option value="">All Subjects</option>
            {filteredSubjects(qModuleId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        {qSubjectId && filteredLessons(qSubjectId).length > 0 && (
          <>
            <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Lesson (optional)</label>
            <select value={qLessonId} onChange={e => setQLessonId(e.target.value)} style={inStyle}>
              <option value="">No specific lesson</option>
              {filteredLessons(qSubjectId).map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </>
        )}
        <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Use In</label>
        <select value={qExamType} onChange={e => setQExamType(e.target.value)} style={inStyle}>
          <option value="both">Practice + Mock Exam</option>
          <option value="practice">Practice Only</option>
          <option value="mock">Mock Exam Only</option>
        </select>
        <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Exam Stage</label>
        <select value={qExamStage} onChange={e => setQExamStage(e.target.value)} style={inStyle}>
          {qStageOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Source (optional)</label>
        <select value={qSource} onChange={e => setQSource(e.target.value)} style={inStyle}>
          <option value="">No tag</option>
          <option value="ai">🤖 AI</option>
          <option value="courses">📚 Courses</option>
          <option value="university">🎓 University Doctors</option>
        </select>

        {bulkMode && !editingQuestionId ? (
          <>
            <p style={{ color: c.sub, fontSize: 12, marginBottom: 8, lineHeight: 1.6 }}>
              Paste as many questions as you want below, one after another,
              separated by an empty line. Every question in this box will
              be added to the module/subject/type selected above. Format:
            </p>
            <pre style={{
              background: c.input, border: `1px solid ${c.border}`, borderRadius: 10,
              padding: 12, fontSize: 11, color: c.sub, marginBottom: 12,
              whiteSpace: 'pre-wrap', lineHeight: 1.6
            }}>{`Q: What is the powerhouse of the cell?
A) Nucleus
B) Mitochondria
C) Ribosome
D) Golgi apparatus
Correct: B
Explanation: Mitochondria produce ATP.

Q: Second question here...
A) ...
B) ...
C) ...
D) ...
Correct: A`}</pre>
            <textarea
              placeholder="Paste your questions here..."
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              style={{ ...inStyle, minHeight: 240, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
            <button onClick={bulkAddQuestions} disabled={bulkSaving} style={btnStyle}>
              {bulkSaving ? 'Adding...' : 'Parse & Add All'}
            </button>
          </>
        ) : (
          <>
            <textarea placeholder="Question" value={qText} onChange={e => setQText(e.target.value)} style={{ ...inStyle, minHeight: 80, resize: 'vertical' }} />
            {['A', 'B', 'C', 'D'].map((opt, i) => (
              <input key={opt} placeholder={`Option ${opt}`}
                value={[qA, qB, qC, qD][i]}
                onChange={e => [setQA, setQB, setQC, setQD][i](e.target.value)}
                style={inStyle} />
            ))}
            <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Correct Answer</label>
            <select value={qCorrect} onChange={e => setQCorrect(e.target.value)} style={inStyle}>
              <option value="a">A</option>
              <option value="b">B</option>
              <option value="c">C</option>
              <option value="d">D</option>
            </select>
            <textarea placeholder="Explanation (optional)" value={qExplanation} onChange={e => setQExplanation(e.target.value)} style={{ ...inStyle, minHeight: 60, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveQuestion} style={{ ...btnStyle, flex: 1 }}>{editingQuestionId ? 'Save Changes' : 'Add Question'}</button>
              {editingQuestionId && <button onClick={resetQuestionForm} style={cancelBtnStyle(c)}>Cancel</button>}
            </div>
          </>
        )}
      </div>

      {questions.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {modules.map(mod => {
            const modQuestions = questions.filter(q => q.module_id === mod.id)
            if (modQuestions.length === 0) return null
            return (
              <div key={mod.id} style={{ marginBottom: 16 }}>
                <h4 style={{ color: mod.color, marginBottom: 8 }}>{mod.icon} {mod.name} <span style={{ color: c.sub, fontSize: 12, fontWeight: 400 }}>({modQuestions.length})</span></h4>
                {modQuestions.map(q => (
                  <div key={q.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: c.text, fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question}</span>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => editQuestion(q)} aria-label="Edit question" style={{ ...miniBtn, borderColor: '#38bdf8', color: '#38bdf8' }}>✏️</button>
                      <button onClick={() => deleteQuestion(q.id)} aria-label="Delete question" style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
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
