// Local (per-device) fallback for the Review / Resume features — used
// only when nobody is signed in, mirroring the same localStorage
// pattern Checklist.jsx already uses for guests. Everything here is
// scoped to a single browser; signing in switches to the real
// Supabase-backed versions instead (see lib/migrateGuestData.js for
// the one-time handoff when a guest signs in with local data still
// sitting here).

const FLAGGED_KEY = 'mcq_flagged'
const INCORRECT_KEY = 'mcq_incorrect'
const HISTORY_KEY = 'mcq_history'
const ACTIVE_EXAM_KEY = 'mcq_active_exam'

function readList(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list))
}

// ── Flags ──────────────────────────────────────────────────────────
export function getGuestFlags() { return readList(FLAGGED_KEY) }

export function toggleGuestFlag(entry) {
  const list = readList(FLAGGED_KEY)
  const idx = list.findIndex(f => f.question_id === entry.question_id)
  if (idx >= 0) {
    list.splice(idx, 1)
    writeList(FLAGGED_KEY, list)
    return false
  }
  list.push({ ...entry, flaggedAt: Date.now() })
  writeList(FLAGGED_KEY, list)
  return true
}

// Called once flagged_questions rows have been (attempted to be)
// written server-side for a newly signed-in user — see
// migrateGuestData.js. Safe to call even if the list was already
// empty.
export function clearGuestFlags() {
  localStorage.removeItem(FLAGGED_KEY)
}

// ── Incorrect questions ───────────────────────────────────────────
export function getGuestIncorrect() { return readList(INCORRECT_KEY) }

export function saveGuestIncorrect(entry) {
  const list = readList(INCORRECT_KEY)
  const idx = list.findIndex(q => q.question_id === entry.question_id)
  if (idx >= 0) list[idx] = { ...list[idx], ...entry, updatedAt: Date.now() }
  else list.push({ ...entry, updatedAt: Date.now() })
  writeList(INCORRECT_KEY, list)
}

// After a quiz is graded, backfill the correct answer/explanation for
// any question the student had already flagged this session. The
// grading result already legitimately reveals this to the student —
// copying it into the flag entry isn't a new exposure.
export function enrichGuestFlagsWithResults(resultMap) {
  const list = readList(FLAGGED_KEY)
  let changed = false
  list.forEach(f => {
    const r = resultMap[f.question_id]
    if (r && !f.correct_answer) {
      f.correct_answer = r.correct_answer
      f.explanation = r.explanation
      changed = true
    }
  })
  if (changed) writeList(FLAGGED_KEY, list)
}

// See clearGuestFlags above.
export function clearGuestIncorrect() {
  localStorage.removeItem(INCORRECT_KEY)
}

// ── Exam history ──────────────────────────────────────────────────
export function getGuestHistory() { return readList(HISTORY_KEY) }

export function addGuestHistory(entry) {
  const list = readList(HISTORY_KEY)
  list.unshift({ ...entry, completed_at: Date.now() })
  if (list.length > 50) list.length = 50
  writeList(HISTORY_KEY, list)
}

// See clearGuestFlags above.
export function clearGuestHistory() {
  localStorage.removeItem(HISTORY_KEY)
}

// ── Active (in-progress) exam, for Resume ─────────────────────────
export function getGuestActiveExam() {
  try { return JSON.parse(localStorage.getItem(ACTIVE_EXAM_KEY) || 'null') } catch { return null }
}
export function saveGuestActiveExam(data) {
  localStorage.setItem(ACTIVE_EXAM_KEY, JSON.stringify(data))
}
export function clearGuestActiveExam() {
  localStorage.removeItem(ACTIVE_EXAM_KEY)
}
