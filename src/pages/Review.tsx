// src/pages/Review.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth, useModules } from '../contexts'
import { getPulseTheme, pulseFonts, pulseType } from '../premiumTheme'
import { glassInput } from '../components/pulse/PulseUI'
import { useToast } from '../components/ToastProvider'
import ErrorBanner from '../components/ErrorBanner'
import LiquidGlassCard from '@/components/ui/liquid-glass-card'
import PulseBackground from '../components/pulse/PulseBackground'
import PulseGlassRow from '../components/pulse/PulseGlassRow'
import { getGuestFlags, getGuestIncorrect, toggleGuestFlag } from '../lib/reviewStorage'
import QuestionSourceBadge from '../components/QuestionSourceBadge'

// Existing functional accent color for the Review/MCQ feature (the
// same terracotta already used on MCQ.jsx) — reused, not invented.
const REVIEW_ACCENT = '#e2725b'

const SECTION_GAP = 22
const ITEM_GAP = 16

interface ReviewModule {
  id: string
  name: string
  icon?: string | null
  color: string
}

interface ReviewItem {
  id?: string
  question_id?: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer?: string
  explanation?: string
  module_id?: string
  subject_id?: string
  source?: string
  attempted?: boolean
}

type ReviewTab = 'incorrect' | 'flagged'

export default function Review({ dark }: { dark: boolean }) {
  const { user } = useAuth() as { user: { id: string } | null }
  const { modules } = useModules() as { modules: ReviewModule[] }
  const navigate = useNavigate()
  const showToast = useToast() as (message: string, type?: 'success' | 'error') => void
  const pt = getPulseTheme(dark)

  const [tab, setTab] = useState<ReviewTab>('incorrect')
  const [items, setItems] = useState<ReviewItem[]>([])
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
      // user has actually submitted through a graded quiz.
      let ids: string[] = []
      if (tab === 'incorrect') {
        const { data, error } = await supabase
          .from('answered_questions')
          .select('question_id')
          .eq('user_id', user.id)
          .eq('correct', false)
        if (error) setLoadError(true)
        ids = (data || []).map((r: any) => r.question_id)
      } else {
        const { data, error } = await supabase
          .from('flagged_questions')
          .select('question_id')
          .eq('user_id', user.id)
        if (error) setLoadError(true)
        ids = (data || []).map((r: any) => r.question_id)
      }

      if (ids.length === 0) { setItems([]); setLoading(false); return }

      const { data: qData, error: qError } = await supabase.rpc('get_review_questions', { p_question_ids: ids })
      if (qError) setLoadError(true)
      setItems(qData || [])
    } else {
      // Guest: everything already lives on this device with the
      // correct answer/explanation attached once a quiz is graded.
      const local = tab === 'incorrect' ? getGuestIncorrect() : getGuestFlags()
      setItems(local.map((q: any) => ({ ...q, attempted: !!q.explanation })))
    }

    setLoading(false)
  }

  async function unflag(questionId: string) {
    if (user) {
      await supabase.from('flagged_questions').delete().eq('user_id', user.id).eq('question_id', questionId)
    } else {
      toggleGuestFlag({ question_id: questionId })
    }
    setItems(prev => prev.filter(i => (i.question_id || i.id) !== questionId))
    showToast('Flag removed')
  }

  function retryAll(list: ReviewItem[]) {
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

  function moduleFor(id?: string) { return modules.find(m => m.id === id) }

  const optionLabels = ['a', 'b', 'c', 'd']
  const optionsOf = (item: ReviewItem) => [item.option_a, item.option_b, item.option_c, item.option_d]

  const filteredItems = items.filter(item => {
    const matchesModule = moduleFilter === 'all' || item.module_id === moduleFilter
    const matchesSearch = !searchQuery.trim() || item.question.toLowerCase().includes(searchQuery.trim().toLowerCase())
    return matchesModule && matchesSearch
  })

  // Only offer the module filter dropdown if the list actually spans
  // more than one module — otherwise it's just clutter.
  const modulesInList = [...new Set(items.map(i => i.module_id).filter(Boolean))] as string[]
  const showModuleFilter = modulesInList.length > 1

  const hoverTint = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'
  const inStyle = { ...glassInput(pt, dark), padding: '13px 20px', marginBottom: 0 }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PulseBackground />
      <div className="pulse-wide" style={{ position: 'relative', zIndex: 1, padding: '24px 20px 100px', fontFamily: pulseFonts.body }}>

        <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📚</div>
          <h1 style={{ fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 24, color: pt.text, marginBottom: 4 }}>
            Review
          </h1>
          <p style={{ color: pt.sub, fontSize: 13 }}>Questions you got wrong, and questions you flagged during a quiz</p>
        </div>

        <div style={{ textAlign: 'center', marginBottom: SECTION_GAP }}>
          <PulseGlassRow dark={dark} radius={999} hoverTint={hoverTint} onClick={() => navigate('/profile?tab=history')}
            role="button" tabIndex={0} style={{ display: 'inline-block' }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/profile?tab=history') } }}>
            <div style={{ padding: '8px 18px', ...pulseType.small, fontWeight: 700, color: pt.sub }}>
              🕘 See my full exam history
            </div>
          </PulseGlassRow>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: SECTION_GAP }}>
          {([{ id: 'incorrect' as const, label: '❌ Incorrect' }, { id: 'flagged' as const, label: '🚩 Flagged' }]).map(t => {
            const active = tab === t.id
            return (
              <PulseGlassRow
                key={t.id} dark={dark} radius={999} active={active}
                activeTint={`${REVIEW_ACCENT}26`} hoverTint={hoverTint}
                onClick={() => setTab(t.id)} role="button" tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTab(t.id) } }}
                style={{ flex: 1, textAlign: 'center' }}
              >
                <div style={{ padding: '10px', ...pulseType.button, color: active ? REVIEW_ACCENT : pt.sub }}>
                  {t.label}
                </div>
              </PulseGlassRow>
            )
          })}
        </div>

        {loadError && <ErrorBanner />}

        {!user && (
          <div style={{ marginBottom: SECTION_GAP }}>
            <LiquidGlassCard dark={dark} delay={0} style={{ padding: '12px 18px', textAlign: 'center' }}>
              <span style={{ color: pt.cobalt, fontSize: 13, fontWeight: 600 }}>
                💡 This list is saved on this device only.{' '}
                <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/auth')}>Sign in</span>{' '}
                to keep it across devices.
              </span>
            </LiquidGlassCard>
          </div>
        )}

        {loading && <p style={{ color: pt.sub, textAlign: 'center' }}>Loading...</p>}

        {!loading && items.length === 0 && (
          <LiquidGlassCard dark={dark} delay={0} style={{ padding: 40, textAlign: 'center', marginBottom: SECTION_GAP }}>
            <p style={{ color: pt.sub }}>
              {tab === 'incorrect' ? 'No incorrect questions yet — nice! 🎉' : 'No flagged questions yet 🚩'}
            </p>
          </LiquidGlassCard>
        )}

        {!loading && items.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="🔍 Search questions..."
                style={{ ...inStyle, flex: 1, minWidth: 160 }}
              />
              {showModuleFilter && (
                <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} style={{ ...inStyle, width: 'auto' }}>
                  <option value="all">All modules</option>
                  {modulesInList.map(id => {
                    const mod = moduleFor(id)
                    return <option key={id} value={id}>{mod ? `${mod.icon} ${mod.name}` : id}</option>
                  })}
                </select>
              )}
            </div>

            {filteredItems.length > 0 && (
              <div style={{ marginBottom: SECTION_GAP }}>
                <button onClick={() => retryAll(filteredItems)} style={{
                  width: '100%', padding: '14px', background: REVIEW_ACCENT, color: '#0f172a',
                  border: 'none', borderRadius: 999, cursor: 'pointer', fontWeight: 700,
                  fontSize: 14, fontFamily: pulseFonts.body, boxShadow: `0 8px 28px ${REVIEW_ACCENT}35`
                }}>
                  🔁 Retry {filteredItems.length === items.length ? 'All' : `These ${filteredItems.length}`} {tab === 'incorrect' ? 'Incorrect' : 'Flagged'} Questions
                </button>
              </div>
            )}
          </>
        )}

        {!loading && items.length > 0 && filteredItems.length === 0 && (
          <LiquidGlassCard dark={dark} delay={0} style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ color: pt.sub }}>No matches for your search/filter 🔎</p>
          </LiquidGlassCard>
        )}

        {filteredItems.map((item, i) => {
          const qId = (item.question_id || item.id) as string
          const mod = moduleFor(item.module_id)
          const isLast = i === filteredItems.length - 1
          return (
            <div key={qId} style={{ marginBottom: isLast ? 0 : ITEM_GAP }}>
              <LiquidGlassCard dark={dark} delay={i * 60} style={{ padding: '20px 22px' }}>
                {(mod || item.source) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    {mod && <div style={{ color: mod.color, ...pulseType.small, fontWeight: 700 }}>{mod.icon} {mod.name}</div>}
                    {item.source && <QuestionSourceBadge source={item.source} />}
                  </div>
                )}
                <p style={{ ...pulseType.cardTitle, color: pt.textPrimary, marginBottom: 12 }}>{item.question}</p>

                {optionsOf(item).map((opt, ai) => {
                  const label = optionLabels[ai]
                  const isCorrect = item.attempted && label === item.correct_answer
                  return (
                    <div key={ai} style={{
                      background: isCorrect ? '#064e3b' : (dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                      border: `1px solid ${isCorrect ? '#4ade80' : pt.border}`,
                      borderRadius: 10, padding: '9px 14px', marginBottom: 6,
                      color: isCorrect ? '#4ade80' : pt.sub, fontSize: 13, fontWeight: 600
                    }}>
                      {label.toUpperCase()}. {opt}
                    </div>
                  )
                })}

                {item.attempted && item.explanation && (
                  <div style={{
                    background: dark ? 'rgba(56,189,248,0.10)' : 'rgba(2,132,199,0.06)',
                    borderRadius: 10, padding: '10px 14px', marginTop: 8, color: pt.sub, fontSize: 12
                  }}>
                    💡 {item.explanation}
                  </div>
                )}
                {!item.attempted && (
                  <div style={{ color: pt.faint, fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
                    Answer it in a quiz to see the correct answer here.
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <PulseGlassRow dark={dark} radius={10} hoverTint={hoverTint} onClick={() => retryAll([item])}
                    role="button" tabIndex={0} style={{ flex: 1 }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); retryAll([item]) } }}>
                    <div style={{ padding: '8px', textAlign: 'center', color: pt.sub, ...pulseType.small, fontWeight: 700 }}>
                      🔁 Retry this one
                    </div>
                  </PulseGlassRow>
                  {tab === 'flagged' && (
                    <button onClick={() => unflag(qId)} style={{
                      padding: '8px 12px', background: 'transparent', border: '1px solid #ef444440',
                      borderRadius: 8, color: '#ef4444', cursor: 'pointer', fontFamily: pulseFonts.body,
                      fontSize: 12, fontWeight: 700
                    }}>🚩 Remove</button>
                  )}
                </div>
              </LiquidGlassCard>
            </div>
          )
        })}
      </div>
    </div>
  )
}
