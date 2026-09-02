import { supabase } from '../supabase'
import {
  getGuestFlags, clearGuestFlags,
  getGuestIncorrect, clearGuestIncorrect,
  getGuestHistory, clearGuestHistory,
} from './reviewStorage'

// One-time handoff for a student who practiced as a guest (no
// account) and then signs in on the SAME device/browser. Without
// this, everything they flagged, got wrong, or completed as a guest
// simply becomes invisible the moment they sign in — Review.tsx and
// Profile.tsx's history tab both switch to reading exclusively from
// Supabase once `user` is truthy, and the localStorage-backed guest
// data is never looked at again.
//
// Deliberately NOT migrated: the guest "active exam" (paused,
// in-progress quiz). That's short-lived selection state, not a
// durable record, and silently overwriting/choosing between it and a
// signed-in user's own possibly-existing active_exams row isn't a
// call this function should make — see the Phase 2 writeup for why.
//
// Every insert here is wrapped individually so one bad/duplicate row
// can't abort the rest of the batch. A duplicate-key error (the
// student already has this exact flag/answer/history row from a
// previous signed-in session on another device) is treated as
// success, not failure — "it already exists" is the outcome we want.
async function safeInsert(table, row) {
  try {
    const { error } = await supabase.from(table).insert(row)
    // Postgres unique_violation is SQLSTATE 23505 — treat it as a
    // no-op success rather than a real failure.
    if (error && error.code !== '23505') {
      console.warn(`[migrateGuestData] Could not migrate a row into ${table}:`, error.message)
    }
  } catch (e) {
    console.warn(`[migrateGuestData] Unexpected error migrating a row into ${table}:`, e)
  }
}

async function migrateFlags(userId) {
  const flags = getGuestFlags()
  if (flags.length === 0) return
  await Promise.all(flags.map(f => safeInsert('flagged_questions', {
    user_id: userId,
    question_id: f.question_id,
    module_id: f.module_id || null,
  })))
}

async function migrateIncorrect(userId) {
  const incorrect = getGuestIncorrect()
  if (incorrect.length === 0) return
  // These become ordinary answered_questions rows marked incorrect —
  // the same table Review.tsx/MCQ.tsx already read from for
  // signed-in users. No points are awarded for these (MCQ.tsx only
  // awards points for questions not already present in
  // answered_questions at submit time, so a migrated row correctly
  // prevents a later re-answer of the same question from being
  // treated as "new" and double-scored).
  await Promise.all(incorrect.map(q => safeInsert('answered_questions', {
    user_id: userId,
    question_id: q.question_id,
    correct: false,
  })))
}

async function migrateHistory(userId) {
  const history = getGuestHistory()
  if (history.length === 0) return
  await Promise.all(history.map(h => safeInsert('exam_history', {
    user_id: userId,
    module_id: h.module_id || null,
    quiz_type: h.quiz_type,
    subject_id: h.subject_id || null,
    total: h.total,
    correct: h.correct,
    score: h.score,
    time_sec: h.time_sec ?? null,
    // Guest history stores completed_at as a ms-epoch number
    // (Date.now()); exam_history's column is a real timestamptz.
    completed_at: new Date(h.completed_at).toISOString(),
  })))
}

// Cheap to call on every sign-in — each read is a tiny localStorage
// JSON.parse, and if there's nothing to migrate this returns
// immediately without touching the network at all. Once migration is
// attempted the local copies are cleared regardless of individual-row
// outcomes, so this naturally runs at most once per device: the next
// time this is called (another sign-in on the same browser) there's
// nothing left to migrate.
export async function migrateGuestDataIfNeeded(userId) {
  if (!userId) return
  const hasAnything =
    getGuestFlags().length > 0 ||
    getGuestIncorrect().length > 0 ||
    getGuestHistory().length > 0
  if (!hasAnything) return

  await Promise.all([
    migrateFlags(userId),
    migrateIncorrect(userId),
    migrateHistory(userId),
  ])

  clearGuestFlags()
  clearGuestIncorrect()
  clearGuestHistory()
}
