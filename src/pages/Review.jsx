import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth, useModules } from '../App'
import { getTheme } from '../theme'
import { useToast } from '../components/ToastProvider'
import ErrorBanner from '../components/ErrorBanner'
import { getGuestFlags, getGuestIncorrect, toggleGuestFlag } from '../lib/reviewStorage'
import QuestionSourceBadge from '../components/QuestionSourceBadge'

export default function Review({ dark }) {
  const { user } = useAuth()
  const { modules } = useModules()
  const navigate = useNavigate()
  const showToast = useToast()
  const c = getTheme(dark)

  const [tab, setTab] = useState('incorrect')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')

  useEffect(() => { fetchTab() }, [tab, user])
  useEffect(() => { setSearchQuery(''); setModuleFilter('all') }, [tab])

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
    showToast('Flag removed')
  }

  function retryAll(list) {
    // A real graded quiz through MCQ.jsx — not just re-reading the
    // explanation. Strip the answer/explanation fields before handing
    // the set over, since a retry should feel like a fresh attempt.
    const retryQuestions = list.map(item => ({
      id: item.question_id || item.id,
      question: item.question,
      option_a: item.option_a, option_b: item.option_b, option_c: item.option_c, option_d: item.option_d,
      module_id: item.module_id, subject_id: item.subject_id
    }))
    navigate('/mcq', { state: { retryQuestions } })
  }

  function moduleFor(id) { return modules.find(m => m.id === id) }

  const optionLabels = ['a', 'b', 'c', 'd']
  const optionsOf = (item) => [item.option_a, item.option_b, item.option_c, item.option_d]

  const filteredItems = items.filter(item => {
    const matchesModule = moduleFilter === 'all' || item.module_id === moduleFilter
    const matchesSearch = !searchQuery.trim() || item.question.toLowerCase().includes(searchQuery.trim().toLowerCase())
    return matchesModule && matchesSearch
  })

  // Only offer the module filter dropdown if the list actually spans
  // more than one module — otherwise it's just clutter.
  const modulesInList = [...new Set(items.map(i => i.module_id).filter(Boolean))]
  const showModuleFilter = modulesInList.length > 1

  return (
    <div className="page-container" style={{ padding: '20px' }}>
      <h1 style={{ color: '#e2725b', textAlign: 'center', marginBottom: 8 }}>📚 Review</h1>
      <p style={{ color: c.sub, textAlign: 'center', marginBottom: 12, fontSize: 13 }}>
        Questions you got wrong, and questions you flagged during a quiz
      </p>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <button onClick={() => navigate('/profile?tab=history')} style={{
          background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 20,
          padding: '6px 16px', color: c.sub, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700
        }}>🕘 See my full exam history</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[{ id: 'incorrect', label: '❌ Incorrect' }, { id: 'flagged', label: '🚩 Flagged' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px', borderRadius: 10, fontFamily: 'inherit',
            border: `2px solid ${tab === t.id ? '#e2725b' : c.border}`,
            background: tab === t.id ? '#e2725b20' : 'transparent',
            color: tab === t.id ? '#e2725b' : c.sub,
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

      {!loading && items.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 Search questions..."
              style={{
                flex: 1, minWidth: 160, padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${c.border}`, background: c.input, color: c.text,
                fontSize: 13, fontFamily: 'inherit', outline: 'none'
              }}
            />
            {showModuleFilter && (
              <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} style={{
                padding: '10px 14px', borderRadius: 10, border: `1px solid ${c.border}`,
                background: c.input, color: c.text, fontSize: 13, fontFamily: 'inherit', outline: 'none'
              }}>
                <option value="all">All modules</option>
                {modulesInList.map(id => {
                  const mod = moduleFor(id)
                  return <option key={id} value={id}>{mod ? `${mod.icon} ${mod.name}` : id}</option>
                })}
              </select>
            )}
          </div>

          {filteredItems.length > 0 && (
            <button onClick={() => retryAll(filteredItems)} style={{
              width: '100%', padding: '12px', background: '#e2725b', color: '#0f172a',
              border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
              fontSize: 14, fontFamily: 'inherit', marginBottom: 16
            }}>
              🔁 Retry {filteredItems.length === items.length ? 'All' : `These ${filteredItems.length}`} {tab === 'incorrect' ? 'Incorrect' : 'Flagged'} Questions
            </button>
          )}
        </>
      )}

      {!loading && items.length > 0 && filteredItems.length === 0 && (
        <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 32, textAlign: 'center' }}>
          <p style={{ color: c.sub }}>No matches for your search/filter 🔎</p>
        </div>
      )}

      {filteredItems.map(item => {
        const qId = item.question_id || item.id
        const mod = moduleFor(item.module_id)
        return (
          <div key={qId} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            {(mod || item.source) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                {mod && <div style={{ color: mod.color, fontSize: 11, fontWeight: 700 }}>{mod.icon} {mod.name}</div>}
                {item.source && <QuestionSourceBadge source={item.source} />}
              </div>
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
              <button onClick={() => retryAll([item])} style={{
                flex: 1, padding: '8px', background: 'transparent', border: `1px solid ${c.border}`,
                borderRadius: 8, color: c.sub, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700
              }}>🔁 Retry this one</button>
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
