import { useState } from 'react'

const modules = [
  {
    id: 'git',
    label: 'GIT Module',
    color: '#38bdf8',
    questions: [
      {
        q: 'Where does most carbohydrate digestion occur?',
        options: ['Mouth', 'Stomach', 'Small intestine', 'Large intestine'],
        correct: 2,
        explain: 'Most carbohydrate digestion occurs in the small intestine by pancreatic amylase.'
      },
      {
        q: 'Which enzyme is responsible for protein digestion in the stomach?',
        options: ['Amylase', 'Pepsin', 'Lipase', 'Trypsin'],
        correct: 1,
        explain: 'Pepsin is the main protease in the stomach, activated from pepsinogen by HCl.'
      },
      {
        q: 'What is the net ATP yield of aerobic glycolysis?',
        options: ['2 ATP', '8 ATP', '36 ATP', '38 ATP'],
        correct: 1,
        explain: 'Aerobic glycolysis yields 2 ATP net + 2 NADH → 6 ATP = 8 ATP total.'
      },
      {
        q: 'Which cells produce HCl in the stomach?',
        options: ['Chief cells', 'Goblet cells', 'Parietal cells', 'G cells'],
        correct: 2,
        explain: 'Parietal (oxyntic) cells produce both HCl and intrinsic factor.'
      },
      {
        q: 'The rate-limiting enzyme of glycolysis is:',
        options: ['Hexokinase', 'PFK-1', 'Pyruvate kinase', 'Aldolase'],
        correct: 1,
        explain: 'PFK-1 (Phosphofructokinase-1) is the most important regulatory enzyme in glycolysis.'
      },
    ]
  }
]

function MCQ({ lang }) {
  const [selectedModule, setSelectedModule] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  function startExam(mod) {
    setSelectedModule(mod)
    setAnswers({})
    setSubmitted(false)
  }

  function selectAnswer(qi, ai) {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [qi]: ai }))
  }

  function getScore() {
    return selectedModule.questions.filter((q, i) => answers[i] === q.correct).length
  }

  if (!selectedModule) return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 30 }}>
        🧪 MCQ Practice
      </h1>
      {modules.map(mod => (
        <div key={mod.id} onClick={() => startExam(mod)} style={{
          background: 'linear-gradient(135deg, #1e293b, #0f2540)',
          border: `2px solid ${mod.color}40`,
          borderRadius: 20, padding: 24,
          cursor: 'pointer', marginBottom: 16,
          transition: 'all 0.2s'
        }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = mod.color
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = `${mod.color}40`
            e.currentTarget.style.transform = 'translateY(0)'
          }}>
          <h2 style={{ color: mod.color, marginBottom: 8 }}>📝 {mod.label}</h2>
          <p style={{ color: '#94a3b8', fontSize: 13 }}>
            {mod.questions.length} questions
          </p>
        </div>
      ))}
    </div>
  )

  const score = submitted ? getScore() : 0
  const total = selectedModule.questions.length
  const percent = Math.round((score / total) * 100)

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setSelectedModule(null)} style={{
          background: 'rgba(255,255,255,0.08)',
          border: '2px solid rgba(255,255,255,0.15)',
          borderRadius: 10, padding: '6px 14px',
          color: '#94a3b8', cursor: 'pointer',
          fontSize: 12, fontWeight: 700, fontFamily: 'inherit'
        }}>← Back</button>
        <h2 style={{ color: selectedModule.color, flex: 1 }}>
          📝 {selectedModule.label}
        </h2>
      </div>

      {submitted && (
        <div style={{
          background: percent >= 60
            ? 'linear-gradient(135deg, #064e3b, #059669)'
            : 'linear-gradient(135deg, #7f1d1d, #dc2626)',
          border: `2px solid ${percent >= 60 ? '#4ade80' : '#f87171'}`,
          borderRadius: 20, padding: 24,
          textAlign: 'center', marginBottom: 24
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>
            {percent >= 80 ? '🏆' : percent >= 60 ? '✅' : '📚'}
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
            {score}/{total}
          </div>
          <div style={{ fontSize: 20, color: percent >= 60 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
            {percent}%
          </div>
          <button onClick={() => startExam(selectedModule)} style={{
            background: '#38bdf8', color: '#0f172a',
            border: 'none', padding: '10px 24px',
            borderRadius: 10, cursor: 'pointer',
            fontWeight: 700, fontSize: 14,
            marginTop: 16, fontFamily: 'inherit'
          }}>
            🔄 Try Again
          </button>
        </div>
      )}

      {selectedModule.questions.map((q, qi) => {
        const answered = answers[qi] !== undefined
        const isCorrect = answers[qi] === q.correct
        return (
          <div key={qi} style={{
            background: 'linear-gradient(135deg, #1e293b, #0f2540)',
            border: submitted
              ? `2px solid ${isCorrect ? '#4ade80' : answered ? '#f87171' : '#1e3a5f'}`
              : '2px solid #1e3a5f',
            borderRadius: 16, padding: 20, marginBottom: 16
          }}>
            <p style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 14, fontSize: 14 }}>
              {qi + 1}. {q.q}
            </p>
            {q.options.map((opt, ai) => {
              let bg = '#0f172a'
              let border = '#1e3a5f'
              let color = '#94a3b8'
              if (answers[qi] === ai && !submitted) { bg = '#1e3a5f'; border = '#38bdf8'; color = '#38bdf8' }
              if (submitted && ai === q.correct) { bg = '#064e3b'; border = '#4ade80'; color = '#4ade80' }
              if (submitted && answers[qi] === ai && ai !== q.correct) { bg = '#7f1d1d'; border = '#f87171'; color = '#f87171' }
              return (
                <div key={ai} onClick={() => selectAnswer(qi, ai)} style={{
                  background: bg, border: `1px solid ${border}`,
                  borderRadius: 10, padding: '10px 14px',
                  marginBottom: 8, cursor: submitted ? 'default' : 'pointer',
                  color, fontSize: 13, fontWeight: 600,
                  transition: 'all 0.15s'
                }}>
                  {String.fromCharCode(65 + ai)}. {opt}
                </div>
              )
            })}
            {submitted && (
              <div style={{
                background: '#1e3a5f', borderRadius: 10,
                padding: '10px 14px', marginTop: 10,
                color: '#94a3b8', fontSize: 12
              }}>
                💡 {q.explain}
              </div>
            )}
          </div>
        )
      })}

      {!submitted && (
        <button
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < total}
          style={{
            background: Object.keys(answers).length < total ? '#1e293b' : '#38bdf8',
            color: Object.keys(answers).length < total ? '#475569' : '#0f172a',
            border: 'none', padding: '14px',
            borderRadius: 12, cursor: Object.keys(answers).length < total ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 16,
            width: '100%', fontFamily: 'inherit',
            marginBottom: 20
          }}>
          {Object.keys(answers).length < total
            ? `Answer all questions (${Object.keys(answers).length}/${total})`
            : '✅ Submit'}
        </button>
      )}
    </div>
  )
}

export default MCQ
