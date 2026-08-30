// src/pages/MCQ.tsx
import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth, useModules } from '../contexts'
import { getPulseTheme, pulseFonts, pulseType } from '../premiumTheme'
import { useToast } from '../components/ToastProvider'
import ErrorBanner from '../components/ErrorBanner'
import QuestionPalette from '../components/QuestionPalette'
import ScoreRing from '../components/ScoreRing'
import QuestionSourceBadge from '../components/QuestionSourceBadge'
import LiquidGlassCard from '@/components/ui/liquid-glass-card'
import PulseBackground from '../components/pulse/PulseBackground'
import PulseGlassRow from '../components/pulse/PulseGlassRow'
import AutoGrid from '../components/AutoGrid'
import { fetchModuleStages } from '../lib/moduleStages'
import {
  getGuestFlags, toggleGuestFlag,
  saveGuestIncorrect, enrichGuestFlagsWithResults,
  addGuestHistory
} from '../lib/reviewStorage'
import { loadSavedActiveExam, persistActiveExam, clearActiveExam } from '../lib/activeExam'

const MOCK_MINUTES = 36
// Existing functional accent for the MCQ/exam feature (same terracotta
// used on Review.tsx) — reused, not invented.
const MCQ_ACCENT = '#e2725b'

export default function MCQ({ dark }: { dark: boolean }) {
  const { user, fetchProfile } = useAuth() as any
  const { modules, modulesLoaded, modulesError } = useModules() as any
  const location = useLocation()
  const navigate = useNavigate()
  const showToast = useToast() as (message: string, type?: 'success' | 'error') => void
  const pt = getPulseTheme(dark)

  const [subjects, setSubjects] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set())
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [activeStage, setActiveStage] = useState(() => {
    const params = new URLSearchParams(location.search)
    return params.get('stage') || 'all'
  })
  const [activeSubject, setActiveSubject] = useState('all')
  const [stages, setStages] = useState<any[]>([])
  const [lessonFilter] = useState(() => new URLSearchParams(location.search).get('lesson') || null)
  const [subjectFilter] = useState(() => new URLSearchParams(location.search).get('subject') || null)
  const [quizMode, setQuizMode] = useState<string | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [grading, setGrading] = useState(false)
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set())
  const [resumeData, setResumeData] = useState<any>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const quizStartedAtRef = useRef<number | null>(null)
  const [usingCache, setUsingCache] = useState(false)

  useEffect(() => {
    fetchSubjects()
    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { if (user) fetchAnsweredIds() }, [user])

  useEffect(() => {
    if (modulesLoaded && modules.length > 0 && !activeModule) {
      const params = new URLSearchParams(location.search)
      const moduleParam = params.get('module')
      const fromLink = moduleParam && modules.find((m: any) => m.id === moduleParam)
      if (fromLink) { setActiveModule(fromLink.id); return }
      const active = modules.find((m: any) => m.status === 'active')
      setActiveModule(active ? active.id : modules[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulesLoaded, modules])

  useEffect(() => {
    if (activeModule) fetchQuestionsForModule(activeModule)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule])

  useEffect(() => {
    if (location.state?.retryQuestions?.length) {
      startRetryQuiz(location.state.retryQuestions)
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  useEffect(() => {
    if (lessonFilter && !quizMode && questions.length > 0) {
      const lessonQs = questions.filter(q => q.lesson_id === lessonFilter)
      startRetryQuiz(lessonQs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonFilter, questions])

  useEffect(() => {
    if (subjectFilter && !lessonFilter && !quizMode && questions.length > 0) {
      const subjectQs = questions.filter(q => q.subject_id === subjectFilter)
      startRetryQuiz(subjectQs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectFilter, lessonFilter, questions])

  useEffect(() => {
    if (quizMode) return
    let cancelled = false
    loadSavedActiveExam(user).then(saved => { if (!cancelled) setResumeData(saved) })
    return () => { cancelled = true }
  }, [user, quizMode])

  useEffect(() => {
    if (!quizMode || submitted || quizMode === 'retry') return
    persistActiveExam(user, {
      activeModule, quizMode, quizQuestions, answers, startedAt: quizStartedAtRef.current
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizMode, quizQuestions, answers, submitted])

  useEffect(() => {
    if (quizMode === 'mock' && !submitted && !grading && timeLeft === 0 && quizQuestions.length > 0) {
      clearInterval(timerRef.current)
      submitQuiz()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  useEffect(() => {
    fetchModuleStages(activeModule).then(setStages)
  }, [activeModule])

  async function fetchSubjects() {
    const { data, error } = await supabase.from('subjects').select('*').order('name')
    if (error) {
      const cached = localStorage.getItem('mcq_subjects_cache')
      if (cached) setSubjects(JSON.parse(cached))
      else setLoadError(true)
    } else if (data) {
      setSubjects(data)
      localStorage.setItem('mcq_subjects_cache', JSON.stringify(data))
    }
  }

  async function fetchQuestionsForModule(moduleId: string) {
    const cacheKey = `mcq_questions_cache_${moduleId}`
    const cached = localStorage.getItem(cacheKey)
    let hadCache = false
    if (cached) {
      try {
        setQuestions(JSON.parse(cached))
        setUsingCache(true)
        hadCache = true
      } catch { /* ignore corrupt cache */ }
    }
    setLoading(!hadCache)

    const { data, error } = await supabase
      .from('questions')
      .select('id, question, option_a, option_b, option_c, option_d, exam_type, exam_stage, module_id, subject_id, lesson_id, source, created_at')
      .eq('module_id', moduleId)
      .order('created_at')

    if (error) {
      if (!hadCache) setLoadError(true)
    } else if (data) {
      setQuestions(data)
      setUsingCache(false)
      localStorage.setItem(cacheKey, JSON.stringify(data))
    }
    setLoading(false)
  }

  async function fetchAnsweredIds() {
    const { data } = await supabase.from('answered_questions').select('question_id').eq('user_id', user.id)
    if (data) setAnsweredIds(new Set(data.map((d: any) => d.question_id)))
  }

  const moduleSubjects = subjects.filter(s => s.module_id === activeModule)
  const activeModuleObj = modules.find((m: any) => m.id === activeModule)

  const getFilteredQuestions = (type: string) => {
    return questions.filter(q => {
      const modMatch = q.module_id === activeModule
      const typeMatch = type === 'mock'
        ? q.exam_type === 'mock' || q.exam_type === 'both'
        : q.exam_type === 'practice' || q.exam_type === 'both'
      const subMatch = activeSubject === 'all' || q.subject_id === activeSubject
      const stageMatch = activeStage === 'all' || (q.exam_stage || 'general') === activeStage
      return modMatch && typeMatch && subMatch && stageMatch
    })
  }

  function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

  async function loadFlagsFor(ids: string[]) {
    if (ids.length === 0) return new Set<string>()
    if (user) {
      const { data } = await supabase.from('flagged_questions').select('question_id').eq('user_id', user.id).in('question_id', ids)
      return new Set<string>((data || []).map((r: any) => r.question_id))
    }
    const flags = getGuestFlags()
    return new Set<string>(flags.filter((f: any) => ids.includes(f.question_id)).map((f: any) => f.question_id))
  }

  async function toggleFlagFor(q: any) {
    const isFlagged = flaggedIds.has(q.id)
    const next = new Set(flaggedIds)
    if (isFlagged) {
      next.delete(q.id)
      if (user) await supabase.from('flagged_questions').delete().eq('user_id', user.id).eq('question_id', q.id)
      else toggleGuestFlag({ question_id: q.id })
      showToast('Flag removed')
    } else {
      next.add(q.id)
      if (user) {
        await supabase.from('flagged_questions').insert({ user_id: user.id, question_id: q.id, module_id: q.module_id })
      } else {
        toggleGuestFlag({
          question_id: q.id, question: q.question,
          option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d,
          module_id: q.module_id, source: q.source
        })
      }
      showToast('🚩 Question flagged')
    }
    setFlaggedIds(next)
  }

  function startMockTimer(startedAt: number) {
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      setTimeLeft(Math.max(0, MOCK_MINUTES * 60 - elapsed))
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
  }

  function startQuiz(type: string, subjectId: string | null = null) {
    let qs = type === 'mock'
      ? shuffle(getFilteredQuestions('mock')).slice(0, 36)
      : shuffle(questions.filter(q =>
          q.subject_id === subjectId &&
          (q.exam_type === 'practice' || q.exam_type === 'both') &&
          (activeStage === 'all' || (q.exam_stage || 'general') === activeStage)
        )).slice(0, 50)

    setQuizQuestions(qs)
    setAnswers({})
    setResults({})
    setSubmitted(false)
    setQuizMode(type)
    setResumeData(null)
    quizStartedAtRef.current = Date.now()
    loadFlagsFor(qs.map(q => q.id)).then(setFlaggedIds)

    if (type === 'mock') startMockTimer(quizStartedAtRef.current)
  }

  function startRetryQuiz(list: any[]) {
    setQuizQuestions(list)
    setAnswers({})
    setResults({})
    setSubmitted(false)
    setQuizMode('retry')
    setResumeData(null)
    quizStartedAtRef.current = Date.now()
    loadFlagsFor(list.map(q => q.id)).then(setFlaggedIds)
  }

  async function resumeExam() {
    if (!resumeData) return
    setActiveModule(resumeData.activeModule)
    setQuizQuestions(resumeData.quizQuestions || [])
    setAnswers(resumeData.answers || {})
    setResults({})
    setSubmitted(false)
    setQuizMode(resumeData.quizMode)
    quizStartedAtRef.current = resumeData.startedAt
    loadFlagsFor((resumeData.quizQuestions || []).map((q: any) => q.id)).then(setFlaggedIds)

    if (resumeData.quizMode === 'mock') startMockTimer(resumeData.startedAt)
    setResumeData(null)
  }

  async function discardResume() {
    await clearActiveExam(user)
    setResumeData(null)
  }

  function stopQuiz() {
    clearInterval(timerRef.current)
    setQuizMode(null)
    setQuizQuestions([])
    setAnswers({})
    setResults({})
    setSubmitted(false)
    setTimeLeft(0)
    setFlaggedIds(new Set())
  }

  function selectAnswer(qi: number, opt: string) {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [qi]: opt }))
  }

  function tryAgain() {
    if (quizMode === 'retry') startRetryQuiz(quizQuestions)
    else startQuiz(quizMode!)
  }

  async function submitQuiz() {
    clearInterval(timerRef.current)
    setGrading(true)

    const payload = quizQuestions.map((q, i) => ({ id: q.id, answer: answers[i] || null }))
    const { data: graded, error } = await supabase.rpc('grade_mcq', { p_answers: payload })

    if (error) {
      setGrading(false)
      showToast('⚠️ Could not submit — check your connection and try again', 'error')
      return
    }

    const resultMap: Record<string, any> = {}
    if (graded) {
      graded.forEach((r: any) => {
        resultMap[r.question_id] = {
          is_correct: r.is_correct,
          correct_answer: r.correct_answer,
          explanation: r.explanation
        }
      })
    }
    setResults(resultMap)
    setGrading(false)
    setSubmitted(true)

    clearActiveExam(user)

    const total = quizQuestions.length
    const correctCount = quizQuestions.filter(q => resultMap[q.id]?.is_correct).length
    const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0
    const timeSec = quizMode === 'mock' ? Math.max(0, MOCK_MINUTES * 60 - timeLeft) : null
    const historyModuleId = quizMode === 'retry' ? (quizQuestions[0]?.module_id || null) : activeModule
    const historySubjectId = (quizMode === 'practice' || quizMode === 'retry') ? (quizQuestions[0]?.subject_id || null) : null

    if (!error && user) {
      const toRecord = quizQuestions
        .map(q => ({
          question_id: q.id,
          correct: resultMap[q.id]?.is_correct || false,
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
          const { error: pointsError } = await supabase.rpc('award_points', { p_amount: newPoints })
          if (!pointsError) {
            fetchProfile(user.id)
          }
        }
        fetchAnsweredIds()
      }

      supabase.from('exam_history').insert({
        user_id: user.id,
        module_id: historyModuleId,
        quiz_type: quizMode,
        subject_id: historySubjectId,
        total, correct: correctCount, score: scorePercent, time_sec: timeSec
      }).then(({ error: historyError }: any) => {
        if (historyError) console.warn('[MCQ] exam_history insert failed:', historyError)
      })
    } else if (!user) {
      quizQuestions.forEach(q => {
        const r = resultMap[q.id]
        if (r && !r.is_correct) {
          saveGuestIncorrect({
            question_id: q.id, question: q.question,
            option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d,
            module_id: q.module_id, source: q.source, correct_answer: r.correct_answer, explanation: r.explanation
          })
        }
      })
      enrichGuestFlagsWithResults(resultMap)
      addGuestHistory({
        module_id: historyModuleId, quiz_type: quizMode,
        total, correct: correctCount, score: scorePercent, time_sec: timeSec
      })
    }
  }

  function getScore() {
    return quizQuestions.filter(q => results[q.id]?.is_correct).length
  }

  const optionLabels = ['a', 'b', 'c', 'd']
  const optionTexts = (q: any) => [q.option_a, q.option_b, q.option_c, q.option_d]
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  const quizTitle = quizMode === 'mock' ? '📝 Mock Exam' : quizMode === 'retry' ? '🔁 Retry' : '🧪 Practice'
  const hoverTint = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'

  // ── Quiz-taking view ──────────────────────────────────────────────
  if (quizMode) {
    const score = submitted ? getScore() : 0
    const total = quizQuestions.length
    const percent = total > 0 ? Math.round((score / total) * 100) : 0
    const timePercent = quizMode === 'mock' ? (timeLeft / (MOCK_MINUTES * 60)) * 100 : 100
    const answeredIndexes = new Set(Object.keys(answers).map(Number))
    const flaggedIndexes = new Set(quizQuestions.map((q, i) => flaggedIds.has(q.id) ? i : null).filter((i): i is number => i !== null))

    if (total === 0) return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <PulseBackground />
        <div className="pulse-wide" style={{ position: 'relative', zIndex: 1, padding: 24, textAlign: 'center' }}>
          <h2 style={{ color: MCQ_ACCENT }}>No questions available yet! 🚧</h2>
          <button onClick={stopQuiz} style={{
            marginTop: 16, background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${pt.border}`, borderRadius: 10, padding: '8px 16px',
            color: pt.sub, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: pulseFonts.body
          }}>← Back</button>
        </div>
      </div>
    )

    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <PulseBackground />
        <div className="pulse-wide" style={{ position: 'relative', zIndex: 1, padding: '24px 20px 100px', fontFamily: pulseFonts.body }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={stopQuiz} style={{
              background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${pt.border}`, borderRadius: 10, padding: '8px 16px',
              color: pt.sub, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: pulseFonts.body
            }}>← Back</button>
            <h2 style={{ color: MCQ_ACCENT, flex: 1, fontSize: 16 }}>{quizTitle}</h2>
            {quizMode === 'mock' && !submitted && (
              <div style={{
                background: timeLeft < 300 ? 'rgba(239,107,87,0.16)' : `${pt.cobalt}20`,
                border: `1px solid ${timeLeft < 300 ? 'rgba(239,107,87,0.4)' : pt.cobaltBorder}`,
                borderRadius: 10, padding: '6px 14px',
                color: timeLeft < 300 ? pt.danger : pt.cobalt,
                fontWeight: 900, fontSize: 16, fontFamily: 'monospace'
              }}>⏱ {formatTime(timeLeft)}</div>
            )}
            <span style={{ color: pt.sub, fontSize: 13 }}>{Object.keys(answers).length}/{total}</span>
          </div>

          {quizMode === 'mock' && !submitted && (
            <div style={{
              background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              borderRadius: 999, height: 6, overflow: 'hidden', marginBottom: 20
            }}>
              <div style={{
                height: '100%', borderRadius: 999,
                background: timeLeft < 300 ? pt.danger : `linear-gradient(90deg, ${pt.cobalt}, ${pt.indigo})`,
                width: `${timePercent}%`, transition: 'width 1s linear'
              }} />
            </div>
          )}

          {!submitted && !grading && (
            <QuestionPalette
              total={total}
              answeredIndexes={answeredIndexes}
              flaggedIndexes={flaggedIndexes}
              dark={dark}
              onGoTo={(i: number) => {
                const el = document.getElementById(`mcq-question-${i}`)
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            />
          )}

          {grading && (
            <div style={{ textAlign: 'center', padding: 24, color: pt.sub, fontSize: 14 }}>Grading...</div>
          )}

          {submitted && (
            <div style={{ marginBottom: 24 }}>
              <LiquidGlassCard dark={dark} delay={0} style={{ padding: 28, textAlign: 'center' }}>
                <ScoreRing percent={percent} />
                <div style={{ fontSize: 32, fontWeight: 900, color: percent >= 60 ? pt.success : pt.danger, marginTop: 12, marginBottom: 4 }}>
                  {score}/{total}
                </div>
                {user && <div style={{ color: pt.amber, fontSize: 13, marginTop: 8 }}>⭐ Points earned for new correct answers!</div>}
                <button onClick={tryAgain} style={{
                  background: pt.cobalt, color: '#fff', border: 'none',
                  padding: '10px 24px', borderRadius: 999, cursor: 'pointer',
                  fontWeight: 700, fontSize: 14, marginTop: 16, fontFamily: pulseFonts.body
                }}>🔄 Try Again</button>
              </LiquidGlassCard>
            </div>
          )}

          {!grading && quizQuestions.map((q, qi) => {
            const result = results[q.id]
            const isCorrect = submitted && result?.is_correct
            const isLast = qi === quizQuestions.length - 1
            return (
              <div key={qi} id={`mcq-question-${qi}`} style={{ marginBottom: isLast && submitted ? 0 : 16, scrollMarginTop: 20 }}>
                <LiquidGlassCard dark={dark} delay={0} style={{
                  padding: '20px 22px',
                  boxShadow: submitted
                    ? `inset 0 0 0 2px ${isCorrect ? '#4ade80' : answers[qi] ? '#f87171' : 'transparent'}`
                    : undefined
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                    <p style={{ ...pulseType.cardTitle, color: pt.textPrimary, margin: 0, flex: 1 }}>
                      {qi + 1}. {q.question}
                    </p>
                    {!submitted && (
                      <button onClick={() => toggleFlagFor(q)} aria-label={flaggedIds.has(q.id) ? 'Remove flag' : 'Flag this question'} style={{
                        background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18,
                        color: flaggedIds.has(q.id) ? pt.amber : pt.sub, flexShrink: 0, lineHeight: 1, padding: 0
                      }}>🚩</button>
                    )}
                  </div>
                  {q.source && <div style={{ marginBottom: 10 }}><QuestionSourceBadge source={q.source} /></div>}
                  {optionTexts(q).map((opt: string, ai: number) => {
                    const label = optionLabels[ai]
                    let bg = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
                    let border = pt.border
                    let color = pt.sub
                    if (answers[qi] === label && !submitted) { bg = `${pt.cobalt}20`; border = pt.cobalt; color = pt.cobalt }
                    if (submitted && result && label === result.correct_answer) { bg = 'rgba(74,222,128,0.16)'; border = '#4ade80'; color = '#4ade80' }
                    if (submitted && result && answers[qi] === label && label !== result.correct_answer) { bg = 'rgba(248,113,113,0.16)'; border = '#f87171'; color = '#f87171' }
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
                  {submitted && result?.explanation && (
                    <div style={{
                      background: dark ? 'rgba(56,189,248,0.10)' : 'rgba(2,132,199,0.06)',
                      borderRadius: 10, padding: '10px 14px', marginTop: 10, color: pt.sub, fontSize: 12
                    }}>
                      💡 {result.explanation}
                    </div>
                  )}
                </LiquidGlassCard>
              </div>
            )
          })}

          {!submitted && (
            <button onClick={submitQuiz}
              disabled={Object.keys(answers).length < total || grading}
              style={{
                background: (Object.keys(answers).length < total || grading) ? (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') : pt.cobalt,
                color: (Object.keys(answers).length < total || grading) ? pt.sub : '#fff',
                border: 'none', padding: '14px', borderRadius: 999,
                cursor: (Object.keys(answers).length < total || grading) ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: 16, width: '100%',
                fontFamily: pulseFonts.body, marginTop: 20
              }}>
              {grading
                ? 'Grading...'
                : Object.keys(answers).length < total
                  ? `Answer all questions (${Object.keys(answers).length}/${total})`
                  : '✅ Submit'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Module / subject browsing view ─────────────────────────────────
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PulseBackground />
      <div className="pulse-wide" style={{ position: 'relative', zIndex: 1, padding: '24px 20px 100px', fontFamily: pulseFonts.body }}>
        {(loadError || modulesError) && <ErrorBanner />}
        {usingCache && (
          <div style={{ marginBottom: 16 }}>
            <LiquidGlassCard dark={dark} delay={0} style={{ padding: '10px 16px', textAlign: 'center' }}>
              <span style={{ color: pt.amber, fontSize: 13 }}>
                📴 You're offline — showing questions saved from your last visit. Submitting a quiz needs a connection.
              </span>
            </LiquidGlassCard>
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🧪</div>
          <h1 style={{ fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 24, color: pt.text, marginBottom: 4 }}>MCQ Bank</h1>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <PulseGlassRow dark={dark} radius={999} hoverTint={hoverTint} onClick={() => navigate('/review')}
            role="button" tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/review') } }}>
            <div style={{ padding: '8px 18px', ...pulseType.small, fontWeight: 700, color: pt.sub }}>
              📚 Review Incorrect & Flagged
            </div>
          </PulseGlassRow>
        </div>

        {resumeData && (
          <div style={{ marginBottom: 20 }}>
            <LiquidGlassCard dark={dark} delay={0} style={{
              padding: '14px 18px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 10, flexWrap: 'wrap'
            }}>
              <div style={{ color: MCQ_ACCENT, fontSize: 13, fontWeight: 700 }}>
                ⏸ Paused {resumeData.quizMode === 'mock' ? 'mock exam' : 'practice quiz'} — {Object.keys(resumeData.answers || {}).length}/{(resumeData.quizQuestions || []).length} answered
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={resumeExam} style={{
                  background: MCQ_ACCENT, color: '#0f172a', border: 'none', padding: '6px 14px',
                  borderRadius: 999, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: pulseFonts.body
                }}>▶ Continue</button>
                <button onClick={discardResume} style={{
                  background: 'transparent', border: `1px solid ${MCQ_ACCENT}40`, color: MCQ_ACCENT,
                  padding: '6px 14px', borderRadius: 999, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: pulseFonts.body
                }}>Discard</button>
              </div>
            </LiquidGlassCard>
          </div>
        )}

        {activeModuleObj && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
            color: activeModuleObj.color, fontWeight: 700, fontSize: 14
          }}>
            <span style={{ fontSize: 18 }}>{activeModuleObj.icon}</span> {activeModuleObj.name}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
          {[{ value: 'all', label: 'All' }, ...stages.map(s => ({ value: s.value, label: `${s.emoji} ${s.title}` }))].map(stage => {
            const active = activeStage === stage.value
            return (
              <PulseGlassRow key={stage.value} dark={dark} radius={999} active={active}
                activeTint={`${MCQ_ACCENT}26`} hoverTint={hoverTint} onClick={() => setActiveStage(stage.value)}
                role="button" tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveStage(stage.value) } }}>
                <div style={{ padding: '9px 16px', whiteSpace: 'nowrap', ...pulseType.button, color: active ? MCQ_ACCENT : pt.sub }}>{stage.label}</div>
              </PulseGlassRow>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, paddingBottom: 4 }}>
          <PulseGlassRow dark={dark} radius={999} active={activeSubject === 'all'}
            activeTint={`${MCQ_ACCENT}26`} hoverTint={hoverTint} onClick={() => setActiveSubject('all')}
            role="button" tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveSubject('all') } }}>
            <div style={{ padding: '9px 16px', whiteSpace: 'nowrap', ...pulseType.button, color: activeSubject === 'all' ? MCQ_ACCENT : pt.sub }}>All</div>
          </PulseGlassRow>
          {moduleSubjects.map(sub => {
            const active = activeSubject === sub.id
            return (
              <PulseGlassRow key={sub.id} dark={dark} radius={999} active={active}
                activeTint={`${MCQ_ACCENT}26`} hoverTint={hoverTint} onClick={() => setActiveSubject(sub.id)}
                role="button" tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveSubject(sub.id) } }}>
                <div style={{ padding: '9px 16px', whiteSpace: 'nowrap', ...pulseType.button, color: active ? MCQ_ACCENT : pt.sub }}>{sub.name}</div>
              </PulseGlassRow>
            )
          })}
        </div>

        {loading && <p style={{ color: pt.sub, textAlign: 'center' }}>Loading...</p>}

        {/* Mock Exam */}
        <div style={{ marginBottom: 16 }}>
          <LiquidGlassCard dark={dark} delay={0} style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ ...pulseType.sectionLabel, fontSize: 15, color: MCQ_ACCENT, marginBottom: 6 }}>📝 Mock Exam</h3>
                <p style={{ color: pt.sub, fontSize: 13 }}>
                  {Math.min(36, getFilteredQuestions('mock').length)} questions · ⏱ 36 minutes
                </p>
              </div>
              <button onClick={() => startQuiz('mock')} style={{
                background: MCQ_ACCENT, color: '#0f172a', border: 'none', padding: '10px 20px',
                borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontFamily: pulseFonts.body
              }}>Start</button>
            </div>
          </LiquidGlassCard>
        </div>

        {/* Practice by Subject */}
        <h3 style={{ ...pulseType.sectionLabel, color: pt.textMuted, marginBottom: 16 }}>Practice by Subject</h3>
        <AutoGrid>
          {moduleSubjects.map((sub, i) => {
            const subQs = questions.filter(q =>
              q.subject_id === sub.id &&
              (q.exam_type === 'practice' || q.exam_type === 'both') &&
              (activeStage === 'all' || (q.exam_stage || 'general') === activeStage)
            )
            return (
              <LiquidGlassCard key={sub.id} dark={dark} delay={i * 70}
                onClick={() => startQuiz('practice', sub.id)}
                style={{ padding: 'clamp(16px, 1.6vw, 24px)' }}>
                <div style={{ color: pt.textPrimary, fontWeight: 700, marginBottom: 6, fontSize: 'clamp(14px, 1.2vw, 17px)' }}>{sub.name}</div>
                <div style={{ color: pt.textMuted, fontSize: 12, marginBottom: 10 }}>{subQs.length} questions</div>
                <div style={{
                  background: MCQ_ACCENT, color: '#0f172a', border: 'none', padding: '6px 12px',
                  borderRadius: 999, fontWeight: 700, textAlign: 'center', fontSize: 12, fontFamily: pulseFonts.body
                }}>Practice</div>
              </LiquidGlassCard>
            )
          })}
        </AutoGrid>
      </div>
    </div>
  )
}
