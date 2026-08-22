import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth, useModules } from '../App'
import { getTheme } from '../theme'
import ErrorBanner from '../components/ErrorBanner'
import { getGuestFlags, getGuestIncorrect, toggleGuestFlag } from '../lib/reviewStorage'

export default function Review({ dark }) {
  const { user } = useAuth()
  const { modules } = useModules()
  const navigate = useNavigate()
  const c = getTheme(dark)

  const [tab, setTab] = useState('incorrect')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => { fetchTab() }, [tab, user])

  async function fetchTab() {
    setLoading(true)
    setLoadError(false)

    if (user) {
      // Signed in: pull the relevant question ids from Supabase, then
      // resolve them through the get_review_questions() RPC. That RPC
      // only reveals the correct answer/explanation for questions this
      // user has actually submitted through a graded quiz (see
      // supabase_review_and_resume.sql) — flagging a question you
      // never answered just shows the question, not the answer.
      let ids = []
      if (tab === 'incorrect') {
        const { data, error } = await supabase
          .from('answered_questions')
          .select('question_id')
          .eq('user_id', user.id)
          .eq('correct', false)
        if (error) setLoadError(true)
        ids = (data || []).map(r => r.question_id)
      } else {
        const { data, error } = await supabase
          .from('flagged_questions')
          .select('question_id')
          .eq('user_id', user.id)
        if (error) setLoadError(true)
        ids = (data || []).map(r => r.question_id)
      }

      if (ids.length === 0) { setItems([]); setLoading(false); return }

      const { data: qData, error: qError } = await supabase.rpc('get_review_questions', { p_question_ids: ids })
      if (qError) setLoadError(true)
      setItems(qData || [])
    } else {
      // Guest: everything already lives on this device with the
      // correct answer/explanation attached once a quiz is graded.
      const local = tab === 'incorrect' ? getGuestIncorrect() : getGuestFlags()
      setItems(local.map(q => ({ ...q, attempted: !!q.explanation })))
    }

    setLoading(false)
  }

  async function unflag(questionId) {
    if (user) {
      await supabase.from('flagged_questions').delete().eq('user_id', user.id).eq('question_id', questionId)
    } else {
      toggleGuestFlag({ question_id: questionId })
    }
    setItems(prev => prev.filter(i => (i.question_id || i.id) !== questionId))
  }

  function moduleFor(id) { return modules.find(m => m.id === id) }

  const optionLabels = ['a', 'b', 'c', 'd']
  const optionsOf = (item) => [item.option_a, item.option_b, item.option_c, item.option_d]

  return (
    <div className="page-container" style={{ padding: '20px' }}>
      <h1 style={{ color: '#f472b6', textAlign: 'center', marginBottom: 8 }}>📚 Review</h1>
      <p style={{ color: c.sub, textAlign: 'center', marginBottom: 20, fontSize: 13 }}>
        Questions you got wrong, and questions you flagged during a quiz
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[{ id: 'incorrect', label: '❌ Incorrect' }, { id: 'flagged', label: '🚩 Flagged' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px', borderRadius: 10, fontFamily: 'inherit',
            border: `2px solid ${tab === t.id ? '#f472b6' : c.border}`,
            background: tab === t.id ? '#f472b620' : 'transparent',
            color: tab === t.id ? '#f472b6' : c.sub,
            cursor: 'pointer', fontWeight: 700, fontSize: 13
          }}>{t.label}</button>
        ))}
      </div>

      {loadError && <ErrorBanner />}

      {!user && (
        <div style={{
          background: '#38bdf820', border: '1px solid #38bdf840', borderRadius: 12,
          padding: '10px 16px', marginBottom: 16, textAlign: 'center', fontSize: 13, color: '#38bdf8'
        }}>
          💡 This list is saved on this device only.{' '}
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/auth')}>Sign in</span>{' '}
          to keep it across devices.
        </div>
      )}

      {loading && <p style={{ color: c.sub, textAlign: 'center' }}>Loading...</p>}

      {!loading && items.length === 0 && (
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <p style={{ color: c.sub }}>
            {tab === 'incorrect' ? 'No incorrect questions yet — nice! 🎉' : 'No flagged questions yet 🚩'}
          </p>
        </div>
      )}

      {items.map(item => {
        const qId = item.question_id || item.id
        const mod = moduleFor(item.module_id)
        return (
          <div key={qId} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            {mod && (
              <div style={{ color: mod.color, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>{mod.icon} {mod.name}</div>
            )}
            <p style={{ color: c.text, fontWeight: 700, marginBottom: 12, fontSize: 14 }}>{item.question}</p>

            {optionsOf(item).map((opt, ai) => {
              const label = optionLabels[ai]
              const isCorrect = item.attempted && label === item.correct_answer
              return (
                <div key={ai} style={{
                  background: isCorrect ? '#064e3b' : c.input,
                  border: `1px solid ${isCorrect ? '#4ade80' : c.border}`,
                  borderRadius: 10, padding: '8px 12px', marginBottom: 6,
                  color: isCorrect ? '#4ade80' : c.sub, fontSize: 13, fontWeight: 600
                }}>
                  {label.toUpperCase()}. {opt}
                </div>
              )
            })}

            {item.attempted && item.explanation && (
              <div style={{
                background: dark ? '#1e3a5f' : '#f0f9ff', borderRadius: 10,
                padding: '10px 14px', marginTop: 8, color: c.sub, fontSize: 12
              }}>
                💡 {item.explanation}
              </div>
            )}
            {!item.attempted && (
              <div style={{ color: c.sub, fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
                Answer it in a quiz to see the correct answer here.
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {item.module_id && (
                <button onClick={() => navigate(`/mcq?module=${item.module_id}`)} style={{
                  flex: 1, padding: '8px', background: 'transparent', border: `1px solid ${c.border}`,
                  borderRadius: 8, color: c.sub, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700
                }}>🧪 Practice this module</button>
              )}
              {tab === 'flagged' && (
                <button onClick={() => unflag(qId)} style={{
                  padding: '8px 12px', background: 'transparent', border: '1px solid #ef444440',
                  borderRadius: 8, color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700
                }}>🚩 Remove</button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
