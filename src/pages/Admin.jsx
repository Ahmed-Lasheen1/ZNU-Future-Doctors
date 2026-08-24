import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth, useModules } from '../App'
import { getTheme, inputStyle } from '../theme'
import { fetchModulesSorted } from '../lib/modules'
import { EXAM_STAGES as STAGE_META } from '../lib/examStages'
import { fetchModuleStages } from '../lib/moduleStages'
import InlineMessage from '../components/InlineMessage'

const EXAM_STAGES = STAGE_META.map(s => ({ value: s.value, label: `${s.emoji} ${s.title}` }))

// Cap on list queries below (files/schedules/questions/summaries) so the
// admin panel stays fast as content grows. 200 is far more than the app
// has today — bump this if the module ever genuinely needs more rows
// listed here at once.
const LIST_LIMIT = 200

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'stage'
}

export default function Admin({ dark }) {
  const { user, profile } = useAuth()
  const { refreshModules } = useModules()
  const navigate = useNavigate()
  const isAuth = profile?.role === 'admin'
  const [activeTab, setActiveTab] = useState('modules')
  const [modules, setModules] = useState([])
  const [subjects, setSubjects] = useState([])
  const [files, setFiles] = useState([])
  const [schedules, setSchedules] = useState([])
  const [questions, setQuestions] = useState([])
  const [summaries, setSummaries] = useState([])
  const [lessons, setLessons] = useState([])
  const [difficulty, setDifficulty] = useState([])
  const [difficultyLoading, setDifficultyLoading] = useState(false)
  const [msg, setMsg] = useState('')

  // ── Modules ──────────────────────────────────────────────────
  const [editingModuleId, setEditingModuleId] = useState(null)
  const [modName, setModName] = useState('')
  const [modColor, setModColor] = useState('#38bdf8')
  const [modIcon, setModIcon] = useState('📚')
  const [modStatus, setModStatus] = useState('active')

  // ── Subjects ─────────────────────────────────────────────────
  const [editingSubjectId, setEditingSubjectId] = useState(null)
  const [subName, setSubName] = useState('')
  const [subModuleId, setSubModuleId] = useState('')
  const [subType, setSubType] = useState('both')

  // ── Files ────────────────────────────────────────────────────
  const [editingFileId, setEditingFileId] = useState(null)
  const [fileName, setFileName] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileType, setFileType] = useState('sharah')
  const [fileFileType, setFileFileType] = useState('pdf')
  const [fileModuleId, setFileModuleId] = useState('')
  const [fileSubjectId, setFileSubjectId] = useState('')
  const [fileExamStage, setFileExamStage] = useState('tbl')
  const [fileStageOptions, setFileStageOptions] = useState(EXAM_STAGES)

  // ── Schedules ────────────────────────────────────────────────
  const [editingScheduleId, setEditingScheduleId] = useState(null)
  const [schTitle, setSchTitle] = useState('')
  const [schUrl, setSchUrl] = useState('')
  const [schType, setSchType] = useState('study')
  const [schModuleId, setSchModuleId] = useState('')
  const [schDate, setSchDate] = useState('')

  // ── Lessons ──────────────────────────────────────────────────
  const [editingLessonId, setEditingLessonId] = useState(null)
  const [lessonModuleId, setLessonModuleId] = useState('')
  const [lessonSubjectId, setLessonSubjectId] = useState('')
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonSummaryUrl, setLessonSummaryUrl] = useState('')

  // ── Per-module exam stages ───────────────────────────────────
  const [stageModuleId, setStageModuleId] = useState('')
  const [moduleStagesList, setModuleStagesList] = useState([])
  const [stagesIsCustom, setStagesIsCustom] = useState(false)
  const [stagesLoading, setStagesLoading] = useState(false)
  const [stagesSaving, setStagesSaving] = useState(false)

  // ── Questions ────────────────────────────────────────────────
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [qText, setQText] = useState('')
  const [qA, setQA] = useState('')
  const [qB, setQB] = useState('')
  const [qC, setQC] = useState('')
  const [qD, setQD] = useState('')
  const [qCorrect, setQCorrect] = useState('a')
  const [qExplanation, setQExplanation] = useState('')
  const [qModuleId, setQModuleId] = useState('')
  const [qSubjectId, setQSubjectId] = useState('')
  const [qLessonId, setQLessonId] = useState('')
  const [qExamType, setQExamType] = useState('both')
  const [qExamStage, setQExamStage] = useState('tbl')
  const [qStageOptions, setQStageOptions] = useState(EXAM_STAGES)
  const [qSource, setQSource] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)

  // ── Summaries ────────────────────────────────────────────────
  const [editingSummaryId, setEditingSummaryId] = useState(null)
  const [sumTitle, setSumTitle] = useState('')
  const [sumUrl, setSumUrl] = useState('')
  const [sumModuleId, setSumModuleId] = useState('')
  const [sumExamStage, setSumExamStage] = useState('tbl')
  const [sumStageOptions, setSumStageOptions] = useState(EXAM_STAGES)

  // ── Settings ─────────────────────────────────────────────────
  const [announcement, setAnnouncement] = useState('')
  const [announcementSaving, setAnnouncementSaving] = useState(false)
  const [driveUrl, setDriveUrl] = useState('')
  const [stageDriveUrls, setStageDriveUrls] = useState({ tbl: '', end_module: '', practical: '', final: '' })
  const [driveUrlSaving, setDriveUrlSaving] = useState(false)
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastBody, setBroadcastBody] = useState('')
  const [broadcastSending, setBroadcastSending] = useState(false)

  const c = {
    ...getTheme(dark),
    bg: dark ? '#0f172a' : '#f8fafc',
  }

  useEffect(() => {
    if (isAuth) {
      fetchModules(); fetchSubjects(); fetchFiles(); fetchSchedules(); fetchQuestions()
      fetchSummaries(); fetchLessons(); fetchAnnouncement()
    }
  }, [isAuth])

  useEffect(() => {
    if (isAuth && activeTab === 'analytics') fetchDifficulty()
  }, [isAuth, activeTab])

  useEffect(() => {
    if (isAuth && activeTab === 'stages' && stageModuleId) loadModuleStagesForAdmin(stageModuleId)
  }, [isAuth, activeTab, stageModuleId])

  // Every place that lets an admin pick an exam stage for a piece of
  // content should offer THAT module's actual stage set, not just the
  // 4 global defaults — so these three re-fetch whenever the relevant
  // module selector changes.
  useEffect(() => {
    fetchModuleStages(fileModuleId).then(list => setFileStageOptions(list.map(s => ({ value: s.value, label: `${s.emoji} ${s.title}` }))))
  }, [fileModuleId])
  useEffect(() => {
    fetchModuleStages(qModuleId).then(list => setQStageOptions(list.map(s => ({ value: s.value, label: `${s.emoji} ${s.title}` }))))
  }, [qModuleId])
  useEffect(() => {
    fetchModuleStages(sumModuleId).then(list => setSumStageOptions(list.map(s => ({ value: s.value, label: `${s.emoji} ${s.title}` }))))
  }, [sumModuleId])

  async function fetchAnnouncement() {
    const keys = ['home_announcement', 'drive_url', ...STAGE_META.map(s => `drive_url_${s.value}`)]
    const { data } = await supabase.from('site_settings').select('key, value').in('key', keys)
    if (data) {
      const byKey = Object.fromEntries(data.map(r => [r.key, r.value || '']))
      setAnnouncement(byKey['home_announcement'] || '')
      setDriveUrl(byKey['drive_url'] || '')
      setStageDriveUrls({
        tbl: byKey['drive_url_tbl'] || '',
        end_module: byKey['drive_url_end_module'] || '',
        practical: byKey['drive_url_practical'] || '',
        final: byKey['drive_url_final'] || '',
      })
    }
  }

  async function saveAnnouncement() {
    setAnnouncementSaving(true)
    const { error } = await supabase.from('site_settings').upsert({ key: 'home_announcement', value: announcement.trim() })
    setAnnouncementSaving(false)
    showMsg(error ? '❌ ' + error.message : '✅ Announcement updated!')
  }

  async function saveDriveLinks() {
    setDriveUrlSaving(true)
    const upserts = [
      { key: 'drive_url', value: driveUrl.trim() },
      ...STAGE_META.map(s => ({ key: `drive_url_${s.value}`, value: (stageDriveUrls[s.value] || '').trim() }))
    ]
    const { error } = await supabase.from('site_settings').upsert(upserts)
    setDriveUrlSaving(false)
    showMsg(error ? '❌ ' + error.message : '✅ Drive links updated!')
  }

  // Sends a real push notification to every registered device — see
  // api/push/broadcast.js. The server independently re-checks that
  // this account has role='admin' before sending anything.
  async function sendBroadcast() {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return showMsg('❌ Please fill in both fields')
    setBroadcastSending(true)
    const { data: { session } } = await supabase.auth.getSession()
    try {
      const res = await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ title: broadcastTitle.trim(), body: broadcastBody.trim() })
      })
      const result = await res.json()
      setBroadcastSending(false)
      if (!res.ok) return showMsg('❌ ' + (result.error || 'Failed to send'))
      showMsg(`✅ Sent to ${result.sent} device(s)!`)
      setBroadcastTitle(''); setBroadcastBody('')
    } catch (e) {
      setBroadcastSending(false)
      showMsg('❌ Network error — please try again')
    }
  }

  async function fetchModules() {
    const { modules: sorted } = await fetchModulesSorted()
    setModules(sorted)
    refreshModules()
  }

  async function fetchSubjects() {
    const { data } = await supabase.from('subjects').select('*').order('created_at')
    if (data) setSubjects(data)
  }

  async function fetchLessons() {
    const { data } = await supabase.from('lessons').select('*').order('created_at', { ascending: false }).limit(LIST_LIMIT)
    if (data) setLessons(data)
  }

  function showMsg(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  // ── Modules: add or update ───────────────────────────────────
  function editModule(mod) {
    setEditingModuleId(mod.id)
    setModName(mod.name); setModColor(mod.color); setModIcon(mod.icon); setModStatus(mod.status)
  }
  function resetModuleForm() {
    setEditingModuleId(null); setModName(''); setModColor('#38bdf8'); setModIcon('📚'); setModStatus('active')
  }
  async function saveModule() {
    if (!modName) return
    const dup = modules.some(m => m.name.trim().toLowerCase() === modName.trim().toLowerCase() && m.id !== editingModuleId)
    if (dup) return showMsg('❌ A module with this name already exists')

    if (editingModuleId) {
      const { error } = await supabase.from('modules').update({ name: modName, color: modColor, icon: modIcon, status: modStatus }).eq('id', editingModuleId)
      if (!error) { showMsg('✅ Module updated!'); resetModuleForm(); fetchModules() }
      else showMsg('❌ ' + error.message)
    } else {
      const { error } = await supabase.from('modules').insert([{ name: modName, color: modColor, icon: modIcon, status: modStatus }])
      if (!error) { showMsg('✅ Module added!'); resetModuleForm(); fetchModules() }
      else showMsg('❌ ' + error.message)
    }
  }

  async function toggleModuleStatus(mod) {
    const newStatus = mod.status === 'active' ? 'completed' : 'active'
    await supabase.from('modules').update({ status: newStatus }).eq('id', mod.id)
    fetchModules()
  }

  async function deleteModule(id) {
    if (!confirm('Delete this module? This will also permanently delete all its subjects, files, schedules, questions and summaries. This cannot be undone.')) return
    if (editingModuleId === id) resetModuleForm()
    const { error } = await supabase.from('modules').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Module deleted')
    fetchModules()
  }

  // ── Subjects: add or update ──────────────────────────────────
  function editSubject(sub) {
    setEditingSubjectId(sub.id)
    setSubModuleId(sub.module_id); setSubName(sub.name); setSubType(sub.type)
  }
  function resetSubjectForm() {
    setEditingSubjectId(null); setSubName(''); setSubType('both')
  }
  async function saveSubject() {
    if (!subName || !subModuleId) return
    const existing = subjects.filter(s => s.module_id === subModuleId && s.id !== editingSubjectId)
    if (existing.some(s => s.name.trim().toLowerCase() === subName.trim().toLowerCase())) {
      return showMsg('❌ This subject already exists in that module')
    }
    if (editingSubjectId) {
      const { error } = await supabase.from('subjects').update({ name: subName, module_id: subModuleId, type: subType }).eq('id', editingSubjectId)
      if (!error) { showMsg('✅ Subject updated!'); resetSubjectForm(); fetchSubjects() }
      else showMsg('❌ ' + error.message)
    } else {
      const { error } = await supabase.from('subjects').insert([{ name: subName, module_id: subModuleId, type: subType }])
      if (!error) { showMsg('✅ Subject added!'); resetSubjectForm(); fetchSubjects() }
      else showMsg('❌ ' + error.message)
    }
  }

  async function deleteSubject(id) {
    if (!confirm('Delete this subject? Its files, lessons and questions will also be deleted. This cannot be undone.')) return
    if (editingSubjectId === id) resetSubjectForm()
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Subject deleted')
    fetchSubjects()
  }

  async function fetchFiles() {
    // Newest first, capped at LIST_LIMIT — keeps the admin panel fast as
    // the file library grows instead of pulling every row every time.
    const { data } = await supabase.from('files').select('*').order('created_at', { ascending: false }).limit(LIST_LIMIT)
    if (data) setFiles(data)
  }

  async function fetchSchedules() {
    const { data } = await supabase.from('schedules').select('*').order('created_at', { ascending: false }).limit(LIST_LIMIT)
    if (data) setSchedules(data)
  }

  async function fetchQuestions() {
    // Note: `correct` and `explanation` are intentionally excluded — those
    // two columns are blocked at the database level for everyone (see
    // supabase_secure_mcq.sql), including this admin panel's LIST view.
    // Editing a specific question instead goes through admin_get_question
    // / admin_update_question (see supabase_lessons_stages_and_admin_edit.sql),
    // which check the caller is actually an admin before revealing them.
    const { data } = await supabase
      .from('questions')
      .select('id, question, module_id, subject_id, lesson_id, exam_type, exam_stage, source, created_at')
      .order('created_at', { ascending: false })
      .limit(LIST_LIMIT)
    if (data) setQuestions(data)
  }

  async function fetchSummaries() {
    const { data } = await supabase.from('summaries').select('*').order('created_at', { ascending: false }).limit(LIST_LIMIT)
    if (data) setSummaries(data)
  }

  // Aggregate error-rate report across ALL students — see
  // get_question_difficulty() in supabase_analytics_and_anon_tracking.sql.
  // Only meaningful once questions have enough attempts (default: 3+),
  // so a single unlucky guess doesn't make a question look "hard".
  async function fetchDifficulty() {
    setDifficultyLoading(true)
    const { data, error } = await supabase.rpc('get_question_difficulty', { p_min_attempts: 3 })
    if (!error && data) setDifficulty(data)
    setDifficultyLoading(false)
  }

  async function deleteFile(id) {
    if (!confirm('Delete this file? This cannot be undone.')) return
    if (editingFileId === id) resetFileForm()
    const { error } = await supabase.from('files').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ File deleted')
    fetchFiles()
  }

  async function deleteSchedule(id) {
    if (!confirm('Delete this schedule? This cannot be undone.')) return
    if (editingScheduleId === id) resetScheduleForm()
    const { error } = await supabase.from('schedules').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Schedule deleted')
    fetchSchedules()
  }

  async function deleteQuestion(id) {
    if (!confirm('Delete this question? This cannot be undone.')) return
    if (editingQuestionId === id) resetQuestionForm()
    const { error } = await supabase.from('questions').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Question deleted')
    fetchQuestions()
  }

  async function deleteSummary(id) {
    if (!confirm('Delete this summary? This cannot be undone.')) return
    if (editingSummaryId === id) resetSummaryForm()
    const { error } = await supabase.from('summaries').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Summary deleted')
    fetchSummaries()
  }

  // ── Files: add or update ─────────────────────────────────────
  function editFile(f) {
    setEditingFileId(f.id)
    setFileName(f.name); setFileUrl(f.url); setFileType(f.type); setFileFileType(f.file_type)
    setFileModuleId(f.module_id); setFileSubjectId(f.subject_id || ''); setFileExamStage(f.exam_stage)
  }
  function resetFileForm() {
    setEditingFileId(null); setFileName(''); setFileUrl('')
  }
  async function saveFile() {
    if (!fileName || !fileUrl || !fileModuleId) return
    const payload = {
      name: fileName, url: fileUrl, type: fileType,
      file_type: fileFileType, module_id: fileModuleId,
      subject_id: fileSubjectId || null, exam_stage: fileExamStage
    }
    if (editingFileId) {
      const { error } = await supabase.from('files').update(payload).eq('id', editingFileId)
      if (!error) { showMsg('✅ File updated!'); resetFileForm(); fetchFiles() }
      else showMsg('❌ ' + error.message)
    } else {
      const { error } = await supabase.from('files').insert([payload])
      if (!error) { showMsg('✅ File added!'); resetFileForm(); fetchFiles() }
      else showMsg('❌ ' + error.message)
    }
  }

  // ── Schedules: add or update ─────────────────────────────────
  function editSchedule(s) {
    setEditingScheduleId(s.id)
    setSchTitle(s.title); setSchUrl(s.url); setSchType(s.type); setSchModuleId(s.module_id); setSchDate(s.date || '')
  }
  function resetScheduleForm() {
    setEditingScheduleId(null); setSchTitle(''); setSchUrl(''); setSchDate('')
  }
  async function saveSchedule() {
    if (!schTitle || !schUrl || !schModuleId) return
    const payload = {
      title: schTitle, url: schUrl, type: schType, module_id: schModuleId,
      date: schType === 'exam' && schDate ? schDate : null
    }
    if (editingScheduleId) {
      const { error } = await supabase.from('schedules').update(payload).eq('id', editingScheduleId)
      if (!error) { showMsg('✅ Schedule updated!'); resetScheduleForm(); fetchSchedules() }
      else showMsg('❌ ' + error.message)
    } else {
      const { error } = await supabase.from('schedules').insert([payload])
      if (!error) { showMsg('✅ Schedule added!'); resetScheduleForm(); fetchSchedules() }
      else showMsg('❌ ' + error.message)
    }
  }

  // ── Lessons: add or update ───────────────────────────────────
  function editLesson(l) {
    setEditingLessonId(l.id)
    setLessonModuleId(l.module_id); setLessonSubjectId(l.subject_id)
    setLessonTitle(l.title); setLessonSummaryUrl(l.summary_url || '')
  }
  function resetLessonForm() {
    setEditingLessonId(null); setLessonTitle(''); setLessonSummaryUrl('')
  }
  async function saveLesson() {
    if (!lessonTitle || !lessonSubjectId || !lessonModuleId) return showMsg('❌ Pick a module, subject, and title first')
    const payload = { title: lessonTitle, summary_url: lessonSummaryUrl || null, subject_id: lessonSubjectId, module_id: lessonModuleId }
    if (editingLessonId) {
      const { error } = await supabase.from('lessons').update(payload).eq('id', editingLessonId)
      if (!error) { showMsg('✅ Lesson updated!'); resetLessonForm(); fetchLessons() }
      else showMsg('❌ ' + error.message)
    } else {
      const { error } = await supabase.from('lessons').insert([payload])
      if (!error) { showMsg('✅ Lesson added!'); resetLessonForm(); fetchLessons() }
      else showMsg('❌ ' + error.message)
    }
  }
  async function deleteLesson(id) {
    if (!confirm('Delete this lesson? Questions tagged to it keep their module/subject tags but lose the lesson link. This cannot be undone.')) return
    if (editingLessonId === id) resetLessonForm()
    const { error } = await supabase.from('lessons').delete().eq('id', id)
    showMsg(error ? '❌ ' + error.message : '✅ Lesson deleted')
    fetchLessons()
  }

  // ── Per-module exam stages ───────────────────────────────────
  async function loadModuleStagesForAdmin(moduleId) {
    setStagesLoading(true)
    const { data } = await supabase.from('module_exam_stages').select('*').eq('module_id', moduleId).order('position')
    if (data && data.length > 0) {
      setModuleStagesList(data.map(s => ({ id: s.id, value: s.value, title: s.title, emoji: s.emoji, color: s.color })))
      setStagesIsCustom(true)
    } else {
      setModuleStagesList(STAGE_META.map(s => ({ id: null, value: s.value, title: s.title, emoji: s.emoji, color: s.color })))
      setStagesIsCustom(false)
    }
    setStagesLoading(false)
  }

  function updateStageField(index, field, val) {
    setModuleStagesList(prev => prev.map((s, i) => i === index ? { ...s, [field]: val } : s))
  }
  function removeStageRow(index) {
    setModuleStagesList(prev => prev.filter((_, i) => i !== index))
  }
  function addStageRow() {
    const existingValues = moduleStagesList.map(s => s.value)
    let value = 'new_stage'
    let suffix = 1
    while (existingValues.includes(value)) { value = `new_stage_${suffix}`; suffix++ }
    setModuleStagesList(prev => [...prev, { id: null, value, title: 'New Stage', emoji: '📌', color: '#64748b' }])
  }

  async function saveModuleStages() {
    if (!stageModuleId) return
    if (moduleStagesList.length === 0) return showMsg('❌ A module needs at least one exam stage')
    setStagesSaving(true)
    // Simplest correct approach: replace the whole set atomically rather
    // than diffing row-by-row (a module only has a handful of stages).
    await supabase.from('module_exam_stages').delete().eq('module_id', stageModuleId)
    const rows = moduleStagesList.map((s, i) => ({
      module_id: stageModuleId,
      value: s.value || slugify(s.title),
      title: s.title || 'Stage',
      emoji: s.emoji || '📌',
      color: s.color || '#64748b',
      position: i
    }))
    const { error } = await supabase.from('module_exam_stages').insert(rows)
    setStagesSaving(false)
    if (error) return showMsg('❌ ' + error.message)
    showMsg('✅ Stages saved for this module!')
    setStagesIsCustom(true)
    loadModuleStagesForAdmin(stageModuleId)
  }

  async function resetModuleStages() {
    if (!stageModuleId) return
    if (!confirm("Reset this module to the 4 default exam stages? Custom stages you added will be removed — anything already tagged with a removed stage keeps that tag, it just won't have a matching button anymore.")) return
    setStagesSaving(true)
    await supabase.from('module_exam_stages').delete().eq('module_id', stageModuleId)
    setStagesSaving(false)
    showMsg('✅ Reset to default stages')
    loadModuleStagesForAdmin(stageModuleId)
  }

  // ── Questions: add or update ─────────────────────────────────
  async function editQuestion(q) {
    // The list view above never has `correct`/`explanation` — those are
    // locked down at the DB level for everyone except this one admin-only
    // RPC, which double-checks role='admin' itself before returning them.
    const { data, error } = await supabase.rpc('admin_get_question', { p_question_id: q.id })
    if (error || !data || data.length === 0) return showMsg('❌ Could not load this question for editing')
    const full = data[0]
    setEditingQuestionId(full.id)
    setQText(full.question); setQA(full.option_a); setQB(full.option_b); setQC(full.option_c); setQD(full.option_d)
    setQCorrect(full.correct || 'a'); setQExplanation(full.explanation || '')
    setQExamType(full.exam_type); setQExamStage(full.exam_stage)
    setQModuleId(full.module_id); setQSubjectId(full.subject_id || '')
    setQLessonId(full.lesson_id || ''); setQSource(full.source || '')
    setBulkMode(false)
  }
  function resetQuestionForm() {
    setEditingQuestionId(null)
    setQText(''); setQA(''); setQB(''); setQC(''); setQD(''); setQCorrect('a'); setQExplanation(''); setQLessonId('')
  }
  async function saveQuestion() {
    if (!qText || !qA || !qB || !qC || !qD || !qModuleId) return
    if (editingQuestionId) {
      const { error } = await supabase.rpc('admin_update_question', {
        p_id: editingQuestionId,
        p_question: qText, p_option_a: qA, p_option_b: qB, p_option_c: qC, p_option_d: qD,
        p_correct: qCorrect, p_explanation: qExplanation, p_exam_type: qExamType, p_exam_stage: qExamStage,
        p_module_id: qModuleId, p_subject_id: qSubjectId || null, p_lesson_id: qLessonId || null, p_source: qSource || null
      })
      if (!error) { showMsg('✅ Question updated!'); resetQuestionForm(); fetchQuestions() }
      else showMsg('❌ ' + error.message)
    } else {
      const { error } = await supabase.from('questions').insert([{
        question: qText, option_a: qA, option_b: qB, option_c: qC, option_d: qD,
        correct: qCorrect, explanation: qExplanation, exam_type: qExamType,
        exam_stage: qExamStage, module_id: qModuleId, subject_id: qSubjectId || null,
        lesson_id: qLessonId || null, source: qSource || null
      }])
      if (!error) { showMsg('✅ Question added!'); resetQuestionForm(); fetchQuestions() }
      else showMsg('❌ ' + error.message)
    }
  }

  // Parses a block of pasted text into multiple questions at once.
  // Expected format per question, separated by a blank line:
  //   Q: question text
  //   A) option a
  //   B) option b
  //   C) option c
  //   D) option d
  //   Correct: B
  //   Explanation: optional explanation
  function parseBulkQuestions(text) {
    const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
    const questions = []
    const errors = []

    blocks.forEach((block, idx) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
      const qLine = lines.find(l => /^Q[:\-]/i.test(l))
      const aLine = lines.find(l => /^A[)\.\-]/i.test(l))
      const bLine = lines.find(l => /^B[)\.\-]/i.test(l))
      const cLine = lines.find(l => /^C[)\.\-]/i.test(l))
      const dLine = lines.find(l => /^D[)\.\-]/i.test(l))
      const correctLine = lines.find(l => /^Correct[:\-]/i.test(l))
      const explLine = lines.find(l => /^Explanation[:\-]/i.test(l))

      if (!qLine || !aLine || !bLine || !cLine || !dLine || !correctLine) {
        errors.push(`Question ${idx + 1}: missing Q/A/B/C/D/Correct line`)
        return
      }
      const correctLetter = correctLine.replace(/^Correct[:\-]/i, '').trim().toLowerCase().charAt(0)
      if (!['a', 'b', 'c', 'd'].includes(correctLetter)) {
        errors.push(`Question ${idx + 1}: "Correct" must be A, B, C or D`)
        return
      }
      questions.push({
        question: qLine.replace(/^Q[:\-]/i, '').trim(),
        option_a: aLine.replace(/^A[)\.\-]/i, '').trim(),
        option_b: bLine.replace(/^B[)\.\-]/i, '').trim(),
        option_c: cLine.replace(/^C[)\.\-]/i, '').trim(),
        option_d: dLine.replace(/^D[)\.\-]/i, '').trim(),
        correct: correctLetter,
        explanation: explLine ? explLine.replace(/^Explanation[:\-]/i, '').trim() : '',
      })
    })

    return { questions, errors }
  }

  async function bulkAddQuestions() {
    if (!qModuleId) return showMsg('❌ Please select a module first')
    if (!bulkText.trim()) return showMsg('❌ Paste some questions first')

    const { questions: parsed, errors } = parseBulkQuestions(bulkText)
    if (errors.length > 0) {
      showMsg(`❌ ${errors.length} question(s) have a formatting problem — ${errors[0]}`)
      return
    }
    if (parsed.length === 0) return showMsg('❌ No questions found in the text')

    setBulkSaving(true)
    const rows = parsed.map(q => ({
      ...q,
      exam_type: qExamType,
      exam_stage: qExamStage,
      module_id: qModuleId,
      subject_id: qSubjectId || null,
      lesson_id: qLessonId || null,
      source: qSource || null
    }))
    const { error } = await supabase.from('questions').insert(rows)
    setBulkSaving(false)

    if (error) { showMsg('❌ ' + error.message); return }
    showMsg(`✅ ${rows.length} questions added!`)
    setBulkText('')
    fetchQuestions()
  }

  // ── Summaries: add or update ─────────────────────────────────
  function editSummary(s) {
    setEditingSummaryId(s.id)
    setSumTitle(s.title); setSumUrl(s.url); setSumModuleId(s.module_id); setSumExamStage(s.exam_stage)
  }
  function resetSummaryForm() {
    setEditingSummaryId(null); setSumTitle(''); setSumUrl('')
  }
  async function saveSummary() {
    if (!sumTitle || !sumUrl || !sumModuleId) return
    const payload = { title: sumTitle, url: sumUrl, module_id: sumModuleId, exam_stage: sumExamStage }
    if (editingSummaryId) {
      const { error } = await supabase.from('summaries').update(payload).eq('id', editingSummaryId)
      if (!error) { showMsg('✅ Summary updated!'); resetSummaryForm(); fetchSummaries() }
      else showMsg('❌ ' + error.message)
    } else {
      const { error } = await supabase.from('summaries').insert([payload])
      if (!error) { showMsg('✅ Summary added!'); resetSummaryForm(); fetchSummaries() }
      else showMsg('❌ ' + error.message)
    }
  }

  const activeModules = modules.filter(m => m.status === 'active')
  const completedModules = modules.filter(m => m.status !== 'active')
  const filteredSubjects = (moduleId) => subjects.filter(s => s.module_id === moduleId)
  const filteredLessons = (subjectId) => lessons.filter(l => l.subject_id === subjectId)

  const inStyle = inputStyle(c)

  const ModuleSelect = ({ value, onChange }) => (
    <select value={value} onChange={onChange} style={inStyle}>
      <option value="">Select Module</option>
      {activeModules.length > 0 && (
        <optgroup label="🟢 Active">
          {activeModules.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
        </optgroup>
      )}
      {completedModules.length > 0 && (
        <optgroup label="✅ Completed">
          {completedModules.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
        </optgroup>
      )}
    </select>
  )

  if (!isAuth) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: c.card, padding: 30, borderRadius: 20, width: '90%', maxWidth: 400, border: `1px solid ${c.border}`, textAlign: 'center' }}>
        <h3 style={{ color: '#38bdf8', marginBottom: 12 }}>🔐 Admin Panel</h3>
        <p style={{ color: c.sub, fontSize: 13, marginBottom: 20 }}>
          {user
            ? "Your account doesn't have admin access."
            : 'Sign in with your admin account to continue.'}
        </p>
        <button onClick={() => navigate(user ? '/' : '/auth')} style={btnStyle}>
          {user ? '← Back to Home' : 'Sign In'}
        </button>
      </div>
    </div>
  )

  const tabs = ['modules', 'subjects', 'lessons', 'files', 'schedules', 'questions', 'summaries', 'stages', 'analytics', 'settings']

  return (
    <div className="page-container" style={{ padding: '20px', maxWidth: '650px' }}>
      <h2 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: 20 }}>⚙️ Admin Panel</h2>

      <InlineMessage message={msg} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 8 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
            fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'inherit', fontSize: 12,
            background: activeTab === t ? '#38bdf8' : c.card,
            color: activeTab === t ? '#0f172a' : c.sub,
            border: `1px solid ${activeTab === t ? '#38bdf8' : c.border}`
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {activeTab === 'modules' && (
        <div>
          <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}`, marginBottom: 16 }}>
            <h3 style={{ color: '#38bdf8', marginBottom: 16 }}>{editingModuleId ? '✏️ Edit Module' : '➕ Add Module'}</h3>
            <input placeholder="Module name" value={modName} onChange={e => setModName(e.target.value)} style={inStyle} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Icon</label>
                <input placeholder="Emoji" value={modIcon} onChange={e => setModIcon(e.target.value)} style={inStyle} />
              </div>
              <div>
                <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Color</label>
                <input type="color" value={modColor} onChange={e => setModColor(e.target.value)} style={{ ...inStyle, padding: 4, height: 42 }} />
              </div>
              <div>
                <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Status</label>
                <select value={modStatus} onChange={e => setModStatus(e.target.value)} style={inStyle}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveModule} style={{ ...btnStyle, flex: 1 }}>{editingModuleId ? 'Save Changes' : 'Add Module'}</button>
              {editingModuleId && <button onClick={resetModuleForm} style={cancelBtnStyle(c)}>Cancel</button>}
            </div>
          </div>

          {activeModules.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ color: '#22c55e', marginBottom: 8 }}>🟢 Active</h4>
              {activeModules.map(mod => (
                <div key={mod.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{mod.icon}</span>
                    <div style={{ color: mod.color, fontWeight: 700 }}>{mod.name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => editModule(mod)} aria-label={`Edit module: ${mod.name}`} style={{ ...miniBtn, borderColor: '#38bdf8', color: '#38bdf8' }}>✏️</button>
                    <button onClick={() => toggleModuleStatus(mod)} style={{ ...miniBtn, borderColor: '#f59e0b', color: '#f59e0b' }}>⏸ Done</button>
                    <button onClick={() => deleteModule(mod.id)} aria-label={`Delete module: ${mod.name}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {completedModules.length > 0 && (
            <div>
              <h4 style={{ color: '#64748b', marginBottom: 8 }}>✅ Completed</h4>
              {completedModules.map(mod => (
                <div key={mod.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{mod.icon}</span>
                    <div style={{ color: mod.color, fontWeight: 700 }}>{mod.name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => editModule(mod)} aria-label={`Edit module: ${mod.name}`} style={{ ...miniBtn, borderColor: '#38bdf8', color: '#38bdf8' }}>✏️</button>
                    <button onClick={() => toggleModuleStatus(mod)} style={{ ...miniBtn, borderColor: '#22c55e', color: '#22c55e' }}>▶ Active</button>
                    <button onClick={() => deleteModule(mod.id)} aria-label={`Delete module: ${mod.name}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'subjects' && (
        <div>
          <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}`, marginBottom: 16 }}>
            <h3 style={{ color: '#38bdf8', marginBottom: 16 }}>{editingSubjectId ? '✏️ Edit Subject' : '➕ Add Subject'}</h3>
            <ModuleSelect value={subModuleId} onChange={e => setSubModuleId(e.target.value)} />
            <input placeholder="Subject name" value={subName} onChange={e => setSubName(e.target.value)} style={inStyle} />
            <select value={subType} onChange={e => setSubType(e.target.value)} style={inStyle}>
              <option value="both">Theory + Practical</option>
              <option value="theory">Theory Only</option>
              <option value="practical">Practical Only</option>
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveSubject} style={{ ...btnStyle, flex: 1 }}>{editingSubjectId ? 'Save Changes' : 'Add Subject'}</button>
              {editingSubjectId && <button onClick={resetSubjectForm} style={cancelBtnStyle(c)}>Cancel</button>}
            </div>
          </div>
          {modules.map(mod => {
            const subs = filteredSubjects(mod.id)
            if (subs.length === 0) return null
            return (
              <div key={mod.id} style={{ marginBottom: 16 }}>
                <h4 style={{ color: mod.color, marginBottom: 8 }}>{mod.icon} {mod.name}</h4>
                {subs.map(sub => (
                  <div key={sub.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: c.text, fontWeight: 600 }}>{sub.name}</span>
                      <span style={{ color: c.sub, fontSize: 12, marginLeft: 8 }}>· {sub.type}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => editSubject(sub)} aria-label={`Edit subject: ${sub.name}`} style={{ ...miniBtn, borderColor: '#38bdf8', color: '#38bdf8' }}>✏️</button>
                      <button onClick={() => deleteSubject(sub.id)} aria-label={`Delete subject: ${sub.name}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'lessons' && (
        <div>
          <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}`, marginBottom: 16 }}>
            <h3 style={{ color: '#38bdf8', marginBottom: 8 }}>{editingLessonId ? '✏️ Edit Lesson' : '➕ Add Lesson'}</h3>
            <p style={{ color: c.sub, fontSize: 13, marginBottom: 16 }}>
              A lesson lives under a subject and shows two things to students: a summary link and its own tagged
              question set (tag questions to a lesson from the Questions tab).
            </p>
            <ModuleSelect value={lessonModuleId} onChange={e => { setLessonModuleId(e.target.value); setLessonSubjectId('') }} />
            {lessonModuleId && (
              <select value={lessonSubjectId} onChange={e => setLessonSubjectId(e.target.value)} style={inStyle}>
                <option value="">Select Subject</option>
                {filteredSubjects(lessonModuleId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            <input placeholder="Lesson title" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} style={inStyle} />
            <input placeholder="Summary URL (optional)" value={lessonSummaryUrl} onChange={e => setLessonSummaryUrl(e.target.value)} style={inStyle} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveLesson} style={{ ...btnStyle, flex: 1 }}>{editingLessonId ? 'Save Changes' : 'Add Lesson'}</button>
              {editingLessonId && <button onClick={resetLessonForm} style={cancelBtnStyle(c)}>Cancel</button>}
            </div>
          </div>

          {modules.map(mod => {
            const modSubjects = filteredSubjects(mod.id)
            const modLessons = lessons.filter(l => l.module_id === mod.id)
            if (modLessons.length === 0) return null
            return (
              <div key={mod.id} style={{ marginBottom: 16 }}>
                <h4 style={{ color: mod.color, marginBottom: 8 }}>{mod.icon} {mod.name}</h4>
                {modSubjects.map(sub => {
                  const subLessons = modLessons.filter(l => l.subject_id === sub.id)
                  if (subLessons.length === 0) return null
                  return (
                    <div key={sub.id} style={{ marginBottom: 10 }}>
                      <div style={{ color: c.sub, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{sub.name}</div>
                      {subLessons.map(l => (
                        <div key={l.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: c.text, fontWeight: 600 }}>{l.title}</span>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => editLesson(l)} aria-label={`Edit lesson: ${l.title}`} style={{ ...miniBtn, borderColor: '#38bdf8', color: '#38bdf8' }}>✏️</button>
                            <button onClick={() => deleteLesson(l.id)} aria-label={`Delete lesson: ${l.title}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'files' && (
        <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
          <h3 style={{ color: '#38bdf8', marginBottom: 16 }}>{editingFileId ? '✏️ Edit File / Recording' : '➕ Add File / Recording'}</h3>
          <input placeholder="File name" value={fileName} onChange={e => setFileName(e.target.value)} style={inStyle} />
          <input placeholder="URL (Drive / YouTube / SoundCloud)" value={fileUrl} onChange={e => setFileUrl(e.target.value)} style={inStyle} />
          <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Content Type</label>
          <select value={fileType} onChange={e => setFileType(e.target.value)} style={inStyle}>
            <option value="sharah">📖 Explanation Files</option>
            <option value="questions">❓ Question Files</option>
            <option value="lectures">🎥 Lecture Recordings</option>
            <option value="courses">🎓 Course Recordings</option>
          </select>
          <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>File Type</label>
          <select value={fileFileType} onChange={e => setFileFileType(e.target.value)} style={inStyle}>
            <option value="pdf">📄 PDF</option>
            <option value="video">🎥 Video</option>
            <option value="audio">🎵 Audio</option>
          </select>
          <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Module</label>
          <ModuleSelect value={fileModuleId} onChange={e => { setFileModuleId(e.target.value); setFileSubjectId('') }} />
          {fileModuleId && (
            <>
              <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Subject (optional)</label>
              <select value={fileSubjectId} onChange={e => setFileSubjectId(e.target.value)} style={inStyle}>
                <option value="">All Subjects</option>
                {filteredSubjects(fileModuleId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </>
          )}
          <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Exam Stage</label>
          <select value={fileExamStage} onChange={e => setFileExamStage(e.target.value)} style={inStyle}>
            {fileStageOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveFile} style={{ ...btnStyle, flex: 1 }}>{editingFileId ? 'Save Changes' : 'Add File'}</button>
            {editingFileId && <button onClick={resetFileForm} style={cancelBtnStyle(c)}>Cancel</button>}
          </div>
        </div>
      )}

      {activeTab === 'files' && files.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {modules.map(mod => {
            const modFiles = files.filter(f => f.module_id === mod.id)
            if (modFiles.length === 0) return null
            return (
              <div key={mod.id} style={{ marginBottom: 16 }}>
                <h4 style={{ color: mod.color, marginBottom: 8 }}>{mod.icon} {mod.name}</h4>
                {modFiles.map(f => (
                  <div key={f.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: c.text, fontWeight: 600 }}>{f.name}</span>
                      <span style={{ color: c.sub, fontSize: 12, marginLeft: 8 }}>· {f.type} · {f.file_type}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => editFile(f)} aria-label={`Edit file: ${f.name}`} style={{ ...miniBtn, borderColor: '#38bdf8', color: '#38bdf8' }}>✏️</button>
                      <button onClick={() => deleteFile(f.id)} aria-label={`Delete file: ${f.name}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'schedules' && (
        <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
          <h3 style={{ color: '#38bdf8', marginBottom: 16 }}>{editingScheduleId ? '✏️ Edit Schedule' : '➕ Add Schedule'}</h3>
          <input placeholder="Title (e.g. Week 1)" value={schTitle} onChange={e => setSchTitle(e.target.value)} style={inStyle} />
          <input placeholder="Image URL (Google Drive)" value={schUrl} onChange={e => setSchUrl(e.target.value)} style={inStyle} />
          <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Type</label>
          <select value={schType} onChange={e => setSchType(e.target.value)} style={inStyle}>
            <option value="study">📅 Study Schedule</option>
            <option value="exam">📝 Exam Schedule</option>
          </select>
          {schType === 'exam' && (
            <>
              <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Exam Date (for reminder notifications)</label>
              <input type="date" value={schDate} onChange={e => setSchDate(e.target.value)} style={inStyle} />
            </>
          )}
          <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Module</label>
          <ModuleSelect value={schModuleId} onChange={e => setSchModuleId(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveSchedule} style={{ ...btnStyle, flex: 1 }}>{editingScheduleId ? 'Save Changes' : 'Add Schedule'}</button>
            {editingScheduleId && <button onClick={resetScheduleForm} style={cancelBtnStyle(c)}>Cancel</button>}
          </div>
        </div>
      )}

      {activeTab === 'schedules' && schedules.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {modules.map(mod => {
            const modSchedules = schedules.filter(s => s.module_id === mod.id)
            if (modSchedules.length === 0) return null
            return (
              <div key={mod.id} style={{ marginBottom: 16 }}>
                <h4 style={{ color: mod.color, marginBottom: 8 }}>{mod.icon} {mod.name}</h4>
                {modSchedules.map(s => (
                  <div key={s.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: c.text, fontWeight: 600 }}>{s.title}</span>
                      <span style={{ color: c.sub, fontSize: 12, marginLeft: 8 }}>· {s.type}{s.date ? ` · 📅 ${s.date}` : ''}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => editSchedule(s)} aria-label={`Edit schedule: ${s.title}`} style={{ ...miniBtn, borderColor: '#38bdf8', color: '#38bdf8' }}>✏️</button>
                      <button onClick={() => deleteSchedule(s.id)} aria-label={`Delete schedule: ${s.title}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'questions' && (
        <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ color: '#38bdf8' }}>
              {editingQuestionId ? '✏️ Edit Question' : bulkMode ? '📋 Bulk Add Questions' : '➕ Add MCQ Question'}
            </h3>
            {!editingQuestionId && (
              <button onClick={() => setBulkMode(!bulkMode)} style={{
                background: 'transparent', border: `1px solid ${c.border}`,
                borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                color: c.sub, fontFamily: 'inherit', fontSize: 12, fontWeight: 700
              }}>{bulkMode ? '✏️ Single Add' : '📋 Bulk Add'}</button>
            )}
          </div>

          <ModuleSelect value={qModuleId} onChange={e => { setQModuleId(e.target.value); setQSubjectId(''); setQLessonId('') }} />
          {qModuleId && (
            <select value={qSubjectId} onChange={e => { setQSubjectId(e.target.value); setQLessonId('') }} style={inStyle}>
              <option value="">All Subjects</option>
              {filteredSubjects(qModuleId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          {qSubjectId && filteredLessons(qSubjectId).length > 0 && (
            <>
              <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Lesson (optional)</label>
              <select value={qLessonId} onChange={e => setQLessonId(e.target.value)} style={inStyle}>
                <option value="">No specific lesson</option>
                {filteredLessons(qSubjectId).map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </>
          )}
          <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Use In</label>
          <select value={qExamType} onChange={e => setQExamType(e.target.value)} style={inStyle}>
            <option value="both">Practice + Mock Exam</option>
            <option value="practice">Practice Only</option>
            <option value="mock">Mock Exam Only</option>
          </select>
          <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Exam Stage</label>
          <select value={qExamStage} onChange={e => setQExamStage(e.target.value)} style={inStyle}>
            {qStageOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Source (optional)</label>
          <select value={qSource} onChange={e => setQSource(e.target.value)} style={inStyle}>
            <option value="">No tag</option>
            <option value="ai">🤖 AI</option>
            <option value="courses">📚 Courses</option>
            <option value="university">🎓 University Doctors</option>
          </select>

          {bulkMode && !editingQuestionId ? (
            <>
              <p style={{ color: c.sub, fontSize: 12, marginBottom: 8, lineHeight: 1.6 }}>
                Paste as many questions as you want below, one after another,
                separated by an empty line. Every question in this box will
                be added to the module/subject/type selected above. Format:
              </p>
              <pre style={{
                background: c.input, border: `1px solid ${c.border}`, borderRadius: 10,
                padding: 12, fontSize: 11, color: c.sub, marginBottom: 12,
                whiteSpace: 'pre-wrap', lineHeight: 1.6
              }}>{`Q: What is the powerhouse of the cell?
A) Nucleus
B) Mitochondria
C) Ribosome
D) Golgi apparatus
Correct: B
Explanation: Mitochondria produce ATP.

Q: Second question here...
A) ...
B) ...
C) ...
D) ...
Correct: A`}</pre>
              <textarea
                placeholder="Paste your questions here..."
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                style={{ ...inStyle, minHeight: 240, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} />
              <button onClick={bulkAddQuestions} disabled={bulkSaving} style={btnStyle}>
                {bulkSaving ? 'Adding...' : 'Parse & Add All'}
              </button>
            </>
          ) : (
            <>
              <textarea placeholder="Question" value={qText} onChange={e => setQText(e.target.value)} style={{ ...inStyle, minHeight: 80, resize: 'vertical' }} />
              {['A', 'B', 'C', 'D'].map((opt, i) => (
                <input key={opt} placeholder={`Option ${opt}`}
                  value={[qA, qB, qC, qD][i]}
                  onChange={e => [setQA, setQB, setQC, setQD][i](e.target.value)}
                  style={inStyle} />
              ))}
              <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Correct Answer</label>
              <select value={qCorrect} onChange={e => setQCorrect(e.target.value)} style={inStyle}>
                <option value="a">A</option>
                <option value="b">B</option>
                <option value="c">C</option>
                <option value="d">D</option>
              </select>
              <textarea placeholder="Explanation (optional)" value={qExplanation} onChange={e => setQExplanation(e.target.value)} style={{ ...inStyle, minHeight: 60, resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveQuestion} style={{ ...btnStyle, flex: 1 }}>{editingQuestionId ? 'Save Changes' : 'Add Question'}</button>
                {editingQuestionId && <button onClick={resetQuestionForm} style={cancelBtnStyle(c)}>Cancel</button>}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'questions' && questions.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {modules.map(mod => {
            const modQuestions = questions.filter(q => q.module_id === mod.id)
            if (modQuestions.length === 0) return null
            return (
              <div key={mod.id} style={{ marginBottom: 16 }}>
                <h4 style={{ color: mod.color, marginBottom: 8 }}>{mod.icon} {mod.name} <span style={{ color: c.sub, fontSize: 12, fontWeight: 400 }}>({modQuestions.length})</span></h4>
                {modQuestions.map(q => (
                  <div key={q.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: c.text, fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question}</span>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => editQuestion(q)} aria-label="Edit question" style={{ ...miniBtn, borderColor: '#38bdf8', color: '#38bdf8' }}>✏️</button>
                      <button onClick={() => deleteQuestion(q.id)} aria-label="Delete question" style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'summaries' && (
        <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
          <h3 style={{ color: '#38bdf8', marginBottom: 16 }}>{editingSummaryId ? '✏️ Edit Summary' : '➕ Add Summary'}</h3>
          <ModuleSelect value={sumModuleId} onChange={e => setSumModuleId(e.target.value)} />
          <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Exam Stage</label>
          <select value={sumExamStage} onChange={e => setSumExamStage(e.target.value)} style={inStyle}>
            {sumStageOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <input placeholder="Title (e.g. End Module Exam)" value={sumTitle} onChange={e => setSumTitle(e.target.value)} style={inStyle} />
          <input placeholder="Summary URL" value={sumUrl} onChange={e => setSumUrl(e.target.value)} style={inStyle} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveSummary} style={{ ...btnStyle, flex: 1 }}>{editingSummaryId ? 'Save Changes' : 'Add Summary'}</button>
            {editingSummaryId && <button onClick={resetSummaryForm} style={cancelBtnStyle(c)}>Cancel</button>}
          </div>
        </div>
      )}

      {activeTab === 'summaries' && summaries.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {modules.map(mod => {
            const modSummaries = summaries.filter(s => s.module_id === mod.id)
            if (modSummaries.length === 0) return null
            return (
              <div key={mod.id} style={{ marginBottom: 16 }}>
                <h4 style={{ color: mod.color, marginBottom: 8 }}>{mod.icon} {mod.name}</h4>
                {modSummaries.map(s => (
                  <div key={s.id} style={{ background: c.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${c.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: c.text, fontWeight: 600 }}>{s.title}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => editSummary(s)} aria-label={`Edit summary: ${s.title}`} style={{ ...miniBtn, borderColor: '#38bdf8', color: '#38bdf8' }}>✏️</button>
                      <button onClick={() => deleteSummary(s.id)} aria-label={`Delete summary: ${s.title}`} style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'stages' && (
        <div>
          <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}`, marginBottom: 16 }}>
            <h3 style={{ color: '#38bdf8', marginBottom: 8 }}>🎯 Exam Stages per Module</h3>
            <p style={{ color: c.sub, fontSize: 13, marginBottom: 16 }}>
              Every module starts with the same 4 default stages (TBL, End Module, Practical, Final). Pick a module
              below to rename, add, or remove stages just for that module — everywhere else keeps the defaults
              until you save changes here.
            </p>
            <ModuleSelect value={stageModuleId} onChange={e => setStageModuleId(e.target.value)} />
          </div>

          {stageModuleId && (
            <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
              {stagesLoading && <p style={{ color: c.sub, textAlign: 'center' }}>Loading...</p>}

              {!stagesLoading && (
                <>
                  <div style={{
                    fontSize: 12, fontWeight: 700, marginBottom: 16,
                    color: stagesIsCustom ? '#f59e0b' : c.sub
                  }}>
                    {stagesIsCustom ? '⚙️ Custom stages for this module' : '📌 Showing global defaults (not yet customized)'}
                  </div>

                  {moduleStagesList.map((stage, i) => (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '50px 1fr 70px 1fr auto', gap: 8,
                      alignItems: 'center', marginBottom: 10
                    }}>
                      <input value={stage.emoji} onChange={e => updateStageField(i, 'emoji', e.target.value)}
                        style={{ ...inStyle, marginTop: 0, textAlign: 'center', padding: '8px 4px' }} />
                      <input value={stage.title} onChange={e => updateStageField(i, 'title', e.target.value)}
                        style={{ ...inStyle, marginTop: 0 }} />
                      <input type="color" value={stage.color} onChange={e => updateStageField(i, 'color', e.target.value)}
                        style={{ ...inStyle, marginTop: 0, padding: 4, height: 42 }} />
                      <div style={{ color: c.sub, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {stage.value}
                      </div>
                      <button onClick={() => removeStageRow(i)} aria-label="Remove stage"
                        style={{ ...miniBtn, borderColor: '#ef4444', color: '#ef4444' }}>🗑</button>
                    </div>
                  ))}

                  <button onClick={addStageRow} style={{
                    background: 'transparent', border: `1px dashed ${c.border}`, borderRadius: 10,
                    padding: '10px', width: '100%', cursor: 'pointer', color: c.sub,
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 700, marginBottom: 16
                  }}>+ Add Stage</button>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveModuleStages} disabled={stagesSaving} style={{ ...btnStyle, flex: 1 }}>
                      {stagesSaving ? 'Saving...' : '✅ Save Stages'}
                    </button>
                    {stagesIsCustom && (
                      <button onClick={resetModuleStages} disabled={stagesSaving} style={cancelBtnStyle(c)}>
                        Reset to Default
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div>
          <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}`, marginBottom: 16 }}>
            <h3 style={{ color: '#38bdf8', marginBottom: 8 }}>📊 Hardest Questions</h3>
            <p style={{ color: c.sub, fontSize: 13 }}>
              Questions with the highest wrong-answer rate across all students (minimum 3 attempts).
              Worth double-checking these for a wording issue or a wrong answer key.
            </p>
          </div>

          {difficultyLoading && <p style={{ color: c.sub, textAlign: 'center' }}>Loading...</p>}

          {!difficultyLoading && difficulty.length === 0 && (
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <p style={{ color: c.sub }}>Not enough attempts yet to report on 🚧</p>
            </div>
          )}

          {difficulty.map(row => {
            const mod = modules.find(m => m.id === row.module_id)
            return (
              <div key={row.question_id} style={{
                background: c.card, border: `1px solid ${c.border}`, borderRadius: 14,
                padding: '14px 18px', marginBottom: 10, display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', gap: 12
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    color: c.text, fontWeight: 600, fontSize: 13,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>{row.question}</div>
                  <div style={{ color: c.sub, fontSize: 11, marginTop: 4 }}>
                    {mod ? `${mod.icon} ${mod.name}` : ''} · {row.incorrect_count}/{row.total_attempts} wrong
                  </div>
                </div>
                <div style={{
                  background: row.error_rate >= 70 ? '#ef444420' : '#f59e0b20',
                  color: row.error_rate >= 70 ? '#ef4444' : '#f59e0b',
                  borderRadius: 20, padding: '4px 12px', fontWeight: 900, fontSize: 13, flexShrink: 0
                }}>{row.error_rate}%</div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'settings' && (
        <div>
          <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}`, marginBottom: 16 }}>
            <h3 style={{ color: '#38bdf8', marginBottom: 8 }}>📢 Send Push Notification to Everyone</h3>
            <p style={{ color: c.sub, fontSize: 13, marginBottom: 16 }}>
              Delivered instantly to every device with notifications enabled — even if they don't have the site open right now.
            </p>
            <input placeholder="Title (e.g. New questions added!)" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} style={inStyle} />
            <textarea placeholder="Message" value={broadcastBody} onChange={e => setBroadcastBody(e.target.value)} style={{ ...inStyle, minHeight: 70, resize: 'vertical' }} />
            <button onClick={sendBroadcast} disabled={broadcastSending} style={btnStyle}>
              {broadcastSending ? 'Sending...' : '📤 Send to Everyone'}
            </button>
          </div>

          <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}`, marginBottom: 16 }}>
            <h3 style={{ color: '#38bdf8', marginBottom: 8 }}>📁 Google Drive Links</h3>
            <p style={{ color: c.sub, fontSize: 13, marginBottom: 16 }}>
              Set a different Drive folder per exam stage (TBL, End Module, Practical, Final) so students land in the
              right folder immediately from that stage's page. Leave a stage empty to fall back to the Default link
              below — leave everything empty to hide the button entirely.
            </p>
            <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>Default (fallback)</label>
            <input
              placeholder="https://drive.google.com/..."
              value={driveUrl}
              onChange={e => setDriveUrl(e.target.value)}
              style={inStyle} />
            {STAGE_META.map(s => (
              <div key={s.value}>
                <label style={{ color: c.sub, fontSize: 12, display: 'block', marginBottom: 4 }}>{s.emoji} {s.title}</label>
                <input
                  placeholder="https://drive.google.com/... (optional)"
                  value={stageDriveUrls[s.value] || ''}
                  onChange={e => setStageDriveUrls(prev => ({ ...prev, [s.value]: e.target.value }))}
                  style={inStyle} />
              </div>
            ))}
            <button onClick={saveDriveLinks} disabled={driveUrlSaving} style={btnStyle}>
              {driveUrlSaving ? 'Saving...' : 'Save Drive Links'}
            </button>
          </div>

          <div style={{ background: c.card, padding: '20px', borderRadius: '16px', border: `1px solid ${c.border}` }}>
            <h3 style={{ color: '#38bdf8', marginBottom: 8 }}>📢 Home Page Announcement</h3>
            <p style={{ color: c.sub, fontSize: 13, marginBottom: 16 }}>
              This shows in a banner at the top of the Home page for everyone.
              Leave it empty to hide the banner completely. Press Enter for a
              new line — it'll look exactly the same on the site. The box
              below is styled exactly like it'll appear, so what you see here
              is what students will see.
            </p>
            <textarea
              placeholder="e.g. Pharma exam next week, study well! 🔥"
              value={announcement}
              onChange={e => setAnnouncement(e.target.value)}
              style={{
                width: '100%', minHeight: 100, padding: '14px 20px',
                borderRadius: 16, border: '1px solid #38bdf840',
                background: 'linear-gradient(135deg, #38bdf820, #818cf815)',
                color: c.text, fontSize: 14, fontWeight: 600, lineHeight: 1.6,
                textAlign: 'center', fontFamily: 'inherit', outline: 'none',
                resize: 'vertical', marginBottom: 12
              }} />
            <button onClick={saveAnnouncement} disabled={announcementSaving} style={btnStyle}>
              {announcementSaving ? 'Saving...' : 'Save Announcement'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const btnStyle = { width: '100%', padding: '12px', background: '#38bdf8', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#0f172a', fontFamily: 'inherit', fontSize: 14 }
const miniBtn = { background: 'transparent', border: '1px solid', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }
const cancelBtnStyle = (c) => ({ padding: '12px 20px', background: 'transparent', border: `1px solid ${c.border}`, borderRadius: 10, cursor: 'pointer', color: c.sub, fontFamily: 'inherit', fontSize: 14, fontWeight: 700 })
