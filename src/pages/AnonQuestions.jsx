import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../App'

export default function AnonQuestions({ dark }) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState([])
  const [newQ, setNewQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminPass, setAdminPass] = useState('')
  const [replyText, setReplyText] = useState({})

  const c = {
    card: dark ? 'linear-gradient(135deg, #1e293b, #0f2540)' : '#fff',
    border: dark ? '#1e3a5f' : '#e2e8f0',
    text: dark ? '#e2e8f0' : '#1e293b',
    sub: dark ? '#94a3b8' : '#64748b',
    input: dark ? '#0f172a' : '#f8fafc',
  }

  const inStyle = {
    width: '100%', padding: '12px', marginBottom: '12px',
    borderRadius: '10px', border: `1px solid ${c.border}`,
    background: c.input, color: c.text,
    fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none'
  }

  useEffect(() => { fetchQuestions() }, [])

  async function fetchQuestions() {
    setLoading(true)
    const { data } = await supabase
      .from('anonymous_questions')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setQuestions(data)
    setLoading(false)
  }

  async function submitQuestion() {
    if (!newQ.trim()) return
    const { error } = await supabase.from('anonymous_questions').insert([{ question: newQ.trim() }])
    if (!error) {
      setMsg('✅ Question submitted anonymously!')
      setNewQ('')
      fetchQuestions()
      setTimeout(() => setMsg(''), 3000)
    }
  }

  async function submitReply(id) {
    const reply = replyText[id]
    if (!reply?.trim()) return
    const { error } = await supabase
      .from('anonymous_questions')
      .update({ answer: reply, answered: true })
      .eq('id', id)
    if (!error) {
      setReplyText(prev => ({ ...prev, [id]: '' }))
      fetchQuestions()
    }
  }

  async function deleteQuestion(id) {
    await supabase.from('anonymous_questions').delete().eq('id', id)
    fetchQuestions()
  }

  const answeredQs = questions.filter(q => q.answered)
  const unansweredQs = questions.filter(q => !q.answered)

  return (
    <div style={{ padding: '20px', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ color: '#a78bfa', textAlign: 'center', marginBottom: 8 }}>
        💬 Anonymous Questions
      </h1>
      <p style={{ color: c.sub, textAlign: 'center', marginBottom: 24, fontSize: 14 }}>
        Ask anything anonymously — no one knows who you are!
      </p>

      {/* Submit Question */}
      <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <h3 style={{ color: '#a78bfa', marginBottom: 12 }}>🙋 Ask a Question</h3>
        <textarea
          placeholder="Type your question here..."
          value={newQ} onChange={e => setNewQ(e.target.value)}
          style={{ ...inStyle, minHeight: 80, resize: 'vertical' }} />
        {msg && <div style={{ color: '#22c55e', fontSize: 13, marginBottom: 8 }}>{msg}</div>}
        <button onClick={submitQuestion} style={{
          width: '100%', padding: '12px', background: '#a78bfa',
          border: 'none', borderRadius: 10, cursor: 'pointer',
          fontWeight: 700, color: '#0f172a', fontFamily: 'inherit', fontSize: 14
        }}>Submit Anonymously 🔒</button>
      </div>

      {/* Admin Panel */}
      {!isAdmin ? (
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="password" placeholder="Admin password"
              value={adminPass} onChange={e => setAdminPass(e.target.value)}
              style={{ ...inStyle, marginBottom: 0, flex: 1 }} />
            <button onClick={() => adminPass === '@SyNapse74' && setIsAdmin(true)} style={{
              background: '#38bdf8', color: '#0f172a', border: 'none',
              padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
              fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap'
            }}>Admin</button>
          </div>
        </div>
      ) : (
        <div style={{
          background: '#38bdf810', border: '1px solid #38bdf830',
          borderRadius: 12, padding: '10px 16px', marginBottom: 24,
          color: '#38bdf8', fontSize: 13, fontWeight: 700, textAlign: 'center'
        }}>
          ✅ Admin Mode Active
        </div>
      )}

      {/* Unanswered */}
      {isAdmin && unansweredQs.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: '#f59e0b', marginBottom: 12 }}>
            ⏳ Unanswered ({unansweredQs.length})
          </h3>
          {unansweredQs.map(q => (
            <div key={q.id} style={{
              background: c.card, border: `1px solid #f59e0b40`,
              borderRadius: 16, padding: 16, marginBottom: 12
            }}>
              <p style={{ color: c.text, fontWeight: 600, marginBottom: 12 }}>❓ {q.question}</p>
              <textarea
                placeholder="Type your answer..."
                value={replyText[q.id] || ''}
                onChange={e => setReplyText(prev => ({ ...prev, [q.id]: e.target.value }))}
                style={{ ...inStyle, minHeight: 60, resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => submitReply(q.id)} style={{
                  flex: 1, padding: '10px', background: '#22c55e',
                  border: 'none', borderRadius: 10, cursor: 'pointer',
                  fontWeight: 700, color: '#fff', fontFamily: 'inherit'
                }}>✅ Answer</button>
                <button onClick={() => deleteQuestion(q.id)} style={{
                  padding: '10px 16px', background: '#ef444420',
                  border: '1px solid #ef444440', borderRadius: 10, cursor: 'pointer',
                  color: '#ef4444', fontFamily: 'inherit', fontWeight: 700
                }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Answered */}
      <div>
        <h3 style={{ color: '#22c55e', marginBottom: 12 }}>
          ✅ Answered Questions ({answeredQs.length})
        </h3>
        {loading && <p style={{ color: c.sub, textAlign: 'center' }}>Loading...</p>}
        {!loading && answeredQs.length === 0 && (
          <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
            <p style={{ color: c.sub }}>No answered questions yet 🚧</p>
          </div>
        )}
        {answeredQs.map(q => (
          <div key={q.id} style={{
            background: c.card, border: `1px solid ${c.border}`,
            borderRadius: 16, padding: 20, marginBottom: 12
          }}>
            <p style={{ color: c.text, fontWeight: 600, marginBottom: 12 }}>❓ {q.question}</p>
            <div style={{
              background: '#22c55e15', border: '1px solid #22c55e30',
              borderRadius: 10, padding: '12px 16px'
            }}>
              <div style={{ color: '#22c55e', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                💡 Answer
              </div>
              <p style={{ color: c.text, fontSize: 14 }}>{q.answer}</p>
            </div>
            {isAdmin && (
              <button onClick={() => deleteQuestion(q.id)} style={{
                marginTop: 8, padding: '6px 12px',
                background: '#ef444420', border: '1px solid #ef444440',
                borderRadius: 8, cursor: 'pointer',
                color: '#ef4444', fontFamily: 'inherit', fontSize: 12
              }}>🗑 Delete</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
