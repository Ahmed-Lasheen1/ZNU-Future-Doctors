// src/pages/MCQ.tsx
import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth, useModules } from '../contexts'
import { useToast } from '../components/ToastProvider'
import { fetchModuleStages } from '../lib/moduleStages'
import {
  getGuestFlags, toggleGuestFlag,
  saveGuestIncorrect, enrichGuestFlagsWithResults,
  addGuestHistory
} from '../lib/reviewStorage'
import { loadSavedActiveExam, persistActiveExam, clearActiveExam } from '../lib/activeExam'
import { MOCK_MINUTES, optionLabels } from './mcq/mcqShared'
import MCQBrowse from './mcq/MCQBrowse'
import MCQExamFlow from './mcq/MCQExamFlow'

export default function MCQ({ dark }: { dark: boolean }) {
  const { user, fetchProfile } = useAuth() as any
  const { modules, modulesLoaded, modulesError } = useModules() as any
  const location = useLocation()
  const navigate = useNavigate()
  const showToast = useToast() as (message: string, type?: 'success' | 'error') => void

  const [subjects, setSubjects] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [finishTimeSec, setFinishTimeSec] = useState(0)
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set())
  const [resumeData, setResumeData] = useState<any>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showReview, setShowReview] = useState(false)
  const [struckOut, setStruckOut] = useState<Record<number, Set<string>>>({})
  // Adjustable text size for the question/answer text — matches
  // ExamSoft's "Adjust Text Size" control, a standard accessibility
  // feature on every reference exam platform. Persisted like the
  // app's existing theme preference (localStorage, not per-account).
  const FONT_SCALES = [0.9, 1, 1.15, 1.3]
  const [fontScale, setFontScale] = useState<number>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('znu_mcq_font_scale') : null
    const parsed = saved ? parseFloat(saved) : 1
    return FONT_SCALES.includes(parsed) ? parsed : 1
  })
  useEffect(() => { localStorage.setItem('znu_mcq_font_scale', String(fontScale)) }, [fontScale])
  function cycleFontScale() {
    setFontScale(prev => FONT_SCALES[(FONT_SCALES.indexOf(prev) + 1) % FONT_SCALES.length])
  }
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const quizStartedAtRef = useRef<number | null>(null)
  const [usingCache, setUsingCache] = useState(false)

  useEffect(() => {
    fetchSubjects()
    fetchLessons()
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

  // Keyboard shortcuts, desktop only in practice (touch devices don't
  // fire keydown for taps) — plain number keys rather than a modifier
  // combo like ExamSoft's Ctrl/Cmd+Shift+Letter, since this page has
  // no text inputs to conflict with. Ignored while grading/submitted,
  // and skips re-selecting once Tutor Mode has already revealed an
  // answer for the current question.
  useEffect(() => {
    if (!quizMode || submitted || grading) return
    function handleKeyDown(e: KeyboardEvent) {
      const targetTag = (e.target as HTMLElement)?.tagName
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return
      const total = quizQuestions.length
      if (total === 0) return
      const safeIdx = Math.min(currentIndex, total - 1)
      const q = quizQuestions[safeIdx]
      if (!q) return
      const alreadyRevealed = (quizMode === 'practice' || quizMode === 'retry') && !!results[q.id]
      const key = e.key.toLowerCase()

      if (key === 'arrowleft') {
        e.preventDefault()
        setCurrentIndex(i => Math.max(0, i - 1))
      } else if (key === 'arrowright') {
        e.preventDefault()
        setCurrentIndex(i => Math.min(total - 1, i + 1))
      } else if (['1', '2', '3', '4'].includes(key) && !alreadyRevealed) {
        e.preventDefault()
        selectAnswer(safeIdx, optionLabels[Number(key) - 1])
      } else if (key === 'f') {
        e.preventDefault()
        toggleFlagFor(q)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [quizMode, submitted, grading, currentIndex, quizQuestions, results])

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

  async function fetchLessons() {
    const { data, error } = await supabase.from('lessons').select('id, title, subject_id')
    if (error) {
      const cached = localStorage.getItem('mcq_lessons_cache')
      if (cached) setLessons(JSON.parse(cached))
    } else if (data) {
      setLessons(data)
      localStorage.setItem('mcq_lessons_cache', JSON.stringify(data))
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
    if (!q) return
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

  // Unified exam timer — counts down for mock (urgency escalates as it
  // runs low), counts up for practice/retry (so a timer is always
  // visible during an exam). Always clears any previous interval
  // first, since "Try Again" can start a fresh quiz before the old
  // one's own timer has stopped.
  function startTimer(startedAt: number, mode: string) {
    clearInterval(timerRef.current)
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      if (mode === 'mock') setTimeLeft(Math.max(0, MOCK_MINUTES * 60 - elapsed))
      else setElapsedSeconds(elapsed)
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
    setCurrentIndex(0)
    setElapsedSeconds(0)
    setShowReview(false)
    setStruckOut({})
    loadFlagsFor(qs.map(q => q.id)).then(setFlaggedIds)

    quizStartedAtRef.current = Date.now()
    startTimer(quizStartedAtRef.current, type)
    // Entering exam mode should start from a known position — the mini
    // status header assumes it's sitting near the top of the gradient.
    window.scrollTo({ top: 0 })
  }

  function startRetryQuiz(list: any[]) {
    setQuizQuestions(list)
    setAnswers({})
    setResults({})
    setSubmitted(false)
    setQuizMode('retry')
    setResumeData(null)
    setCurrentIndex(0)
    setElapsedSeconds(0)
    setShowReview(false)
    setStruckOut({})
    quizStartedAtRef.current = Date.now()
    startTimer(quizStartedAtRef.current, 'retry')
    loadFlagsFor(list.map(q => q.id)).then(setFlaggedIds)
    window.scrollTo({ top: 0 })
  }

  async function resumeExam() {
    if (!resumeData) return
    setActiveModule(resumeData.activeModule)
    setQuizQuestions(resumeData.quizQuestions || [])
    setAnswers(resumeData.answers || {})
    setResults({})
    setSubmitted(false)
    setQuizMode(resumeData.quizMode)
    setCurrentIndex(0)
    setShowReview(false)
    setStruckOut({})
    quizStartedAtRef.current = resumeData.startedAt
    loadFlagsFor((resumeData.quizQuestions || []).map((q: any) => q.id)).then(setFlaggedIds)

    startTimer(resumeData.startedAt, resumeData.quizMode)
    setResumeData(null)
    window.scrollTo({ top: 0 })
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
    setElapsedSeconds(0)
    setFlaggedIds(new Set())
    setCurrentIndex(0)
    setShowReview(false)
    setStruckOut({})
  }

  // Tutor Mode: practice and retry quizzes reveal correct/incorrect +
  // explanation the instant a question is answered (matches how every
  // major board-exam question bank — UWorld, TrueLearn, BoardVitals —
  // splits "tutor" from "timed" mode). Mock Exam stays strictly
  // deferred until submission, since it's meant to simulate real test
  // conditions.
  const isTutorMode = quizMode === 'practice' || quizMode === 'retry'

  async function tutorGradeAnswer(qi: number, opt: string) {
    const q = quizQuestions[qi]
    if (!q) return
    const { data, error } = await supabase.rpc('grade_mcq', { p_answers: [{ id: q.id, answer: opt }] })
    if (!error && data && data[0]) {
      const r = data[0]
      setResults(prev => ({
        ...prev,
        [q.id]: { is_correct: r.is_correct, correct_answer: r.correct_answer, explanation: r.explanation }
      }))
    } else {
      showToast('⚠️ Could not grade that answer — check your connection and try again', 'error')
    }
  }

  function selectAnswer(qi: number, opt: string) {
    if (submitted) return
    const q = quizQuestions[qi]
    if (isTutorMode && q && results[q.id]) return
    setAnswers(prev => ({ ...prev, [qi]: opt }))
    if (isTutorMode) tutorGradeAnswer(qi, opt)
  }

  function toggleStrike(qi: number, label: string) {
    setStruckOut(prev => {
      const next = { ...prev }
      const set = new Set(next[qi] || [])
      if (set.has(label)) set.delete(label)
      else set.add(label)
      next[qi] = set
      return next
    })
  }

  function goPrev() { setCurrentIndex(i => Math.max(0, i - 1)) }
  function goNext() { setCurrentIndex(i => Math.min(quizQuestions.length - 1, i + 1)) }

  function tryAgain() {
    if (quizMode === 'retry') startRetryQuiz(quizQuestions)
    else startQuiz(quizMode!)
  }

  function startTargetedPractice(subjectId: string) {
    const incorrectQs = quizQuestions
      .filter(q => q.subject_id === subjectId && results[q.id] && !results[q.id].is_correct)
      .map(q => ({
        id: q.id, question: q.question,
        option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d,
        module_id: q.module_id, subject_id: q.subject_id
      }))
    if (incorrectQs.length === 0) return
    startRetryQuiz(incorrectQs)
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
    window.scrollTo({ top: 0 })

    clearActiveExam(user)

    const total = quizQuestions.length
    const correctCount = quizQuestions.filter(q => resultMap[q.id]?.is_correct).length
    const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0
    const timeSec = quizMode === 'mock' ? Math.max(0, MOCK_MINUTES * 60 - timeLeft) : null
    setFinishTimeSec(quizMode === 'mock' ? (timeSec as number) : elapsedSeconds)
    const retryModuleIsUniform = quizMode === 'retry' && quizQuestions.every(q => q.module_id === quizQuestions[0]?.module_id)
    const retrySubjectIsUniform = quizMode === 'retry' && quizQuestions.every(q => q.subject_id === quizQuestions[0]?.subject_id)
    const historyModuleId = quizMode === 'retry'
      ? (retryModuleIsUniform ? (quizQuestions[0]?.module_id || null) : null)
      : activeModule
    const historySubjectId = quizMode === 'practice'
      ? (quizQuestions[0]?.subject_id || null)
      : quizMode === 'retry'
        ? (retrySubjectIsUniform ? (quizQuestions[0]?.subject_id || null) : null)
        : null

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

  // ── Exam mode (taking + results) ────────────────────────────────────
  if (quizMode) {
    return (
      <MCQExamFlow
        dark={dark}
        quizMode={quizMode}
        submitted={submitted}
        grading={grading}
        quizQuestions={quizQuestions}
        answers={answers}
        results={results}
        flaggedIds={flaggedIds}
        struckOut={struckOut}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        timeLeft={timeLeft}
        elapsedSeconds={elapsedSeconds}
        finishTimeSec={finishTimeSec}
        fontScale={fontScale}
        cycleFontScale={cycleFontScale}
        showReview={showReview}
        setShowReview={setShowReview}
        subjects={subjects}
        lessons={lessons}
        lessonFilter={lessonFilter}
        stopQuiz={stopQuiz}
        submitQuiz={submitQuiz}
        tryAgain={tryAgain}
        startTargetedPractice={startTargetedPractice}
        selectAnswer={selectAnswer}
        toggleStrike={toggleStrike}
        toggleFlagFor={toggleFlagFor}
        goPrev={goPrev}
        goNext={goNext}
      />
    )
  }

  // ── Module / subject browsing view ─────────────────────────────────
  return (
    <MCQBrowse
      dark={dark}
      modulesError={modulesError}
      loadError={loadError}
      usingCache={usingCache}
      resumeData={resumeData}
      onResume={resumeExam}
      onDiscardResume={discardResume}
      activeModuleObj={activeModuleObj}
      stages={stages}
      activeStage={activeStage}
      onSelectStage={setActiveStage}
      moduleSubjects={moduleSubjects}
      activeSubject={activeSubject}
      onSelectSubject={setActiveSubject}
      loading={loading}
      questions={questions}
      getFilteredQuestions={getFilteredQuestions}
      onStartQuiz={startQuiz}
    />
  )
}
