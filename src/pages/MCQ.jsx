import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth, useModules } from '../App'
import { getTheme } from '../theme'
import { useToast } from '../components/ToastProvider'
import ErrorBanner from '../components/ErrorBanner'
import ModuleTabs from '../components/ModuleTabs'
import QuestionPalette from '../components/QuestionPalette'
import ScoreRing from '../components/ScoreRing'
import QuestionSourceBadge from '../components/QuestionSourceBadge'
import AutoGrid from '../components/AutoGrid'
import { fetchModuleStages } from '../lib/moduleStages'
import {
  getGuestFlags, toggleGuestFlag,
  saveGuestIncorrect, enrichGuestFlagsWithResults,
  addGuestHistory
} from '../lib/reviewStorage'
import { loadSavedActiveExam, persistActiveExam, clearActiveExam } from '../lib/activeExam'

const MOCK_MINUTES = 36

export default function MCQ({ dark }) {
  const { user, fetchProfile } = useAuth()
  const { modules, modulesLoaded, modulesError } = useModules()
  const location = useLocation()
  const navigate = useNavigate()
  const showToast = useToast()
  const [subjects, setSubjects] = useState([])
  const [questions, setQuestions] = useState([])
  const [answeredIds, setAnsweredIds] = useState(new Set())
  const [activeModule, setActiveModule] = useState(null)
  const [activeStage, setActiveStage] = useState(() => {
    const params = new URLSearchParams(location.search)
    return params.get('stage') || 'all'
  })
  const [activeSubject, setActiveSubject] = useState('all')
  const [stages, setStages] = useState([])
  const [lessonFilter] = useState(() => {
    const params = new URLSearchParams(location.search)
    return params.get('lesson') || null
  })
  const [subjectFilter] = useState(() => {
    const params = new URLSearchParams(location.search)
    return params.get('subject') || null
  })
  const [quizMode, setQuizMode] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [grading, setGrading] = useState(false)
  // Keyed by question id → { is_correct, correct_answer, explanation }.
  // Filled in only after the server grades the quiz — never before.
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [flaggedIds, setFlaggedIds] = useState(new Set())
  const [resumeData, setResumeData] = useState(null)
  const timerRef = useRef(null)
  const quizStartedAtRef = useRef(null)

  const c = getTheme(dark)

  useEffect(() => {
    fetchData()
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (user) fetchAnsweredIds()
  }, [user])

  useEffect(() => {
    if (modulesLoaded && modules.length > 0 && !activeModule) {
      const params = new URLSearchParams(location.search)
      const moduleParam = params.get('module')
      const fromLink = moduleParam && modules.find(m => m.id === moduleParam)
      if (fromLink) { setActiveModule(fromLink.id); return }
      const active = modules.find(m => m.status === 'active')
      setActiveModule(active ? active.id : modules[0].id)
    }
  }, [modulesLoaded, modules])

  // ── Retry mode: arriving here from the Review page with a specific
  // set of questions to answer again (real grading, not read-only). ──────
  useEffect(() => {
    if (location.state?.retryQuestions?.length) {
      startRetryQuiz(location.state.retryQuestions)
      // Clear the router state so refreshing this page (or navigating
      // back to it later) doesn't restart the same retry quiz.
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  // Arriving from LessonPage with ?lesson=<id> — auto-start a practice
  // quiz scoped to just that lesson's questions, untimed like normal
  // practice, using the same grading path.
  useEffect(() => {
    if (lessonFilter && !quizMode && questions.length > 0) {
      const lessonQs = questions.filter(q => q.lesson_id === lessonFilter)
      startRetryQuiz(lessonQs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonFilter, questions])

  // Arriving from SubjectPage with ?subject=<id> (the "All MCQs"
  // button) — every question tagged to this subject across all its
  // lessons, regardless of exam_type, same untimed/gradable path as a
  // lesson-scoped practice quiz. Skipped if a lesson filter is also
  // present so the two never race each other.
  useEffect(() => {
    if (subjectFilter && !lessonFilter && !quizMode && questions.length > 0) {
      const subjectQs = questions.filter(q => q.subject_id === subjectFilter)
      startRetryQuiz(subjectQs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectFilter, lessonFilter, questions])

  // ── Paused-exam check (Resume) ─────────────────────────────────────────
  // Runs whenever we're back on the module list (not mid-quiz) or the
  // auth state settles, so signing in mid-session also picks up a
  // paused exam saved under the account.
  useEffect(() => {
    if (quizMode) return
    let cancelled = false
    loadSavedActiveExam(user).then(saved => { if (!cancelled) setResumeData(saved) })
    return () => { cancelled = true }
  }, [user, quizMode])

  // Persist quiz progress as it changes, so it can be resumed later.
  // (Retry quizzes are short and re-derivable from the Review page, so
  // there's no need to save/resume those specifically.)
  useEffect(() => {
    if (!quizMode || submitted || quizMode === 'retry') return
    persistActiveExam(user, {
      activeModule, quizMode, quizQuestions, answers, startedAt: quizStartedAtRef.current
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizMode, quizQuestions, answers, submitted])

  // Auto-submit exactly once when the mock-exam timer reaches zero.
  // Using an effect keyed on `timeLeft` (rather than calling submitQuiz
  // directly inside the interval) guarantees this always sees the
  // current quizQuestions/answers, not a stale closure from whenever
  // the interval was created.
  useEffect(() => {
    if (quizMode === 'mock' && !submitted && !grading && timeLeft === 0 && quizQuestions.length > 0) {
      clearInterval(timerRef.current)
      submitQuiz()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  const [usingCache, setUsingCache] = useState(false)

  useEffect(() => {
    fetchModuleStages(activeModule).then(setStages)
  }, [activeModule])

  async function fetchData() {
    setLoading(true)
    const [subRes, qRes] = await Promise.all([
      supabase.from('subjects').select('*').order('name'),
      // Note: deliberately NOT selecting `correct` or `explanation` here —
      // those columns are blocked at the database level for this role
      // anyway (see supabase_secure_mcq.sql). Grading happens server-side
      // via the grade_mcq() function, only after the student submits.
      supabase.from('questions')
        .select('id, question, option_a, option_b, option_c, option_d, exam_type, exam_stage, module_id, subject_id, lesson_id, source, created_at')
        .order('created_at')
    ])

    if (subRes.error || qRes.error) {
      // Offline fallback — reuse the last successfully loaded question
      // bank (cached in localStorage below) so a student without a
      // connection can still browse/answer questions. Submitting still
      // needs a connection, since grading happens server-side by design.
      const cachedSubjects = localStorage.getItem('mcq_subjects_cache')
      const cachedQuestions = localStorage.getItem('mcq_questions_cache')
      if (cachedQuestions) {
        setQuestions(JSON.parse(cachedQuestions))
        setSubjects(cachedSubjects ? JSON.parse(cachedSubjects) : [])
        setUsingCache(true)
      } else {
        setLoadError(true)
      }
    } else {
      if (subRes.data) { setSubjects(subRes.data); localStorage.setItem('mcq_subjects_cache', JSON.stringify(subRes.data)) }
      if (qRes.data) { setQuestions(qRes.data); localStorage.setItem('mcq_questions_cache', JSON.stringify(qRes.data)) }
      setUsingCache(false)
    }
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
      const stageMatch = activeStage === 'all' || (q.exam_stage || 'general') === activeStage
      return modMatch && typeMatch && subMatch && stageMatch
    })
  }

  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }

  // ── Flags: load for the current quiz's questions, and toggle one ──────
  async function loadFlagsFor(ids) {
    if (ids.length === 0) return new Set()
    if (user) {
      const { data } = await supabase.from('flagged_questions').select('question_id').eq('user_id', user.id).in('question_id', ids)
      return new Set((data || []).map(r => r.question_id))
    }
    const flags = getGuestFlags()
    return new Set(flags.filter(f => ids.includes(f.question_id)).map(f => f.question_id))
  }

  async function toggleFlagFor(q) {
    const isFlagged = flaggedIds.has(q.id)
    const next = new Set(flaggedIds)
    if (isFlagged) {
      next.delete(q.id)
      if (user) await supabase.from('flagged_questions').delete().eq('user_id', user.id).eq('question_id', q.id)
      else toggleGuestFlag({ question_id: q.id })
      showToast('Flag removed')
    } else {
      next.add(q.id)
      // Tagged with the question's OWN module (q.module_id), not
      // whichever module tab happens to be active — matters for retry
      // quizzes, which can mix questions from several modules.
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

  // ── Mock-exam timer: always computed from wall-clock elapsed time
  // (not a simple per-second decrement), so it stays accurate even
  // after the tab was backgrounded or the exam was paused and resumed
  // on another day. ──────────────────────────────────────────────────
  function startMockTimer(startedAt) {
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      setTimeLeft(Math.max(0, MOCK_MINUTES * 60 - elapsed))
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
  }

  function startQuiz(type, subjectId = null) {
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

  // Real, gradable retry of a specific set of questions (e.g. everything
  // currently in the student's Incorrect or Flagged list) — untimed,
  // like practice, and graded the exact same way through grade_mcq(),
  // which only needs question ids and doesn't care which module/subject
  // they came from.
  function startRetryQuiz(list) {
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
    loadFlagsFor((resumeData.quizQuestions || []).map(q => q.id)).then(setFlaggedIds)

    if (resumeData.quizMode === 'mock') startMockTimer(resumeData.startedAt)
    setResumeData(null)
  }

  async function discardResume() {
    await clearActiveExam(user)
    setResumeData(null)
  }

  function stopQuiz() {
    // Deliberately does NOT clear the saved paused-exam record — that's
    // exactly what lets the student resume it later. Only the explicit
    // "Discard" button on the resume banner clears it.
    clearInterval(timerRef.current)
    setQuizMode(null)
    setQuizQuestions([])
    setAnswers({})
    setResults({})
    setSubmitted(false)
    setTimeLeft(0)
    setFlaggedIds(new Set())
  }

  function selectAnswer(qi, opt) {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [qi]: opt }))
  }

  function tryAgain() {
    // A retry quiz's question set doesn't come from the normal
    // module/subject filters, so it re-runs the exact same list rather
    // than going through startQuiz()'s filtering logic.
    if (quizMode === 'retry') startRetryQuiz(quizQuestions)
    else startQuiz(quizMode)
  }

  async function submitQuiz() {
    clearInterval(timerRef.current)
    setGrading(true)

    // Ask the server to grade every question in this quiz. The client
    // only ever sends the student's chosen letters — it never had the
    // correct answers to begin with, so there's nothing to fake here.
    const payload = quizQuestions.map((q, i) => ({ id: q.id, answer: answers[i] || null }))
    const { data: graded, error } = await supabase.rpc('grade_mcq', { p_answers: payload })

    if (error) {
      // Likely offline or a network blip — don't mark the quiz as
      // submitted or touch the paused-exam snapshot, so the student's
      // answers are still safely there to retry once back online.
      setGrading(false)
      showToast('⚠️ Could not submit — check your connection and try again', 'error')
      return
    }

    const resultMap = {}
    if (graded) {
      graded.forEach(r => {
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

    // The paused-exam snapshot is only useful while a quiz is still in
    // progress — clear it now that it's graded.
    clearActiveExam(user)

    const total = quizQuestions.length
    const correctCount = quizQuestions.filter(q => resultMap[q.id]?.is_correct).length
    const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0
    const timeSec = quizMode === 'mock' ? Math.max(0, MOCK_MINUTES * 60 - timeLeft) : null
    // Retry quizzes can mix questions from several modules/subjects, so
    // tag the history row with the first question's own module/subject
    // as a best-effort label rather than the (possibly unrelated)
    // currently-active module tab.
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
          // Points are still added through the award_points RPC — the
          // server checked the answers, so this count can be trusted.
          const { error: pointsError } = await supabase.rpc('award_points', { p_amount: newPoints })
          if (!pointsError) {
            fetchProfile(user.id) // refresh the points shown in the header immediately
          }
        }
        fetchAnsweredIds()
      }

      // Per-attempt history log — shown on the profile's History tab.
      supabase.from('exam_history').insert({
        user_id: user.id,
        module_id: historyModuleId,
        quiz_type: quizMode,
        subject_id: historySubjectId,
        total, correct: correctCount, score: scorePercent, time_sec: timeSec
      }).then(({ error: historyError }) => {
        if (historyError) console.warn('[MCQ] exam_history insert failed:', historyError)
      })
    } else if (!user) {
      // Guest — everything lives on this device only.
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
  const optionTexts = (q) => [q.option_a, q.option_b, q.option_c, q.option_d]

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const quizTitle = quizMode === 'mock' ? '📝 Mock Exam' : quizMode === 'retry' ? '🔁 Retry' : '🧪 Practice'

  if (quizMode) {
    const score = submitted ? getScore() : 0
    const total = quizQuestions.length
    const percent = total > 0 ? Math.round((score / total) * 100) : 0
    const timePercent = quizMode === 'mock' ? (timeLeft / (MOCK_MINUTES * 60)) * 100 : 100
    const answeredIndexes = new Set(Object.keys(answers).map(Number))
    const flaggedIndexes = new Set(quizQuestions.map((q, i) => flaggedIds.has(q.id) ? i : null).filter(i => i !== null))

    if (total === 0) return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2 style={{ color: '#e2725b' }}>No questions available yet! 🚧</h2>
        <button onClick={stopQuiz} style={backBtnStyle(dark)}>← Back</button>
      </div>
    )

    return (
      <div className="page-container" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={stopQuiz} style={backBtnStyle(dark)}>← Back</button>
          <h2 style={{ color: '#e2725b', flex: 1, fontSize: 16 }}>{quizTitle}</h2>
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

        {!submitted && !grading && (
          <QuestionPalette
            total={total}
            answeredIndexes={answeredIndexes}
            flaggedIndexes={flaggedIndexes}
            dark={dark}
            onGoTo={(i) => {
              const el = document.getElementById(`mcq-question-${i}`)
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          />
        )}

        {grading && (
          <div style={{ textAlign: 'center', padding: 24, color: c.sub, fontSize: 14 }}>Grading...</div>
        )}

        {submitted && (
          <div style={{
            background: percent >= 60 ? 'linear-gradient(135deg, #064e3b, #059669)' : 'linear-gradient(135deg, #7f1d1d, #dc2626)',
            border: `2px solid ${percent >= 60 ? '#4ade80' : '#f87171'}`,
            borderRadius: 20, padding: 24, textAlign: 'center', marginBottom: 24
          }}>
            <ScoreRing percent={percent} />
            <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginTop: 12, marginBottom: 4 }}>{score}/{total}</div>
            {user && <div style={{ color: '#f59e0b', fontSize: 13, marginTop: 8 }}>⭐ Points earned for new correct answers!</div>}
            <button onClick={tryAgain} style={{
              background: '#38bdf8', color: '#0f172a', border: 'none',
              padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
              fontWeight: 700, fontSize: 14, marginTop: 16, fontFamily: 'inherit'
            }}>🔄 Try Again</button>
          </div>
        )}

        {!grading && quizQuestions.map((q, qi) => {
          const result = results[q.id]
          const isCorrect = submitted && result?.is_correct
          return (
            <div key={qi} id={`mcq-question-${qi}`} style={{
              background: c.card,
              border: submitted
                ? `2px solid ${isCorrect ? '#4ade80' : answers[qi] ? '#f87171' : c.border}`
                : `1px solid ${c.border}`,
              borderRadius: 16, padding: 20, marginBottom: 16, scrollMarginTop: 20
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                <p style={{ color: c.text, fontWeight: 700, fontSize: 14, margin: 0, flex: 1 }}>
                  {qi + 1}. {q.question}
                </p>
                {!submitted && (
                  <button onClick={() => toggleFlagFor(q)} aria-label={flaggedIds.has(q.id) ? 'Remove flag' : 'Flag this question'} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18,
                    color: flaggedIds.has(q.id) ? '#f59e0b' : c.sub, flexShrink: 0, lineHeight: 1, padding: 0
                  }}>🚩</button>
                )}
              </div>
              {q.source && (
                <div style={{ marginBottom: 10 }}>
                  <QuestionSourceBadge source={q.source} />
                </div>
              )}
              {optionTexts(q).map((opt, ai) => {
                const label = optionLabels[ai]
                let bg = c.input, border = c.border, color = c.sub
                if (answers[qi] === label && !submitted) { bg = '#1e3a5f'; border = '#38bdf8'; color = '#38bdf8' }
                if (submitted && result && label === result.correct_answer) { bg = '#064e3b'; border = '#4ade80'; color = '#4ade80' }
                if (submitted && result && answers[qi] === label && label !== result.correct_answer) { bg = '#7f1d1d'; border = '#f87171'; color = '#f87171' }
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
                  background: dark ? '#1e3a5f' : '#f0f9ff',
                  borderRadius: 10, padding: '10px 14px', marginTop: 10,
                  color: c.sub, fontSize: 12
                }}>
                  💡 {result.explanation}
                </div>
              )}
            </div>
          )
        })}

        {!submitted && (
          <button onClick={submitQuiz}
            disabled={Object.keys(answers).length < total || grading}
            style={{
              background: (Object.keys(answers).length < total || grading) ? (dark ? '#1e293b' : '#e2e8f0') : '#38bdf8',
              color: (Object.keys(answers).length < total || grading) ? c.sub : '#0f172a',
              border: 'none', padding: '14px', borderRadius: 12,
              cursor: (Object.keys(answers).length < total || grading) ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: 16, width: '100%',
              fontFamily: 'inherit', marginBottom: 20
            }}>
            {grading
              ? 'Grading...'
              : Object.keys(answers).length < total
                ? `Answer all questions (${Object.keys(answers).length}/${total})`
                : '✅ Submit'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="page-container" style={{ padding: '20px' }}>
      {(loadError || modulesError) && <ErrorBanner />}
      {usingCache && (
        <div style={{
          background: '#f59e0b20', border: '1px solid #f59e0b40', borderRadius: 12,
          padding: '10px 16px', marginBottom: 16, textAlign: 'center', fontSize: 13, color: '#f59e0b'
        }}>
          📴 You're offline — showing questions saved from your last visit. Submitting a quiz needs a connection.
        </div>
      )}
      <h1 style={{ color: '#e2725b', textAlign: 'center', marginBottom: 12 }}>🧪 MCQ Bank</h1>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <button onClick={() => navigate('/review')} style={{
          background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 20,
          padding: '6px 16px', color: c.sub, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700
        }}>📚 Review Incorrect & Flagged</button>
      </div>

      {resumeData && (
        <div style={{
          background: '#e2725b20', border: '1px solid #e2725b40', borderRadius: 12,
          padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 10, flexWrap: 'wrap'
        }}>
          <div style={{ color: '#e2725b', fontSize: 13, fontWeight: 700 }}>
            ⏸ Paused {resumeData.quizMode === 'mock' ? 'mock exam' : 'practice quiz'} — {Object.keys(resumeData.answers || {}).length}/{(resumeData.quizQuestions || []).length} answered
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={resumeExam} style={{
              background: '#e2725b', color: '#0f172a', border: 'none', padding: '6px 14px',
              borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit'
            }}>▶ Continue</button>
            <button onClick={discardResume} style={{
              background: 'transparent', border: '1px solid #e2725b40', color: '#e2725b',
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit'
            }}>Discard</button>
          </div>
        </div>
      )}

      <ModuleTabs
        modules={modules}
        activeModule={activeModule}
        onSelect={(id) => { setActiveModule(id); setActiveSubject('all') }}
        dark={dark}
      />

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
        {[{ value: 'all', label: 'All' }, ...stages.map(s => ({ value: s.value, label: `${s.emoji} ${s.title}` }))].map(stage => (
          <button key={stage.value} onClick={() => setActiveStage(stage.value)} style={{
            ...subBtnStyle, borderColor: activeStage === stage.value ? '#e2725b' : c.border,
            color: activeStage === stage.value ? '#e2725b' : c.sub
          }}>{stage.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24, paddingBottom: 4 }}>
        <button onClick={() => setActiveSubject('all')} style={{
          ...subBtnStyle, borderColor: activeSubject === 'all' ? '#e2725b' : c.border,
          color: activeSubject === 'all' ? '#e2725b' : c.sub
        }}>All</button>
        {moduleSubjects.map(sub => (
          <button key={sub.id} onClick={() => setActiveSubject(sub.id)} style={{
            ...subBtnStyle, borderColor: activeSubject === sub.id ? '#e2725b' : c.border,
            color: activeSubject === sub.id ? '#e2725b' : c.sub
          }}>{sub.name}</button>
        ))}
      </div>

      {loading && <p style={{ color: c.sub, textAlign: 'center' }}>Loading...</p>}

      {/* Mock Exam */}
      <div style={{
        background: c.card, border: '2px solid #e2725b40',
        borderRadius: 20, padding: 24, marginBottom: 16, transition: 'all 0.2s'
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#e2725b'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#e2725b40'}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: '#e2725b', marginBottom: 6 }}>📝 Mock Exam</h3>
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
      <AutoGrid>
        {moduleSubjects.map(sub => {
          const subQs = questions.filter(q =>
            q.subject_id === sub.id &&
            (q.exam_type === 'practice' || q.exam_type === 'both') &&
            (activeStage === 'all' || (q.exam_stage || 'general') === activeStage)
          )
          return (
            <div key={sub.id} style={{
              background: c.card, border: `1px solid ${c.border}`,
              borderRadius: 16, padding: 'clamp(16px, 1.6vw, 24px)', cursor: 'pointer', transition: 'all 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#e2725b'}
              onMouseLeave={e => e.currentTarget.style.borderColor = c.border}
              onClick={() => startQuiz('practice', sub.id)}>
              <div style={{ color: c.text, fontWeight: 700, marginBottom: 6, fontSize: 'clamp(14px, 1.2vw, 17px)' }}>{sub.name}</div>
              <div style={{ color: c.sub, fontSize: 12, marginBottom: 10 }}>{subQs.length} questions</div>
              <button style={{ ...startBtnStyle, width: '100%', fontSize: 12, padding: '6px 12px' }}>
                Practice
              </button>
            </div>
          )
        })}
      </AutoGrid>
    </div>
  )
}

const subBtnStyle = { padding: '6px 14px', borderRadius: 20, background: 'transparent', border: '1px solid', whiteSpace: 'nowrap', fontSize: 12, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }
const startBtnStyle = { background: '#e2725b', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }
const backBtnStyle = (dark) => ({ background: dark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', border: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : '#e2e8f0'}`, borderRadius: 10, padding: '8px 16px', color: dark ? '#94a3b8' : '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' })
