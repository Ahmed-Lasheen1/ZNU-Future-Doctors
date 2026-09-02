// src/pages/MCQ.tsx
import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../supabase'
import { useAuth, useModules } from '../contexts'
import { getPulseTheme, pulseFonts, pulseType } from '../premiumTheme'
import { useToast } from '../components/ToastProvider'
import ErrorBanner from '../components/ErrorBanner'
import QuestionRail from '../components/QuestionRail'
import QuestionSourceBadge from '../components/QuestionSourceBadge'
import LiquidGlassCard from '@/components/ui/liquid-glass-card'
import PulseBackground from '../components/pulse/PulseBackground'
import PulseGlassRow from '../components/pulse/PulseGlassRow'
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

// ── Gradient-aware text colors ──────────────────────────────────────
// PulseBackground's gradient is fixed to the *viewport* (not the
// scrolled page) and always runs pale blue (top) → dark navy (bottom),
// in both themes. Anything rendered directly on it (not inside a
// LiquidGlassCard, which has its own backing) needs colors chosen for
// whichever zone it actually sits in, not the theme's usual card-text
// colors. We force a scroll-to-top whenever a quiz starts or finishes
// (see startTimer-adjacent calls below) so these zone assumptions —
// "the mini status header sits in the light top zone", "everything
// below the first divider sits in the medium/dark zone" — actually
// hold in practice.
const EXAM_TOP_TEXT = '#0a1f3d'                 // dark navy — for the light top of the gradient
const EXAM_TOP_TEXT_MUTED = 'rgba(10,31,61,0.62)'
const EXAM_TOP_AMBER = '#b45309'                // deepened amber — still legible on pale blue
const EXAM_TOP_RED = '#b91c1c'                  // deepened red — still legible on pale blue
const EXAM_LOW_TEXT = '#f5faff'                 // near-white — for the medium/dark lower gradient
const EXAM_LOW_TEXT_MUTED = 'rgba(245,250,255,0.72)'
const EXAM_LOW_SHADOW = '0 1px 6px rgba(1,12,74,0.5)'
const EXAM_DIVIDER = 'rgba(255,255,255,0.28)'   // reads on both light and dark portions

// Small labeled number used on the results screen ("CORRECT 28",
// "INCORRECT 8", "TIME 31:42") — plain typography, no chart chrome.
// Lives in the lower/results zone, so it always carries the legibility
// shadow regardless of the color passed in for its accent.
function StatChip({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 22, color, textShadow: EXAM_LOW_SHADOW }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color, opacity: 0.75, marginTop: 2, textShadow: EXAM_LOW_SHADOW }}>{label}</div>
    </div>
  )
}

// Generic subject/lesson context tag, same pill treatment as
// QuestionSourceBadge — shown next to it based on how broad the
// current quiz is (see showSubjectTag/showLessonTag below).
function InfoTag({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: `${color}20`, border: `1px solid ${color}40`,
      color, borderRadius: 20, padding: '2px 10px',
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap'
    }}>{label}</span>
  )
}

export default function MCQ({ dark }: { dark: boolean }) {
  const { user, fetchProfile } = useAuth() as any
  const { modules, modulesLoaded, modulesError } = useModules() as any
  const location = useLocation()
  const navigate = useNavigate()
  const showToast = useToast() as (message: string, type?: 'success' | 'error') => void
  const pt = getPulseTheme(dark)

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
  // conditions. Grades just that one question via the same grade_mcq
  // RPC already used for full submission, and stores it in the same
  // `results` map the post-submit review already reads — so the
  // reveal UI is shared code, not a separate rendering path.
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
      // Previously this failed completely silently: the student's tap
      // was already recorded in `answers` by selectAnswer, but no
      // reveal ever appeared and nothing told them why — retapping
      // other options looked like it was doing nothing at all. The
      // answer is NOT locked at this point (selectAnswer's lock only
      // engages once results[q.id] actually exists, which never
      // happens here), so nothing needs to be "unlocked" — the fix is
      // purely giving the student an explanation and a next step.
      showToast('⚠️ Could not grade that answer — check your connection and try again', 'error')
    }
  }

  function selectAnswer(qi: number, opt: string) {
    if (submitted) return
    const q = quizQuestions[qi]
    // Once Tutor Mode has revealed a question's answer, it's locked —
    // matches every reference question bank (you commit, then see the
    // answer; you don't get to keep changing it after the reveal).
    if (isTutorMode && q && results[q.id]) return
    setAnswers(prev => ({ ...prev, [qi]: opt }))
    if (isTutorMode) tutorGradeAnswer(qi, opt)
  }

  // Strikethrough / eliminate — a visual-only convenience for ruling
  // out an option, independent of actually selecting an answer. Same
  // pattern used across board-exam software (ExamSoft, BoardVitals):
  // striking an option never selects or excludes it from being
  // selectable, it just crosses it out for the student's own process
  // of elimination.
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

  // Starts a fresh retry quiz made only of the questions the student
  // got wrong, within one subject, from the exam they just finished —
  // real data pulled from this session's own results, nothing invented.
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
    // Results screen also assumes it starts near the top of the gradient.
    window.scrollTo({ top: 0 })

    clearActiveExam(user)

    const total = quizQuestions.length
    const correctCount = quizQuestions.filter(q => resultMap[q.id]?.is_correct).length
    const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0
    const timeSec = quizMode === 'mock' ? Math.max(0, MOCK_MINUTES * 60 - timeLeft) : null
    setFinishTimeSec(quizMode === 'mock' ? (timeSec as number) : elapsedSeconds)
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
  const hoverTint = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)'

  // Gradual urgency for the mock-exam countdown — normal (dark navy,
  // since the timer sits in the light top zone), then a deepened amber
  // under ~28% remaining (~10 min of 36), then a deepened red under
  // ~14% (~5 min). No sudden full-screen warning, just a color shift.
  function timerColor() {
    if (quizMode !== 'mock') return EXAM_TOP_TEXT
    const pctLeft = timeLeft / (MOCK_MINUTES * 60)
    if (pctLeft <= 0.14) return EXAM_TOP_RED
    if (pctLeft <= 0.28) return EXAM_TOP_AMBER
    return EXAM_TOP_TEXT
  }

  // ── Exam mode (taking + results) ────────────────────────────────────
  if (quizMode) {
    const score = submitted ? getScore() : 0
    const total = quizQuestions.length
    const percent = total > 0 ? Math.round((score / total) * 100) : 0
    const answeredIndexes = new Set(Object.keys(answers).map(Number))
    const flaggedIndexes = new Set(quizQuestions.map((q, i) => flaggedIds.has(q.id) ? i : null).filter((i): i is number => i !== null))
    const safeIndex = total > 0 ? Math.min(currentIndex, total - 1) : 0
    const currentQuestion = total > 0 ? quizQuestions[safeIndex] : null
    const answeredCount = Object.keys(answers).length
    const isLastQuestion = safeIndex === total - 1

    // Real per-subject breakdown from this session's own results — no
    // invented numbers. Only subjects actually present among the
    // graded questions are included.
    const subjectStats = submitted ? (() => {
      const map: Record<string, { name: string; total: number; correct: number }> = {}
      quizQuestions.forEach(q => {
        const r = results[q.id]
        if (!q.subject_id || !r) return
        if (!map[q.subject_id]) {
          const subj = subjects.find(s => s.id === q.subject_id)
          map[q.subject_id] = { name: subj?.name || 'Other', total: 0, correct: 0 }
        }
        map[q.subject_id].total++
        if (r.is_correct) map[q.subject_id].correct++
      })
      return Object.entries(map).map(([id, v]) => ({
        id, name: v.name, total: v.total, correct: v.correct,
        incorrect: v.total - v.correct,
        accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0
      })).sort((a, b) => a.accuracy - b.accuracy)
    })() : []
    const weakestSubject = subjectStats.find(s => s.incorrect > 0) || null

    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <PulseBackground />
        <style>{`
          .exam-option { transition: transform 0.12s ease, background 0.15s ease, border-color 0.15s ease; }
          .exam-option:hover { background: var(--opt-hover-bg); }
          .exam-option:active { transform: scale(0.985); }
          .exam-btn { transition: opacity 0.15s ease, transform 0.12s ease; }
          .exam-btn:active { transform: scale(0.97); }
          .kbd-hint { display: none; }
          @media (hover: hover) and (pointer: fine) { .kbd-hint { display: block; } }
        `}</style>

        {/* Short entrance — a quick fade/slide, not a takeover. The
            real site header (rendered above this by App.jsx) stays
            exactly where it is; exam mode is just this page's content. */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'relative', zIndex: 1,
            maxWidth: 'min(1080px, 92vw)', margin: '0 auto',
            padding: '12px clamp(16px, 3vw, 36px) max(16px, env(safe-area-inset-bottom))', fontFamily: pulseFonts.body
          }}
        >
          {/* Minimal status header — sits in the gradient's light top zone */}
          <div style={{ position: 'relative', textAlign: 'center', paddingBottom: 14 }}>
            <button onClick={stopQuiz} className="exam-btn" aria-label="Exit exam" style={{
              position: 'absolute', top: 0, right: 0,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: EXAM_TOP_TEXT_MUTED, fontSize: 11, fontWeight: 700, letterSpacing: 1
            }}>✕ EXIT</button>

            {!submitted && !grading && (
              <button
                onClick={cycleFontScale}
                className="exam-btn"
                aria-label={`Adjust text size (currently ${Math.round(fontScale * 100)}%)`}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: EXAM_TOP_TEXT_MUTED, fontSize: 13, fontWeight: 800, letterSpacing: 0.5
                }}>Aa</button>
            )}

            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: EXAM_TOP_TEXT_MUTED }}>ZNU · EXAM MODE</div>

            {!submitted && !grading && total > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, color: EXAM_TOP_TEXT, marginTop: 8 }}>
                  QUESTION {safeIndex + 1} / {total}
                </div>
                <div style={{
                  fontFamily: 'monospace', fontWeight: 800, fontSize: 24, marginTop: 8,
                  color: timerColor(), transition: 'color 0.5s ease'
                }}>
                  {quizMode === 'mock' ? formatTime(timeLeft) : formatTime(elapsedSeconds)}
                </div>

                {/* Simple time-remaining bar, same color escalation as
                    the timer digits — kept plain rather than layering
                    extra comparison markers on it. */}
                {quizMode === 'mock' && (
                  <div style={{ width: '100%', maxWidth: 220, margin: '10px auto 0', height: 4, borderRadius: 999, background: 'rgba(10,31,61,0.12)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 999,
                      width: `${(timeLeft / (MOCK_MINUTES * 60)) * 100}%`,
                      background: timerColor(), transition: 'width 1s linear, background 0.5s ease'
                    }} />
                  </div>
                )}
              </>
            )}
            {grading && (
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, color: EXAM_TOP_TEXT, marginTop: 8 }}>GRADING…</div>
            )}
            {submitted && (
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, color: EXAM_TOP_TEXT, marginTop: 8 }}>RESULTS</div>
            )}
          </div>

          {total === 0 && !submitted && (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <h2 style={{ color: MCQ_ACCENT, fontSize: 16 }}>No questions available yet! 🚧</h2>
            </div>
          )}

          {grading && (
            <div style={{ textAlign: 'center', padding: 24, color: EXAM_LOW_TEXT, textShadow: EXAM_LOW_SHADOW, fontSize: 14 }}>Grading...</div>
          )}

          {/* ── Active taking: single-question focus, card kept large
              via a direct minHeight floor rather than a flex-stretch
              chain (LiquidGlassCard's own inner layer hardcodes
              height:'100%' against ITS parent — which silently
              resolves to nothing unless that parent already has a
              definite height, so relying on stretch through it is
              fragile). A minHeight works bottom-up regardless of any
              ancestor's sizing: short question → card stays big;
              genuinely long question → card (and page) simply grows
              past the floor and scrolls. */}
          {!submitted && !grading && currentQuestion && (
            <>
              <div style={{ height: 1, background: EXAM_DIVIDER, marginBottom: 16 }} />

              <QuestionRail
                total={total}
                currentIndex={safeIndex}
                answeredIndexes={answeredIndexes}
                flaggedIndexes={flaggedIndexes}
                onGoTo={setCurrentIndex}
                dark={dark}
                accent={MCQ_ACCENT}
              />

              <LiquidGlassCard dark={dark} delay={0} style={{
                minHeight: 'clamp(320px, 58vh, 760px)', boxSizing: 'border-box',
                padding: 'clamp(20px, 3vh, 40px) clamp(22px, 3.5vw, 44px)',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                overflowY: 'auto', overflowX: 'hidden', marginBottom: 14
              }}>
                {(() => {
                  // Real data only: each tag is resolved from the
                  // current question's own subject_id/lesson_id against
                  // the subjects/lessons already fetched — nothing
                  // invented. Which tags show depends on how broad this
                  // quiz is: a mock exam spans every subject, so subject
                  // + lesson + source all help orient the student;
                  // practicing one subject already makes the subject
                  // obvious, so just lesson + source; a lesson-filtered
                  // quiz (detected via the `lesson` URL param, since it
                  // still runs under the general 'retry' quiz mode)
                  // makes both redundant — source only.
                  const subj = subjects.find(s => s.id === currentQuestion.subject_id)
                  const lesson = lessons.find(l => l.id === currentQuestion.lesson_id)
                  const showSubjectTag = quizMode === 'mock' && !!subj
                  const showLessonTag = !lessonFilter && !!lesson
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 14, flexShrink: 0 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: 30, height: 24, padding: '0 9px', borderRadius: 8,
                        background: `${MCQ_ACCENT}22`, border: `1px solid ${MCQ_ACCENT}55`,
                        color: MCQ_ACCENT, fontWeight: 800, fontSize: 12, whiteSpace: 'nowrap'
                      }}>Q{safeIndex + 1}</span>
                      {showSubjectTag && <InfoTag label={subj.name} color={subj.color || '#34d399'} />}
                      {showLessonTag && <InfoTag label={lesson.title} color="#818cf8" />}
                      {currentQuestion.source && <QuestionSourceBadge source={currentQuestion.source} />}
                    </div>
                  )
                })()}

                <p style={{
                  ...pulseType.cardTitle, fontSize: `calc(clamp(18px, 1.8vw, 24px) * ${fontScale})`, color: pt.textPrimary,
                  margin: '0 0 22px', lineHeight: 1.5, flexShrink: 0,
                  wordBreak: 'break-word', overflowWrap: 'anywhere'
                }}>
                  {currentQuestion.question}
                </p>

                {(() => {
                  const revealed = isTutorMode && !!results[currentQuestion.id]
                  const result = results[currentQuestion.id]
                  const struck = struckOut[safeIndex] || new Set<string>()

                  return (
                    <>
                      {optionTexts(currentQuestion).map((opt: string, ai: number) => {
                        const label = optionLabels[ai]
                        const selected = answers[safeIndex] === label
                        const isStruck = struck.has(label)
                        const hoverBg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.045)'

                        // Tutor Mode reveal takes over the color coding
                        // once this question has been graded; otherwise
                        // it's just the normal selectable/selected state.
                        let bg = selected ? `${pt.cobalt}18` : (dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')
                        let border = selected ? pt.cobalt : pt.border
                        let textColor = selected ? pt.cobalt : pt.text
                        let badgeBg = selected ? pt.cobalt : 'transparent'
                        let badgeColor = selected ? '#fff' : pt.sub

                        if (revealed && result) {
                          if (label === result.correct_answer) {
                            bg = 'rgba(74,222,128,0.16)'; border = '#4ade80'; textColor = '#4ade80'
                            badgeBg = '#4ade80'; badgeColor = '#08300f'
                          } else if (label === answers[safeIndex]) {
                            bg = 'rgba(248,113,113,0.16)'; border = '#f87171'; textColor = '#f87171'
                            badgeBg = '#f87171'; badgeColor = '#3a0a0a'
                          } else {
                            textColor = pt.faint
                          }
                        }

                        const hoverBgFinal = revealed ? 'transparent' : selected ? `${pt.cobalt}20` : hoverBg

                        return (
                          <div
                            key={ai}
                            className="exam-option"
                            onClick={() => !revealed && selectAnswer(safeIndex, label)}
                            style={{
                              ['--opt-hover-bg' as any]: hoverBgFinal,
                              display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0, minWidth: 0,
                              background: bg, border: `1.5px solid ${border}`,
                              borderRadius: 14, padding: 'clamp(14px, 1.8vh, 20px) clamp(16px, 2vw, 24px)', marginBottom: 12,
                              cursor: revealed ? 'default' : 'pointer', opacity: isStruck && !revealed ? 0.5 : 1,
                              transition: 'opacity 0.15s ease'
                            }}>
                            <span style={{
                              width: 'clamp(28px, 2.2vw, 34px)', height: 'clamp(28px, 2.2vw, 34px)', borderRadius: '50%', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: badgeBg,
                              border: `1.5px solid ${badgeBg === 'transparent' ? pt.border : badgeBg}`,
                              color: badgeColor, fontWeight: 800, fontSize: 'clamp(12px, 1vw, 14px)',
                              marginTop: -4
                            }}>{label.toUpperCase()}</span>
                            <span style={{
                              flex: 1, minWidth: 0, color: textColor,
                              fontSize: `calc(clamp(14px, 1.2vw, 17px) * ${fontScale})`, fontWeight: 600, lineHeight: 1.45,
                              wordBreak: 'break-word', overflowWrap: 'anywhere',
                              textDecoration: isStruck && !revealed ? 'line-through' : 'none'
                            }}>{opt}</span>
                            {!revealed && (
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleStrike(safeIndex, label) }}
                                aria-pressed={isStruck}
                                aria-label={`Eliminate option ${label.toUpperCase()}`}
                                className="exam-btn"
                                style={{
                                  flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                                  background: isStruck ? (dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)') : 'transparent',
                                  border: `1px solid ${pt.border}`, color: pt.faint,
                                  fontSize: 12, fontWeight: 800, cursor: 'pointer', lineHeight: 1
                                }}>Ø</button>
                            )}
                          </div>
                        )
                      })}

                      {revealed && result && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: result.explanation ? 10 : 0,
                          flexShrink: 0
                        }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800, letterSpacing: 0.5, padding: '3px 10px', borderRadius: 20,
                            background: result.is_correct ? 'rgba(74,222,128,0.16)' : 'rgba(248,113,113,0.16)',
                            color: result.is_correct ? '#4ade80' : '#f87171'
                          }}>{result.is_correct ? '✓ CORRECT' : '✕ INCORRECT'}</span>
                        </div>
                      )}
                      {revealed && result?.explanation && (
                        <div style={{
                          background: dark ? 'rgba(56,189,248,0.10)' : 'rgba(2,132,199,0.06)',
                          borderRadius: 10, padding: '10px 14px', color: pt.sub, fontSize: 12,
                          flexShrink: 0, wordBreak: 'break-word', overflowWrap: 'anywhere'
                        }}>
                          💡 {result.explanation}
                        </div>
                      )}
                    </>
                  )
                })()}
              </LiquidGlassCard>

              <div style={{ height: 1, background: EXAM_DIVIDER, marginBottom: 12 }} />

              {/* FLAG, then PREVIOUS / NEXT — sits in the gradient's medium/dark lower zone */}
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <button onClick={() => toggleFlagFor(currentQuestion)} className="exam-btn" style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: flaggedIds.has(currentQuestion.id) ? pt.amber : EXAM_LOW_TEXT_MUTED,
                  textShadow: EXAM_LOW_SHADOW,
                  fontSize: 12, fontWeight: 700, letterSpacing: 1.5
                }}>🚩 {flaggedIds.has(currentQuestion.id) ? 'FLAGGED' : 'FLAG'}</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12 }}>
                <button onClick={goPrev} disabled={safeIndex === 0} className="exam-btn" style={{
                  background: 'transparent', border: 'none', cursor: safeIndex === 0 ? 'not-allowed' : 'pointer',
                  color: safeIndex === 0 ? 'rgba(245,250,255,0.35)' : EXAM_LOW_TEXT,
                  textShadow: EXAM_LOW_SHADOW, fontSize: 13, fontWeight: 700, letterSpacing: 1.5
                }}>PREVIOUS</button>

                <span style={{ color: EXAM_LOW_TEXT_MUTED, textShadow: EXAM_LOW_SHADOW, fontSize: 11, fontWeight: 700 }}>{answeredCount}/{total}</span>

                {!isLastQuestion ? (
                  <button onClick={goNext} className="exam-btn" style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: pt.cobalt, textShadow: EXAM_LOW_SHADOW, fontSize: 13, fontWeight: 700, letterSpacing: 1.5
                  }}>NEXT</button>
                ) : (
                  <button
                    onClick={() => {
                      const remaining = total - answeredCount
                      if (remaining > 0) {
                        const proceed = window.confirm(
                          `${remaining} question${remaining === 1 ? '' : 's'} left unanswered — submit the exam anyway?`
                        )
                        if (!proceed) return
                      }
                      submitQuiz()
                    }}
                    className="exam-btn"
                    style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: pt.cobalt, textShadow: EXAM_LOW_SHADOW, fontSize: 13, fontWeight: 800, letterSpacing: 1.5
                    }}>SUBMIT</button>
                )}
              </div>

              <div className="kbd-hint" style={{
                textAlign: 'center', color: EXAM_LOW_TEXT_MUTED, textShadow: EXAM_LOW_SHADOW,
                fontSize: 10, fontWeight: 600, letterSpacing: 0.3, paddingBottom: 4
              }}>← → navigate · 1–4 select · F flag</div>
            </>
          )}

          {/* ── Results: analytical instrument ─────────────────────── */}
          {submitted && !grading && !showReview && (
            <div style={{ paddingBottom: 20 }}>
              <div style={{ height: 1, background: EXAM_DIVIDER, marginBottom: 18 }} />

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: EXAM_LOW_TEXT_MUTED, textShadow: EXAM_LOW_SHADOW, marginBottom: 2 }}>
                  {quizMode === 'mock' ? 'MOCK EXAM COMPLETE' : quizMode === 'retry' ? 'RETRY COMPLETE' : 'PRACTICE COMPLETE'}
                </div>
                <div style={{
                  fontFamily: pulseFonts.display, fontWeight: 800, fontSize: 'clamp(52px, 11vw, 104px)',
                  lineHeight: 1, color: EXAM_LOW_TEXT, textShadow: '0 2px 14px rgba(1,12,74,0.55)'
                }}>{percent}</div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: EXAM_LOW_TEXT, textShadow: EXAM_LOW_SHADOW, marginTop: 4 }}>
                  {percent >= 90 ? 'EXCELLENT.' : percent >= 75 ? 'GREAT WORK.' : percent >= 60 ? 'GOOD WORK.' : 'KEEP PRACTICING.'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
                  <StatChip label="CORRECT" value={score} color={pt.success} />
                  <StatChip label="INCORRECT" value={total - score} color={pt.danger} />
                  <StatChip label="TIME" value={formatTime(finishTimeSec)} color={EXAM_LOW_TEXT} />
                </div>
              </div>

              {subjectStats.length > 1 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: EXAM_LOW_TEXT_MUTED, textShadow: EXAM_LOW_SHADOW, marginBottom: 10 }}>YOUR PERFORMANCE</div>
                  {subjectStats.map(s => (
                    <div key={s.id} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: EXAM_LOW_TEXT, textShadow: EXAM_LOW_SHADOW, fontSize: 12, fontWeight: 600 }}>{s.name}</span>
                        <span style={{ color: EXAM_LOW_TEXT_MUTED, textShadow: EXAM_LOW_SHADOW, fontSize: 12, fontWeight: 700 }}>{s.accuracy}</span>
                      </div>
                      <div style={{
                        height: 4, borderRadius: 999, overflow: 'hidden',
                        background: 'rgba(255,255,255,0.15)'
                      }}>
                        <div style={{
                          height: '100%', width: `${s.accuracy}%`, borderRadius: 999,
                          background: s.accuracy >= 60 ? pt.cobalt : pt.danger,
                          transition: 'width 0.6s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {weakestSubject && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: EXAM_LOW_TEXT_MUTED, textShadow: EXAM_LOW_SHADOW, marginBottom: 8 }}>FOCUS NEXT</div>
                  <LiquidGlassCard dark={dark} delay={0} style={{ padding: '16px 20px' }}>
                    <div style={{ color: MCQ_ACCENT, fontWeight: 800, fontSize: 15, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {weakestSubject.name}
                    </div>
                    <div style={{ color: pt.sub, fontSize: 12, marginBottom: 12 }}>
                      You missed {weakestSubject.incorrect} question{weakestSubject.incorrect === 1 ? '' : 's'} from this topic.
                    </div>
                    <button onClick={() => startTargetedPractice(weakestSubject.id)} className="exam-btn" style={{
                      width: '100%', background: MCQ_ACCENT, color: '#0f172a', border: 'none', borderRadius: 999,
                      padding: '11px', fontWeight: 800, fontSize: 12, letterSpacing: 0.5, cursor: 'pointer', fontFamily: pulseFonts.body
                    }}>START TARGETED PRACTICE</button>
                  </LiquidGlassCard>
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                <button onClick={() => setShowReview(true)} className="exam-btn" style={{
                  width: '100%', background: 'rgba(1,12,74,0.28)',
                  border: '1px solid rgba(255,255,255,0.35)', borderRadius: 999, padding: '12px',
                  color: EXAM_LOW_TEXT, textShadow: EXAM_LOW_SHADOW,
                  cursor: 'pointer', fontWeight: 700, fontSize: 13, letterSpacing: 0.5, fontFamily: pulseFonts.body
                }}>🔍 REVIEW ANSWERS</button>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button onClick={tryAgain} className="exam-btn" style={{
                  flex: 1, background: 'rgba(1,12,74,0.28)',
                  border: '1px solid rgba(255,255,255,0.35)', borderRadius: 999, padding: '13px',
                  color: EXAM_LOW_TEXT, textShadow: EXAM_LOW_SHADOW,
                  cursor: 'pointer', fontWeight: 700, fontSize: 13, letterSpacing: 0.5, fontFamily: pulseFonts.body
                }}>TRY AGAIN</button>
                <button onClick={stopQuiz} className="exam-btn" style={{
                  flex: 1, background: pt.cobalt, border: 'none', borderRadius: 999, padding: '13px',
                  color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, letterSpacing: 0.5, fontFamily: pulseFonts.body
                }}>DONE</button>
              </div>
            </div>
          )}

          {/* ── Review Answers: full scrollable per-question breakdown ── */}
          {submitted && !grading && showReview && (
            <div style={{ paddingBottom: 20 }}>
              <div style={{ height: 1, background: EXAM_DIVIDER, marginBottom: 16 }} />

              <button onClick={() => setShowReview(false)} className="exam-btn" style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: EXAM_LOW_TEXT, textShadow: EXAM_LOW_SHADOW,
                fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 16, display: 'block'
              }}>← BACK TO RESULTS</button>

              {quizQuestions.map((q, qi) => {
                const result = results[q.id]
                const isCorrect = result?.is_correct
                const userAnswer = answers[qi]
                const isLast = qi === quizQuestions.length - 1
                // Same real-data tag rules as the taking screen, resolved
                // per question since a mock exam's review list spans
                // multiple subjects/lessons.
                const subj = subjects.find(s => s.id === q.subject_id)
                const lesson = lessons.find(l => l.id === q.lesson_id)
                const showSubjectTag = quizMode === 'mock' && !!subj
                const showLessonTag = !lessonFilter && !!lesson
                return (
                  <div key={qi} style={{ marginBottom: isLast ? 0 : 14 }}>
                    <LiquidGlassCard dark={dark} delay={0} style={{
                      padding: '18px 20px',
                      boxShadow: `inset 0 0 0 2px ${isCorrect ? '#4ade80' : userAnswer ? '#f87171' : 'transparent'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          minWidth: 28, height: 22, padding: '0 8px', borderRadius: 7,
                          background: `${MCQ_ACCENT}22`, border: `1px solid ${MCQ_ACCENT}55`,
                          color: MCQ_ACCENT, fontWeight: 800, fontSize: 11
                        }}>Q{qi + 1}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 800, letterSpacing: 0.5, padding: '2px 9px', borderRadius: 20,
                          background: isCorrect ? 'rgba(74,222,128,0.16)' : 'rgba(248,113,113,0.16)',
                          color: isCorrect ? '#4ade80' : '#f87171'
                        }}>{isCorrect ? '✓ CORRECT' : userAnswer ? '✕ INCORRECT' : '— UNANSWERED'}</span>
                        {showSubjectTag && <InfoTag label={subj.name} color={subj.color || '#34d399'} />}
                        {showLessonTag && <InfoTag label={lesson.title} color="#818cf8" />}
                        {q.source && <QuestionSourceBadge source={q.source} />}
                      </div>

                      <p style={{
                        ...pulseType.cardTitle, color: pt.textPrimary, margin: '0 0 12px',
                        wordBreak: 'break-word', overflowWrap: 'anywhere'
                      }}>{q.question}</p>

                      {optionTexts(q).map((opt: string, ai: number) => {
                        const label = optionLabels[ai]
                        let bg = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
                        let border = pt.border
                        let color = pt.sub
                        if (result && label === result.correct_answer) { bg = 'rgba(74,222,128,0.16)'; border = '#4ade80'; color = '#4ade80' }
                        if (result && userAnswer === label && label !== result.correct_answer) { bg = 'rgba(248,113,113,0.16)'; border = '#f87171'; color = '#f87171' }
                        return (
                          <div key={ai} style={{
                            background: bg, border: `1px solid ${border}`,
                            borderRadius: 10, padding: '10px 14px', marginBottom: 8,
                            color, fontSize: 13, fontWeight: 600,
                            wordBreak: 'break-word', overflowWrap: 'anywhere'
                          }}>
                            {label.toUpperCase()}. {opt}
                          </div>
                        )
                      })}

                      {result?.explanation && (
                        <div style={{
                          background: dark ? 'rgba(56,189,248,0.10)' : 'rgba(2,132,199,0.06)',
                          borderRadius: 10, padding: '10px 14px', marginTop: 8, color: pt.sub, fontSize: 12
                        }}>
                          💡 {result.explanation}
                        </div>
                      )}
                    </LiquidGlassCard>
                  </div>
                )
              })}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setShowReview(false)} className="exam-btn" style={{
                  flex: 1, background: 'rgba(1,12,74,0.28)',
                  border: '1px solid rgba(255,255,255,0.35)', borderRadius: 999, padding: '13px',
                  color: EXAM_LOW_TEXT, textShadow: EXAM_LOW_SHADOW,
                  cursor: 'pointer', fontWeight: 700, fontSize: 13, letterSpacing: 0.5, fontFamily: pulseFonts.body
                }}>← BACK</button>
                <button onClick={stopQuiz} className="exam-btn" style={{
                  flex: 1, background: pt.cobalt, border: 'none', borderRadius: 999, padding: '13px',
                  color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, letterSpacing: 0.5, fontFamily: pulseFonts.body
                }}>DONE</button>
              </div>
            </div>
          )}
        </motion.div>
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

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 28, paddingBottom: 4 }}>
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

        {/* Mock Exam — hero banner */}
        <div style={{ marginBottom: 32 }}>
          <LiquidGlassCard dark={dark} delay={0} style={{ padding: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '22px 24px', flexWrap: 'wrap' }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18, flexShrink: 0,
                background: `${MCQ_ACCENT}22`, border: `1px solid ${MCQ_ACCENT}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28
              }}>📝</div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <h3 style={{ ...pulseType.sectionLabel, fontSize: 15, color: MCQ_ACCENT, marginBottom: 4 }}>Mock Exam</h3>
                <p style={{ color: pt.sub, fontSize: 13 }}>
                  {Math.min(36, getFilteredQuestions('mock').length)} questions · ⏱ 36 minutes
                </p>
              </div>
              <button onClick={() => startQuiz('mock')} style={{
                background: MCQ_ACCENT, color: '#0f172a', border: 'none', padding: '12px 24px',
                borderRadius: 999, fontWeight: 800, cursor: 'pointer', fontFamily: pulseFonts.body, flexShrink: 0
              }}>Start →</button>
            </div>
          </LiquidGlassCard>
        </div>

        {/* Practice by Subject — horizontal scroll-snap carousel */}
        <h3 style={{ ...pulseType.sectionLabel, color: pt.textMuted, marginBottom: 16 }}>Practice by Subject</h3>
        <div style={{
          display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10,
          scrollSnapType: 'x mandatory'
        }}>
          {moduleSubjects.map((sub, i) => {
            const subQs = questions.filter(q =>
              q.subject_id === sub.id &&
              (q.exam_type === 'practice' || q.exam_type === 'both') &&
              (activeStage === 'all' || (q.exam_stage || 'general') === activeStage)
            )
            return (
              <div key={sub.id} style={{ flex: '0 0 auto', width: 'clamp(150px, 40vw, 220px)', scrollSnapAlign: 'start' }}>
                <LiquidGlassCard dark={dark} delay={i * 70}
                  onClick={() => startQuiz('practice', sub.id)}
                  style={{ padding: '20px 18px', height: '100%' }}>
                  <div style={{ color: pt.textPrimary, fontWeight: 700, marginBottom: 8, fontSize: 15 }}>{sub.name}</div>
                  <div style={{ color: pt.textMuted, fontSize: 12, marginBottom: 16 }}>{subQs.length} questions</div>
                  <div style={{
                    background: MCQ_ACCENT, color: '#0f172a', border: 'none', padding: '7px 0',
                    borderRadius: 999, fontWeight: 700, textAlign: 'center', fontSize: 12, fontFamily: pulseFonts.body
                  }}>Practice</div>
                </LiquidGlassCard>
              </div>
            )
          })}
          {moduleSubjects.length === 0 && !loading && (
            <LiquidGlassCard dark={dark} delay={0} style={{ padding: 24, width: '100%', textAlign: 'center' }}>
              <p style={{ color: pt.sub, fontSize: 13 }}>No subjects for this module yet 🚧</p>
            </LiquidGlassCard>
          )}
        </div>
      </div>
    </div>
  )
}
