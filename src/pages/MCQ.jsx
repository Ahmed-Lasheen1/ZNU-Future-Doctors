import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function MCQ() {
  const [modules, setModules] = useState([])
  const [subjects, setSubjects] = useState([])
  const [questions, setQuestions] = useState([])
  const [activeModule, setActiveModule] = useState(null)
  const [activeSubject, setActiveSubject] = useState('all')
  const [quizMode, setQuizMode] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    fetchData()
  }, [])

  const moduleSubjects = subjects.filter(s => s.module_id === activeModule)

  const filteredQuestions = questions.filter(q => {
    const modMatch = q.module_id === activeModule
    const subMatch = activeSubject === 'all' || q.subject_id === activeSubject
    return modMatch && subMatch
  })

  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

  function startQuiz(type, subjectId = null) {
    let qs = filteredQuestions
    if (subjectId) qs = questions.filter(q => q.subject_id === subjectId)
    qs = shuffle(qs).slice(0, type === 'mock' ? 36 : 50)
    setQuizQuestions(qs)
    setAnswers({})
    setSubmitted(false)
    setQuizMode(type)
  }

  function selectAnswer(qi, opt) {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [qi]: opt }))
  }

  function getScore() {
    return quizQuestions.filter((q, i) => answers[i] === q.correct).length
  }

  const optionLabels = ['a', 'b', 'c', 'd']
  const optionTexts = (q) => [q.option_a, q.option_b, q.option_c, q.option_d]

  if (quizMode) {
    const score = submitted ? getScore() : 0
    const total = quizQuestions.length
    const percent = total > 0 ? Math.round((score / total) * 100) : 0

    if (total === 0) return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2 style={{ color: '#f472b6' }}>No questions available yet! 🚧</h2>
        <button onClick={() => setQuizMode(null)} style={backBtn}>← Back</button>
      </div>
    )

    return (
      <div style={{ padding: '20px', maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setQuizMode(null)} style={backBtn}>← Back</button>
          <h2 style={{ color: '#f472b6', flex: 1 }}>
            {quizMode === 'mock' ? '📝 Mock Exam' : '🧪 Practice'}
          </h2>
          <span style={{ color: '#64748b', fontSize: 13 }}>{Object.keys(answers).length}/{total}</span>
        </div>

        {submitted && (
          <div style={{
            background: percent >= 60 ? 'linear-gradient(135deg, #064e3b, #059669)' : 'linear-gradient(135deg, #7f1d1d, #dc2626)',
            border: `2px solid ${percent >= 60 ? '#4ade80' : '#f87171'}`,
            borderRadius: 20, padding: 24, textAlign: 'center', marginBottom: 24
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{percent >= 80 ? '🏆' : percent >= 60 ? '✅' : '📚'}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{score}/{total}</div>
            <div style={{ fontSize: 22, color: percent >= 60 ? '#4ade80' : '#f87171', fontWeight: 700 }}>{percent}%</div>
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
              background: 'linear-gradient(135deg, #1e293b, #0f2540)',
              border: submitted ? `2px solid ${isCorrect ? '#4ade80' : answers[qi] ? '#f87171' : '#1e3a5f'}` : '1px solid #1e3a5f',
              borderRadius: 16, padding: 20, marginBottom: 16
            }}>
              <p style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 14, fontSize: 14 }}>
                {qi + 1}. {q.question}
              </p>
              {optionTexts(q).map((opt, ai) => {
                const label = optionLabels[ai]
                let bg = '#0f172a', border = '#1e3a5f', color = '#94a3b8'
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
                <div style={{ background: '#1e3a5f', borderRadius: 10, padding: '10px 14px', marginTop: 10, color: '#94a3b8', fontSize: 12 }}>
                  💡 {q.explanation}
                </div>
              )}
            </div>
          )
        })}

        {!submitted && (
          <button onClick={() => setSubmitted(true)}
            disabled={Object.keys(answers).length < total}
            style={{
              background: Object.keys(answers).length < total ? '#1e293b' : '#38bdf8',
              color: Object.keys(answers).length < total ? '#475569' : '#0f172a',
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
            border: `2px solid ${activeModule === mod.id ? mod.color : '#1e3a5f'}`,
            background: activeModule === mod.id ? `${mod.color}20` : 'transparent',
            color: activeModule === mod.id ? mod.color : '#64748b',
            cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit'
          }}>
            {mod.icon} {mod.name}
            {mod.status === 'completed' && <span style={{ fontSize: 10, marginLeft: 4, color: '#64748b' }}>✓</span>}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, paddingBottom: 4 }}>
        <button onClick={() => setActiveSubject('all')} style={{ ...subBtn, borderColor: activeSubject === 'all' ? '#f472b6' : '#1e3a5f', color: activeSubject === 'all' ? '#f472b6' : '#64748b' }}>All</button>
        {moduleSubjects.map(sub => (
          <button key={sub.id} onClick={() => setActiveSubject(sub.id)} style={{ ...subBtn, borderColor: activeSubject === sub.id ? '#f472b6' : '#1e3a5f', color: activeSubject === sub.id ? '#f472b6' : '#64748b' }}>{sub.name}</button>
        ))}
      </div>

      {loading && <p style={{ color: '#94a3b8', textAlign: 'center' }}>Loading...</p>}

      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f2540)',
        border: '2px solid #f472b640', borderRadius: 20, padding: 24, marginBottom: 16, transition: 'all 0.2s'
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#f472b6'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#f472b640'}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: '#f472b6', marginBottom: 6 }}>📝 Mock Exam</h3>
            <p style={{ color: '#64748b', fontSize: 13 }}>{Math.min(36, filteredQuestions.length)} questions · Full practice</p>
          </div>
          <button onClick={() => startQuiz('mock')} style={startBtn}>Start</button>
        </div>
      </div>

      <h3 style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>
        Practice by Subject
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {moduleSubjects.map(sub => {
          const subQs = questions.filter(q => q.subject_id === sub.id)
          return (
            <div key={sub.id} style={{
              background: 'linear-gradient(135deg, #1e293b, #0f2540)',
              border: '1px solid #1e3a5f', borderRadius: 16, padding: 16,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#f472b6'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1e3a5f'}
              onClick={() => startQuiz('practice', sub.id)}>
              <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 6 }}>{sub.name}</div>
              <div style={{ color: '#64748b', fontSize: 12, marginBottom: 10 }}>{subQs.length} questions</div>
              <button style={{ ...startBtn, width: '100%', fontSize: 12, padding: '6px 12px' }}>Practice</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const subBtn = { padding: '6px 14px', borderRadius: 20, background: 'transparent', border: '1px solid', whiteSpace: 'nowrap', fontSize: 12, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }
const startBtn = { background: '#f472b6', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }
const backBtn = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 16px', color: '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }
