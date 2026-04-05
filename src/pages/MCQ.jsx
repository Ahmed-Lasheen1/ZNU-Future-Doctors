import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../App'

export default function MCQ({ dark }) {
  const { user } = useAuth()
  const [modules, setModules] = useState([])
  const [subjects, setSubjects] = useState([])
  const [questions, setQuestions] = useState([])
  const [answeredIds, setAnsweredIds] = useState(new Set())
  const [activeModule, setActiveModule] = useState(null)
  const [activeSubject, setActiveSubject] = useState('all')
  const [quizMode, setQuizMode] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef(null)

  const c = {
    card: dark ? 'linear-gradient(135deg, #1e293b, #0f2540)' : '#fff',
    border: dark ? '#1e3a5f' : '#e2e8f0',
    text: dark ? '#e2e8f0' : '#1e293b',
    sub: dark ? '#94a3b8' : '#64748b',
    input: dark ? '#0f172a' : '#f8fafc',
  }

  useEffect(() => {
    fetchData()
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (user) fetchAnsweredIds()
  }, [user])

  async function fetchData() {
    setLoading(true)
    const [modRes, subRes, qRes] = await Promise.all([
      supabase.from('modules').select('*').order('created_at'),
      supabase.from('subjects').select('*').order('name'),
      supabase.from('questions').select('*').order('created_at')
    ])
    if (modRes.data) {
      const sorted = [
        ...modRes.data.filter(m => m.status === 'active'),
        ...modRes.data.filter(m => m.status !== 'active')
      ]
      setModules(sorted)
      const active = sorted.find(m => m.status === 'active')
      if (active) setActiveModule(active.id)
    }
    if (subRes.data) setSubjects(subRes.data)
    if (qRes.data) setQuestions(qRes.data)
    setLoading(false)
  }

  async function fetchAnsweredIds() {
    const { data } = await supabase
      .from('answered_questions')
      .select('question_id')
      .eq('user_id', user.id)
    if (data) setAnsweredIds(new Set(data.map(d => d.question_id)))
  }

  const moduleSubjects = subjects.filter(s => s.module_id === activeModule)

  const getFilteredQuestions = (type) => {
    return questions.filter(q => {
      const modMatch = q.module_id === activeModule
      const typeMatch = type === 'mock'
        ? q.exam_type === 'mock' || q.exam_type === 'both'
        : q.exam_type === 'practice' || q.exam_type === 'both'
      const subMatch = activeSubject === 'all' || q.subject_id === activeSubject
      return modMatch && typeMatch && subMatch
    })
  }

  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

  function startQuiz(type, subjectId = null) {
    let qs = type === 'mock'
      ? shuffle(getFilteredQuestions('mock')).slice(0, 36)
      : shuffle(questions.filter(q => q.subject_id === subjectId && (q.exam_type === 'practice' || q.exam_type === 'both'))).slice(0, 50)

    setQuizQuestions(qs)
    setAnswers({})
    setSubmitted(false)
    setQuizMode(type)

    if (type === 'mock') {
      const mins = 36
      setTimeLeft(mins * 60)
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); setSubmitted(true); return 0 }
          return prev - 1
        })
      }, 1000)
    }
  }

  function stopQuiz() {
    clearInterval(timerRef.current)
    setQuizMode(null)
    setQuizQuestions([])
    setAnswers({})
    setSubmitted(false)
    setTimeLeft(0)
  }

  function selectAnswer(qi, opt) {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [qi]: opt }))
  }

  async function submitQuiz() {
    clearInterval(timerRef.current)
    setSubmitted(true)

    if (user) {
      const toRecord = quizQuestions
        .map((q, i) => ({
          question_id: q.id,
          correct: answers[i] === q.correct,
          isNew: !answeredIds.has(q.id)
        }))
        .filter(r => r.isNew)

      if (toRecord.length > 0) {
        await supabase.from('answered_questions').upsert(
          toRecord.map(r => ({
            user_id: user.id,
            question_id: r.question_id,
            correct: r.correct
          }))
        )

        const newPoints = toRecord.filter(r => r.correct).length
        if (newPoints > 0) {
          const { data: prof } = await supabase.from('profiles').select('points').eq('id', user.id).single()
          if (prof) {
            await supabase.from('profiles').update({ points: prof.points + newPoints }).eq('id', user.id)
          }
        }
        fetchAnsweredIds()
      }
    }
  }

  function getScore() {
    return quizQuestions.filter((q, i) => answers[i] === q.correct).length
  }

  const optionLabels = ['a', 'b', 'c', 'd']
  const optionTexts = (q) => [q.option_a, q.option_b, q.option_c, q.option_d]

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  if (quizMode) {
    const score = submitted ? getScore() : 0
    const total = quizQuestions.length
    const percent = total > 0 ? Math.round((score / total) * 100) : 0
    const timePercent = quizMode === 'mock' ? (timeLeft / (36 * 60)) * 100 : 100

    if (total === 0) return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2 style={{ color: '#f472b6' }}>No questions available yet! 🚧</h2>
        <button onClick={stopQuiz} style={backBtnStyle(dark)}>← Back</button>
      </div>
    )

    return (
      <div style={{ padding: '20px', maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={stopQuiz} style={backBtnStyle(dark)}>← Back</button>
          <h2 style={{ color: '#f472b6', flex: 1, fontSize: 16 }}>
            {quizMode === 'mock' ? '📝 Mock Exam' : '🧪 Practice'}
          </h2>
          {quizMode === 'mock' && !submitted && (
            <div style={{
              background: timeLeft < 300 ? '#ef444420' : '#38bdf820',
              border: `1px solid ${timeLeft < 300 ? '#ef444440' : '#38bdf840'}`,
              borderRadius: 10, padding: '6px 14px',
              color: timeLeft < 300 ? '#ef4444' : '#38bdf8',
              fontWeight: 900, fontSize: 16, fontFamily: 'monospace'
            }}>⏱ {formatTime(timeLeft)}</div>
          )}
          <span style={{ color: c.sub, fontSize: 13 }}>{Object.keys(answers).length}/{total}</span>
        </div>

        {quizMode === 'mock' && !submitted && (
          <div style={{ background: dark ? '#0f172a' : '#e2e8f0', borderRadius: 20, height: 6, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{
              height: '100%', borderRadius: 20,
              background: timeLeft < 300 ? '#ef4444' : 'linear-gradient(90deg, #38bdf8, #818cf8)',
              width: `${timePercent}%`, transition: 'width 1s linear'
            }} />
          </div>
        )}

        {submitted && (
          <div style={{
            background: percent >= 60 ? 'linear-gradient(135deg, #064e3b, #059669)' : 'linear-gradient(135deg, #7f1d1d, #dc2626)',
            border: `2px solid ${percent >= 60 ? '#4ade80' : '#f87171'}`,
            borderRadius: 20, padding: 24, textAlign: 'center', marginBottom: 24
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{percent >= 80 ? '🏆' : percent >= 60 ? '✅' : '📚'}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{score}/{total}</div>
            <div style={{ fontSize: 22, color: percent >= 60 ? '#4ade80' : '#f87171', fontWeight: 700 }}>{percent}%</div>
            {user && <div style={{ color: '#f59e0b', fontSize: 13, marginTop: 8 }}>⭐ Points earned for new correct answers!</div>}
            <button onClick={() => startQuiz(quizMode)} style={{
              background: '#38bdf8', color: '#0f172a', border: 'none',
              padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
              fontWeight: 700, fontSize: 14, marginTop: 16, fontFamily: 'inherit'
            }}>🔄 Try Again</button>
          </div>
        )}

        {quizQuestions.map((q, qi) => {
          const isCorrect = answers[qi] === q.correct
          return (
            <div key={qi} style={{
              background: c.card,
              border: submitted
                ? `2px solid ${isCorrect ? '#4ade80' : answers[qi] ? '#f87171' : c.border}`
                : `1px solid ${c.border}`,
              borderRadius: 16, padding: 20, marginBottom: 16
            }}>
              <p style={{ color: c.text, fontWeight: 700, marginBottom: 14, fontSize: 14 }}>
                {qi + 1}. {q.question}
              </p>
              {optionTexts(q).map((opt, ai) => {
                const label = optionLabels[ai]
                let bg = c.input, border = c.border, color = c.sub
                if (answers[qi] === label && !submitted) { bg = '#1e3a5f'; border = '#38bdf8'; color = '#38bdf8' }
                if (submitted && label === q.correct) { bg = '#064e3b'; border = '#4ade80'; color = '#4ade80' }
                if (submitted && answers[qi] === label && label !== q.correct) { bg = '#7f1d1d'; border = '#f87171'; color = '#f87171' }
                return (
                  <div key={ai} onClick={() => selectAnswer(qi, label)} style={{
                    background: bg, border: `1px solid ${border}`,
                    borderRadius: 10, padding: '10px 14px', marginBottom: 8,
                    cursor: submitted ? 'default' : 'pointer',
                    color, fontSize: 13, fontWeight: 600, transition: 'all 0.15s'
                  }}>
                    {label.toUpperCase()}. {opt}
                  </div>
                )
              })}
              {submitted && q.explanation && (
                <div style={{
                  background: dark ? '#1e3a5f' : '#f0f9ff',
                  borderRadius: 10, padding: '10px 14px', marginTop: 10,
                  color: c.sub, fontSize: 12
                }}>
                  💡 {q.explanation}
                </div>
              )}
            </div>
          )
        })}

        {!submitted && (
          <button onClick={submitQuiz}
            disabled={Object.keys(answers).length < total}
            style={{
              background: Object.keys(answers).length < total ? (dark ? '#1e293b' : '#e2e8f0') : '#38bdf8',
              color: Object.keys(answers).length < total ? c.sub : '#0f172a',
              border: 'none', padding: '14px', borderRadius: 12,
              cursor: Object.keys(answers).length < total ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: 16, width: '100%',
              fontFamily: 'inherit', marginBottom: 20
            }}>
            {Object.keys(answers).length < total
              ? `Answer all questions (${Object.keys(answers).length}/${total})`
              : '✅ Submit'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ color: '#f472b6', textAlign: 'center', marginBottom: 20 }}>🧪 MCQ Bank</h1>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
        {modules.map(mod => (
          <button key={mod.id} onClick={() => { setActiveModule(mod.id); setActiveSubject('all') }} style={{
            padding: '8px 16px', borderRadius: 10, whiteSpace: 'nowrap',
            border: `2px solid ${activeModule === mod.id ? mod.color : c.border}`,
            background: activeModule === mod.id ? `${mod.color}20` : 'transparent',
            color: activeModule === mod.id ? mod.color : c.sub,
            cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit'
          }}>
            {mod.icon} {mod.name}
            {mod.status === 'completed' && <span style={{ fontSize: 10, marginLeft: 4, color: c.sub }}>✓</span>}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, paddingBottom: 4 }}>
        <button onClick={() => setActiveSubject('all')} style={{
          ...subBtnStyle, borderColor: activeSubject === 'all' ? '#f472b6' : c.border,
          color: activeSubject === 'all' ? '#f472b6' : c.sub
        }}>All</button>
        {moduleSubjects.map(sub => (
          <button key={sub.id} onClick={() => setActiveSubject(sub.id)} style={{
            ...subBtnStyle, borderColor: activeSubject === sub.id ? '#f472b6' : c.border,
            color: activeSubject === sub.id ? '#f472b6' : c.sub
          }}>{sub.name}</button>
        ))}
      </div>

      {loading && <p style={{ color: c.sub, textAlign: 'center' }}>Loading...</p>}

      {/* Mock Exam */}
      <div style={{
        background: c.card, border: '2px solid #f472b640',
        borderRadius: 20, padding: 24, marginBottom: 16, transition: 'all 0.2s'
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#f472b6'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#f472b640'}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: '#f472b6', marginBottom: 6 }}>📝 Mock Exam</h3>
            <p style={{ color: c.sub, fontSize: 13 }}>
              {Math.min(36, getFilteredQuestions('mock').length)} questions · ⏱ 36 minutes
            </p>
          </div>
          <button onClick={() => startQuiz('mock')} style={startBtnStyle}>Start</button>
        </div>
      </div>

      {/* Practice by Subject */}
      <h3 style={{ color: c.sub, fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
        Practice by Subject
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {moduleSubjects.map(sub => {
          const subQs = questions.filter(q => q.subject_id === sub.id && (q.exam_type === 'practice' || q.exam_type === 'both'))
          return (
            <div key={sub.id} style={{
              background: c.card, border: `1px solid ${c.border}`,
              borderRadius: 16, padding: 16, cursor: 'pointer', transition: 'all 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#f472b6'}
              onMouseLeave={e => e.currentTarget.style.borderColor = c.border}
              onClick={() => startQuiz('practice', sub.id)}>
              <div style={{ color: c.text, fontWeight: 700, marginBottom: 6 }}>{sub.name}</div>
              <div style={{ color: c.sub, fontSize: 12, marginBottom: 10 }}>{subQs.length} questions</div>
              <button style={{ ...startBtnStyle, width: '100%', fontSize: 12, padding: '6px 12px' }}>
                Practice
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const subBtnStyle = { padding: '6px 14px', borderRadius: 20, background: 'transparent', border: '1px solid', whiteSpace: 'nowrap', fontSize: 12, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }
const startBtnStyle = { background: '#f472b6', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }
const backBtnStyle = (dark) => ({ background: dark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', border: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : '#e2e8f0'}`, borderRadius: 10, padding: '8px 16px', color: dark ? '#94a3b8' : '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' })
